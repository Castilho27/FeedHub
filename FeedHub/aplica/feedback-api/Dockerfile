# Etapa 1: Compilar o projeto
FROM clojure:openjdk-17-tools-deps as builder

WORKDIR /app
COPY . .

# Gera o uberjar
RUN lein uberjar

# Etapa 2: Imagem final leve
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copia apenas o JAR gerado
COPY --from=builder /app/target/feedback-api-standalone.jar .

# Define a porta padrão (usada pelo Jetty)
EXPOSE 3000

# Comando para rodar o app
CMD ["java", "-jar", "feedback-api-standalone.jar"]
