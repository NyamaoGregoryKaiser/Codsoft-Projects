```markdown
# PerfoMetrics: Deployment Guide

This guide details how to deploy the PerfoMetrics system to a production environment using Docker and Nginx. It also covers CI/CD integration with GitHub Actions for automated deployments.

## Table of Contents
1.  [Deployment Strategy](#1-deployment-strategy)
2.  [Prerequisites](#2-prerequisites)
    *   [Production Server](#production-server)
    *   [Domain Name and DNS](#domain-name-and-dns)
    *   [SSL Certificate](#ssl-certificate)
    *   [Docker Hub / Container Registry](#docker-hub--container-registry)
3.  [Server Setup](#3-server-setup)
    *   [Install Docker & Docker Compose](#install-docker--docker-compose)
    *   [Create Project Directory](#create-project-directory)
    *   [Configure `.env` for Production](#configure-env-for-production)
4.  [Manual Deployment Steps](#4-manual-deployment-steps)
    *   [Build and Push Docker Images](#build-and-push-docker-images)
    *   [Deploy via Docker Compose](#deploy-via-docker-compose)
5.  [CI/CD with GitHub Actions](#5-cicd-with-github-actions)
    *   [GitHub Secrets Configuration](#github-secrets-configuration)
    *   [Workflow Details](#workflow-details)
    *   [Triggering Deployment](#triggering-deployment)
6.  [Post-Deployment Checks](#6-post-deployment-checks)
7.  [Maintenance & Updates](#7-maintenance--updates)
8.  [Troubleshooting](#8-troubleshooting)

## 1. Deployment Strategy

The recommended deployment strategy for PerfoMetrics involves:
*   **Containerization:** All services (backend, frontend, database, Nginx) are deployed as Docker containers.
*   **Docker Compose:** Used for orchestrating multi-container applications on a single host. For larger deployments, Kubernetes would be preferred.
*   **Nginx Reverse Proxy:** Serves as the public entry point, handling static file serving (frontend), API routing to the backend, SSL/TLS termination, and potentially basic load balancing.
*   **Persistent Data:** Database data is stored in Docker volumes to ensure data persistence across container restarts/updates.
*   **CI/CD:** Automated build, test, and deployment using GitHub Actions for efficient updates.

## 2. Prerequisites

### Production Server
*   A Linux server (e.g., Ubuntu, CentOS) with sufficient RAM, CPU, and disk space.
*   Public IP address.
*   SSH access.

### Domain Name and DNS
*   A registered domain name (e.g., `perfometrics.com`).
*   DNS `A` record pointing your domain to the server's public IP address.

### SSL Certificate
*   An SSL/TLS certificate for your domain (e.g., from Let's Encrypt, Cloudflare, or a commercial CA). This is crucial for securing communications (HTTPS).

### Docker Hub / Container Registry
*   A Docker Hub account or access to a private container registry (e.g., AWS ECR, Google Container Registry) to store your built Docker images.

## 3. Server Setup

### Install Docker & Docker Compose

Follow the official Docker documentation to install Docker Engine and Docker Compose on your production server.

```bash
# Example for Ubuntu
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version # Verify installation
```
Add your user to the `docker` group to run Docker commands without `sudo`:
```bash
sudo usermod -aG docker $USER
newgrp docker # Apply group changes immediately
```

### Create Project Directory
Create a dedicated directory for your PerfoMetrics project on the server:
```bash
mkdir -p /opt/perfometrics
cd /opt/perfometrics
```

### Configure `.env` for Production
Create a `.env` file in your project directory (`/opt/perfometrics/.env`). This file will contain environment-specific variables for your production deployment.

**Important Changes for Production:**
*   **`JWT_SECRET`**: Generate a strong, unique secret key.
*   **`DB_PASSWORD`**: Generate a strong, unique password for the database user.
*   **`REACT_APP_API_BASE_URL`**: Set to `/api` as Nginx will handle proxying.
*   **`DB_HOST`**: Keep as `perfo-metrics-db` if using `docker-compose.yml` (service name).
*   **`SERVER_PORT`**: Keep as `8080` (internal container port).
*   **Nginx Configuration for SSL**: You will need to modify `docker/nginx/nginx.conf` to include SSL configuration. This typically involves mounting your SSL certificate and key into the Nginx container and adding `listen 443 ssl;` blocks.

Example production `.env` (replace placeholders with actual secure values):
```
# Backend Configuration
SERVER_PORT=8080
JWT_SECRET=YOUR_VERY_STRONG_AND_UNIQUE_JWT_SECRET_HERE
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_SECONDS=60

# Database Configuration
DB_HOST=perfo-metrics-db
DB_PORT=5432
DB_NAME=perfo_metrics_db
DB_USER=perfo_user
DB_PASSWORD=YOUR_VERY_STRONG_DB_PASSWORD_HERE

# Frontend Configuration
REACT_APP_API_BASE_URL=/api

# Docker Registry for CI/CD
DOCKER_USERNAME=your_dockerhub_username
```

## 4. Manual Deployment Steps (for initial setup or emergency)

For automated deployments, proceed to [CI/CD with GitHub Actions](#5-cicd-with-github-actions).

### Build and Push Docker Images
On your local machine, build and push the Docker images to your container registry (e.g., Docker Hub):

```bash
cd PerfoMetrics

# Login to Docker Hub
docker login -u your_dockerhub_username

# Build and push backend image
docker build -t your_dockerhub_username/perfometrics-backend:latest -f backend/Dockerfile .
docker push your_dockerhub_username/perfometrics-backend:latest

# Build and push frontend image
docker build -t your_dockerhub_username/perfometrics-frontend:latest -f frontend/Dockerfile .
docker push your_dockerhub_username/perfometrics-frontend:latest

# (Optional) If you customize Nginx beyond the default in docker/nginx/nginx.conf, build a custom Nginx image:
# docker build -t your_dockerhub_username/perfometrics-nginx:latest -f docker/nginx/Dockerfile docker/nginx
# docker push your_dockerhub_username/perfometrics-nginx:latest
```
**Note:** Remember to update `docker-compose.yml` to use your pushed images (e.g., `image: your_dockerhub_username/perfometrics-backend:latest` instead of `build: .`).

### Deploy via Docker Compose

1.  **Copy `docker-compose.yml` and `docker/nginx/nginx.conf` (modified for SSL) to the server:**
    ```bash
    scp docker-compose.yml /opt/perfometrics/
    scp docker/nginx/nginx.conf /opt/perfometrics/docker/nginx/nginx.conf # Make sure /opt/perfometrics/docker/nginx exists
    # Also copy your SSL certs to a suitable location (e.g., /opt/perfometrics/certs/) and update nginx.conf to use them.
    ```

2.  **Pull and Start Services on Server:**
    ```bash
    cd /opt/perfometrics
    # (If not already logged in) docker login -u your_dockerhub_username
    docker-compose pull # Pulls the latest images from your registry
    docker-compose up -d --force-recreate # Recreates containers with new images
    ```

## 5. CI/CD with GitHub Actions

The `.`github/workflows/ci.yml` file defines a GitHub Actions workflow that automates the build, test, and deployment process.

### GitHub Secrets Configuration
You need to add the following secrets to your GitHub repository (`Settings -> Secrets -> Actions -> New repository secret`):

*   **`DOCKER_USERNAME`**: Your Docker Hub username.
*   **`DOCKER_PASSWORD`**: Your Docker Hub access token (or password).
*   **`SSH_HOST`**: The IP address or hostname of your production server.
*   **`SSH_USERNAME`**: The SSH username for your production server.
*   **`SSH_PRIVATE_KEY`**: The private SSH key corresponding to the public key authorized on your production server. (Ensure this key has permissions only to the necessary files on the server).

### Workflow Details
The `ci.yml` workflow includes:
*   **`build-and-test-backend`**: Builds the C++ backend, runs unit tests (if configured), and builds its Docker image.
*   **`build-and-test-frontend`**: Installs Node.js dependencies, runs React unit tests, builds the React app, and builds its Docker image.
*   **`deploy`**:
    *   **Trigger:** Runs only on pushes to the `main` branch.
    *   **Docker Login:** Logs into Docker Hub using secrets.
    *   **Build & Push:** Builds the production Docker images (using correct tags like `your_dockerhub_username/perfometrics-backend:latest`) and pushes them to Docker Hub.
    *   **SSH Deploy:** Connects to the production server via SSH.
        *   `git pull origin main`: Fetches the latest code (including `docker-compose.yml` and `nginx.conf` changes).
        *   `docker-compose pull`: Pulls the newly pushed Docker images.
        *   `docker-compose up -d --build --force-recreate`: Recreates containers to use the new images. `--build` is included to rebuild if Dockerfile changes are detected on the host. `--force-recreate` ensures new containers are spun up even if image hash hasn't changed.
        *   `docker system prune -f`: Cleans up old, unused Docker objects to save disk space.

### Triggering Deployment
A deployment will automatically trigger when changes are pushed to the `main` branch.

## 6. Post-Deployment Checks

After deployment, perform the following checks:

*   **Access Frontend:** Navigate to your domain name (e.g., `https://perfometrics.com`). Verify the login page loads correctly.
*   **Login Test:** Attempt to log in with `admin`/`admin123` (or your configured credentials). Verify redirection to the dashboard.
*   **API Test:** Use `curl` or Postman to hit a few API endpoints (e.g., `GET /api/services` with admin token) to ensure the backend is responsive.
*   **Metric Ingestion Test:** If you have a test service, send some sample metrics using its API key.
*   **Docker Logs:** Check container logs for any errors:
    ```bash
    docker-compose logs -f
    ```
*   **System Health:** Monitor server resources (CPU, Memory) using tools like `htop` or ` glances`.

## 7. Maintenance & Updates

*   **Regular Backups:** Implement regular backups for your PostgreSQL database.
*   **Software Updates:** Keep Docker, Docker Compose, and the host OS updated.
*   **Security Patches:** Regularly scan for and apply security patches to your base images and dependencies.
*   **Log Monitoring:** Set up a centralized log management system (e.g., ELK Stack, Grafana Loki) to aggregate and analyze logs from all containers.
*   **Scaling:** As load increases, consider scaling strategies:
    *   **Vertical Scaling:** Upgrade server resources.
    *   **Horizontal Scaling:** Use a container orchestrator like Kubernetes to run multiple instances of the backend.
    *   **Database Scaling:** Read replicas, sharding, or moving to a managed database service.

## 8. Troubleshooting

*   **Container not starting:**
    *   Check `docker-compose logs <service_name>` for specific errors.
    *   Verify `.env` file values are correct.
    *   Ensure no port conflicts on the host.
*   **Frontend not loading or showing API errors:**
    *   Check browser console for JavaScript errors.
    *   Verify `REACT_APP_API_BASE_URL` is correctly set.
    *   Check Nginx logs (`docker-compose logs nginx`) for proxy errors.
    *   Ensure the backend container is running and healthy.
*   **Backend errors:**
    *   Check backend logs (`docker-compose logs perfo-metrics-backend`).
    *   Verify database connectivity and credentials in `.env`.
    *   Ensure database migrations ran successfully.
*   **Authentication issues:**
    *   Double-check `JWT_SECRET` in `.env`.
    *   Ensure correct credentials are used.
*   **Database connection refused:**
    *   Ensure `perfo-metrics-db` container is running and healthy.
    *   Check database credentials and host/port in `.env`.
    *   Verify network connectivity between backend and database containers within the Docker network.
```