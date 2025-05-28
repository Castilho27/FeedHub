(ns feedback-api.core
  (:gen-class)
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


(def rooms (atom {}))
(def active-connections (atom {}))
(def ws-connections (atom {}))
(def feedbacks (atom {}))


(def frontend-url (or (System/getenv "FRONTEND_URL") "https://feedhub-omega.vercel.app/"))


;; Gero um PIN de 6 dígitos para as salas, bem simples.
(defn generate-pin []
  (format "%06d" (rand-int 1000000)))

;; Garanto que o PIN gerado é único antes de criar a sala.
(defn unique-pin []
  (loop [new-pin (generate-pin)]
    (if (contains? @rooms new-pin)
      (recur (generate-pin))
      new-pin)))

(defn create-room []
  (let [pin (unique-pin)
        room-id (str (java.util.UUID/randomUUID))]
    (swap! rooms assoc pin {:id room-id
                            :created-at (coerce/to-long (time/now))
                            :connected-students []
                            :current-question "Qual a sua expectativa para a aula de hoje?"})
    {:pin pin :room-id room-id}))

;; WebSocket responsavel por comunicar a lista da sala
(defn broadcast-student-list [pin]
  (when-let [room-students (:connected-students (get @rooms pin))]
    (let [message-data {:type "student-list-update"
                         :students room-students}
          json-message (json/write-str message-data)]
      (doseq [[_ ws-channel] (get @ws-connections pin)]
        (httpkit/send! ws-channel json-message)))))

;; Transmite a pergunta para todos
(defn broadcast-question-update [pin question]
  (let [message-data {:type "question-update"
                       :question question}
        json-message (json/write-str message-data)]
    (doseq [[_ ws-channel] (get @ws-connections pin)]
      (httpkit/send! ws-channel json-message))))

;; Atualiza a lista de alunos
(defn add-student-to-room [pin student]
  (let [student-id (:student-id student)]
    (swap! rooms update-in [pin :connected-students]
           (fn [students]
             (let [existing-student (some #(and (= (:student-id %) student-id) %) students)]
               (if existing-student
                 (mapv #(if (= (:student-id %) student-id) student %) students)
                 (conj students student)))))
    (broadcast-student-list pin)))

;; Remove um aluno da lista
(defn remove-student-from-room [pin student-id]
  (swap! rooms update-in [pin :connected-students]
                 (fn [students]
                   (vec (remove #(= student-id (:student-id %)) students))))
  (swap! active-connections update pin
                 (fn [connections]
                   (vec (remove #(= student-id (:student-id %)) connections))))
  (broadcast-student-list pin))

;; Envia cada aluno para uma página diferente
(defn send-navigate-page [pin student-id page-number]
  (when-let [ws-channel (get-in @ws-connections [pin student-id])]
    (let [msg {:type "navigate" :page page-number}
          json-msg (json/write-str msg)]
      (httpkit/send! ws-channel json-msg))))

;; Compilador da menssagem de Feedback
(defn notify-new-feedback [pin feedback]
  (println "Tentando notificar professor sobre novo feedback - PIN:" pin)
  (when-let [professor-ws (get-in @ws-connections [pin "professor"])]
    (println "Professor encontrado, enviando feedback:" feedback)
    (httpkit/send! professor-ws
                      (json/write-str {:type "feedback" :data feedback}))))

(defn validate-feedback [rating comment]
  (and (integer? rating)
       (>= rating 1)
       (<= rating 10)
       (string? comment)
       (>= (count comment) 2)
       (<= (count comment) 500)))

;; Modificado para aceitar rating e comment separadamente, e incluir o pin 
(defn add-feedback [pin student-id rating comment]
  (let [feedback {:student-id student-id
                  :rating rating
                  :comment comment
                  :message (str "Nota: " rating "/10 | Comentário: " comment)
                  :pin pin
                  :timestamp (coerce/to-long (time/now))}]
    (swap! feedbacks update pin (fnil conj []) feedback)
    feedback))
(defn ws-handler [request]
  (println "Nova conexão WebSocket recebida")
  (httpkit/with-channel request ws-channel
    (let [uri (:uri request)
          query-string (:query-string request)
          pin (second (re-find #"/ws/rooms/(\d{6})" uri))
          student-id (when query-string
                       (->> (str/split query-string #"&")
                            (some #(when (str/starts-with? % "student_id=")
                                     (subs % (count "student_id="))))))
          is-professor (= student-id "professor")]
      (println "Conexão estabelecida - PIN:" pin "| Student-ID:" student-id)
      (cond
        ;; Conexão do Professor
        is-professor
        (do
          (swap! ws-connections assoc-in [pin "professor"] ws-channel)
          ;; Envia a pergunta atual para o professor ao conectar.
          (when-let [current-question (:current-question (get @rooms pin))]
            (httpkit/send! ws-channel (json/write-str {:type "question-update" :question current-question})))
          ;; Quando o professor desconecta, eu removo a conexão.
          (httpkit/on-close ws-channel (fn [status]
                                         (swap! ws-connections update pin dissoc "professor"))))

        ;; Conexão do Aluno
        (and pin student-id (get @rooms pin))
        (do
          (swap! ws-connections update pin (fnil assoc {}) student-id ws-channel)
          ;; Envia a pergunta atual para o aluno ao conectar.
          (when-let [current-question (:current-question (get @rooms pin))]
            (httpkit/send! ws-channel (json/write-str {:type "question-update" :question current-question})))
          ;; Lida com as mensagens recebidas do aluno (por exemplo, se ele enviasse feedback via WS).
          (httpkit/on-receive ws-channel (fn [data]
                                           (try
                                             (let [msg (json/read-str data :key-fn keyword)]
                                               (cond
                                                 (= (:type msg) "question-update")
                                                 (if is-professor 
                                                   (let [new-question (:question msg)]
                                                     (println "Recebida question-update do professor para sala" pin ":" new-question)
                                                     (when new-question
                                                       (swap! rooms assoc-in [pin :current-question] new-question)
                                                       (broadcast-question-update pin new-question)))
                                                   (println "Tentativa não autorizada de 'question-update' de aluno:" student-id))

                                                 (= (:type msg) "feedback")
                                                 (let [feedback (add-feedback pin student-id
                                                                               (:rating msg)
                                                                               (:comment msg))]
                                                   (notify-new-feedback pin feedback))))
                                             (catch Exception e
                                               (println "Erro ao processar mensagem WebSocket do aluno:" e)))))
          ;; Quando o aluno desconecta, eu removo a conexão e atualizo a lista de alunos.
          (httpkit/on-close ws-channel (fn [status]
                                         (swap! ws-connections update pin dissoc student-id)
                                         (remove-student-from-room pin student-id))))
        :else
        (do
          (httpkit/send! ws-channel (json/write-str {:error "Credenciais inválidas"}))
          (httpkit/close ws-channel))))))
(defroutes app-routes
  (GET "/" []
    {:status 200
      :body {:message "API FeedHub - Feedback de Professores"
            :version "1.0.0"}})

  ;; Rota para obter feedbacks: Retorna todos os campos, incluindo pin, rating e comment 
  (GET "/api/rooms/:pin/feedbacks" [pin]
    (if-let [room-feedbacks (get @feedbacks pin)]
      (response {:feedbacks room-feedbacks})
      (not-found {:status "error" :message "Nenhum feedback encontrado"})))

  (POST "/api/rooms" []
    (response (create-room)))

  (POST "/api/rooms/:pin/join" [pin :as req]
    (let [student-id (get-in req [:body :student_id])
          student-name (get-in req [:body :name])
          avatar-color (get-in req [:body :avatar_color])
          student-data {:student-id student-id
                        :name student-name
                        :avatar-color avatar-color}]
      (if-let [room (get @rooms pin)]
        (do
          (add-student-to-room pin student-data)
          (swap! active-connections update pin (fnil conj [])
                {:user-agent (get-in req [:headers "user-agent"])
                  :timestamp (coerce/to-long (time/now))
                  :student-id student-id
                  :name student-name})
          (response {:status "success"
                      :room-id (:id room)
                      :message "Entrou na sala com sucesso!"
                      :student-id student-id}))
        (not-found {:status "error"
                    :message "PIN inválido ou sala não encontrada"}))))

  (POST "/api/rooms/:pin/leave" [pin :as req]
    (let [student-id (get-in req [:body :student_id])]
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

  (GET "/ws/rooms/:pin" [] ws-handler)

  (GET "/api/rooms/:pin" [pin]
    (if-let [room (get @rooms pin)]
      (response {:room room
                  :connections (count (get @active-connections pin []))})
      (not-found {:status "error"
                  :message "Sala não encontrada"})))

  (GET "/api/rooms/:pin/panel" [pin]
    (if-let [room (get @rooms pin)]
      (response {:room room
                  :connected-students (:connected-students room)
                  :current-question (:current-question room)})
      (not-found {:status "error"
                  :message "Sala não encontrada"})))

  (POST "/api/rooms/:pin/start" [pin :as req]
    (if-let [room (get @rooms pin)]
      (do
        (doseq [[_ ws-channel] (get @ws-connections pin)]
          (httpkit/send! ws-channel (json/write-str {:type "start"})))
        (response {:status "success"
                   :message "Atividade iniciada!"}))
      (not-found {:status "error"
                  :message "Sala não encontrada"})))


  (POST "/api/rooms/:pin/students/:student-id/navigate" [pin student-id :as req]
    (let [page (get-in req [:body :page])]
      (if (and (get @rooms pin) (get-in @ws-connections [pin student-id]))
        (do
          (send-navigate-page pin student-id page)
          (response {:status "success"
                     :message (str "Solicitada navegação para a página " page " do aluno " student-id)}))
        (not-found {:status "error"
                    :message "Sala ou aluno não encontrado"}))))

  ;; Rota para enviar feedback 
  (POST "/api/rooms/:pin/feedback" [pin :as req]
    (let [student-id (get-in req [:body :student-id])
          rating (get-in req [:body :rating])
          comment (get-in req [:body :comment])]
      (println "Recebido feedback - PIN:" pin "| Student-ID:" student-id "| Rating:" rating "| Comment:" comment)
      (cond
        (not (get @rooms pin)) (not-found {:status 404 :message "Sala não existe"})
        (not (validate-feedback rating comment)) {:status 400 :body {:error "Rating deve ser um número entre 1 e 10, e o comentário entre 2 e 500 caracteres"}}
        :else (let [feedback (add-feedback pin student-id rating comment)]
                (println "Feedback armazenado:" feedback)
                (notify-new-feedback pin feedback)
                (response {:status "success" :feedback feedback})))))

  ;; Caso a sala não exista
  (GET "/api/rooms/:pin/status" [pin]
    (if-let [room (get @rooms pin)]
      (response {:pin pin
                  :room-id (:id room)
                  :created-at (:created-at room)
                  :connected-students (:connected-students room)
                  :active-connections (count (get @active-connections pin []))
                  :current-question (:current-question room)})
      (not-found {:status "error"
                  :message "Sala não encontrada"}))))

;; Middleware da minha aplicação. Eles processam as requisições antes que cheguem às rotas.
(def app
  (-> app-routes

     ;; Fechar a rota depois 
     ( 
                 :access-control-allow-methods [:get :post :put :delete :options]
                 :access-control-allow-headers ["Content-Type" "Authorization"]
                 :access-control-allow-credentials false)
      wrap-json-response
      (wrap-json-body {:keywords? true})
      wrap-params))

(defn -main [& args]
  (println "Servidor iniciado na porta 3001")
  (println "Frontend URL permitida para CORS (configuração atual):" frontend-url)
  (httpkit/run-server #'app {:port 3001}))