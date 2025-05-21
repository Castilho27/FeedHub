(ns feedback-api.core
  (:require [ring.adapter.jetty :as jetty]
            [compojure.core :refer [defroutes GET POST]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.util.response :refer [not-found response]] ;
            [clj-time.core :as time]
            [clj-time.coerce :as coerce]))

(def rooms (atom {}))
(def active-connections (atom {}))

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

(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "API Feedback Professores"
            :version "0.1.0"}})

  (POST "/api/rooms" []
    (let [room (create-room)]
      (response room))) ; <--- SEM 'resp/'

  (POST "/api/rooms/:pin/join" [pin :as req]
    (let [student-id (get-in req [:body :student-id])
          student-name (get-in req [:body :name])]
      (if-let [room (get @rooms pin)]
        (do
          (swap! rooms update-in [pin :connected-students]
                 (fn [students]
                   (if (some #(= student-id (:student-id %)) students)
                     students
                     (conj students {:student-id student-id :name student-name}))))

          (swap! active-connections update pin (fnil conj [])
                 {:user-agent (get-in req [:headers "user-agent"])
                  :timestamp (coerce/to-long (time/now))
                  :student-id student-id
                  :name student-name})

          (response {:status "success"
                          :room-id (:id room)
                          :message "Joined room successfully"}))
        (not-found {:status "error"
                         :message "PIN inválido ou sala não encontrada"})))) ; <--- SEM 'resp/'

  (GET "/api/rooms/:pin" [pin]
    (if-let [room (get @rooms pin)]
      (response {:room room
                      :connections (count (get @active-connections pin []))})
      (not-found {:status "error"
                       :message "Sala não encontrada"}))) ; <--- SEM 'resp/'

  (GET "/api/rooms/:pin/panel" [pin]
    (if-let [room (get @rooms pin)]
      (response {
        :status "success"
        :pin pin
        :room-id (:id room)
        :created-at (:created-at room)
        :connected-students (:connected-students room)
        :connection_count (count (:connected-students room))
      })
      (not-found {:status "error"
                       :message "Sala não encontrada"}))) ; <--- SEM 'resp/'

  (GET "/api/rooms/:pin/status" [pin]
    (if (contains? @rooms pin)
      (response{:status "success" :message "PIN válido e sala encontrada"}) ; <--- USANDO 'ok' DIRETAMENTE
      (not-found {:status "error" :message "PIN inválido ou sala não encontrada"}))) ; <--- SEM 'resp/'
  )

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
      (wrap-json-response)))

(defn -main [& args]
  (let [port (or (some-> (System/getenv "PORT") Integer/parseInt) 3001)]
    (println (str "Servidor iniciado na porta " port))
    (jetty/run-jetty app {:port port :join? false})))