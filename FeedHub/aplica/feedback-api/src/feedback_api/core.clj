(ns feedback-api.core
  (:gen-class) ;; ESSENCIAL para `lein run` funcionar
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

;; Átomos para gerenciar o estado da aplicação
(def rooms (atom {})) ; {pin-da-sala {room-data}}
(def active-connections (atom {})) ; {pin-da-sala [list-of-connections-info]}
(def ws-connections (atom {})) ; {pin-da-sala {student-id WebSocketChannel}}

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
                            :connected-students []})
    {:pin pin :room-id room-id}))

;; Função para transmitir a lista de alunos para todos os clientes conectados via WebSocket na sala
(defn broadcast-student-list [pin]
  (when-let [room-students (:connected-students (get @rooms pin))]
    (let [message-data {:type "student-list-update"
                        :students room-students}
          json-message (json/write-str message-data)]
      (doseq [[_ ws-channel] (get @ws-connections pin)]
        (httpkit/send! ws-channel json-message)))))

;; Função para adicionar ou atualizar um aluno na lista de alunos conectados da sala
(defn add-student-to-room [pin student]
  (let [student-id (:student-id student)]
    (swap! rooms update-in [pin :connected-students]
           (fn [students]
             (let [existing-student (some #(and (= (:student-id %) student-id) %) students)]
               (if existing-student
                 (mapv #(if (= (:student-id %) student-id) student %) students)
                 (conj students student)))))
    (broadcast-student-list pin)))

;; Função para remover um aluno da lista de alunos conectados da sala
(defn remove-student-from-room [pin student-id]
  (swap! rooms update-in [pin :connected-students]
         (fn [students]
           (vec (remove #(= student-id (:student-id %)) students))))
  (swap! active-connections update pin
         (fn [connections]
           (vec (remove #(= student-id (:student-id %)) connections))))
  (broadcast-student-list pin))

;; Manipulador de WebSocket
(defn ws-handler [request]
  (httpkit/with-channel request ws-channel
    (let [uri (:uri request)
          query-string (:query-string request)
          pin (second (re-find #"/ws/rooms/(\d{6})" uri))
          student-id (when query-string
                       (->> (str/split query-string #"&")
                            (some #(when (str/starts-with? % "student_id=")
                                     (subs % (count "student_id="))))))]
      (if (and pin student-id (get @rooms pin))
        (do
          (swap! ws-connections update pin (fnil assoc {}) student-id ws-channel)
          (httpkit/on-receive ws-channel (fn [data]
                                          (println "Mensagem WebSocket recebida de" student-id ":" data)))
          (httpkit/on-close ws-channel (fn [status]
                                        (swap! ws-connections update pin dissoc student-id)
                                        (remove-student-from-room pin student-id))))
        (do
          (httpkit/send! ws-channel (json/write-str {:error "PIN da sala ou StudentID inválido/ausente."}))
          (httpkit/close ws-channel))))))

;; Rotas
(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "API FeedHub - Feedback de Professores"
            :version "1.0.0"}})

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
                 :connected-students (:connected-students room)})
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

  ;; ** NOVO ENDPOINT: status da sala **
  (GET "/api/rooms/:pin/status" [pin]
    (if-let [room (get @rooms pin)]
      (response {:pin pin
                 :room-id (:id room)
                 :created-at (:created-at room)
                 :connected-students (:connected-students room)
                 :active-connections (count (get @active-connections pin []))})
      (not-found {:status "error"
                  :message "Sala não encontrada"}))))

;; Middleware
(def app
  (-> app-routes
      (wrap-cors :access-control-allow-origin [#".*"]
                 :access-control-allow-methods [:get :post :put :delete])
      wrap-json-response
      (wrap-json-body {:keywords? true})
      wrap-params))

;; FUNÇÃO PRINCIPAL para lein run
(defn -main [& args]
  (println "Servidor iniciado na porta 3001")
  (httpkit/run-server #'app {:port 3001}))
