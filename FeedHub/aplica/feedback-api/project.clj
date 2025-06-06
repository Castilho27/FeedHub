(defproject feedback-api "0.1.0-SNAPSHOT"
  :description "Backend em Clojure para coleta de feedbacks via PIN, com REST e WebSockets"
  :url "https://github.com/Castilho27/FeedHub"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.11.1"]
                 [ring/ring-core "1.9.6"]
                 [http-kit "2.7.0"]
                 [ring/ring-json "0.5.1"]
                 [compojure "1.7.1"]
                 [cheshire "5.11.0"]
                 [clj-time "0.15.2"]
                 [ring-cors "0.1.13"]
                 [org.clojure/data.json "2.5.0"]] ;; ← devolvido aqui!
  :main feedback-api.core
  :uberjar-name "feedback-api-standalone.jar"
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all
                       :jvm-opts ["-Dclojure.compiler.direct-linking=true"]}
             :dev {:dependencies [[ring/ring-mock "0.4.0"]]}})
