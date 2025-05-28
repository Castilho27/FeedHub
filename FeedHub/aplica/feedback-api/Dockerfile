# Etapa 1: Compilar o uberjar
FROM clojure:openjdk-21-lein as builder

WORKDIR /app

# Copiar arquivos de projeto
COPY project.clj /app/
COPY src /app/src

# Resolver dependências e compilar
RUN lein deps
RUN lein uberjar

# Etapa 2: Imagem mais leve para rodar
# Abaixo, a instrução FROM deve estar sozinha em sua linha, sem comentários ou outros caracteres.
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copiar o uberjar da etapa de build
COPY --from=builder /app/target/feedback-api-standalone.jar /app/app.jar

# Expor a porta que sua API usa (ajustado para 3001, conforme sua aplicação)
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["java", "-jar", "app.jar"]