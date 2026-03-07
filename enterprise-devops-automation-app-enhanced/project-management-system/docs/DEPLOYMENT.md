```markdown
# Project Management System (PMS) - Deployment Guide

This guide outlines the steps to deploy the Project Management System to a production environment. The deployment strategy focuses on containerization with Docker, leveraging cloud services for scalability and reliability.

**Assumptions:**

*   You have a cloud provider account (e.g., AWS, GCP, Azure, DigitalOcean, Render).
*   You have `git`, `docker`, and `docker-compose` installed locally.
*   You have configured GitHub Secrets for Docker Hub authentication and (optionally) SSH access for direct server deployment (as per `ci-cd.yml`).
*   You have a domain name registered (e.g., `yourdomain.com`).

## 1. Choose Your Cloud Environment

While this guide focuses on a generic approach, common choices for containerized applications include:

*   **Platform as a Service (PaaS):** Render, Heroku, Vercel (for frontend), Google App Engine. Simplifies infrastructure management.
*   **Container Orchestration:** AWS ECS/EKS, Google Kubernetes Engine (GKE), Azure Kubernetes Service (AKS), DigitalOcean Kubernetes. Provides high scalability and resilience but has a steeper learning curve.
*   **Virtual Private Server (VPS):** DigitalOcean Droplets, AWS EC2, Linode. Requires manual Docker/Docker Compose setup.

This guide will assume a **VPS-like environment** with Docker and Docker Compose for simplicity, as it maps directly to the `docker-compose.yml` provided. For PaaS or full orchestration, consult their specific documentation.

## 2. Prepare Your Production Environment

### 2.1. Server Setup (VPS Example)

1.  **Provision a Server:** Create a new VPS instance (e.g., Ubuntu 22.04 LTS).
2.  **SSH Access:** Ensure you can SSH into your server.
3.  **Install Docker and Docker Compose:**
    ```bash
    sudo apt update
    sudo apt install apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER # Add your user to the docker group
    newgrp docker # Activate changes immediately (or log out/in)

    # Install Docker Compose (if not already installed with Docker)
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    docker compose version # Verify installation
    ```
4.  **Firewall Configuration:** Open necessary ports (e.g., 80 for HTTP, 443 for HTTPS).
    ```bash
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow OpenSSH
    sudo ufw enable
    ```

### 2.2. Database & Redis (Managed Services Recommended)

For production, it's highly recommended to use **managed database and caching services** provided by your cloud provider (e.g., AWS RDS for PostgreSQL, AWS ElastiCache for Redis). This offloads maintenance, backups, and scaling.

1.  **Provision Managed PostgreSQL:** Create a PostgreSQL instance. Note down its connection string (host, port, user, password, database name).
2.  **Provision Managed Redis:** Create a Redis instance. Note down its connection string (host, port, password).
3.  **Update `backend/.env` (Production Version):**
    Modify your production `.env` for the backend to use the managed service URLs.

    ```dotenv
    # ... other variables
    NODE_ENV=production
    DATABASE_URL=postgres://your_prod_user:your_prod_password@your_prod_db_host:5432/your_prod_db_name
    REDIS_HOST=your_prod_redis_host
    REDIS_PORT=6379
    REDIS_PASSWORD=your_prod_redis_password # Only if your Redis instance has a password
    JWT_SECRET=your_HIGHLY_SECURE_JWT_SECRET # CHANGE THIS! Use a strong, generated secret
    # ...
    ```
    **Important:** Do NOT commit your production `.env` file to source control. Use environment variables directly in your deployment platform or a secure secret management service.

## 3. CI/CD Deployment Flow

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automates the build and push of Docker images. The final deployment step needs to be configured based on your chosen deployment target.

### 3.1. Build & Push Docker Images (Automated by CI/CD)

1.  **Configure GitHub Secrets:**
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_PASSWORD`: Your Docker Hub access token (recommended) or password.
    *   (Optional, for direct server deployment later) `HOST_SERVER_ADDRESS`, `HOST_USERNAME`, `SSH_PRIVATE_KEY`

2.  **Push to `main` branch:**
    When you push changes to the `main` branch, the `docker-push-cd` job in `ci-cd.yml` will:
    *   Log in to Docker Hub.
    *   Build Docker images for `pms-backend` and `pms-frontend`.
    *   Push these images to your Docker Hub repository (e.g., `your_username/pms-backend:latest`, `your_username/pms-frontend:latest`).

### 3.2. Deploy to Production Server (Manual or Automated)

Once the Docker images are in Docker Hub, you need to pull and run them on your production server.

#### Option A: Manual Deployment (for VPS)

1.  **SSH into your server:**
    ```bash
    ssh your_username@your_server_ip
    ```
2.  **Clone the repository (or just copy `docker-compose.yml` and `nginx.conf`):**
    ```bash
    git clone https://github.com/your-username/project-management-system.git
    cd project-management-system
    ```
    **Note:** You only need the `docker-compose.yml` and `nginx.conf` (for frontend Nginx) on the server, as the actual application code is in the Docker images.
3.  **Create a `.env` file for Docker Compose on the server:**
    This file will contain your production environment variables.
    ```bash
    nano .env # or your preferred editor
    ```
    Paste the content of your production `backend/.env` here, ensuring `DATABASE_URL`, `REDIS_HOST`, `REDIS_PASSWORD`, `JWT_SECRET` are correctly set for production. Also, ensure `REACT_APP_API_URL` is `/api` for Nginx proxying.

    Example `project-management-system/.env` on server:
    ```dotenv
    # This .env is used by Docker Compose for the `backend` service
    # The frontend image is built with REACT_APP_API_URL=/api already
    NODE_ENV=production
    PORT=3001
    DATABASE_URL=postgres://your_prod_user:your_prod_password@your_managed_db_host:5432/your_prod_db_name
    JWT_SECRET=YOUR_VERY_LONG_AND_SECURE_JWT_SECRET_FOR_PROD
    JWT_ACCESS_EXPIRATION_MINUTES=30
    JWT_REFRESH_EXPIRATION_DAYS=30
    REDIS_HOST=your_managed_redis_host # Or the service name if self-hosted Redis in same compose
    REDIS_PORT=6379
    REDIS_PASSWORD=your_prod_redis_password # Only if applicable
    ```
4.  **Log in to Docker Hub (on server):**
    ```bash
    docker login -u your_docker_username -p your_docker_password
    ```
5.  **Pull and run the latest images:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
    ```
    *   You might want a separate `docker-compose.prod.yml` to disable volumes for code mounting and set restart policies etc. For simplicity, we'll assume the provided `docker-compose.yml` is used but adapted for production (e.g., by ensuring `volumes` are commented out for backend/frontend if not desired).
    *   If you *don't* want to rebuild images on the server (which is generally better practice for CI/CD, as images are pre-built), remove `--build` and use `docker compose pull` first:
        ```bash
        docker compose pull
        docker compose up -d --remove-orphans
        ```

6.  **Run Database Migrations & Seeders (first time or after schema changes):**
    ```bash
    docker compose exec backend npm run migrate
    docker compose exec backend npm run seed # Only if you need to re-seed or initially seed
    ```
    **Important:** For migrations, ensure your `backend` service is configured with the correct `DATABASE_URL` in its environment variables in `docker-compose.yml` or the `.env` file it uses.

#### Option B: Automated Deployment (using GitHub Actions placeholder)

The `ci-cd.yml` has a placeholder for this:

```yaml
      - name: Deploy to Server (Optional - Placeholder)
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST_SERVER_ADDRESS }}
          username: ${{ secrets.HOST_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/your/deployment/directory
            # Ensure .env is securely copied or created with production values
            # (e.g., using SCP action or templating from secrets)
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f # Clean up old images
            docker compose exec backend npm run migrate # Run migrations
```
This requires configuring `HOST_SERVER_ADDRESS`, `HOST_USERNAME`, and `SSH_PRIVATE_KEY` in GitHub Secrets. You'd also need to ensure your production `.env` is either copied securely to the server or its variables are directly passed to the Docker Compose command (which is generally preferred for secrets).

## 4. Domain and SSL/TLS Setup

1.  **DNS Configuration:** Update your domain's DNS records to point to your server's IP address (e.g., A record for `yourdomain.com` and `api.yourdomain.com`).
2.  **HTTPS with Certbot/Let's Encrypt:**
    *   Install Certbot on your server.
    *   Use Certbot to obtain and renew free SSL certificates for your domain, automatically configuring Nginx.
    ```bash
    sudo snap install core
    sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot

    # Request certificate for your domain
    # This assumes Nginx is already running and serving your domain
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```
    Follow the prompts. This will modify your Nginx configuration (which might conflict if you use a custom `nginx.conf`). A more robust approach might be to use a separate Nginx container for Certbot or use a tool like Traefik. For simplicity, manually adjust your `nginx.conf` with the SSL directives provided by Certbot.

## 5. Monitoring and Logging

*   **Server Monitoring:** Use cloud provider's monitoring tools (e.g., AWS CloudWatch, GCP Monitoring) or third-party tools (Prometheus, Grafana, Datadog) to monitor server health (CPU, RAM, disk, network).
*   **Application Logging:**
    *   Backend logs (Winston/Morgan) should be redirected to a centralized logging system (e.g., ELK stack, Loggly, Papertrail) for easier analysis and alerting. Configure Docker's logging driver (e.g., `json-file` with `max-size`/`max-file` or `syslog`).
*   **Performance Monitoring:** Tools like New Relic, Datadog, or custom Prometheus exporters can provide insights into API performance.

## 6. Post-Deployment Checks

1.  **Access URL:** Verify you can access your application at `https://yourdomain.com`.
2.  **Functionality Test:** Register a new user, create a project, add tasks/comments to ensure all core features work.
3.  **API Endpoints:** Test a few API endpoints (e.g., `GET /api/projects`) directly using Postman or browser dev tools.
4.  **Logs:** Check server logs (`journalctl -u docker.service`), Nginx logs, and backend container logs (`docker compose logs backend`) for any errors.
5.  **Database Connection:** Verify backend successfully connects to the managed PostgreSQL instance.
6.  **Redis Connection:** Verify backend successfully connects to the managed Redis instance.
7.  **Authentication:** Ensure login/logout and token validation work correctly.
8.  **Rate Limiting:** Test if rate limiting is active by sending many requests rapidly.

This comprehensive guide should provide a solid foundation for deploying your Project Management System to a production environment. Remember to always prioritize security, monitor your applications, and iterate on your deployment strategy as your project evolves.
```