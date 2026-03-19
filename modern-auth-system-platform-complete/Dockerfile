# Use a JRE base image for a smaller footprint
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the packaged Spring Boot JAR file into the container
# Assuming 'target/auth-system-0.0.1-SNAPSHOT.jar' is the name of your built JAR
COPY target/auth-system-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the Spring Boot application runs on
EXPOSE 8080

# Define environment variables (can be overridden by docker-compose or Kubernetes)
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=authdb
ENV DB_USERNAME=user
ENV DB_PASSWORD=password
ENV JWT_SECRET=your_super_secret_key_for_jwt_which_is_at_least_256_bit_long # CHANGE THIS!
ENV SPRING_PROFILES_ACTIVE=prod # Or 'dev' if you want DDL-auto update

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**`docker-compose.yml`**
```yaml