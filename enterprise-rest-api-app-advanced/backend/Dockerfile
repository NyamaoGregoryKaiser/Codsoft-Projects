# Use a slimmed-down OpenJDK 17 base image
FROM openjdk:17-jdk-slim AS build

# Set working directory inside the container
WORKDIR /app

# Copy the Maven pom.xml and src directory
COPY pom.xml .
COPY src ./src

# Build the Spring Boot application using Maven
# The -Dmaven.test.skip=true flag skips tests during the build, which is common for Docker builds
# However, for a production-ready system, tests should be run in a CI pipeline BEFORE building the image.
RUN --mount=type=cache,target=/root/.m2 ./mvnw package -DskipTests
# If you don't use the wrapper, replace with:
# RUN mvn clean package -DskipTests

# Use a JRE-only base image for a smaller final image
FROM openjdk:17-jre-slim

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar /app/projectpulse.jar

# Expose the port the Spring Boot app runs on
EXPOSE 8080

# Define the command to run the application
ENTRYPOINT ["java", "-jar", "/app/projectpulse.jar"]
```
**`frontend/Dockerfile`**
```dockerfile