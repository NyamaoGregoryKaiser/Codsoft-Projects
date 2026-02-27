# Deployment Guide for ProjectPulse

This document provides instructions and considerations for deploying the ProjectPulse application to a production environment. It assumes familiarity with Docker, Linux server administration, and basic cloud concepts.

## 1. Deployment Strategy

The recommended deployment strategy for ProjectPulse involves containerization using Docker, orchestrated by Docker Compose (for simpler deployments) or Kubernetes (for larger, more complex deployments).

### Key Components:

*   **PostgreSQL Database:** Dedicated managed database service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) or a Docker container (for smaller scale).
*   **Spring Boot Backend:** Docker container(s).
*   **React Frontend:** Docker container serving static files (e.g., Nginx) or integrated into the Spring Boot JAR (for monolithic deploy). For this project, a separate Nginx container for the frontend is used in Docker Compose.
*   **Reverse Proxy / Load Balancer:** (e.g., Nginx, AWS ALB, GCP Load Balancer) to route traffic, handle SSL/TLS, and distribute load across backend instances.

## 2. Production Checklist

Before deploying to production, ensure the following:

*   **Security:**
    *   **JWT Secret:** Replace `JWT_SECRET` in `application.yml` with a strong, random string (e.g., 256-bit key) and manage it as a secure environment variable or secret.
    *   **Database Credentials:** Use strong, unique passwords for the database user and manage them securely (e.g., AWS Secrets Manager, Vault).
    *   **HTTPS:** All traffic (frontend and API) must be served over HTTPS. Configure SSL/TLS certificates on your reverse proxy/load balancer.
    *   **CORS:** Restrict `app.cors.allowed-origins` in `application.yml` to your production frontend domain(s).
    *   **Dependencies:** Ensure all dependencies are up-to-date and free from known vulnerabilities.
    *   **Firewall:** Configure server firewalls (security groups) to only allow necessary ports (e.g., 443 for HTTPS, 22 for SSH, database port only from backend).
*   **Performance & Scalability:**
    *   **Database:** Use a managed database service configured for high availability, backups, and appropriate instance size.
    *   **Backend:** Consider running multiple instances of the backend service behind a load balancer for horizontal scaling and high availability.
    *   **Caching:** Monitor cache hit rates and adjust Caffeine configuration or consider external distributed caches (Redis, Memcached) if scaling horizontally.
    *   **Rate Limiting:** Monitor rate limit usage and adjust limits based on traffic patterns and business needs.
    *   **Build Optimization:** Ensure frontend is built with `npm run build` and backend with `mvn package` (or equivalent in Dockerfile) for production optimizations.
*   **Monitoring & Logging:**
    *   **Centralized Logging:** Integrate application logs (from `logs/projectpulse.log` or console output) with a centralized logging solution (e.g., ELK Stack, Splunk, Datadog, AWS CloudWatch Logs).
    *   **Metrics:** Collect metrics from Spring Boot Actuator (`/actuator/prometheus`) using Prometheus and visualize them with Grafana.
    *   **Health Checks:** Configure uptime monitoring and health checks against `/actuator/health`.
*   **Backup & Recovery:**
    *   **Database Backups:** Implement a robust database backup strategy (managed services usually provide this).
    *   **Container Images:** Store Docker images in a private container registry (e.g., Docker Hub, AWS ECR, GCP Container Registry).
*   **Environment Variables:** All sensitive configurations (database credentials, JWT secret, API keys) should be injected via environment variables, not hardcoded.

## 3. Deployment Steps (Example: Using Docker Compose on a single Linux VM)

This example assumes you have a Linux VM (e.g., EC2, DigitalOcean Droplet) with Docker and Docker Compose installed. For higher availability and scalability, consider Kubernetes.

### 3.1. Server Preparation

1.  **SSH into your server.**
2.  **Update system packages:**
    ```bash
    sudo apt update && sudo apt upgrade -y # For Ubuntu/Debian
    # sudo yum update -y # For CentOS/RHEL
    ```
3.  **Install Docker & Docker Compose (if not already installed):**
    Follow the official Docker installation guide for your OS.
    ```bash
    # Example for Ubuntu
    sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y # For Docker Compose V2
    # For Docker Compose V1:
    # sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    # sudo chmod +x /usr/local/bin/docker-compose
    ```
4.  **Add your user to the `docker` group:**
    ```bash
    sudo usermod -aG docker $USER
    newgrp docker # Apply group changes immediately
    ```
5.  **Configure Firewall (UFW example):**
    ```bash
    sudo ufw allow 22/tcp  # SSH
    sudo ufw allow 80/tcp  # HTTP (will redirect to HTTPS)
    sudo ufw allow 443/tcp # HTTPS
    sudo ufw enable
    ```

### 3.2. Clone Repository & Environment Setup

1.  **Clone the ProjectPulse repository:**
    ```bash
    git clone https://github.com/your-repo/project-pulse.git # Replace with your actual repo URL
    cd project-pulse
    ```
2.  **Create `.env` file for production environment variables:**
    This file should be kept secure and ideally not committed to version control.
    ```bash
    # .env (example)
    DB_HOST=projectpulse-prod-db.xxxxxxxx.us-east-1.rds.amazonaws.com # Managed DB endpoint
    DB_PORT=5432
    DB_NAME=projectpulse_prod
    DB_USERNAME=your_db_user
    DB_PASSWORD=your_strong_db_password

    JWT_SECRET=YOUR_SUPER_STRONG_AND_RANDOM_JWT_SECRET_KEY_AT_LEAST_32_CHARS # Crucial!

    # Frontend specific (if frontend is served separately by Nginx or similar)
    # REACT_APP_API_BASE_URL=https://api.yourdomain.com/api/v1 # Your production API URL

    # Backend CORS configuration for production
    APP_CORS_ALLOWED_ORIGINS=https://yourdomain.com
    APP_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
    APP_CORS_ALLOWED_HEADERS=*
    APP_CORS_EXPOSED_HEADERS=Authorization,Cache-Control,Content-Language,Content-Type,Expires,Last-Modified,Pragma
    APP_CORS_ALLOW_CREDENTIALS=true
    ```
    **Note:** If using a managed database service, modify `docker-compose.yml` to remove the `db` service and adjust the `backend` service's `SPRING_DATASOURCE_URL` to point to your external DB. For the frontend, remove the Nginx configuration from the `Dockerfile` if Spring Boot will serve the static files, or adjust Nginx config as needed.

### 3.3. Build and Deploy

1.  **Build Docker images for production:**
    *   For the backend, the `Dockerfile` uses a multi-stage build for a smaller final image.
    *   For the frontend, the `Dockerfile` builds the React app and serves it with Nginx.
    ```bash
    docker-compose build
    ```
2.  **Start the services in detached mode:**
    ```bash
    docker-compose up -d
    ```
3.  **Verify container status:**
    ```bash
    docker-compose ps
    ```
    All services (`db`, `backend`, `frontend`) should be `Up`.

### 3.4. Database Migrations (Important for Production)

For production, relying on `schema.sql` and `data.sql` run by Spring Boot's `defer-datasource-initialization` might not be robust enough, especially for schema evolution.

**Recommended Approach:** Use a dedicated database migration tool like **Flyway** or **Liquibase**.

*   **Flyway/Liquibase Integration:**
    1.  Add Flyway/Liquibase dependency to `backend/pom.xml`.
    2.  Remove `spring.sql.init.mode=always` and `spring.sql.init.schema-locations` from `application.yml`.
    3.  Create migration scripts (e.g., `V1__create_tables.sql`, `V2__add_index.sql`) in `src/main/resources/db/migration`.
    4.  Flyway/Liquibase will manage schema changes automatically on backend startup.

## 4. Setting up a Reverse Proxy (Nginx) for SSL

In a real production environment, you'd typically have a reverse proxy like Nginx or a cloud load balancer in front of your Docker containers.

1.  **Install Nginx on the host machine** (if not using cloud load balancer).
2.  **Configure Nginx to proxy requests:**
    *   Route `yourdomain.com` to the frontend container (port 80).
    *   Route `api.yourdomain.com` (or `yourdomain.com/api`) to the backend container (port 8080).
    *   Handle SSL termination for both domains.

    **Example Nginx configuration (`/etc/nginx/sites-available/projectpulse`):**

    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Use Certbot for easy SSL
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
        ssl_stapling on;
        ssl_stapling_verify on;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "no-referrer-when-downgrade";

        location / {
            proxy_pass http://localhost:3000; # Assuming frontend Nginx container port is exposed on host 3000
            # Or if host Nginx serves static files directly:
            # root /path/to/project-pulse/frontend/build;
            # try_files $uri $uri/ /index.html;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/v1/ {
            proxy_pass http://localhost:8080/api/v1/; # Assuming backend container port is exposed on host 8080
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 90; # Adjust as needed
        }

        # For Actuator endpoints
        location /actuator/ {
            proxy_pass http://localhost:8080/actuator/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            # Restrict access to /actuator to specific IPs or require authentication
        }

        # For Swagger UI
        location /swagger-ui.html {
            proxy_pass http://localhost:8080/swagger-ui.html;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        location /api-docs/ {
            proxy_pass http://localhost:8080/api-docs/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
3.  **Enable the Nginx configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/projectpulse /etc/nginx/sites-enabled/
    sudo nginx -t # Test configuration
    sudo systemctl reload nginx
    ```
4.  **Obtain SSL certificates:** Use [Certbot](https://certbot.eff.org/) to easily get free SSL certificates from Let's Encrypt.
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
    ```

## 5. Continuous Deployment

Integrate these steps into a CI/CD pipeline (refer to `CI_CD_PIPELINE.md`) to automate the deployment process after successful builds and tests. This typically involves:

1.  **Build:** Building Docker images.
2.  **Push:** Pushing images to a container registry.
3.  **Deploy:** Pulling new images on the server and updating/restarting containers (e.g., `docker-compose pull && docker-compose up -d --remove-orphans`).
```