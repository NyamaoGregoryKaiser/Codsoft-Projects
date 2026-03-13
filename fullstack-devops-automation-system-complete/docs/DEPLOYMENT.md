# Deployment Guide: Product Catalog Management System

This document outlines the steps for deploying the Product Catalog Management System to a production environment. It assumes a cloud-based Linux server (e.g., AWS EC2, Google Cloud Compute Engine, DigitalOcean Droplet) with Docker and Docker Compose installed.

For highly scalable and resilient deployments, consider using container orchestration platforms like Kubernetes or managed services like AWS ECS/EKS, Azure AKS, or Google GKE. This guide focuses on a single-server Docker Compose deployment for simplicity.

## Table of Contents

1.  [Prerequisites](#1-prerequisites)
2.  [Server Setup](#2-server-setup)
3.  [Database Setup (Production)](#3-database-setup-production)
4.  [Application Deployment](#4-application-deployment)
5.  [Nginx Configuration](#5-nginx-configuration)
6.  [SSL/TLS Configuration (HTTPS)](#6-ssltls-configuration-https)
7.  [Continuous Deployment (CD) Considerations](#7-continuous-deployment-cd-considerations)
8.  [Monitoring and Logging](#8-monitoring-and-logging)
9.  [Security Best Practices](#9-security-best-practices)

## 1. Prerequisites

*   A Linux server (Ubuntu 20.04+ recommended) with `ssh` access.
*   Domain name pointing to your server's IP address.
*   **Docker** installed on the server (version 20.10+).
*   **Docker Compose** installed on the server (version 2.0+).
*   **Git** installed on the server.
*   `sudo` privileges on the server.

## 2. Server Setup

Connect to your server via SSH:

```bash
ssh user@your_server_ip
```

### 2.1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2. Install Docker & Docker Compose

If not already installed, follow the official Docker installation guide for your Linux distribution.

**For Ubuntu:**
```bash
# Install Docker Engine
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Add your user to the docker group to run docker commands without sudo
sudo usermod -aG docker ${USER}
# Log out and log back in for the changes to take effect, or run:
# newgrp docker

# Install Docker Compose (latest stable version)
sudo apt install docker-compose-plugin # For Docker Compose v2 (recommended)
# Or for Docker Compose v1:
# sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# sudo chmod +x /usr/local/bin/docker-compose
```

Verify installations:
```bash
docker --version
docker compose version # For v2
# docker-compose --version # For v1
```

## 3. Database Setup (Production)

For production, it's highly recommended to use a managed PostgreSQL service from a cloud provider (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL for PostgreSQL). This offloads database management, backups, scaling, and high availability.

### 3.1. Using a Managed Database (Recommended)

1.  **Provision:** Create a PostgreSQL instance via your cloud provider's console.
2.  **Configure:** Set up a strong password for the `postgres` user or create a dedicated application user.
3.  **Security:** Configure network security (firewall/security groups) to allow incoming connections *only* from your application server's IP address.
4.  **Connection String:** Obtain the connection string (hostname, port, database name, user, password). It will look something like:
    `postgresql://<user>:<password>@<host>:<port>/<database_name>`

### 3.2. Self-Hosting PostgreSQL (Not Recommended for Production, but possible with `docker-compose.yml`)

If you absolutely must self-host on the same server:

1.  **Data Persistence:** Ensure you have a Docker volume for your PostgreSQL data to prevent data loss if the container is removed. Our `docker-compose.yml` already includes this (`db-data:/var/lib/postgresql/data`).
2.  **Backup Strategy:** Implement a robust backup strategy for your `db-data` volume.
3.  **Resource Allocation:** Ensure your server has enough RAM and CPU for both the application and the database.

**Important:** For production, **never** use the `POSTGRES_PASSWORD` in `docker-compose.yml` directly as a static value. Use Docker secrets or environment variables managed by your deployment system. For this guide, we will use environment variables from the `.env` file, which should be secured.

## 4. Application Deployment

### 4.1. Clone the Repository

On your server, clone the project repository:

```bash
cd /opt # Or your preferred deployment directory
sudo git clone https://github.com/your-username/product-catalog-system.git
cd product-catalog-system
```

### 4.2. Configure Environment Variables

Create `.env` files for both backend and frontend. **These files should contain production-ready values and be secured.**

```bash
sudo cp backend/.env.example backend/.env
sudo cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```
PORT=5000
DATABASE_URL=postgresql://<prod_user>:<prod_password>@<prod_db_host>:<prod_db_port>/<prod_db_name>
JWT_SECRET=YOUR_SUPER_STRONG_PRODUCTION_JWT_SECRET_KEY
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
CACHE_TTL=3600
```
*   **`DATABASE_URL`**: Use the connection string for your production PostgreSQL instance (managed or self-hosted).
*   **`JWT_SECRET`**: Generate a new, very long, and complex secret for production. Do NOT use the development secret.

Edit `frontend/.env`:

```
VITE_API_BASE_URL=https://your-domain.com/api
```
*   **`VITE_API_BASE_URL`**: This should point to your domain's API endpoint, which will be handled by Nginx. Use `https` for production.

### 4.3. Build Docker Images

From the project root directory, build the Docker images. This process can take some time.

```bash
sudo docker compose build --no-cache
```
`--no-cache` ensures that images are built from scratch, picking up the latest dependencies and code.

### 4.4. Run Database Migrations and Seed Data

The `docker-compose.yml` is configured to run migrations and seeds automatically on the backend service start.

### 4.5. Start Services

```bash
sudo docker compose up -d
```
The `-d` flag runs the containers in detached mode (in the background).

Verify that all containers are running:
```bash
sudo docker ps
```
You should see `product-catalog-system-backend-1`, `product-catalog-system-frontend-1`, `product-catalog-system-db-1`, and `product-catalog-system-nginx-1` (or similar names based on your compose project name).

Check logs for any errors:
```bash
sudo docker compose logs -f
```

## 5. Nginx Configuration

The `nginx/nginx.conf` included in the repository is suitable for production. It serves the frontend static files and proxies API requests to the backend.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com; # Replace with your domain

    # Redirect HTTP to HTTPS (important for production with Certbot)
    # return 301 https://$host$request_uri;

    location / {
        root /usr/share/nginx/html; # Path inside frontend container where build assets are copied
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000; # 'backend' is the service name in docker-compose.yml
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Important:** If you implement HTTPS (highly recommended), you'll need to update this `nginx.conf` to listen on port 443, include SSL certificates, and redirect HTTP to HTTPS.

## 6. SSL/TLS Configuration (HTTPS)

**HTTPS is mandatory for production environments.** We will use Certbot to automate obtaining and renewing Let's Encrypt SSL certificates.

### 6.1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2. Stop Nginx

Certbot needs to temporarily bind to port 80/443 to verify domain ownership.

```bash
sudo docker compose stop nginx
```

### 6.3. Obtain SSL Certificate

Run Certbot. Replace `your-domain.com` and `www.your-domain.com` with your actual domain names, and `your_email@example.com` with your email.

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your_email@example.com --agree-tos --redirect --non-interactive
```
*   `--nginx`: Tells Certbot to use the Nginx plugin.
*   `-d`: Specifies the domain names.
*   `--email`: Your email for urgent renewal notices.
*   `--agree-tos`: Agree to Let's Encrypt's terms of service.
*   `--redirect`: Automatically sets up HTTP to HTTPS redirection.
*   `--non-interactive`: Run Certbot without user interaction (useful for automation).

Certbot will automatically modify your Nginx configuration in `/etc/nginx/sites-available/default` (or your relevant Nginx config file) to include the SSL certificates and handle redirects.

### 6.4. Update `nginx/nginx.conf` and `docker-compose.yml`

Certbot modifies the Nginx config file *on your host machine*. However, our `docker-compose.yml` mounts `nginx/nginx.conf` from the project directory into the Nginx container. You need to either:

1.  **Copy Certbot's generated config:** Copy the SSL-related parts from `/etc/nginx/sites-available/default` to your `nginx/nginx.conf` file, and adjust paths for Docker.
2.  **Mount Certbot volumes:** Modify `docker-compose.yml` to mount Certbot's `/etc/letsencrypt` directory into the Nginx container. This is generally the cleaner approach.

**Example `docker-compose.yml` modification for Certbot volumes and `nginx.conf` update:**

First, modify `nginx/nginx.conf` to use the Certbot paths for SSL:

```nginx
# nginx/nginx.conf
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com; # Replace with your domain

    return 301 https://$host$request_uri; # Redirect all HTTP to HTTPS
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name your-domain.com www.your-domain.com; # Replace with your domain

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem; # Mount path
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem; # Mount path
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then, modify `docker-compose.yml` to mount the Certbot volumes:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:stable-alpine
    container_name: product-catalog-system-nginx
    ports:
      - "80:80"
      - "443:443" # Expose HTTPS port
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - frontend_build:/usr/share/nginx/html:ro
      # Add these volumes for Certbot certificates
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/lib/letsencrypt:/var/lib/letsencrypt:ro
    depends_on:
      - frontend
      - backend
```

### 6.5. Start Nginx with new config

```bash
sudo docker compose up -d --force-recreate nginx
```

Your application should now be accessible via HTTPS at `https://your-domain.com`.

### 6.6. Automate Certificate Renewal

Certbot automatically sets up a cron job or systemd timer for renewals. You can test it:

```bash
sudo certbot renew --dry-run
```

## 7. Continuous Deployment (CD) Considerations

The provided `.github/workflows/ci-cd.yml` has a `deploy` step that is a placeholder. For a real CD, you would:

1.  **Push Docker Images:** After building, push the images to a Docker Registry (e.g., Docker Hub, AWS ECR, Google Container Registry).
    ```bash
    # Example in CI/CD workflow
    - name: Push Docker Images
      run: |
        docker tag backend:latest your-registry/backend:latest
        docker push your-registry/backend:latest
        docker tag frontend:latest your-registry/frontend:latest
        docker push your-registry/frontend:latest
    ```
2.  **Update Server:** On your server, you would pull the new images and restart the services. This can be done via SSH, a deployment script, or a tool like Ansible.

    **Example deployment script on server (e.g., `deploy.sh`):**
    ```bash
    #!/bin/bash
    cd /opt/product-catalog-system
    sudo docker compose pull # Pull latest images from registry
    sudo docker compose up -d --force-recreate # Restart services
    sudo docker image prune -f # Clean up old images
    ```
    This script could be triggered by your CI/CD pipeline after a successful build and push.

## 8. Monitoring and Logging

*   **Container Logs:** Access logs using `sudo docker compose logs -f`. For persistent storage and analysis, consider:
    *   **Log Drivers:** Configure Docker to send logs to a centralized logging system (e.g., ELK Stack, Splunk, Datadog) using Docker's logging drivers.
    *   **Backend Logging:** The backend uses Winston, which can be configured to output to files, external services, etc.
*   **Resource Monitoring:** Use server monitoring tools (e.g., `htop`, cloud provider dashboards, Prometheus/Grafana) to track CPU, RAM, disk I/O, and network usage.
*   **Application Performance Monitoring (APM):** Tools like New Relic, Datadog, or Sentry can provide deep insights into application performance and errors.

## 9. Security Best Practices

*   **Firewall:** Configure your server's firewall (e.g., `ufw`) to only allow necessary incoming traffic (SSH, HTTP, HTTPS, and potentially database port if self-hosting).
*   **Least Privilege:** Run containers with the least necessary privileges.
*   **Secrets Management:** For production, move sensitive environment variables out of `.env` files and into a dedicated secrets management system (e.g., AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).
*   **Regular Updates:** Keep your server's OS, Docker, and application dependencies updated to patch security vulnerabilities.
*   **Strong Passwords:** Use strong, unique passwords for all services and user accounts.
*   **SSH Key Authentication:** Disable password-based SSH login and use SSH keys.
*   **Penetration Testing & Vulnerability Scanning:** Regularly scan your application and infrastructure for security vulnerabilities.

By following this guide, you can confidently deploy your Product Catalog Management System to a production environment. Remember that continuous learning and adaptation are key to maintaining a robust and secure system.

---
### 5. `backend/package.json`