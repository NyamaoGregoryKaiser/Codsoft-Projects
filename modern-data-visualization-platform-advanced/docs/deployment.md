```markdown
# VisuFlow Deployment Guide

This document outlines the steps to deploy the VisuFlow application to a production environment. It assumes a cloud-agnostic approach using Docker and Docker Compose. For more complex deployments (e.g., Kubernetes), this guide provides a foundation.

## 1. Prerequisites

*   A Linux-based server (e.g., Ubuntu, CentOS)
*   Docker installed (version 20.10.0 or higher)
*   Docker Compose installed (version 2.0.0 or higher)
*   Git installed
*   An Nginx (or Apache) web server for reverse proxy and SSL termination (recommended for HTTPS).
*   DNS configured to point your domain (e.g., `visuflow.yourdomain.com`) to your server's IP address.
*   (Optional but Recommended) Let's Encrypt / Certbot for free SSL certificates.

## 2. Server Setup

### 2.1. Install Docker and Docker Compose

Follow the official Docker documentation to install Docker Engine and Docker Compose on your server:

*   [Install Docker Engine](https://docs.docker.com/engine/install/)
*   [Install Docker Compose](https://docs.docker.com/compose/install/)

Ensure your user is added to the `docker` group to run Docker commands without `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker # Apply group changes immediately
```

### 2.2. Install Git and Nginx

```bash
sudo apt update
sudo apt install git nginx certbot python3-certbot-nginx -y
```

## 3. Application Deployment

### 3.1. Clone the Repository

Clone your VisuFlow repository to your server:

```bash
git clone https://github.com/your-username/visuflow.git /opt/visuflow
cd /opt/visuflow
```

### 3.2. Configure Environment Variables

Create a `.env` file for production-specific settings. **This file should not be committed to source control.**

```bash
cp .env.example .env
```

**Edit `.env` for production:**

*   **`SECRET_KEY`**: **CRITICAL:** Generate a very strong, random, and unique secret key. Do NOT use the default from `.env.example`.
    ```bash
    openssl rand -hex 32
    # Copy output to SECRET_KEY
    ```
*   **`POSTGRES_PASSWORD`**: Set a strong password for your PostgreSQL database.
*   **`FIRST_SUPERUSER_PASSWORD`**: Set a strong, unique password for the initial admin user.
*   **`DATABASE_URL`**: Ensure this points to the `db` service within the Docker network, e.g., `postgresql+asyncpg://visuflow_user:visuflow_password@db:5432/visuflow_db`.
*   **`REDIS_URL`**: Ensure this points to the `redis` service, e.g., `redis://redis:6379/0`.
*   **`BACKEND_CORS_ORIGINS`**: Update this to include your production frontend URL (e.g., `"https://visuflow.yourdomain.com"`).
*   **`LOG_LEVEL`**: Set to `INFO` or `WARNING` for production, `DEBUG` is too verbose.
*   **`TESTING`**: Set to `False`.
*   **`VITE_API_BASE_URL` (in frontend Dockerfile/docker-compose.yml):** This should point to your public backend URL, e.g., `https://visuflow.yourdomain.com/api/v1`.

### 3.3. Build and Start Services

From the `/opt/visuflow` directory:

```bash
docker-compose build --no-cache
docker-compose up -d
```

This will:
*   Build fresh Docker images for backend and frontend.
*   Start the `db`, `redis`, `backend`, and `frontend` containers in detached mode.
*   The `backend` service will run Alembic migrations and seed initial data automatically during startup (as configured in `docker-compose.yml`).

Verify that containers are running:

```bash
docker ps
```

Check logs for any errors during startup:

```bash
docker-compose logs -f
```

### 3.4. Database Migrations (Manual Updates)

While `docker-compose up` runs `alembic upgrade head` on startup, for production, you might want more control.
To run migrations for subsequent updates:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of change"
# Review the generated migration script in backend/alembic/versions/
docker-compose exec backend alembic upgrade head
```

## 4. Nginx Reverse Proxy and SSL Configuration

The Docker Compose setup exposes the frontend on port `3000` and backend on `8000`. You should not expose these directly to the internet. Instead, use Nginx as a reverse proxy with SSL termination.

### 4.1. Configure Nginx

Create a new Nginx configuration file for your domain (e.g., `/etc/nginx/sites-available/visuflow.conf`):

```nginx
server {
    listen 80;
    server_name visuflow.yourdomain.com; # Replace with your actual domain
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name visuflow.yourdomain.com; # Replace with your actual domain

    # SSL certificates will be configured by Certbot later
    ssl_certificate /etc/letsencrypt/live/visuflow.yourdomain.com/fullchain.pem; # Placeholder
    ssl_certificate_key /etc/letsencrypt/live/visuflow.yourdomain.com/privkey.pem; # Placeholder

    # Recommended SSL settings
    include /etc/nginx/snippets/ssl-params.conf; # Create this file as below

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000; # Points to frontend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Backend API (FastAPI)
    location /api/v1/ {
        proxy_pass http://localhost:8000/api/v1/; # Points to backend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Swagger UI (optional, remove in strict production)
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /redoc {
        proxy_pass http://localhost:8000/redoc;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Health check endpoints
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

Create the SSL parameters snippet `/etc/nginx/snippets/ssl-params.conf`:

```nginx
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
```

Enable the Nginx config and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/visuflow.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.2. Secure with Let's Encrypt (Certbot)

Generate and install SSL certificates:

```bash
sudo certbot --nginx -d visuflow.yourdomain.com
```

Certbot will automatically modify your Nginx configuration to include the correct SSL certificate paths. It will also set up automatic renewal.

## 5. Continuous Deployment (Optional, using GitHub Actions)

The `ci.yml` in `.github/workflows/` includes a `deploy` job. To use this:

1.  **Server SSH Access:**
    *   Generate an SSH key pair on your local machine or CI/CD runner.
    *   Add the public key to your server's `~/.ssh/authorized_keys` for the user that will perform deployments.
    *   Store the **private key** as a GitHub Secret (e.g., `PROD_SSH_KEY`) in your repository.
    *   Store your server's host and username as GitHub Secrets (e.g., `PROD_SSH_HOST`, `PROD_SSH_USER`).
2.  **Docker Hub Credentials:**
    *   Create a Docker Hub account.
    *   Store your Docker Hub username and access token/password as GitHub Secrets (e.g., `DOCKER_USERNAME`, `DOCKER_PASSWORD`).
3.  **Deployment Script:**
    *   The `deploy` job in `ci.yml` uses `appleboy/ssh-action` to connect to your server.
    *   It then navigates to `/path/to/visuflow-deployment` (ensure this matches your server path), pulls the latest Docker images, and restarts the containers.
    *   **Important:** You might need to update the `tags` in `build-push-action` to reflect your Docker Hub username (e.g., `yourdockerhubusername/visuflow-backend:latest`).
    *   **For production**, it's recommended to pull specific versions (e.g., `git rev-parse --short HEAD`) instead of `:latest` for better rollback capabilities.

## 6. Monitoring and Maintenance

*   **Logs:** Regularly check container logs for errors: `docker-compose logs -f`
*   **Health Checks:** Configure your monitoring system to ping `/health` endpoint (exposed via Nginx) to check application status.
*   **Updates:** Keep Docker, Docker Compose, Python, Node.js, and underlying OS packages updated.
*   **Backups:** Implement regular backups for your PostgreSQL `postgres_data` volume.
*   **Resource Usage:** Monitor CPU, memory, and disk usage on your server.
*   **Security Scans:** Periodically scan your Docker images for vulnerabilities.

This deployment guide provides a robust starting point for deploying VisuFlow to a production environment. Adapt it based on your specific infrastructure and security requirements.
```