```dockerfile
# Use a specific OpenJDK version for stability
FROM openjdk:17-jdk-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper files to allow building inside the container if needed
# COPY mvnw .
# COPY .mvn .mvn

# Copy the pom.xml file to leverage Docker layer caching
COPY pom.xml .

# If you need to build inside Docker, uncomment the following line and ensure mvnw is copied
# RUN ./mvnw dependency:go-offline -B

# Copy the application JAR file built by Maven
# Assuming your JAR is named target/ml-utilities-system-0.0.1-SNAPSHOT.jar
ARG JAR_FILE=target/ml-utilities-system-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

# Expose the port your Spring Boot application runs on
EXPOSE 8080

# Define environment variables for database connection (can be overridden by docker-compose/k8s)
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=ml_util_db
ENV DB_USERNAME=mluser
ENV DB_PASSWORD=mlpassword
ENV JWT_SECRET=YOUR_SECURE_JWT_SECRET_KEY_THAT_IS_AT_LEAST_256_BITS_LONG_DOCKER_DEFAULT

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
```