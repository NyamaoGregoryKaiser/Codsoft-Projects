# Use a lighter base image for Java applications
FROM eclipse-temurin:17-jre-focal

# Set the working directory in the container
WORKDIR /app

# Copy the packaged Spring Boot application JAR file
# The JAR file is typically generated as 'web-scraping-tools-0.0.1-SNAPSHOT.jar' by Maven
COPY target/web-scraping-tools-0.0.1-SNAPSHOT.jar app.jar

# Expose the port that the Spring Boot application runs on
EXPOSE 8080

# Set environment variables for database connection (replace with actual values or use secrets)
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=webscraping
ENV DB_USERNAME=user
ENV DB_PASSWORD=password
ENV JWT_SECRET_KEY=YourSuperSecretJwtKeyThatIsLongEnoughAndRandomlyGeneratedForProductionEnvironments

# Command to run the application
# -Djava.security.egd=file:/dev/urandom for faster startup in container
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/urandom", "-jar", "app.jar"]