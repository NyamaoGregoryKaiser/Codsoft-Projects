# Deployment Guide: Secure Project Management System

This document provides a comprehensive guide for deploying the Secure Project Management System. It covers local development setup, containerized deployment using Docker Compose, and a conceptual CI/CD pipeline for production environments.

## Table of Contents

- [1. Local Development Deployment](#1-local-development-deployment)
    - [1.1. Running with Maven (H2 In-Memory)](#11-running-with-maven-h2-in-memory)
    - [1.2. Running with Docker Compose (PostgreSQL)](#12-running-with-docker-compose-postgresql)
- [2. Production Deployment Strategy (Conceptual)](#2-production-deployment-strategy-conceptual)
    - [2.1. Prerequisites for Production](#21-prerequisites-for-production)
    - [2.2. CI/CD Pipeline (GitHub Actions)](#22-cicd-pipeline-github-actions)
    - [2.3. Manual Deployment to a Remote Server](#23-manual-deployment-to-a-remote-server)
    - [2.4. Cloud Deployment Considerations](#24-cloud-deployment-considerations)
- [3. Security Considerations](#3-security-considerations)
- [4. Monitoring and Logging](#4-monitoring-and-logging)

## 1. Local Development Deployment

### 1.1. Running with Maven (H2 In-Memory)

This is the quickest way to get the application running for development purposes, using an embedded H2 database.

**Prerequisites:**
*   Java 17 JDK installed
*   Apache Maven installed

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/secure-project-management.git
    cd secure-project-management
    ```
2.  **Build the project:**
    ```bash
    mvn clean install
    ```
    This command compiles the code, runs tests, and packages the application into a JAR file.
3.  **Run the Spring Boot application:**
    ```bash
    mvn spring-boot:run
    ```
    The application will start on `http://localhost:8080`.

    *   **Default Credentials:**
        *   **Admin:** `username: admin`, `password: adminpass`
        *   **User:** `username: user`, `password: userpass`
    *   **H2 Console:** Accessible at `http://localhost:8080/h2-console` with JDBC URL `jdbc:h2:mem:projectdb`, Username `sa`, Password `password`.

### 1.2. Running with Docker Compose (PostgreSQL)

This method provides a local environment that closely mirrors a production setup, using PostgreSQL as the database.

**Prerequisites:**
*   Docker Desktop (or Docker Engine and Docker Compose) installed

**Steps:**

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/your-username/secure-project-management.git
    cd secure-project-management
    ```
2.  **Build and run the services:**
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Forces Docker to rebuild the application image.
    *   `-d`: Runs the containers in detached mode (in the background).

    This will:
    *   Build the `secure-pm` Docker image based on the `Dockerfile`.
    *   Start a PostgreSQL database container.
    *   Start the Spring Boot application container, configured to connect to the PostgreSQL container.
    *   Liquibase will automatically run to create the schema and seed data in PostgreSQL.

3.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
    You should see both `app` and `db` services listed as `Up`. Wait for the `app` service's health check to pass.

4.  **Access the application:**
    Open your web browser and navigate to `http://localhost:8080`.
    Use the same default credentials as above.

5.  **Stop and clean up:**
    When you are done, stop the containers and optionally remove the associated volumes:
    ```bash
    docker-compose down # Stops and removes containers and networks
    # docker-compose down --volumes # Use this to also remove the pgdata volume (deletes database data)
    ```

## 2. Production Deployment Strategy (Conceptual)

For a production environment, a more robust and automated approach is essential. The provided `Dockerfile` and `.github/workflows/ci-cd.yml` illustrate a typical strategy.

### 2.1. Prerequisites for Production

*   **Version Control:** Git repository (e.g., GitHub).
*   **Container Registry:** Docker Hub, GitHub Container Registry, or a private registry (e.g., AWS ECR, GCP GCR) to store your Docker images.
*   **Cloud Provider/Server:** A virtual machine, cloud platform (AWS, Azure, GCP), or Kubernetes cluster to host your application.
*   **Database Service:** Managed database service (e.g., AWS RDS PostgreSQL, Azure Database for PostgreSQL) for production-grade reliability and scalability.
*   **Environment Variables:** Securely store sensitive configuration (database credentials, JWT secret, API keys) as environment variables on your production server. **Never hardcode secrets!**
*   **HTTPS/SSL:** Always deploy with HTTPS using a valid SSL certificate (e.g., Let's Encrypt, Cloudflare). This typically involves a reverse proxy (Nginx, Apache, or a cloud Load Balancer).

### 2.2. CI/CD Pipeline (GitHub Actions)

The `.github/workflows/ci-cd.yml` file sets up a basic Continuous Integration/Continuous Deployment pipeline:

1.  **Build and Test:**
    *   Triggered on `push` to `main` or `develop` and `pull_request` events.
    *   Checks out code, sets up Java 17, and runs `mvn clean install`.
    *   Executes unit and integration tests (including Testcontainers for database integration tests).
    *   Generates JaCoCo code coverage report.
    *   (Optional) Uploads coverage report to Codecov.
    *   **Failure on any test/build error prevents further steps.**
2.  **Deploy to Docker Hub:**
    *   Runs **only if `build-and-test` job passes** and the push is to the `main` branch.
    *   Logs into Docker Hub using secrets.
    *   Builds the Docker image and pushes it to Docker Hub with the `latest` tag.
3.  **Deploy to Remote Server (Conceptual):**
    *   Runs **only if `deploy-to-dockerhub` job passes**.
    *   Uses `appleboy/ssh-action` to connect to a remote server.
    *   Executes commands on the server to pull the latest Docker image and restart the application using `docker-compose` (or similar orchestration).

**To use this CI/CD pipeline:**

1.  **Fork the repository** to your GitHub account.
2.  **Configure GitHub Secrets** for your repository:
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_PASSWORD`: Your Docker Hub access token or password.
    *   `CODECOV_TOKEN`: (Optional) Your Codecov token.
    *   `SSH_HOST`: IP address or hostname of your remote deployment server.
    *   `SSH_USERNAME`: SSH username for your remote server.
    *   `SSH_PRIVATE_KEY`: The private SSH key to authenticate with your remote server (ensure it's secured).
    *   `SSH_PORT`: (Optional, default 22) SSH port for your remote server.
3.  **Set up `docker-compose.yml` on your remote server:**
    Ensure you have a `docker-compose.yml` file on your production server that pulls the correct image (`${{ secrets.DOCKER_USERNAME }}/secure-pm:latest`) and is configured for your production PostgreSQL instance and other environment variables (e.g., `JWT_SECRET`).

### 2.3. Manual Deployment to a Remote Server

If you prefer a manual approach or your CI/CD setup is different:

1.  **Build the Docker image:**
    ```bash
    docker build -t your-dockerhub-username/secure-pm:latest .
    ```
2.  **Push the image to your registry:**
    ```bash
    docker push your-dockerhub-username/secure-pm:latest
    ```
3.  **SSH into your production server.**
4.  **Create/Update `docker-compose.yml` on the server:**
    Modify the provided `docker-compose.yml` to point to your *production* PostgreSQL database and other sensitive configurations. Ensure `JWT_SECRET` is a strong, unique secret.
    ```yaml
    # Example production docker-compose.yml (db service might be removed if using managed DB)
    version: '3.8'
    services:
      app:
        image: your-dockerhub-username/secure-pm:latest
        ports:
          - "8080:8080"
        environment:
          # Use your actual production DB details
          SPRING_DATASOURCE_URL: jdbc:postgresql://your.production.db.host:5432/projectdb
          SPRING_DATASOURCE_USERNAME: your_db_username
          SPRING_DATASOURCE_PASSWORD: your_db_password
          SPRING_JPA_HIBERNATE_DDL_AUTO: validate # ALWAYS 'validate' in production
          SPRING_LIQUIBASE_ENABLED: "true"
          SPRING_LIQUIBASE_CHANGELOG: classpath:db/changelog/db.changelog-master.xml
          JWT_SECRET: your_very_long_and_secure_production_jwt_secret # IMPORTANT: USE A STRONG, UNIQUE SECRET
          JWT_EXPIRATION: 3600000
          # Add other production specific env vars
        restart: always # Ensure the app restarts if it crashes
        depends_on:
          - db_if_local # Remove if using managed DB

      # If using a managed database, remove this db service.
      # Otherwise, configure for production-grade persistence and backups.
      db:
        image: postgres:15-alpine
        # ... (configure for production with volumes, backups, etc.)
    ```
5.  **Pull the latest image and deploy:**
    ```bash
    docker-compose pull app # Pulls the latest image
    docker-compose up -d --remove-orphans # Starts/updates services, removes old ones
    ```
6.  **Set up a Reverse Proxy (Nginx/Apache):**
    In a production environment, you should place a reverse proxy (like Nginx) in front of your Spring Boot application. This handles:
    *   **SSL Termination:** Encrypting traffic (HTTPS).
    *   **Load Balancing:** Distributing traffic to multiple application instances (if scaled).
    *   **Caching:** Static content caching.
    *   **Security Headers:** Adding additional HTTP security headers.
    *   **Rate Limiting:** (Can also be done at proxy level, or in app as implemented)

## 2.4. Cloud Deployment Considerations

*   **AWS:** Deploy to AWS ECS (Elastic Container Service) with Fargate, or AWS EKS (Elastic Kubernetes Service). Use AWS RDS for PostgreSQL, AWS Secrets Manager for secrets, and AWS ALB for load balancing/SSL.
*   **Azure:** Deploy to Azure Container Instances (ACI), Azure Kubernetes Service (AKS), or Azure App Service (for containers). Use Azure Database for PostgreSQL, Azure Key Vault for secrets, and Azure Application Gateway for load balancing/SSL.
*   **GCP:** Deploy to Google Kubernetes Engine (GKE) or Cloud Run. Use Cloud SQL for PostgreSQL, Google Secret Manager for secrets, and Google Load Balancing for SSL.

## 3. Security Considerations

*   **HTTPS Everywhere:** Always use HTTPS in production.
*   **Strong Secrets:** Use long, random, and unique `JWT_SECRET` values, database passwords, and other sensitive credentials. Manage them via environment variables or a secret management service (e.g., AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).
*   **Least Privilege:** Configure user roles and permissions with the principle of least privilege.
*   **Database Access:** Restrict direct database access to only the application and necessary administration tools. Use strong passwords for database users.
*   **Firewall:** Configure network firewalls to only expose necessary ports (e.g., 80/443 for web traffic, 22 for SSH admin access).
*   **Security Headers:** Implement additional security headers (e.g., Content Security Policy, X-XSS-Protection, X-Content-Type-Options) via your reverse proxy or Spring Security.
*   **Dependency Scanning:** Regularly scan your project dependencies for known vulnerabilities (e.g., dependabot, Snyk).
*   **Regular Audits:** Perform security audits and penetration testing.

## 4. Monitoring and Logging

*   **Spring Boot Actuator:** The application exposes actuator endpoints (e.g., `/actuator/health`, `/actuator/info`, `/actuator/prometheus`) for monitoring.
*   **Centralized Logging:** For production, integrate logs with a centralized logging system (e.g., ELK Stack, Splunk, Datadog) for easier analysis and troubleshooting.
*   **Metrics:** Use Prometheus and Grafana for collecting and visualizing application metrics.
*   **Alerting:** Set up alerts for critical errors, performance degradation, or security incidents.

By following this guide, you can confidently deploy and manage the Secure Project Management System in various environments, prioritizing security and operational excellence.