```dockerfile
# Use a slim Java 17 base image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the OpenTelemetry Java Agent
# Download it manually: wget https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
# And place it in the same directory as this Dockerfile or in the root of the project
COPY opentelemetry-javaagent.jar /opentelemetry-javaagent.jar

# Copy Maven wrapper files and pom.xml first to leverage Docker cache
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Copy source code
COPY src src

# Build the application
# Use -Dmaven.test.skip=true to skip tests during build if tests are run in CI/CD pipeline separately
RUN ./mvnw clean install -DskipTests

# Expose the port the Spring Boot application runs on
EXPOSE 8080

# Command to run the application
# OpenTelemetry agent is configured via environment variables in docker-compose.yml
ENTRYPOINT ["java", "-jar", "target/tasksyncpro-0.0.1-SNAPSHOT.jar"]
```