```dockerfile
# Stage 1: Build the application
FROM openjdk:17-jdk-slim AS build

# Set working directory
WORKDIR /app

# Copy the Maven wrapper files to enable building without a local Maven installation
COPY mvnw .
COPY .mvn .mvn

# Copy the pom.xml and download all dependencies (useful for caching layers)
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the application source code
COPY src src

# Build the JAR file
RUN ./mvnw clean install -DskipTests

# Stage 2: Create the final runtime image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8080

# Set environment variables for database connection (default values)
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=scrapify_db
ENV DB_USERNAME=scrapify_user
ENV DB_PASSWORD=scrapify_pass
ENV JWT_SECRET=thisisthesecretkeyforjwtauthenticationanditshouldbeverylongandsecureinaproductionenvironment
ENV JWT_EXPIRATION=3600000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```