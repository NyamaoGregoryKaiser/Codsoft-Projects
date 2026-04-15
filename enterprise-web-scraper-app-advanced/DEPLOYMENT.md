# Web Scraping Automation Platform - Deployment Guide

This document provides instructions for deploying the Web Scraping Automation Platform to various environments, focusing on Docker-based deployments.

---

## Table of Contents
1.  [Local Deployment (Docker Compose)](#1-local-deployment-docker-compose)
2.  [Production Deployment (Single Server with Docker Compose)](#2-production-deployment-single-server-with-docker-compose)
3.  [Production Deployment (Kubernetes - Conceptual)](#3-production-deployment-kubernetes---conceptual)
4.  [Environment Variables & Secrets Management](#4-environment-variables--secrets-management)
5.  [Post-Deployment Checks](#5-post-deployment-checks)
6.  [Troubleshooting](#6-troubleshooting)

---

## 1. Local Deployment (Docker Compose)

This is the quickest way to get the application up and running locally, including the PostgreSQL database.

**Prerequisites:**
*   Docker Desktop installed and running.
*   Git installed.
*   Maven installed (to build the JAR).

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/web-scraping-tools.git
    cd web-scraping-tools
    ```

2.  **Build the Spring Boot JAR file:**
    ```bash
    mvn clean install -DskipTests
    ```
    This will create `target/web-scraping-tools-0.0.1-SNAPSHOT.jar`. The `Dockerfile` is configured to copy this JAR.

3.  **Build and start the Docker Compose services:**
    ```bash
    docker-compose build
    docker-compose up -d
    ```
    *   `docker-compose build`: Builds the `app` Docker image using the `Dockerfile`.
    *   `docker-compose up -d`: Starts the `app` and `postgres` services in detached mode.

4.  **Verify services:**
    ```bash
    docker-compose ps
    ```
    You should see both `web-scraping-tools-app-1` and `web-scraping-tools-postgres-1` (or similar names) in a healthy state.

5.  **Access the application:**
    *   **Web UI:** Open your browser to `http://localhost:8080`
    *   **Swagger UI (API Docs):** Open your browser to `http://localhost:8080/swagger-ui.html`

6.  **Stop services:**
    ```bash
    docker-compose down
    ```
    This will stop and remove the containers and the network. To remove the persistent PostgreSQL data volume as well, use `docker-compose down -v`.

---

## 2. Production Deployment (Single Server with Docker Compose)

For small to medium-scale production deployments on a single server, Docker Compose can be a viable option.

**Prerequisites:**
*   A Linux server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed.
*   SSH access to the server.
*   Firewall configured to allow incoming traffic on port 8080 (or 80/443 if using a reverse proxy).
*   A pre-built Docker image pushed to a registry (e.g., Docker Hub, GitHub Container Registry). This is typically handled by your CI/CD pipeline.

**Steps:**

1.  **SSH into your server:**
    ```bash
    ssh your_user@your_server_ip
    ```

2.  **Create a deployment directory:**
    ```bash
    sudo mkdir /opt/web-scraping-tools
    sudo chown your_user:your_user /opt/web-scraping-tools
    cd /opt/web-scraping-tools
    ```

3.  **Download `docker-compose.yml` and `.env` (optional):**
    Copy the `docker-compose.yml` from your project to this directory.
    If you use environment variables for sensitive data, create a `.env` file in the same directory (e.g., `JWT_SECRET_KEY=your_production_secret_key`, `DB_PASSWORD=your_db_password`). These variables will be picked up by `docker-compose`.

    Example `.env` content:
    ```
    JWT_SECRET_KEY=REPLACE_WITH_A_STRONG_RANDOM_KEY_FOR_PRODUCTION
    POSTGRES_DB=webscraping
    POSTGRES_USER=produser
    POSTGRES_PASSWORD=prod_db_password
    SPRING_DATASOURCE_USERNAME=produser
    SPRING_DATASOURCE_PASSWORD=prod_db_password
    ```

    **Important:** Update the `docker-compose.yml` to use your pre-built image from the registry instead of building locally.
    Change `build: .` to `image: your_docker_username/web-scraping-tools:latest` in the `app` service.

4.  **Pull the Docker images and start services:**
    ```bash
    # Log in to Docker Hub if your image is private
    docker login -u your_docker_username -p your_docker_password

    # Start the application
    docker-compose up -d
    ```

5.  **Configure a Reverse Proxy (Recommended for Production):**
    For production, it's highly recommended to place a reverse proxy (like Nginx or Caddy) in front of your Spring Boot application to handle SSL/TLS, domain routing, and potentially more advanced rate limiting or caching.

    **Example Nginx configuration (`/etc/nginx/sites-available/web-scraping-tools`):**
    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Replace with your SSL cert
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # Replace with your SSL key

        location / {
            proxy_pass http://localhost:8080; # Assuming your app is on port 8080
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    Enable the site: `sudo ln -s /etc/nginx/sites-available/web-scraping-tools /etc/nginx/sites-enabled/` and reload Nginx: `sudo systemctl reload nginx`.

6.  **Monitoring:**
    Ensure logging is configured correctly (e.g., sending JSON logs to a centralized log management system) and monitor your server's resources.

---

## 3. Production Deployment (Kubernetes - Conceptual)

For high-availability, scalability, and robust management, Kubernetes is the industry standard.

**Key Components:**

*   **Deployment:** Define a Kubernetes Deployment for the Spring Boot application, specifying the Docker image, replica count, resource limits, and environment variables (using Kubernetes Secrets).
*   **Service:** A Kubernetes Service (e.g., ClusterIP or NodePort) to expose the application pods.
*   **Ingress:** An Ingress resource (with an Ingress Controller like Nginx Ingress or Traefik) to handle external traffic, SSL termination, and routing to the Service.
*   **Persistent Volume (PV) & Persistent Volume Claim (PVC):** For the PostgreSQL database, ensuring data persistence independent of the pod lifecycle.
*   **StatefulSet:** For PostgreSQL, to ensure stable identifiers and ordered scaling.
*   **Secrets:** Kubernetes Secrets to securely store database credentials, JWT secret, etc.
*   **ConfigMaps:** For non-sensitive configurations.
*   **Horizontal Pod Autoscaler (HPA):** To automatically scale application pods based on CPU/memory utilization or custom metrics.

**General Steps (Highly Simplified):**

1.  **Set up a Kubernetes Cluster:** EKS (AWS), GKE (GCP), AKS (Azure), or self-hosted.
2.  **Create Kubernetes Secrets:**
    ```bash
    kubectl create secret generic app-secrets \
      --from-literal=jwt-secret='YOUR_SUPER_SECRET_JWT_KEY' \
      --from-literal=db-password='YOUR_DB_PASSWORD'
    ```
3.  **Define YAML Manifests:** Create `deployment.yaml`, `service.yaml`, `ingress.yaml`, `postgres-statefulset.yaml`, `postgres-service.yaml`, `pvc.yaml` (or use Helm charts).
4.  **Apply Manifests:**
    ```bash
    kubectl apply -f .
    ```
5.  **Monitor:** Use Kubernetes dashboards, Prometheus/Grafana, and centralized logging solutions.

---

## 4. Environment Variables & Secrets Management

It is crucial to manage sensitive information (database credentials, JWT secret keys, API keys for external services) securely.

*   **Development (Docker Compose):** Use a `.env` file alongside `docker-compose.yml`.
*   **Production (Docker Compose):** Use a `.env` file on the server, or directly pass environment variables to `docker run` commands.
*   **Production (Kubernetes):** Use Kubernetes Secrets for sensitive data and ConfigMaps for non-sensitive configurations. Avoid putting secrets directly in YAML files or committing them to source control.
*   **CI/CD:** Utilize CI/CD platform's secret management features (e.g., GitHub Secrets).

**Example environment variables:**

```
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=webscraping
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET_KEY=a_very_long_and_random_string_for_jwt_signing
APP_SCRAPING_SCHEDULER_INTERVAL_MS=300000 # 5 minutes
```

---

## 5. Post-Deployment Checks

After deploying, verify the application's health:

1.  **Check Docker Container Status:**
    ```bash
    docker-compose ps # For Docker Compose
    kubectl get pods # For Kubernetes
    ```
    Ensure all containers/pods are running and healthy.

2.  **Access Application URL:**
    Navigate to `http://your_domain.com` or `http://your_server_ip:8080`.
    *   Confirm the login page loads.
    *   Log in with `admin/adminpass` (if seeded) and verify you can access the scrapers list.

3.  **Check API Endpoints:**
    Use `curl` or Postman to test a few API endpoints:
    *   `POST /api/auth/authenticate` to get a token.
    *   `GET /api/scrapers` with the token.
    *   `POST /api/scrapers/{id}/run` to trigger a scraper.

4.  **Review Logs:**
    Check application logs for errors or warnings.
    ```bash
    docker-compose logs -f app # For Docker Compose
    kubectl logs -f <app-pod-name> # For Kubernetes
    ```

5.  **Monitor Health Endpoints:**
    Access Spring Boot Actuator health endpoint: `http://your_domain.com/actuator/health` (or `http://localhost:8080/actuator/health` if direct).
    It should return status `UP`.

---

## 6. Troubleshooting

*   **Container not starting:**
    *   Check `docker-compose logs app` for Spring Boot startup errors.
    *   Ensure database container is healthy and accessible.
    *   Verify environment variables are correctly set.
*   **Database connection issues:**
    *   Ensure `postgres` container is running and accessible from the `app` container.
    *   Check database credentials in `application.yml` or environment variables.
    *   Verify network connectivity between containers (they should be on the same Docker network by default with `docker-compose`).
*   **`401 Unauthorized` / `403 Forbidden`:**
    *   Ensure you are sending a valid JWT token in the `Authorization: Bearer <token>` header.
    *   Verify the token's expiration.
    *   Check user roles and `@PreAuthorize` annotations.
*   **`404 Not Found`:**
    *   Double-check the API endpoint URLs.
    *   Ensure the resource (scraper, task, data item) actually exists in the database.
*   **`429 Too Many Requests`:**
    *   You've hit the rate limit. Wait a few seconds before trying again, or adjust the `RateLimitInterceptor` settings (not recommended for production).
*   **Flyway errors:**
    *   Ensure `spring.jpa.hibernate.ddl-auto` is set to `validate` or `none` in production after initial migrations. If it's `create-drop` or `update`, it might interfere with Flyway.
    *   Check for SQL syntax errors in migration scripts.

---
```