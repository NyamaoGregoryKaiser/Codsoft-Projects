```markdown
# Deployment Guide

This document outlines the steps to deploy the Enterprise Data Visualization Tools System to a production environment. The recommended approach involves using Docker containers orchestrated with Docker Compose on a single server, which can be extended to a Kubernetes cluster for more advanced deployments.

## Table of Contents

1.  [Deployment Strategy Overview](#1-deployment-strategy-overview)
2.  [Prerequisites](#2-prerequisites)
3.  [Server Setup](#3-server-setup)
4.  [Configure Environment Variables](#4-configure-environment-variables)
5.  [Building and Pushing Docker Images](#5-building-and-pushing-docker-images)
6.  [Deploying with Docker Compose](#6-deploying-with-docker-compose)
7.  [Nginx Configuration (Reverse Proxy & SSL)](#7-nginx-configuration-reverse-proxy--ssl)
8.  [Database Management](#8-database-management)
9.  [Monitoring and Logging](#9-monitoring-and-logging)
10. [CI/CD Integration](#10-cicd-integration)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Deployment Strategy Overview

We will deploy the application using Docker containers on a Linux server. Nginx will act as a reverse proxy, serving the static frontend files and forwarding API requests to the backend Flask container. SSL (using Certbot for Let's Encrypt) will be configured for secure HTTPS communication.

**Components:**
*   **Nginx:** Serves React static files and proxies API requests to the Flask backend. Handles SSL termination.
*   **Frontend Container:** Serves the built React application's static files (e.g., `your-dockerhub-user/dashboard-frontend:latest`).
*   **Backend Container:** Runs the Flask application using Gunicorn (e.g., `your-dockerhub-user/dashboard-backend:latest`).
*   **PostgreSQL Container:** The primary database for the application.
*   **Redis Container:** Used for caching and rate limiting.
*   **Docker Compose:** Orchestrates all these containers.

---

## 2. Prerequisites

*   **Production Server:** A Linux server (e.g., Ubuntu, CentOS) with sufficient CPU, RAM, and disk space.
*   **Domain Name:** A registered domain name pointing to your server's IP address (e.g., `dashboard.yourcompany.com`).
*   **Docker & Docker Compose:** Installed on the production server.
*   **SSH Access:** To connect to your server.
*   **Git:** For cloning the repository on the server.
*   **Docker Hub Account (or private registry):** To push your built Docker images.

---

## 3. Server Setup

1.  **Update OS & Install Docker:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install docker.io docker-compose -y
    sudo usermod -aG docker $USER # Add your user to the docker group
    newgrp docker # Apply group changes immediately
    ```

2.  **Clone the Repository:**
    Log in to your server via SSH, then clone your project:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git /srv/dashboard_app
    cd /srv/dashboard_app
    ```
    *   Consider setting up a dedicated deployment user or using SSH keys for automation.

---

## 4. Configure Environment Variables

Production environment variables must be securely managed.

1.  **Create a `.env` file:**
    Inside `/srv/dashboard_app/`, create a `.env` file for production configuration. This file should **not** be committed to Git.

    ```bash
    # /srv/dashboard_app/.env
    # Flask App Configuration
    FLASK_ENV=production
    SECRET_KEY="YOUR_VERY_LONG_AND_RANDOM_SECRET_KEY" # Generate a strong, unique key
    JWT_SECRET_KEY="YOUR_VERY_LONG_AND_RANDOM_JWT_SECRET" # Generate a strong, unique key
    DATABASE_URL="postgresql://user:password@db:5432/dashboard_db" # Ensure 'db' is the service name in docker-compose
    
    # Caching (Redis)
    CACHE_REDIS_HOST=redis
    CACHE_REDIS_PORT=6379
    # CACHE_REDIS_PASSWORD="YOUR_REDIS_PASSWORD_IF_CONFIGURED" # Uncomment if Redis needs a password
    
    # Frontend Configuration
    # This isn't directly used by the Nginx-served frontend, but good for consistency.
    # The actual API base URL is configured in frontend/nginx.conf
    REACT_APP_API_BASE_URL=/api 

    # CORS Origins - IMPORTANT! Set this to your actual frontend domain
    CORS_ORIGINS=https://dashboard.yourcompany.com 

    # Database credentials (if different from default in docker-compose.yml)
    DB_USER=dashboard_user
    DB_PASSWORD=YOUR_DB_PASSWORD
    DB_NAME=dashboard_db
    POSTGRES_USER=dashboard_user # Match DB_USER
    POSTGRES_PASSWORD=YOUR_DB_PASSWORD # Match DB_PASSWORD

    # Other settings...
    ```
    *   **Security:** Ensure `SECRET_KEY`, `JWT_SECRET_KEY`, and database passwords are truly random and strong. Do not expose them publicly.
    *   **`DATABASE_URL`:** Make sure the hostname `db` matches the PostgreSQL service name in `docker-compose.yml`.
    *   **`CORS_ORIGINS`:** Crucial for security. Replace `https://dashboard.yourcompany.com` with your actual frontend URL.

---

## 5. Building and Pushing Docker Images

While CI/CD (GitHub Actions) handles this automatically, understanding the process is vital.

1.  **Log in to Docker Hub:**
    ```bash
    docker login
    ```
    (Enter your Docker Hub username and password)

2.  **Build and Push Backend Image:**
    ```bash
    cd /srv/dashboard_app/backend
    docker build -t your-dockerhub-user/dashboard-backend:latest .
    docker push your-dockerhub-user/dashboard-backend:latest
    ```

3.  **Build and Push Frontend Image:**
    ```bash
    cd /srv/dashboard_app/frontend
    docker build --build-arg REACT_APP_API_BASE_URL=/api -t your-dockerhub-user/dashboard-frontend:latest .
    docker push your-dockerhub-user/dashboard-frontend:latest
    ```
    *   `--build-arg REACT_APP_API_BASE_URL=/api`: This is critical. It tells the frontend build that API requests should be relative to the root, letting Nginx handle the proxying.

---

## 6. Deploying with Docker Compose

1.  **Update `docker-compose.yml`:**
    Modify the `docker-compose.yml` in `/srv/dashboard_app/` to use your pushed Docker images instead of local builds, and for production settings.

    *   Change `build: .` to `image: your-dockerhub-user/dashboard-backend:latest`.
    *   Remove `volumes: - ./backend:/app/backend` from backend service.
    *   Update `command:` for backend to `gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app` (remove migration/seed data logic as that's one-time or handled by CI/CD migrations).
    *   Change `build: .` to `image: your-dockerhub-user/dashboard-frontend:latest`.
    *   Remove `volumes: - ./frontend:/app` from frontend service.
    *   Remove `ports: - "3000:80"` from frontend service, as Nginx will handle external access.
    *   Add an `nginx` service (see next section).

    **Example `docker-compose.yml` for Production:**
    ```yaml
    version: '3.8'

    services:
      db:
        image: postgres:14-alpine
        restart: always
        environment:
          POSTGRES_DB: ${DB_NAME}
          POSTGRES_USER: ${DB_USER}
          POSTGRES_PASSWORD: ${DB_PASSWORD}
        volumes:
          - pg_data:/var/lib/postgresql/data
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
          interval: 10s
          timeout: 5s
          retries: 5
        # No ports exposed to host directly in production usually

      redis:
        image: redis:6-alpine
        restart: always
        command: redis-server --appendonly yes
        volumes:
          - redis_data:/data
        # environment:
        #   REDIS_PASSWORD: ${CACHE_REDIS_PASSWORD} # Uncomment if using password
        healthcheck:
          test: ["CMD", "redis-cli", "ping"]
          interval: 5s
          timeout: 3s
          retries: 5

      backend:
        image: your-dockerhub-user/dashboard-backend:latest # Use your actual image
        restart: always
        env_file:
          - ./.env # Production .env file
        depends_on:
          db:
            condition: service_healthy
          redis:
            condition: service_healthy
        command: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app # Production command
        # No ports exposed to host directly, Nginx proxies to it

      frontend:
        image: your-dockerhub-user/dashboard-frontend:latest # Use your actual image
        restart: always
        depends_on:
          backend:
            condition: service_started
        # No ports exposed to host directly

      nginx: # New Nginx service for reverse proxy and static file serving
        image: nginx:alpine
        restart: always
        ports:
          - "80:80"  # HTTP
          - "443:443" # HTTPS
        volumes:
          - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
          # Mount certbot directories for SSL certificates
          - ./certbot/conf:/etc/letsencrypt
          - ./certbot/www:/var/www/certbot
        depends_on:
          frontend:
            condition: service_started # Nginx needs frontend static files
          backend:
            condition: service_started # Nginx proxies to backend

    volumes:
      pg_data:
      redis_data:
    ```

2.  **Run Migrations and Seed Data (if not done by CI/CD):**
    Before starting the backend, ensure the database is ready and migrations are applied.
    ```bash
    docker-compose up -d db redis # Start db and redis first
    docker-compose run --rm backend sh -c "until pg_isready -h db -U ${DB_USER}; do echo 'Waiting for db...'; sleep 1; done; alembic -c alembic.ini upgrade head"
    docker-compose run --rm backend sh -c "python seed_data.py" # Only run once for initial seed
    ```

3.  **Deploy with Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    *   The `-d` flag runs containers in detached mode.

---

## 7. Nginx Configuration (Reverse Proxy & SSL)

Nginx will serve static frontend files and proxy API requests. We'll use Certbot for Let's Encrypt SSL certificates.

1.  **Create Nginx Configuration Directory and File:**
    ```bash
    mkdir -p /srv/dashboard_app/nginx
    # Create /srv/dashboard_app/nginx/nginx.conf
    ```

2.  **`nginx.conf` content:**
    Replace `dashboard.yourcompany.com` with your actual domain.

    ```nginx
    # /srv/dashboard_app/nginx/nginx.conf
    server {
        listen 80;
        server_name dashboard.yourcompany.com;

        # Redirect all HTTP to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }

        # For Certbot ACME challenges
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }

    server {
        listen 443 ssl;
        server_name dashboard.yourcompany.com;

        ssl_certificate /etc/letsencrypt/live/dashboard.yourcompany.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/dashboard.yourcompany.com/privkey.pem;

        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384";
        ssl_prefer_server_ciphers on;
        add_header X-Frame-Options "DENY";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "no-referrer-when-downgrade";

        root /usr/share/nginx/html; # Points to the static files from frontend container
        index index.html index.htm;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to the backend Flask application
        location /api/ {
            proxy_pass http://backend:5000/api/; # 'backend' is the Docker service name
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
            proxy_buffering off; # Disable buffering for real-time applications
        }
    }
    ```

3.  **Obtain SSL Certificates with Certbot:**

    *   **Initial run of Nginx (without SSL):** Start `nginx` service first so Certbot can communicate with it.
        ```bash
        docker-compose up -d nginx
        ```
    *   **Request certificates:**
        ```bash
        sudo docker run --rm --name certbot \
            -v "/srv/dashboard_app/certbot/conf:/etc/letsencrypt" \
            -v "/srv/dashboard_app/certbot/www:/var/www/certbot" \
            certbot/certbot \
            certonly --webroot -w /var/www/certbot \
            -d dashboard.yourcompany.com \
            --email your-email@example.com --rsa-key-size 4096 --agree-tos --no-eff-email
        ```
        *   Replace `dashboard.yourcompany.com` and `your-email@example.com`.
        *   This creates `conf/live/dashboard.yourcompany.com/` with certs.
    *   **Stop Nginx and restart all services:**
        ```bash
        docker-compose down # Stop everything
        docker-compose up -d # Start everything, Nginx will now find certs
        ```
    *   **Automate Renewal (Certbot container):** Add a cron job on the host machine to renew certificates regularly (e.g., monthly).
        ```bash
        sudo crontab -e
        # Add the following line:
        0 0 1 * * /usr/bin/docker run --rm --name certbot \
            -v "/srv/dashboard_app/certbot/conf:/etc/letsencrypt" \
            -v "/srv/dashboard_app/certbot/www:/var/www/certbot" \
            certbot/certbot renew --webroot -w /var/www/certbot --post-hook "docker-compose -f /srv/dashboard_app/docker-compose.yml restart nginx"
        ```

---

## 8. Database Management

*   **Migrations:** When updating the backend, ensure migrations are applied before the new backend code is fully active. This is often handled by CI/CD or by a `docker-compose run` command before the main `up -d`.
    ```bash
    # Example: Apply migrations from backend container
    docker-compose run --rm backend alembic -c alembic.ini upgrade head
    ```
*   **Backups:** Implement a regular backup strategy for your PostgreSQL data volume (`pg_data`). This is critical.
    *   Use tools like `pg_dump` from within the `db` container or host-level volume snapshots.

---

## 9. Monitoring and Logging

*   **Logging:**
    *   Backend logs to `stdout`/`stderr` inside the container. Docker collects these logs.
    *   For centralized logging, integrate with a log aggregation system (e.g., ELK Stack, Splunk, Datadog, cloud-native services) by configuring Docker's logging driver or forwarding container logs.
*   **Monitoring:**
    *   Use a system like Prometheus + Grafana to monitor container health, resource usage (CPU, memory, network I/O), and application metrics (e.g., API response times, error rates).
    *   Integrate Sentry or a similar error tracking tool for application-level error monitoring.

---

## 10. CI/CD Integration

The provided `.github/workflows/main.yml` demonstrates a basic CI/CD pipeline using GitHub Actions.

*   **Build:** Automatically builds Docker images for backend and frontend on push/PR.
*   **Test:** Runs unit and integration tests for both backend and frontend, and uploads coverage reports.
*   **Deploy:** On pushes to `main` branch, pushes images to Docker Hub and then uses `appleboy/ssh-action` to connect to the production server and run deployment commands (e.g., `docker-compose pull && docker-compose up -d`).

**Steps for CI/CD setup:**
1.  **Configure GitHub Secrets:**
    *   `DOCKER_USERNAME`, `DOCKER_PASSWORD`: For logging into Docker Hub.
    *   `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`: For SSH access to your production server.
    *   `SECRET_KEY`, `JWT_SECRET_KEY`: Production secrets for your application.
    *   Add any other sensitive production environment variables.
2.  **Ensure SSH Key access:** The `SSH_PRIVATE_KEY` provided to GitHub Actions must have access to your server.
3.  **Adjust `your-dockerhub-user`:** Replace placeholders in `main.yml` with your actual Docker Hub username.
4.  **Update `deploy` job script:** The `script` in the `Deploy to Server` step should match the commands you would run manually on your server to update the application.

---

## 11. Troubleshooting

*   **Check Docker Logs:**
    ```bash
    docker-compose logs -f <service_name>
    ```
    This is the first place to look for errors from your containers.
*   **Verify Container Status:**
    ```bash
    docker-compose ps
    ```
    Ensure all services are `Up`.
*   **Network Issues:** If containers cannot communicate, check Docker network configurations. `docker-compose exec <service_name> ping <another_service_name>` can help diagnose.
*   **Database Connectivity:** If backend can't connect to DB, ensure `DATABASE_URL` is correct and `db` service is healthy.
    ```bash
    docker-compose exec backend ping db
    docker-compose exec db pg_isready -U <db_user> -d <db_name>
    ```
*   **Nginx Errors:** Check Nginx logs: `docker-compose logs -f nginx`. Pay attention to 4xx and 5xx errors.
    *   If SSL fails, check Certbot logs and certificate paths.
*   **Frontend Build Errors:** Check the `docker build` output for frontend if it fails. Ensure `REACT_APP_API_BASE_URL` is correctly configured in the Dockerfile build-args for production.
*   **Permissions:** Ensure Docker has correct permissions to access mounted volumes (e.g., for Nginx certs).
```