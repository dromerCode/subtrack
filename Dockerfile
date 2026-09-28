# syntax=docker/dockerfile:1

FROM node:24-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist ./src/main/resources/static
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN addgroup -S subtrack && adduser -S subtrack -G subtrack
USER subtrack
COPY --from=backend /app/backend/target/subtrack.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
