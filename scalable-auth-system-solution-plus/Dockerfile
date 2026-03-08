# Use a slim Java runtime image for the builder stage
FROM openjdk:17-jdk-slim AS builder

# Set the working directory
WORKDIR /app

# Copy the Maven pom.xml file to download dependencies
COPY backend/pom.xml .

# Download dependencies (only if pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy the rest of the application source code
COPY backend/src ./src

# Build the JAR application
RUN mvn package -DskipTests

# Use a lean base image for the final stage
FROM openjdk:17-jre-slim

# Set the working directory
WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/auth-system-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the application runs on
EXPOSE 8080

# Define the entry point for the application
ENTRYPOINT ["java", "-jar", "app.jar"]