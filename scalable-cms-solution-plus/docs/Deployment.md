# CMS System Deployment Guide

This document provides instructions for deploying the CMS System to a production environment. The primary method described uses Docker and Docker Compose, suitable for single-server or small-scale deployments. For larger, highly available deployments, consider Kubernetes.

## 1. Prerequisites

*   A Linux server (e.g., Ubuntu, CentOS)
*   **Docker** and **Docker Compose** installed on the server.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)
*   **Git** for cloning the repository.
*   **Domain name** (e.g., `cms.example.com`) pointing to your server's IP address.
*   **SSL/TLS Certificates** (e.g., from Let's Encrypt using Certbot) for HTTPS.
*   **Nginx** or another reverse proxy configured on the host (if not using Nginx within Docker Compose for frontend).

## 2. Server Setup Steps

1.  **Update System**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Install Docker and Docker Compose**:
    Follow the official Docker documentation linked above. After installation, ensure your user can run Docker commands without `sudo`:
    ```bash
    sudo usermod -aG docker ${USER}
    newgrp docker # Apply group changes without logging out
    ```

3.  **Clone the Repository**:
    On your server, clone the CMS system repository:
    ```bash
    git clone https://github.com/your-username/cms-system.git
    cd cms-system
    ```

4.  **Create `.env` File**:
    Create a `.env` file in the root directory (`cms-system/`) based on `.env.example`. This file will hold your production environment variables. **Crucially, change `JWT_SECRET` to a strong, long, random string.**
    ```bash
    cp .env.example .env
    # Now edit .env with your favorite editor
    nano .env
    ```
    Example `.env` (ensure strong passwords and secrets):
    ```
    DB_USER=cmsuser_prod
    DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
    DB_NAME=cms_db_prod

    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_DB=0

    HTTP_PORT=8080
    FRONTEND_ORIGIN=https://cms.example.com # Your actual frontend domain
    JWT_SECRET=REALLY_LONG_AND_RANDOM_SECRET_FOR_PRODUCTION_DO_NOT_SHARE
    ```

## 3. Deployment with Docker Compose

1.  **Build and Run Services**:
    From the `cms-system/` root directory, execute:
    ```bash
    docker-compose -f backend/docker/docker-compose.yml up --build -d
    ```
    *   `--build`: Forces rebuilding of images, ensuring you have the latest code. Omit this for faster restarts if code hasn't changed.
    *   `-d`: Runs containers in detached mode (in the background).

2.  **Verify Services**:
    Check if all containers are running and healthy:
    ```bash
    docker-compose -f backend/docker/docker-compose.yml ps
    ```
    You should see `cms_db`, `cms_redis`, `cms_backend`, and `cms_frontend` in `Up (healthy)` state.

3.  **Check Logs**:
    To view logs for any service:
    ```bash
    docker-compose -f backend/docker/docker-compose.yml logs -f <service_name>
    # Example: docker-compose -f backend/docker/docker-compose.yml logs -f cms_backend
    ```

## 4. Reverse Proxy (Nginx) Configuration (Recommended for Production)

For production, it's highly recommended to place an Nginx reverse proxy in front of your Docker containers. This allows for:
*   **SSL/TLS Termination**: Secure HTTPS connections.
*   **Domain Routing**: Directing traffic for `cms.example.com` to your frontend/backend.
*   **Load Balancing**: (If you have multiple backend instances).
*   **Static File Serving**: Efficiently serving frontend static assets.

Here's a basic Nginx configuration example. This assumes Nginx is installed directly on your host machine.

```nginx
# /etc/nginx/sites-available/cms.example.com
server {
    listen 80;
    server_name cms.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name cms.example.com;

    # SSL Certificates (configure these to your actual paths)
    ssl_certificate /etc/letsencrypt/live/cms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/cms.example.com/chain.pem;

    # Recommended SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3000; # Points to the frontend container's exposed port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080; # Points to the backend container's exposed port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        # For Websockets if Drogon uses them
        # proxy_http_version 1.1;
        # proxy_set_header Upgrade $http_upgrade;
        # proxy_set_header Connection "upgrade";
    }

    # Nginx can also serve frontend static files directly if you build the frontend outside Docker or mount its build folder
    # For example, if you build frontend locally and copy to /var/www/cms.example.com
    # location / {
    #     root /var/www/cms.example.com;
    #     index index.html index.htm;
    #     try_files $uri $uri/ /index.html;
    # }
    # location /api/ {
    #     proxy_pass http://localhost:8080;
    #     # ... other proxy headers
    # }
}
```

**Steps to configure Nginx**:
1.  Save the above configuration to `/etc/nginx/sites-available/cms.example.com`.
2.  Create a symbolic link to `sites-enabled`:
    ```bash
    sudo ln -s /etc/nginx/sites-available/cms.example.com /etc/nginx/sites-enabled/
    ```
3.  Test Nginx configuration:
    ```bash
    sudo nginx -t
    ```
4.  Reload Nginx:
    ```bash
    sudo systemctl reload nginx
    ```
5.  **Obtain SSL Certificates**: Use Certbot for Let's Encrypt certificates:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d cms.example.com
    ```
    Certbot will automatically modify your Nginx config for SSL.

## 5. Continuous Deployment (Optional with GitHub Actions)

The `.github/workflows/ci-cd.yml` file defines a GitHub Actions workflow that can be used for continuous integration and deployment.

**Steps for CI/CD setup (conceptual)**:
1.  **Repository Secrets**: Add the following secrets to your GitHub repository settings (`Settings -> Secrets and variables -> Actions -> Repository secrets`):
    *   `SSH_PRIVATE_KEY`: Your server's SSH private key (generate a new one dedicated for CI/CD).
    *   `SSH_HOST`: Your server's IP address or hostname.
    *   `SSH_USER`: The username for SSH access on your server.
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_PASSWORD`: Your Docker Hub password or a token.
    *   `PROD_DB_USER`, `PROD_DB_PASSWORD`, `PROD_DB_NAME`, `PROD_JWT_SECRET`, etc. (all production environment variables from your `.env`).

2.  **Workflow (`.github/workflows/ci-cd.yml`)**: (See section 6 below)
    This workflow typically involves:
    *   Building backend and frontend Docker images.
    *   Pushing images to a container registry (e.g., Docker Hub).
    *   SSH'ing into the production server.
    *   Pulling the latest images.
    *   Running `docker-compose up --build -d` on the server to update services.

## 6. Maintenance and Monitoring

*   **Logs**: Regularly check container logs for errors. You can integrate a centralized logging solution (e.g., ELK stack, Grafana Loki) for production.
*   **Health Checks**: `docker-compose.yml` includes basic health checks. For production, consider more advanced monitoring tools (Prometheus, Grafana).
*   **Backups**: Set up regular backups for your PostgreSQL database.
*   **Updates**: Keep your host OS, Docker, and application dependencies updated.

This guide provides a solid foundation for deploying your CMS system. Adapt it to your specific cloud provider and infrastructure needs.
```