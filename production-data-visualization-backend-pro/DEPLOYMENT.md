# 🚀 DataViz Pro: Deployment Guide

This document outlines the steps for deploying the DataViz Pro application to a production environment. The deployment strategy leverages Docker and Docker Compose for container orchestration, making the process consistent and scalable.

## 1. Prerequisites

Before starting the deployment, ensure you have the following:

*   **Server Access:** SSH access to a Linux-based server (e.g., Ubuntu, CentOS) where the application will be hosted.
*   **Docker & Docker Compose:** Docker Engine and Docker Compose installed on your server.
*   **Git:** Git installed on your server to clone the repository.
*   **DNS (Optional but Recommended):** A domain name pointing to your server's IP address.
*   **SSL Certificate (Highly Recommended):** For HTTPS, obtain an SSL certificate (e.g., from Let's Encrypt using Certbot).
*   **Environment Variables:** You'll need to set up environment variables for your production secrets.

## 2. Server Setup

### 2.1. Install Docker and Docker Compose

Follow the official Docker documentation to install Docker Engine and Docker Compose on your server.

*   [Install Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
*   [Install Docker Compose](https://docs.docker.com/compose/install/)

### 2.2. Create a Deployment Directory

SSH into your server and create a directory for your application.

```bash
ssh your_user@your_server_ip
sudo mkdir -p /opt/dataviz-pro
sudo chown your_user:your_user /opt/dataviz-pro # Grant ownership to your user
cd /opt/dataviz-pro
```

### 2.3. Clone the Repository

Clone your DataViz Pro repository into the deployment directory.

```bash
git clone https://github.com/your-username/dataviz-pro.git . # Clone into current directory
```

### 2.4. Configure Environment Variables

Create a `.env` file in `/opt/dataviz-pro`. This file will contain sensitive configuration for your production environment.

```bash
nano .env
```

Populate it with your production-ready values. **Ensure `JWT_SECRET` and `DATABASE_URL` are strong and unique for production.**

```ini
# Production Server Configuration
SERVER_PORT=8080 # Backend port

# Production Database Configuration
# Replace with your actual production DB details or link to an external managed DB
DATABASE_URL="postgresql://dataviz_prod_user:YOUR_PROD_DB_PASSWORD@localhost:5432/datavizpro_prod"

# JWT Secret (CRITICAL: Must be a very strong, long, random string)
JWT_SECRET="A_VERY_LONG_AND_COMPLEX_RANDOM_STRING_FOR_PRODUCTION_JWT_SIGNING"

# Frontend Configuration
# Frontend API base URL should point to your backend's public access point
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api/v1 # Or http://yourdomain.com:8080/api/v1 if no reverse proxy
```

**Note:** For the `DATABASE_URL`, if you're using the `db` service from `docker-compose.yml`, it should point to `db:5432` from within the Docker network (e.g., `postgresql://user:password@db:5432/datavizpro`). If using an external managed database (recommended for production), provide its connection string.

## 3. Docker Image Management

In a production scenario, you typically build and push your Docker images to a container registry (e.g., Docker Hub, AWS ECR, Google Container Registry) as part of your CI/CD pipeline.

**Example CI/CD (GitHub Actions `deploy` job):**

Your CI/CD pipeline (e.g., `.github/workflows/ci.yml`) should handle:
1.  Building the `backend` image: `yourdockerhubusername/datavizpro-backend:latest`
2.  Building the `frontend` image: `yourdockerhubusername/datavizpro-frontend:latest`
3.  Pushing these images to Docker Hub (or your chosen registry).

This means that when you run `docker-compose pull` on your server, it will fetch these pre-built images.

## 4. Deployment

### 4.1. Pull Latest Images

On your server, navigate to the deployment directory (`/opt/dataviz-pro`) and pull the latest Docker images from your registry.

```bash
cd /opt/dataviz-pro
docker-compose pull
```

### 4.2. Run the Application

Start the Docker containers.

```bash
docker-compose up -d --remove-orphans
```

*   `-d`: Runs the containers in detached mode (in the background).
*   `--remove-orphans`: Removes containers for services that are no longer defined in the `docker-compose.yml` file.

### 4.3. Verify Deployment

*   Check if containers are running:
    ```bash
    docker-compose ps
    ```
    You should see `db`, `backend`, and `frontend` containers in the `Up` state.
*   Check logs for any errors:
    ```bash
    docker-compose logs -f
    ```
*   Access your application:
    *   Backend Health Check: `curl http://localhost:8080/health` (from within the server)
    *   Frontend: Navigate to `http://your_server_ip:3000` (or your domain if using a reverse proxy).

## 5. Post-Deployment Steps (Production Best Practices)

### 5.1. Reverse Proxy (Nginx/Caddy) and SSL

**Highly Recommended:** Use a reverse proxy like Nginx or Caddy to:
*   Handle SSL termination (HTTPS).
*   Route traffic to the correct Docker containers.
*   Serve static frontend files directly (if `npm run build` is used for frontend).
*   Implement advanced caching, load balancing, or request filtering.

**Example Nginx Configuration (`/etc/nginx/sites-available/datavizpro.conf`):**

```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com; # Frontend domain

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Path to your SSL cert
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # Path to your SSL key

    location / {
        proxy_pass http://localhost:3000; # Forward to frontend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com; # Backend API domain

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api/v1/ {
        proxy_pass http://localhost:8080/api/v1/; # Forward to backend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /health { # Health check
        proxy_pass http://localhost:8080/health;
        proxy_set_header Host $host;
    }
}
```

After configuring Nginx, enable it and restart:
```bash
sudo ln -s /etc/nginx/sites-available/datavizpro.conf /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

### 5.2. Persistent Volumes

The `docker-compose.yml` already defines named volumes for database data (`datavizpro_db`) and uploaded files (`server/data_storage`). This ensures your data persists even if containers are removed or rebuilt.

### 5.3. Monitoring and Logging

*   **Logs:** Configure a log aggregation system (e.g., ELK Stack, Grafana Loki, Datadog) to collect and analyze logs from your Docker containers. `spdlog` in the C++ backend supports various sinks.
*   **Metrics:** Use tools like Prometheus and Grafana to collect and visualize system and application metrics (CPU, Memory, Network, API latencies, error rates).

### 5.4. Database Backups

Regularly back up your PostgreSQL database. This is critical for disaster recovery. Tools like `pg_dump` or cloud provider managed backup solutions are essential.

### 5.5. Security Hardening

*   **Firewall:** Configure your server's firewall (e.g., `ufw` or `firewalld`) to only allow necessary incoming traffic (e.g., 80, 443, 22 for SSH).
*   **Network:** Isolate Docker containers into custom networks for better security.
*   **Secrets Management:** For very sensitive production environments, consider dedicated secrets management services (e.g., AWS Secrets Manager, HashiCorp Vault) instead of `.env` files.

## 6. Updates and Rollbacks

### 6.1. Updating the Application

To deploy new versions:
1.  Commit and push your code changes to your repository.
2.  Your CI/CD pipeline will build and push new Docker images.
3.  On your production server:
    ```bash
    cd /opt/dataviz-pro
    git pull # Pull latest docker-compose.yml or other config changes
    docker-compose pull # Pull new Docker images
    docker-compose up -d --remove-orphans # Apply updates
    docker image prune -f # Clean up old Docker images
    ```

### 6.2. Rolling Back

If an update causes issues, you can roll back to a previous working Docker image tag (if you're tagging images properly).
1.  Edit your `docker-compose.yml` to specify the previous stable image tags for `backend` and `frontend`.
2.  Run `docker-compose up -d --remove-orphans` again.

---
```