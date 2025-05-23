(ns feedback-api.core
  (:require [compojure.core :refer [defroutes GET POST]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.util.response :refer [not-found response]]
            [clj-time.core :as time]
            [clj-time.coerce :as coerce]
            [org.httpkit.server :as httpkit]
            [clojure.data.json :as json]
            [ring.middleware.params :refer [wrap-params]]
            [clojure.string :as str]))

;; Atomos para gerenciar o estado da aplicação
(def rooms (atom {})) ; {pin-da-sala {room-data}}
(def active-connections (atom {})) ; {pin-da-sala [list-of-connections-info]} - OBS: Esta estrutura pode ser redundante se `connected-students` em `rooms` for suficiente.
(def ws-connections (atom {})) ; {pin-da-sala {student-id WebSocketChannel}} - Mapeia student-id para o canal WebSocket

;; Funções de utilidade para PIN
(defn generate-pin []
  (format "%06d" (rand-int 1000000)))

(defn unique-pin []
  (loop [new-pin (generate-pin)]
    (if (contains? @rooms new-pin)
      (recur (generate-pin))
      new-pin)))

;; Função para criar uma nova sala
(defn create-room []
  (let [pin (unique-pin)
        room-id (str (java.util.UUID/randomUUID))]
    (swap! rooms assoc pin {:id room-id
                            :created-at (coerce/to-long (time/now))
                            :connected-students []}) ; Inicializa com lista vazia de alunos conectados
    {:pin pin :room-id room-id}))

;; Função para transmitir a lista de alunos para todos os clientes conectados via WebSocket na sala
(defn broadcast-student-list [pin]
  (when-let [room-students (:connected-students (get @rooms pin))]
    (println (str "DEBUG: Broadcasting student list para PIN " pin ": " room-students))
    (let [message-data {:type "student-list-update"
                        :students room-students}
          json-message (json/write-str message-data)]
      (doseq [[_ ws-channel] (get @ws-connections pin)]
        (httpkit/send! ws-channel json-message)))))

;; Função para adicionar ou atualizar um aluno na lista de alunos conectados da sala
(defn add-student-to-room [pin student]
  (let [student-id (:student-id student)]
    (println (str "DEBUG: Tentando adicionar/atualizar aluno " student-id " na sala " pin))
    (swap! rooms update-in [pin :connected-students]
           (fn [students]
             (let [existing-student (some #(and (= (:student-id %) student-id) %) students)]
               (if existing-student
                 ;; Se o aluno já existe, atualiza as informações (ou substitui, se necessário)
                 (mapv #(if (= (:student-id %) student-id) student %) students)
                 ;; Caso contrário, adiciona o novo aluno
                 (conj students student)))))
    (println (str "DEBUG: Aluno " student-id " adicionado/atualizado. Estado atual da sala (connected-students): " (:connected-students (get @rooms pin))))
    (broadcast-student-list pin)))

;; Função para remover um aluno da lista de alunos conectados da sala
(defn remove-student-from-room [pin student-id]
  (println (str "DEBUG: Tentando remover aluno " student-id " da sala " pin))
  (println "DEBUG: Estado de rooms antes da remocao: " (get @rooms pin))
  
  (swap! rooms update-in [pin :connected-students]
           (fn [students]
             (let [new-students (vec (remove #(= student-id (get % :student-id)) students))]
               (println (str "DEBUG: Lista de estudantes apos remocao de " student-id ": " new-students))
               new-students)))
  
  ;; A remoção de active-connections não afeta diretamente a lista de students da sala,
  ;; mas é mantida aqui para fins de depuração ou se houver outro uso para ela.
  (swap! active-connections update pin
           (fn [connections]
             (let [new-connections (vec (remove #(= student-id (get % :student-id)) connections))]
               (println (str "DEBUG: Lista de active-connections apos remocao de " student-id ": " new-connections))
               new-connections)))
  
  (broadcast-student-list pin)
  (println (str "DEBUG: Funcao remove-student-from-room para " student-id " finalizada. Estado atual da sala (verifique :connected-students): " (get @rooms pin))))

;; Manipulador de WebSocket
(defn ws-handler [request]
  (httpkit/with-channel request ws-channel
    (println "DEBUG: Request map recebido no ws-handler:" request)
    (println "DEBUG: URI da requisicao WebSocket:" (:uri request))

    (let [uri (:uri request)
          query-string (:query-string request)

          ;; Extrai o PIN da URI
          pin (second (re-find #"/ws/rooms/(\d{6})" uri))
          
          ;; Extrai o student_id da query string (agora mais robusto)
          student-id (when query-string
                       (->> (str/split query-string #"&")
                            (some #(when (str/starts-with? % "student_id=")
                                     (subs % (count "student_id="))))))
          
          room-exists? (get @rooms pin)]
      
      (println (str "DEBUG: PIN extraido (manual)=" pin ", StudentID extraido (manual)=" student-id))
      (println "DEBUG: A sala existe?" room-exists?)

      (if (and pin student-id room-exists?)
        (do
          (println (str "WebSocket conectado: PIN=" pin ", StudentID=" student-id))
          ;; Associa o canal WebSocket ao student-id para esta sala
          (swap! ws-connections update pin (fnil assoc {}) student-id ws-channel)

          ;; Handler para mensagens recebidas do cliente WebSocket
          (httpkit/on-receive ws-channel (fn [data]
                                            (println (str "Mensagem WebSocket recebida de " student-id " na sala " pin ": " data))))

          ;; Handler para quando a conexão WebSocket é fechada
          (httpkit/on-close ws-channel (fn [status]
                                          (println (str "WebSocket desconectado: PIN=" pin ", StudentID=" student-id ", Status=" status))
                                          ;; Remove o canal WebSocket da lista de conexões ativas
                                          (swap! ws-connections update pin dissoc student-id)
                                          ;; Garante que a remoção do aluno da lista de sala e o broadcast aconteçam
                                          (remove-student-from-room pin student-id))))
        (do
          (println (str "Falha na conexão WebSocket: PIN=" pin ", StudentID=" student-id " (motivo: sala não existe ou ID ausente)."))
          (httpkit/send! ws-channel (json/write-str {:error "PIN da sala ou StudentID inválido/ausente."}))
          (httpkit/close ws-channel))))))

;; Definição das rotas da aplicação
(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "API FeedHub - Feedback de Professores"
            :version "1.0.0"}})

  ;; Rota para criar uma nova sala
  (POST "/api/rooms" []
    (let [room (create-room)]
      (response room)))

  ;; Rota para um aluno entrar em uma sala
  (POST "/api/rooms/:pin/join" [pin :as req]
    (let [student-id (get-in req [:body :student_id]) ; student_id do corpo da requisição JSON
          student-name (get-in req [:body :name])
          avatar-color (get-in req [:body :avatar_color])
          student-data {:student-id student-id
                        :name student-name
                        :avatar-color avatar-color}]
      (println "DEBUG: Recebida requisicao JOIN para PIN:" pin "com Student ID:" student-id "Nome:" student-name "Cor:" avatar-color) ; Log crucial
      (if-let [room (get @rooms pin)]
        (do
          ;; Adiciona ou atualiza o aluno na lista de alunos conectados da sala
          (add-student-to-room pin student-data)

          ;; Este `active-connections` parece redundante se `connected-students`
          ;; já gerencia a lista de alunos na sala. Avalie se ele é realmente necessário.
          ;; Se sim, garanta que :student-id seja usado como chave para evitar duplicação ou conflitos.
          (swap! active-connections update pin (fnil conj [])
                 {:user-agent (get-in req [:headers "user-agent"])
                  :timestamp (coerce/to-long (time/now))
                  :student-id student-id ; Garanta que o student-id seja usado aqui
                  :name student-name})
          (println "DEBUG: Retornando sucesso para JOIN. Estado de active-connections:" (get @active-connections pin))

          (response {:status "success"
                     :room-id (:id room)
                     :message "Entrou na sala com sucesso!"
                     :student-id student-id})) ; Retorna o student-id para o frontend
        (not-found {:status "error"
                    :message "PIN inválido ou sala não encontrada"}))))

  ;; Rota para um aluno sair de uma sala
  (POST "/api/rooms/:pin/leave" [pin :as req]
    (let [student-id (get-in req [:body :student_id])]
      (println "DEBUG: Recebida requisicao LEAVE para PIN:" pin "com Student ID:" student-id) ; Log para leave
      (if (and pin student-id)
        (if (get @rooms pin)
          (do
            (remove-student-from-room pin student-id)
            (response {:status "success"
                       :message (str "Aluno " student-id " removido da sala " pin " com sucesso.")}))
          (not-found {:status "error"
                      :message "Sala não encontrada."}))
        {:status 400
         :body {:message "PIN da sala ou ID do aluno ausente."}})))

  ;; Endpoint WebSocket para comunicação em tempo real
  (GET "/ws/rooms/:pin" [] ws-handler)

  ;; Rota para obter informações de uma sala específica
  (GET "/api/rooms/:pin" [pin]
    (if-let [room (get @rooms pin)]
      (response {:room room
                 :connections (count (get @active-connections pin []))}) ; Se active-connections for mantido
      (not-found {:status "error"
                  :message "Sala não encontrada"})))

  ;; Rota para o painel de controle (ex: para o professor)
  (GET "/api/rooms/:pin/panel" [pin]
    (if-let [room (get @rooms pin)]
      (response {:status "success"
                 :pin pin
                 :room-id (:id room)
                 :created-at (:created-at room)
                 :connected-students (:connected-students room)
                 :connection_count (count (:connected-students room))})
      (not-found {:status "error"
                  :message "Sala não encontrada"})))

  ;; Rota para verificar o status de um PIN
  (GET "/api/rooms/:pin/status" [pin]
    (if (contains? @rooms pin)
      (response {:status "success"
                 :message "PIN válido e sala encontrada"})
      (not-found {:status "error"
                  :message "PIN inválido ou sala não encontrada"}))))

;; Middlewares da aplicação
(def app
  (-> app-routes
      ;; Permite requisições CORS de origens específicas
      (wrap-cors
        :access-control-allow-origin [#"https://feedhub-theta.vercel.app"
                                      #"https://feedhub-theta.vercel.app/page2"
                                      #"http://localhost:3000"
                                      #"http://localhost:3001"]
        :access-control-allow-methods [:get :post :put :delete :options]
        :access-control-allow-headers ["Content-Type" "Authorization"])
      ;; Converte o corpo das requisições JSON em mapas Clojure (com chaves keyword)
      (wrap-json-body {:keywords? true :bigdecimals? true})
      ;; Converte as respostas Clojure em JSON
      (wrap-json-response)
      ;; Analisa parâmetros de query string e form
      (wrap-params)))

;; Função principal para iniciar o servidor
(defn -main [& args]
  (let [port (or (some-> (System/getenv "PORT") Integer/parseInt) 3001)]
    (println (str "Servidor iniciado na porta " port))
    (httpkit/run-server app {:port port :join? false})))