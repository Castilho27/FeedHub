(ns feedback-api.core
  (:require [ring.adapter.jetty :as jetty]
            [compojure.core :refer [defroutes GET POST]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.util.response :as resp]
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
                            :created-at (coerce/to-long (time/now))})
    {:pin pin :room-id room-id}))

(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "API Feedback Professores"
            :version "0.1.0"}})

  ;; Criar sala — deve ser chamado no frontend em https://feedhub-theta.vercel.app/api/rooms
  (POST "/api/rooms" []
    (let [room (create-room)]
      (resp/response room)))

  (POST "/api/rooms/:pin/join" [pin :as req]
    (if-let [room (get @rooms pin)]
      (do
        (swap! active-connections update pin (fnil conj [])
               {:user-agent (get-in req [:headers "user-agent"])
                :timestamp (coerce/to-long (time/now))})
        (resp/response {:status "success"
                        :room-id (:id room)}))
      (resp/not-found {:status "error"
                       :message "PIN inválido ou sala não encontrada"})))

  (GET "/api/rooms/:pin" [pin]
    (if-let [room (get @rooms pin)]
      (resp/response {:room room
                      :connections (count (get @active-connections pin []))})
      (resp/not-found {:status "error"
                       :message "Sala não encontrada"}))))

(def app
  (-> app-routes
      (wrap-cors
        :access-control-allow-origin [#"https://feedhub-theta.vercel.app/page2"]
        :access-control-allow-methods [:get :post :put :delete :options]
        :access-control-allow-headers ["Content-Type" "Authorization"])
      (wrap-json-body {:keywords? true :bigdecimals? true})
      (wrap-json-response)))

(defn -main [& args]
  (let [port (or (some-> (System/getenv "PORT") Integer/parseInt) 3000)]
    (println (str "Servidor iniciado na porta " port))
    (jetty/run-jetty app {:port port :join? false})))
