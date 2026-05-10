```markdown
# Deployment Guide: AuthSystem

This guide outlines the steps to deploy the AuthSystem C++ backend to a production environment. We will primarily focus on Docker-based deployments, which offer consistency and ease of management.

## Table of Contents

1.  [Overview](#1-overview)
2.  [Prerequisites](#2-prerequisites)
3.  [Configuration for Production](#3-configuration-for-production)
4.  [Deployment with Docker Compose (Single Host)](#4-deployment-with-docker-compose-single-host)
    *   [4.1. Server Setup](#41-server-setup)
    *   [4.2. Clone and Configure](#42-clone-and-configure)
    *   [4.3. Run with Docker Compose](#43-run-with-docker-compose)
    *   [4.4. Nginx Reverse Proxy (Recommended)](#44-nginx-reverse-proxy-recommended)
5.  [Deployment with Kubernetes (Conceptual)](#5-deployment-with-kubernetes-conceptual)
6.  [Monitoring and Logging](#6-monitoring-and-logging)
7.  [Security Checklist](#7-security-checklist)

---

## 1. Overview

The AuthSystem backend is a C++ application designed for containerized deployment.
Recommended production setup:

*   **Containerization**: Docker for consistency and isolation.
*   **Orchestration**: Docker Compose for single-host deployments; Kubernetes for multi-host, highly available deployments.
*   **Database**: PostgreSQL or MySQL (instead of SQLite for production).
*   **Reverse Proxy**: Nginx or Caddy for SSL termination, load balancing, and additional security.
*   **Secrets Management**: Secure handling of sensitive environment variables.
*   **Observability**: Centralized logging, metrics, and health checks.

## 2. Prerequisites

*   A Linux server (e.g., Ubuntu, CentOS)
*   `git` installed
*   `Docker` installed (engine and CLI)
*   `Docker Compose` installed
*   `Nginx` (optional, but highly recommended for HTTPS and reverse proxy)
*   (For Kubernetes) `kubectl` and access to a Kubernetes cluster

## 3. Configuration for Production

Before deploying, you **MUST** configure the application for production.

1.  **Create a `.env` file**: This file will contain all environment variables for your production deployment. **DO NOT** commit this file to your repository.

2.  **Sensitive Variables**:
    *   `JWT_SECRET`: Generate a **strong, random, 256-bit+ secret key**. Never use the default from `.env.example`.
        ```bash
        openssl rand -base64 32 # Example for a 256-bit key
        ```
    *   `DATABASE_PATH`: For SQLite, ensure this path is within a persistent volume. For PostgreSQL/MySQL, this would be connection string details.
    *   `APP_ENV`: Set to `production`.
    *   `LOG_LEVEL`: Set to `INFO` or `WARN` to reduce verbosity in production.

3.  **Database**:
    *   **Recommendation**: For production, switch from SQLite to PostgreSQL or MySQL.
        *   This project currently uses SQLite. To switch, you would need to:
            *   Modify `src/database/Database.h/.cpp` to use a different database driver (e.g., `libpqxx` for PostgreSQL, `mysql-connector-cpp` for MySQL).
            *   Update migration scripts to be compatible with the new RDBMS.
            *   Update `docker-compose.yml` to include a PostgreSQL/MySQL service instead of relying on a SQLite file volume.
            *   Update `.env` with new database connection details.
    *   For this guide, we'll assume a persistent SQLite setup for simplicity, but reiterate the **strong recommendation** to use a dedicated RDBMS.

4.  **Network**:
    *   Ensure `APP_PORT` (default 8080) is configured correctly and accessible within your Docker network. It will be exposed to the reverse proxy.

## 4. Deployment with Docker Compose (Single Host)

This is suitable for small to medium-sized applications or for quick production deployments on a single server.

### 4.1. Server Setup

1.  **Update your server**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Install Docker and Docker Compose**:
    Follow the official Docker documentation for installation on your specific OS.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)

### 4.2. Clone and Configure

1.  **SSH into your server**.

2.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/auth-system.git
    cd auth-system
    ```
    Consider using a specific release tag or commit hash for production stability.

3.  **Create the production `.env` file**:
    ```bash
    cp .env.example .env
    # Edit .env with your production configurations (JWT_SECRET, DATABASE_PATH, etc.)
    ```
    **Crucially, ensure `JWT_SECRET` is strong and unique.**

### 4.3. Run with Docker Compose

1.  **Build and run the services**:
    ```bash
    docker-compose up -d --build
    ```
    *   `-d`: Runs the containers in detached mode (background).
    *   `--build`: Rebuilds the Docker images, ensuring you have the latest code. This is useful for initial deployment or after code changes. For subsequent restarts without code changes, you can omit `--build`.

2.  **Verify services**:
    ```bash
    docker-compose ps
    docker-compose logs -f app
    ```
    Check the logs for any errors. The `db_initializer` should run first, then the `app` should start.
    Once started, the application should be accessible on `http://localhost:8080` *from within the server's network*. To access it publicly, you need a reverse proxy.

### 4.4. Nginx Reverse Proxy (Recommended for HTTPS)

It is **critical** to use HTTPS in production. Nginx can handle SSL termination, proxy requests to your Docker container, and provide additional security features.

1.  **Install Nginx**:
    ```bash
    sudo apt install nginx -y
    sudo ufw allow 'Nginx Full' # If you have UFW firewall enabled
    ```

2.  **Configure Nginx**:
    Create a new Nginx configuration file for your domain (e.g., `/etc/nginx/sites-available/auth.yourdomain.com`).
    ```nginx
    # /etc/nginx/sites-available/auth.yourdomain.com
    server {
        listen 80;
        server_name auth.yourdomain.com; # Replace with your domain

        location / {
            # Redirect HTTP to HTTPS
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name auth.yourdomain.com; # Replace with your domain

        ssl_certificate /etc/letsencrypt/live/auth.yourdomain.com/fullchain.pem; # Path to your SSL cert
        ssl_certificate_key /etc/letsencrypt/live/auth.yourdomain.com/privkey.pem; # Path to your SSL key

        # Recommended SSL configurations (strong ciphers, protocols)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        location / {
            proxy_pass http://localhost:8080; # Points to the Docker container's exposed port
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # Health check for load balancers/orchestration
        location /health {
            proxy_pass http://localhost:8080/health;
        }

        # Optional: error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
    ```

3.  **Obtain SSL Certificates (e.g., Let's Encrypt with Certbot)**:
    ```bash
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
    sudo certbot --nginx -d auth.yourdomain.com
    ```
    Follow the prompts. Certbot will automatically update your Nginx config for HTTPS.

4.  **Enable the Nginx configuration**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/auth.yourdomain.com /etc/nginx/sites-enabled/
    sudo nginx -t # Test Nginx configuration
    sudo systemctl restart nginx
    ```

Now your application should be accessible securely via `https://auth.yourdomain.com`.

## 5. Deployment with Kubernetes (Conceptual)

For high availability, scalability, and robust management, Kubernetes is the preferred choice.

*   You would create Kubernetes manifests:
    *   **Deployment**: To manage the replicas of your AuthSystem application.
    *   **Service**: To expose your application within the cluster.
    *   **Ingress**: To expose your service to the outside world via an Ingress Controller (e.g., Nginx Ingress).
    *   **PersistentVolumeClaim (PVC)**: For persistent storage of your database (if using SQLite, though not recommended in K8s).
    *   **Secrets**: To securely inject `JWT_SECRET` and other sensitive environment variables.
    *   **ConfigMap**: For non-sensitive configuration.

*   **Example Kubernetes Workflow**:
    1.  Push Docker image to a container registry (e.g., Docker Hub, GCR, ECR).
    2.  Create Kubernetes `Secret` for `JWT_SECRET`.
    3.  Apply `Deployment`, `Service`, `Ingress` manifests.
    4.  Configure `Horizontal Pod Autoscaler` for dynamic scaling.

*(Detailed Kubernetes manifests are beyond the scope of this single response but follow standard patterns.)*

## 6. Monitoring and Logging

*   **Health Checks**: The `/health` endpoint is crucial for load balancers and container orchestrators (Docker Compose healthcheck, Kubernetes liveness/readiness probes).
*   **Application Logs**: Collect logs from your Docker containers using a centralized logging solution (e.g., ELK stack, Grafana Loki, cloud-provider specific services).
*   **Metrics**:
    *   Integrate a metrics library (e.g., Prometheus client library) into your C++ application to expose custom metrics (request counts, latency, error rates).
    *   Use node exporter for host-level metrics.
    *   Scrape metrics with Prometheus and visualize with Grafana.

## 7. Security Checklist

*   **HTTPS Everywhere**: Ensure all traffic is encrypted.
*   **Strong JWT Secret**: Use a long, random, and securely stored secret. Rotate it periodically.
*   **Input Validation**: Ensure all API inputs are rigorously validated.
*   **Rate Limiting**: Implement robust rate limiting at the API Gateway and/or application layer.
*   **Firewall**: Configure server and network firewalls to allow only necessary ports (e.g., 80, 443, 22).
*   **Principle of Least Privilege**:
    *   Run containers with non-root users.
    *   Database user credentials should have minimal necessary permissions.
*   **Regular Updates**: Keep the OS, Docker, Nginx, and all dependencies updated.
*   **Security Scans**: Regularly scan Docker images for vulnerabilities.
*   **Backup Strategy**: Implement a robust backup and recovery plan for your database.
*   **Error Handling**: Ensure production error messages do not leak sensitive internal information.
*   **CORS**: Only allow necessary origins to access your API.
```