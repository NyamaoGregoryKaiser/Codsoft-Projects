```dockerfile
# Stage 1: Build the application
FROM eclipse-temurin:17-jdk-alpine as builder

WORKDIR /app

COPY gradle/ gradle/
COPY gradlew .
COPY build.gradle .
COPY settings.gradle .
COPY src/ src/

RUN chmod +x gradlew
RUN ./gradlew clean build -x test

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose the port the Spring Boot application runs on
EXPOSE 8080

# Define environment variables for database connection (can be overridden by docker-compose)
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=taskflow_db
ENV DB_USER=taskflow_user
ENV DB_PASSWORD=taskflow_password
ENV JWT_SECRET=aVerySecretKeyThatIsAtLeast256BitsLongAndShouldBeChangedInProduction
ENV JAEGER_HOST=jaeger

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```