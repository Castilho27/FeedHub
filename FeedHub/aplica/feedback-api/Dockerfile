# Etapa 1: Compilar o projeto
FROM clojure:tools-deps-1.11.1.1165-temurin-17-slim-jammy as builder

WORKDIR /app
COPY . .

RUN lein uberjar

# Etapa 2: Imagem final leve e atualizada
FROM openjdk:17-jdk-slim-bullseye

WORKDIR /app

# Atualiza o sistema para reduzir vulnerabilidades
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/feedback-api-standalone.jar .

EXPOSE 3001

CMD ["java", "-jar", "feedback-api-standalone.jar"]
