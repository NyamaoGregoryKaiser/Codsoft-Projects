```markdown
# Zenith Payments - Deployment Guide

This document outlines the steps for deploying the Zenith Payments system to a production environment. We'll focus on a Docker-based deployment using Docker Compose for simplicity, which can be extended to Kubernetes for larger scale.

## Table of Contents
- [1. Prerequisites](#1-prerequisites)
- [2. Environment Setup](#2-environment-setup)
- [3. Configuration](#3-configuration)
- [4. Database Setup](#4-database-setup)
- [5. Building and Pushing Docker Image](#5-building-and-pushing-docker-image)
- [6. Deployment using Docker Compose](#6-deployment-using-docker-compose)
- [7. Monitoring and Logging](#7-monitoring-and-logging)
- [8. Updates and Rollbacks](#8-updates-and-rollbacks)
- [9. Security Considerations](#9-security-considerations)

---

## 1. Prerequisites

-   **Server**: A Linux-based server (e.g., Ubuntu, CentOS) with sufficient CPU, RAM, and disk space.
-   **Docker & Docker Compose**: Installed and running on the server.
-   **Git**: For cloning the repository.
-   **SSH Access**: To connect to your deployment server.
-   **Domain Name & SSL Certificate**: For securing API traffic with HTTPS (e.g., using Nginx/Caddy as a reverse proxy).
-   **Docker Registry Access**: (e.g., Docker Hub, AWS ECR, GCR) to store your Docker images.

## 2. Environment Setup

1.  **SSH into your server:**
    ```bash
    ssh user@your-production-server-ip
    ```

2.  **Create a deployment directory:**
    ```bash
    sudo mkdir -p /opt/zenith-payments
    sudo chown -R user:user /opt/zenith-payments # Adjust ownership as needed
    cd /opt/zenith-payments
    ```

3.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/zenith-payments.git .
    ```

4.  **Install `docker-compose` if not already present:**
    (Often comes with Docker Desktop, but may need manual install on servers)
    ```bash
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.19.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    docker-compose --version
    ```

## 3. Configuration

1.  **Create `.env` file:**
    Copy the example `.env` file and populate it with production-specific values. **Never commit this file to your repository.**

    ```bash
    cp .env.example .env
    ```

2.  **Edit `.env` for production:**
    -   **`SERVER_HOST`**: `0.0.0.0` (allow external connections)
    -   **`SERVER_PORT`**: `8080` (or your desired internal port)
    -   **`DB_HOST`**: `db` (if using Docker Compose's internal network) or your external PostgreSQL IP.
    -   **`DB_USER`**: A strong, dedicated database user.
    -   **`DB_PASSWORD`**: A complex, unique password for the database.
    -   **`DB_NAME`**: Your production database name.
    -   **`JWT_SECRET`**: A *very* long, random, and secret string. Generate a new one for production.
        ```bash
        openssl rand -base64 32 # Example to generate a 32-byte secret
        ```
    -   **`JWT_EXPIRATION_SECONDS`**: Adjust as per security policy (e.g., 3600 for 1 hour).
    -   **`REDIS_HOST`**: `redis` (if using Docker Compose's internal network) or your external Redis IP.
    -   **`PAYMENT_GATEWAY_API_URL`**: Actual production API endpoint for your payment gateway.
    -   **`PAYMENT_GATEWAY_API_KEY`**: Production API key for your payment gateway. **Handle this as a secret!**
    -   **`LOG_LEVEL`**: `info` or `warn` (avoid `debug` in production unless debugging).
    -   **`RATE_LIMIT_MAX_REQUESTS` / `RATE_LIMIT_WINDOW_SECONDS`**: Adjust as per traffic and abuse prevention needs.

## 4. Database Setup

The `docker-compose.yml` file sets up a PostgreSQL container.
The `entrypoint.sh` script in the `app` container is responsible for running database migrations using `tools/setup_db.sh`.

1.  **Initial Database Creation**: When `docker-compose up` is run for the first time, the PostgreSQL container will be initialized. The `10-schema.sql` from `database/schema.sql` will be applied.
2.  **Running Migrations**: The application container's `entrypoint.sh` will `wait-for-it.sh` for the database to be healthy, then execute `/app/tools/setup_db.sh` to apply any pending migrations and seed data.

**Important**: For highly sensitive production setups, consider running your PostgreSQL database on a separate, dedicated server or a managed database service (e.g., AWS RDS, Google Cloud SQL) rather than as a Docker container within the same `docker-compose` stack. If so, update `DB_HOST` in `.env` accordingly.

## 5. Building and Pushing Docker Image

It's best practice to build your Docker image as part of your CI/CD pipeline and push it to a private Docker registry.

1.  **Build the Docker image (locally or in CI):**
    ```bash
    docker build -t yourusername/zenith-payments:$(git rev-parse HEAD) .
    docker tag yourusername/zenith-payments:$(git rev-parse HEAD) yourusername/zenith-payments:latest
    ```
    Replace `yourusername` with your Docker Hub username or registry path.

2.  **Login to your Docker registry:**
    ```bash
    docker login -u yourusername -p yourpassword
    ```

3.  **Push the images:**
    ```bash
    docker push yourusername/zenith-payments:$(git rev-parse HEAD)
    docker push yourusername/zenith-payments:latest
    ```

## 6. Deployment using Docker Compose

1.  **Update `docker-compose.yml` for production (optional, if using external DB/Redis):**
    If your `db` or `redis` services are external, you might remove them from `docker-compose.yml` and update the `app` service's `depends_on` accordingly. The `env_file` mount should point to your production `.env`.

2.  **Pull the latest image on the server:**
    ```bash
    docker pull yourusername/zenith-payments:latest
    ```

3.  **Deploy the stack:**
    ```bash
    docker-compose -f docker/docker-compose.yml up -d --remove-orphans
    ```
    -   `-f docker/docker-compose.yml`: Specifies the compose file.
    -   `up -d`: Starts containers in detached mode.
    -   `--remove-orphans`: Removes services that are not defined in the compose file anymore.

4.  **Verify services:**
    ```bash
    docker-compose ps
    docker-compose logs -f app
    ```
    Check logs for any errors. The `app` service should report "Zenith Payments API Server starting..." and "listening on 0.0.0.0:8080".

5.  **Set up a Reverse Proxy (Nginx/Caddy - Highly Recommended):**
    To enable HTTPS, load balancing, and potentially serve static frontend files, use a reverse proxy.

    **Example Nginx configuration (`/etc/nginx/sites-available/zenith-payments.conf`):**
    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name api.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem; # Use Certbot for free SSL
        ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
        ssl_prefer_server_ciphers on;

        location / {
            proxy_pass http://localhost:8080; # Or your Docker internal IP/port
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_request_buffering off;
        }

        # Health check for load balancers
        location /health {
            proxy_pass http://localhost:8080/health;
        }

        # Optionally add rate limiting at Nginx level as well
        # limit_req_zone $binary_remote_addr zone=api_limiter:10m rate=100r/m;
        # location /api/ {
        #     limit_req zone=api_limiter burst=20 nodelay;
        #     proxy_pass http://localhost:8080;
        #     # ... other proxy headers
        # }
    }
    ```
    -   Enable the site: `sudo ln -s /etc/nginx/sites-available/zenith-payments.conf /etc/nginx/sites-enabled/`
    -   Test Nginx config: `sudo nginx -t`
    -   Reload Nginx: `sudo systemctl reload nginx`

## 7. Monitoring and Logging

-   **Container Logs**: Use `docker-compose logs -f` for real-time logs. For persistent logging, map `/app/logs` volume to a host directory and use a log aggregator (e.g., Filebeat + ELK stack, Promtail + Loki).
-   **System Metrics**: Use Prometheus + Grafana to monitor container resources (CPU, memory, network I/O) and application-specific metrics (if instrumented).
-   **Health Checks**: Configure HTTP health checks in your load balancer or orchestration system (`/health` endpoint).

## 8. Updates and Rollbacks

### Updating the Application

1.  Push your new Docker image to the registry (e.g., `yourusername/zenith-payments:new-version`).
2.  On the server, pull the new image: `docker pull yourusername/zenith-payments:new-version`
3.  Update the `docker-compose.yml` to use the `new-version` tag, or simply use `latest` if you always push `latest`
    (less safe for rollbacks).
4.  Redeploy: `docker-compose -f docker/docker-compose.yml up -d --no-deps --build` (if you modified Dockerfile) or `docker-compose -f docker/docker-compose.yml up -d --no-deps` (if only image tag changed).
5.  Perform rolling updates if using Kubernetes or a more advanced orchestrator.

### Rollbacks

If a new deployment causes issues:

1.  Revert your `docker-compose.yml` (or Kubernetes manifest) to use a previous, known-good Docker image tag.
2.  Redeploy the old version using `docker-compose up -d`.

## 9. Security Considerations

-   **Secrets Management**: Never hardcode secrets. Use environment variables (via `.env` or Docker secrets for Docker Swarm/Kubernetes).
-   **Network Security**:
    -   Use a firewall to restrict access to necessary ports (e.g., 80, 443 for web, 22 for SSH, 5432 for DB only from app server).
    -   Run database and Redis on internal Docker networks or private subnets if not externally managed.
-   **HTTPS**: Always use HTTPS in production with valid SSL certificates.
-   **Principle of Least Privilege**: Run containers and services with minimal necessary permissions.
-   **Regular Updates**: Keep your server OS, Docker, and application dependencies updated to patch security vulnerabilities.
-   **Audit Logs**: Enable and monitor audit logs (`audit_logs` table) for suspicious activities.
-   **Security Scans**: Regularly scan Docker images for vulnerabilities.
```