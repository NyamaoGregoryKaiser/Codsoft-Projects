# Task Management System - Deployment Guide

This guide provides instructions for deploying the Task Management System to a production environment. The recommended deployment strategy involves Docker and Docker Compose for ease of management, though Kubernetes is a natural next step for larger deployments.

## 1. Production Environment Configuration

Before deploying, ensure your `.env` file for production is configured correctly. This file should **not** be committed to version control.

1.  **Create a production `.env` file**:
    ```bash
    cp ./.env.example .env.production
    # OR directly on your server:
    # nano .env
    ```
    Populate it with production-ready values:

    *   `DEBUG=False`: **Crucial** for security and performance in production.
    *   `SECRET_KEY`: Generate a **very strong, unique, and truly secret key**.
    *   `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Use dedicated production database credentials. The `POSTGRES_SERVER` should point to your external PostgreSQL instance (e.g., an AWS RDS endpoint, or the Docker Compose service name if running everything on one host).
    *   `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`: Use dedicated production Redis instance details.
    *   `FIRST_SUPERUSER_EMAIL`, `FIRST_SUPERUSER_PASSWORD`: Set initial admin credentials for a fresh deployment. **Change these after first login.**
    *   `BACKEND_CORS_ORIGINS`: Set to your frontend's production URL (e.g., `["https://your-frontend-domain.com"]`).
    *   `REACT_APP_API_BASE_URL`: Set to your public API endpoint (e.g., `https://api.your-domain.com/api/v1` or `https://your-frontend-domain.com/api/v1` if Nginx proxies).

## 2. Docker Compose Deployment (Single Server)

This method is suitable for deploying all services (DB, Redis, Backend, Frontend) on a single server (e.g., a DigitalOcean Droplet, AWS EC2 instance).

### 2.1 Server Setup

1.  **Provision a Linux Server**: (e.g., Ubuntu 22.04 LTS).
2.  **Install Docker and Docker Compose**: Follow the official Docker documentation for your OS.
    ```bash
    # Install Docker
    sudo apt-get update
    sudo apt-get install ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add your user to the docker group to run docker commands without sudo
    sudo usermod -aG docker $USER
    newgrp docker # Log out and back in for this to take effect, or run newgrp
    ```
3.  **Install Git**:
    ```bash
    sudo apt-get install git
    ```
4.  **Clone your repository**:
    ```bash
    git clone https://github.com/your-username/task-management-system.git
    cd task-management-system
    ```
5.  **Place your `.env.production` file**:
    Rename it to `.env` in the root directory of the cloned repository on the server.
    ```bash
    mv .env.production .env
    ```

### 2.2 Running the Application

1.  **Build and start services in detached mode**:
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build Docker images for the backend (Python/FastAPI) and frontend (Node/Nginx).
    *   Pull official images for PostgreSQL and Redis.
    *   Start all containers, including the database, Redis, backend, and frontend (Nginx).

2.  **Verify service health**:
    ```bash
    docker-compose ps
    docker-compose logs -f # Follow logs for all services to check for errors
    ```

3.  **Run database migrations**:
    Wait for the `backend` service to be healthy. Then, execute migrations:
    ```bash
    docker-compose exec backend alembic upgrade head
    ```
    This command runs `alembic upgrade head` inside the `backend` container, applying any pending database schema changes.
    The `init_db.py` script will automatically create the initial superuser and seed data on first run if they don't exist.

4.  **Access the application**:
    *   Your frontend will be available on port 80 (or 3000 if you mapped it differently) of your server's IP address or domain.
    *   Ensure your server's firewall allows incoming traffic on port 80/443.

### 2.3 Setting up HTTPS (Recommended for Production)

For production, **always use HTTPS**. A reverse proxy like Nginx or Caddy is ideal for this, typically running outside your Docker Compose stack or as a separate service.

1.  **Configure a Reverse Proxy**:
    *   Install Nginx on your host machine or run it in a separate Docker container.
    *   Configure Nginx to proxy requests to your `frontend` service (running on port 80 within its container, usually mapped to port 3000 on the host).
    *   Obtain SSL certificates (e.g., using Certbot with Let's Encrypt).

    **Example Nginx config on host (replace with your domain):**
    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        location / {
            proxy_pass http://localhost:3000; # Frontend service mapped to host port 3000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/v1/ {
            proxy_pass http://localhost:8000/api/v1/; # Backend service mapped to host port 8000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    Ensure you update `REACT_APP_API_BASE_URL` in your frontend's `.env.production` to `https://your-domain.com/api/v1` and `BACKEND_CORS_ORIGINS` in backend's `.env.production` to `["https://your-domain.com"]`.

### 2.4 Persistent Data

By default, the `docker-compose.yml` uses a Docker volume for PostgreSQL data (`postgres_data`). This ensures your database data persists even if the `db` container is removed or recreated. Redis also uses a ephemeral volume. For Redis persistence, you might need to configure a named volume and Redis AOF/RDB persistence.

## 3. CI/CD Pipeline (GitHub Actions)

The `.github/workflows/main.yml` file provides a basic CI/CD pipeline configuration using GitHub Actions.

**Workflow Stages:**

1.  **`build-and-test-backend`**:
    *   Checks out code.
    *   Sets up Python and installs backend dependencies.
    *   Runs unit, integration, and API tests.
    *   Publishes test coverage reports.
2.  **`build-and-test-frontend`**:
    *   Checks out code.
    *   Sets up Node.js and installs frontend dependencies.
    *   Runs frontend tests (Jest/React Testing Library).
3.  **`deploy` (Optional)**:
    *   Requires successful completion of both backend and frontend tests.
    *   Triggers only on pushes to the `main` branch.
    *   Logs in to Docker Hub (or other registry) using GitHub Secrets.
    *   Builds and pushes Docker images to the registry.
    *   Connects to a remote server via SSH (using GitHub Secrets for credentials).
    *   Pulls the latest Docker images on the server.
    *   Applies database migrations on the server.
    *   Restarts the Docker services (e.g., using `docker-compose up -d --remove-orphans`).

**To use the `deploy` job:**

1.  **Configure GitHub Secrets**:
    *   In your GitHub repository, go to `Settings -> Secrets and variables -> Actions`.
    *   Add secrets for `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`.
    *   Also add production environment variables like `PROD_DB_HOST`, `PROD_SECRET_KEY`, etc., as GitHub Secrets.
2.  **Adjust Docker Hub Username**: Replace `your_docker_username` with your actual Docker Hub username in `main.yml`.
3.  **`docker-compose.prod.yml`**: For a true production deployment, you'd typically have a `docker-compose.prod.yml` that differs slightly from `docker-compose.yml` (e.g., fixed image versions, no volume mounts for live coding, different restart policies). You would then specify `-f docker-compose.prod.yml` in your deployment script.
4.  **Target Server**: Ensure your target production server is configured to accept SSH connections and has Docker/Docker Compose installed.

## 4. Monitoring and Logging

*   **Backend Logging**: FastAPI is configured to use `rich` for structured and colorful console logging in development. In production, Docker will capture stdout/stderr from Gunicorn, which can then be forwarded to a centralized logging system (e.g., ELK Stack, Splunk, cloud logging services).
*   **Health Checks**: Docker Compose health checks (`db`, `redis`) ensure services are ready before dependent services start.
*   **Uptime Monitoring**: Use external tools (e.g., UptimeRobot, Pingdom) to monitor the availability of your frontend and API endpoints.
*   **Performance Monitoring**: Integrate with APM tools (e.g., New Relic, Datadog, Sentry) for more in-depth monitoring of application performance, error rates, and resource utilization.

## 5. Backups

*   **Database**: Implement a regular backup strategy for your PostgreSQL database. This could involve `pg_dump` to an S3 bucket or using managed database services' backup features.
*   **Volumes**: Ensure that any Docker volumes (`postgres_data`) are included in your backup strategy if they are critical.