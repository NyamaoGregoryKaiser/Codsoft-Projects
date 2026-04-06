# Use a multi-stage build to create a smaller final image

# Stage 1: Build the application
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the project with Maven, skipping tests for faster build in CI/CD (tests run in separate CI stage)
RUN mvn -f pom.xml clean package -Dmaven.test.skip=true

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy only the built JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8080

# Set environment variables for database connection if not provided during runtime
# IMPORTANT: These should be overridden in production using Docker Compose, Kubernetes, etc.
ENV DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=cmsdb \
    DB_USERNAME=cmsuser \
    DB_PASSWORD=cmspass \
    JWT_SECRET_KEY=aSecretKeyForTestingAndDevelopmentWhichIsDefinitelyNotStrongEnoughForProductionUsePleaseChangeMe

# Run the application
ENTRYPOINT ["java","-jar","app.jar"]