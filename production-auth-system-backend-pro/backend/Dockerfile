```dockerfile
# Stage 1: Build the Spring Boot application
FROM maven:3.9.6-amazoncorretto-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B # Download dependencies
COPY src ./src
RUN mvn clean install -DskipTests # Build the application, skipping tests

# Stage 2: Create the final Docker image
FROM amazoncorretto:17-alpine-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar authsystem.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "authsystem.jar"]
```