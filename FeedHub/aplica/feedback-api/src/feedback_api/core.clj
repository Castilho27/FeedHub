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

;; Atomos
(def rooms (atom {}))
(def active-connections (atom {}))
(def ws-connections (atom {})) ; {pin-da-sala {student-id WebSocketChannel}}

(defn generate-pin []
  (format "%06d" (rand-int 1000000)))

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
                            :connected-students []})
    {:pin pin :room-id room-id}))

(defn broadcast-student-list [pin]
  (when-let [room-students (:connected-students (get @rooms pin))]
    (let [message-data {:type "student-list-update"
                        :students room-students}
          json-message (json/write-str message-data)]
      (doseq [[_ ws-channel] (get @ws-connections pin)]
        (httpkit/send! ws-channel json-message)))))

(defn add-student-to-room [pin student]
  (let [student-id (:student-id student)]
    (swap! rooms update-in [pin :connected-students]
          (fn [students]
            (let [existing-student (some #(and (= (:student-id %) student-id) %) students)]
              (if existing-student
                (mapv #(if (= (:student-id %) student-id) student %) students)
                (conj students student)))))
    (broadcast-student-list pin)))

(defn remove-student-from-room [pin student-id]
  (swap! rooms update-in [pin :connected-students]
          (fn [students]
            (vec (remove #(= student-id (get % :student-id)) students))))
  (swap! active-connections update pin
          (fn [connections]
            (vec (remove #(= student-id (get % :student-id)) connections))))
  (broadcast-student-list pin))

;; Manipulador de WebSocket - ESTA É A ÚNICA DEFINIÇÃO DE ws-handler
(defn ws-handler [request]
  (httpkit/with-channel request ws-channel
    (println "DEBUG: Request map recebido no ws-handler:" request)
    (println "DEBUG: URI da requisicao WebSocket:" (:uri request))

    (let [uri (:uri request)
          query-string (:query-string request)

          pin (second (re-find #"/ws/rooms/(\d{6})" uri))
          student-id (when query-string
                       (->> (str/split query-string #"&") ;; Mudei `->` para `->>` aqui
                            (some #(when (str/starts-with? % "student_id=")
                                     (subs % (count "student_id="))))))
          
          room-exists? (get @rooms pin)]
      
      (println (str "DEBUG: PIN extraido (manual)=" pin ", StudentID extraido (manual)=" student-id))
      (println "DEBUG: A sala existe?" room-exists?) ; Nova linha de debug para a sala

      (if (and pin student-id room-exists?)
        (do
          (println (str "WebSocket conectado: PIN=" pin ", StudentID=" student-id))
          (swap! ws-connections update pin (fnil assoc {}) student-id ws-channel)

          (httpkit/on-receive ws-channel (fn [data]
                                           (println (str "Mensagem WebSocket recebida de " student-id ": " data))))

          (httpkit/on-close ws-channel (fn [status]
                                         (println (str "WebSocket desconectado: PIN=" pin ", StudentID=" student-id ", Status=" status))
                                         (swap! ws-connections update pin dissoc student-id)
                                         (remove-student-from-room pin student-id))))
        (do
          (println (str "Falha na conexão WebSocket: PIN=" pin ", StudentID=" student-id))
          (httpkit/send! ws-channel (json/write-str {:error "PIN ou StudentID inválido."}))
          (httpkit/close ws-channel))))))

(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "API Feedback Professores"
            :version "0.1.0"}})

  (POST "/api/rooms" []
    (let [room (create-room)]
      (response room)))

  (POST "/api/rooms/:pin/join" [pin :as req]
    (let [student-id (get-in req [:body :student-id])
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
                     :message "Joined room successfully"}))
        (not-found {:status "error"
                    :message "PIN inválido ou sala não encontrada"}))))

  (POST "/api/rooms/:pin/leave" [pin :as req]
    (let [student-id (get-in req [:body :student-id])]
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

  ;; Endpoint WebSocket
  (GET "/ws/rooms/:pin" [] ws-handler)

  (GET "/api/rooms/:pin" [pin]
    (if-let [room (get @rooms pin)]
      (response {:room room
                 :connections (count (get @active-connections pin []))})
      (not-found {:status "error"
                  :message "Sala não encontrada"})))

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

  (GET "/api/rooms/:pin/status" [pin]
    (if (contains? @rooms pin)
      (response {:status "success"
                 :message "PIN válido e sala encontrada"})
      (not-found {:status "error"
                  :message "PIN inválido ou sala não encontrada"}))))

(def app
  (-> app-routes
      (wrap-cors
        :access-control-allow-origin [#"https://feedhub-theta.vercel.app"
                                      #"https://feedhub-theta.vercel.app/page2"
                                      #"http://localhost:3000"
                                      #"http://localhost:3001"]
        :access-control-allow-methods [:get :post :put :delete :options]
        :access-control-allow-headers ["Content-Type" "Authorization"])
      (wrap-json-body {:keywords? true :bigdecimals? true})
      (wrap-json-response)
      (wrap-params)))

(defn -main [& args]
  (let [port (or (some-> (System/getenv "PORT") Integer/parseInt) 3001)]
    (println (str "Servidor iniciado na porta " port))
    (httpkit/run-server app {:port port :join? false})))