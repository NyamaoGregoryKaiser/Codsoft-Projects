# Use a smaller base image for Java 17
FROM eclipse-temurin:17-jdk-alpine

# Set the working directory
WORKDIR /app

# Copy the Maven wrapper files to allow building inside the container if needed (dev flow)
# Or, typically, build outside and copy the JAR
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Install Maven if you plan to build inside the container, otherwise skip
# RUN apk add --no-cache maven

# Build the application (skipping tests for smaller image in production build)
# This layer uses a separate command to optimize Docker caching:
# 1. Download dependencies (seldom changes)
# 2. Copy source code (frequently changes)
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Expose the port the Spring Boot app runs on
EXPOSE 8080

# Expose port for debugging (if enabled)
# EXPOSE 5005

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

# --- Multi-stage build for production optimized image (alternative) ---
# FROM maven:3.8.7-openjdk-17 AS build
# COPY . /src/app
# WORKDIR /src/app
# RUN mvn clean package -DskipTests

# FROM eclipse-temurin:17-jre-alpine
# COPY --from=build /src/app/target/*.jar /app/app.jar
# EXPOSE 8080
# ENTRYPOINT ["java","-jar","/app/app.jar"]
```

**`frontend/package.json`**
```json