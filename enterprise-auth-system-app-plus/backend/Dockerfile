# Use a slim Java runtime image
FROM openjdk:17-jdk-slim AS build

# Set the working directory in the container
WORKDIR /app

# Copy the Maven project files (pom.xml and .mvn folder first for caching)
COPY pom.xml .
COPY .mvn .mvn

# Copy the project source code
COPY src src

# Build the application using Maven
# The -Dmaven.test.skip=true flag skips tests during the Docker build
# The -Dspring-boot.repackage.skip=true ensures we get a plain JAR first
# Then we use 'dependency:resolve' to download all dependencies to cache layer
# and 'package' to build the fat JAR
RUN mvn clean package -Dmaven.test.skip=true

# Stage 2: Create the final image
FROM openjdk:17-jre-slim

# Set the working directory
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/auth-system-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the Spring Boot application runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### `frontend/Dockerfile`
```dockerfile