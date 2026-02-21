```markdown
# E-commerce System Deployment Guide

This document provides instructions for deploying the E-commerce System to a production environment using Docker and Docker Compose. This guide assumes you have a Linux server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed.

## 1. Prerequisites on Production Server

Before you begin, ensure your production server meets the following requirements:

*   **Operating System:** A recent Linux distribution (e.g., Ubuntu 20.04+, CentOS 7+).
*   **SSH Access:** Secure Shell access to the server.
*   **Docker:** Installed and running. Follow the official Docker installation guide for your OS.
    *   Verify: `docker --version`
*   **Docker Compose:** Installed. Follow the official Docker Compose installation guide.
    *   Verify: `docker-compose --version`
*   **Git:** Installed.
*   **Nginx (Optional but Recommended):** For reverse proxy, SSL termination, and serving static files.
*   **Firewall:** Configure your firewall (e.g., `ufw`, `firewalld`) to allow incoming traffic on necessary ports (e.g., 80, 443, 8080).

## 2. Server Setup

### 2.1. Create a Deployment Directory

SSH into your server and create a dedicated directory for your application:

```bash
ssh your_user@your_server_ip
sudo mkdir /opt/ecommerce-app
sudo chown your_user:your_user /opt/ecommerce-app
cd /opt/ecommerce-app
```

### 2.2. Clone the Repository

Clone your E-commerce System repository into the deployment directory.
**Important:** Use an SSH key or deploy token for production.

```bash
git clone git@github.com:your-username/ecommerce-system.git .
# Or, if using HTTPS and a deploy token:
# git clone https://your_username:your_deploy_token@github.com/your-username/ecommerce-system.git .
```

### 2.3. Configure Environment Variables

Create a production `.env` file in the root of the cloned repository (`/opt/ecommerce-app/.env`).

```bash
cp .env.example .env
```
**Edit `.env`:**
*   **`JWT_SECRET`:** **ABSOLUTELY critical! Generate a very strong, unique secret key.** Do NOT use the default from `.env.example`.
*   **`DB_PASSWORD`:** Set a strong password for your PostgreSQL user.
*   **`REDIS_PASSWORD`:** Set a strong password for Redis.
*   **`APP_PORT`:** Confirm the port your backend will listen on (default 8080).
*   **`DB_HOST`, `REDIS_HOST`:** These should remain `db` and `redis` respectively, as Docker Compose creates a network where services can communicate by their names.
*   Adjust `LOG_LEVEL` to `info` or `warn` for production.

**Example Production `.env` Snippet:**
```ini
# ...
JWT_SECRET=YOUR_VERY_LONG_AND_COMPLEX_PRODUCTION_JWT_SECRET_HERE_CHANGE_ME_IMMEDIATELY
DB_PASSWORD=YourStrongDbPassword123!
REDIS_PASSWORD=YourStrongRedisPassword456!
LOG_LEVEL=info
# ...
```

### 2.4. (Optional) Nginx Configuration

If you are using Nginx as a reverse proxy (recommended for SSL, static file serving, and load balancing):

1.  **Create Nginx configuration files:**
    Copy `nginx/nginx.conf` and `nginx/conf.d/default.conf` from your repository to `/etc/nginx/nginx.conf` and `/etc/nginx/conf.d/ecommerce.conf` on the server respectively.

    **Example `nginx/conf.d/ecommerce.conf`:**
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com; # Replace with your domain

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your_domain.com www.your_domain.com; # Replace with your domain

        ssl_certificate /etc/nginx/certs/your_domain.com.crt; # Path to your SSL certificate
        ssl_certificate_key /etc/nginx/certs/your_domain.com.key; # Path to your SSL private key
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;

        # Frontend static files (if serving from Nginx)
        root /usr/share/nginx/html;
        index index.html index.htm;

        location / {
            try_files $uri $uri/ /index.html; # For single-page applications
        }

        # Backend API proxy
        location /api/ {
            proxy_pass http://backend:8080; # 'backend' is the service name in docker-compose
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            # Enable WebSocket proxy if needed
            # proxy_http_version 1.1;
            # proxy_set_header Upgrade $http_upgrade;
            # proxy_set_header Connection "upgrade";
        }

        # Optional: Prometheus metrics endpoint
        # location /metrics {
        #     proxy_pass http://backend:8080/metrics;
        # }
    }
    ```
2.  **Obtain SSL/TLS Certificates:** Use Let's Encrypt with Certbot (recommended) to get free SSL certificates for your domain. Store them in `/opt/ecommerce-app/nginx/certs/` or adjust paths in your Nginx config.
3.  **Ensure Nginx is started:** `sudo systemctl enable nginx && sudo systemctl start nginx`

## 3. Deployment

### 3.1. Build and Run Containers

From your application's root directory (`/opt/ecommerce-app`), run Docker Compose:

```bash
# Pull the latest Git changes (if not done via CI/CD)
git pull

# Build images and start containers in detached mode
docker-compose up --build -d
```

*   `--build`: This rebuilds your application's Docker image using the latest code. This is essential after code changes.
*   `-d`: Runs the containers in the background.

### 3.2. Verify Deployment

*   **Check container status:**
    ```bash
    docker-compose ps
    ```
    All services (`db`, `redis`, `backend`, `nginx` if enabled) should be `Up (healthy)`.

*   **View logs:**
    ```bash
    docker-compose logs -f backend
    ```
    Check for any errors or unexpected warnings.

*   **Test API endpoints:** Use `curl` or a tool like Postman to make requests to your server's IP or domain.

    ```bash
    curl http://your_server_ip:8080/api/v1/products
    ```
    If Nginx is configured, use `curl https://your_domain.com/api/v1/products`.

### 3.3. Database Initialization

The `docker-compose.yml` is configured to run `schema.sql` and `seed.sql` on the `db` container's first startup. If your database is already running with data, these scripts will NOT re-run.
For schema updates, use proper database migration tools (e.g., Flyway or custom scripts) which you would run as a separate step or integrate into your CI/CD.

## 4. Updates and Rollbacks

### 4.1. Updating the Application

To deploy new code changes:

1.  **Pull latest code:**
    ```bash
    cd /opt/ecommerce-app
    git pull
    ```
2.  **Rebuild and restart containers:**
    ```bash
    docker-compose up --build -d
    ```
    Docker Compose will intelligently stop and replace only the containers whose images have changed, minimizing downtime.

### 4.2. Rollback (if an update fails)

If a new deployment causes issues, you can roll back to a previous working Docker image.

1.  **Identify previous stable image:**
    You need to know the tag of your previous stable image (e.g., `your_username/ecommerce-backend:previous_sha` or `your_username/ecommerce-backend:v1.0.0`). Your CI/CD should tag images.

2.  **Edit `docker-compose.yml`:**
    Change the `image` entry for the `backend` service from `build` to a specific image tag:
    ```yaml
    services:
      backend:
        # build:
        #   context: .
        #   dockerfile: Dockerfile
        image: your_username/ecommerce-backend:previous_stable_tag # <--- Change this line
        # ... other configurations
    ```
3.  **Redeploy with old image:**
    ```bash
    docker-compose up -d
    ```
    This will pull and run the specified stable image.

## 5. Monitoring & Logging

*   **Container Logs:** `docker-compose logs -f` is your first line of defense.
*   **Persistent Logs:** The `logs` directory is mounted from the host. Configure a log aggregator (e.g., Filebeat, Fluentd) on the host to send these logs to a centralized logging system (ELK Stack, Loki, Datadog).
*   **Monitoring Tools:** Integrate Prometheus and Grafana to collect and visualize metrics from your Drogon application (e.g., request count, response times, error rates, CPU/memory usage). Drogon provides some built-in metrics, or you can implement custom ones.

## 6. Security Best Practices

*   **Least Privilege:** Run containers with the minimum necessary permissions.
*   **Secrets Management:** Use environment variables for secrets, and consider more robust solutions like Docker Secrets or Kubernetes Secrets for larger deployments.
*   **Network Segmentation:** Use Docker's network features to isolate services.
*   **Regular Updates:** Keep Docker, Docker Compose, and your base OS up-to-date.
*   **Vulnerability Scanning:** Regularly scan your Docker images for known vulnerabilities.
*   **Backup Strategy:** Implement a robust backup strategy for your PostgreSQL database (e.g., `pg_dump`, cloud provider backups).

---
```