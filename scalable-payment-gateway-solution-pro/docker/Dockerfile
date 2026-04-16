```dockerfile
# Use a specific OpenJDK version for stability and security
FROM openjdk:17-jdk-slim AS build

# Set working directory
WORKDIR /app

# Copy the Maven wrapper files and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (only if pom.xml changes)
RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY src src

# Build the application
RUN ./mvnw clean install -DskipTests

# Stage 2: Create a smaller runtime image
FROM openjdk:17-jre-slim

# Set working directory
WORKDIR /app

# Copy the compiled JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8080

# Define environment variables for database connection (can be overridden at runtime)
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=payment_processor
ENV DB_USER=payment_user
ENV DB_PASSWORD=payment_password
ENV JWT_SECRET=a_very_long_and_secure_secret_key_that_should_be_at_least_256_bits_long_and_generated_randomly

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```