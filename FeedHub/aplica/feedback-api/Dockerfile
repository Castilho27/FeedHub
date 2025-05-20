# Etapa 1: Compilar o projeto
FROM clojure:temurin-17-tools-deps-slim as builder

WORKDIR /app
COPY . .

RUN lein uberjar

# Etapa 2: Imagem final leve e atualizada
FROM openjdk:17.0.8-jdk-slim

WORKDIR /app

# Atualiza o sistema para reduzir vulnerabilidades
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/feedback-api-standalone.jar .

EXPOSE 3000

CMD ["java", "-jar", "feedback-api-standalone.jar"]
