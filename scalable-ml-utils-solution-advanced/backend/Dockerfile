# Use a lightweight OpenJDK 17 image
FROM eclipse-temurin:17-jre-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the built Spring Boot fat JAR to the container
# This assumes your build process (e.g., Maven) produces a JAR in target/
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Expose the port your Spring Boot application runs on
EXPOSE 8080

# Define environment variables for database connection (defaults for local dev)
# For production, these should be supplied via Docker Compose or Kubernetes secrets
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=ml_util_db
ENV DB_USER=mluser
ENV DB_PASSWORD=mlpassword
ENV JWT_SECRET=thisisthesecretkeyforjwttokengenerationanditsveryverylongandsecure
ENV MODEL_STORAGE_PATH=/app/ml-models # Inside container for model files

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]