# Use a multi-stage build
# Stage 1: Build the application
FROM eclipse-temurin:17-jdk-alpine as builder

WORKDIR /app

# Copy the Maven wrapper files and pom.xml first to leverage Docker cache
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download dependencies (only if pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the application source
COPY src ./src

# Build the JAR
RUN ./mvnw package -DskipTests

# Stage 2: Create the final image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port the Spring Boot application runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]