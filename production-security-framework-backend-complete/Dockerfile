# Use a slimmed down OpenJDK 17 image for smaller size
FROM openjdk:17-jdk-slim as build

# Set the working directory
WORKDIR /app

# Copy the Maven pom.xml and src directory
COPY pom.xml .
COPY src ./src

# Build the application
# Skip tests to speed up the build in Docker, run tests in CI/CD
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests

# --- Second stage: Runtime image ---
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]