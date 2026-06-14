```markdown
# DataViz Pro - Deployment Guide

This guide covers the steps to deploy the DataViz Pro system to a production environment. We will focus on a Docker-based deployment, which can be extended to Kubernetes for larger-scale operations.

## 1. Production Environment Setup

### 1.1 Server Provisioning

Provision at least one Linux server (e.g., AWS EC2, Google Cloud VM, DigitalOcean Droplet) with:
*   Minimum 2 vCPU, 4GB RAM (scale up based on expected load).
*   Docker & Docker Compose installed.
*   Git installed.
*   SSH access configured with key-based authentication.

### 1.2 Firewall Configuration

Open the necessary ports on your server's firewall:
*   `80` (HTTP) - For Nginx.
*   `443` (HTTPS) - For Nginx (highly recommended for production).
*   `22` (SSH) - For administrative access.
*   Internal ports (e.g., 3000, 3001, 5432, 6379) can be restricted to internal Docker network access only.

### 1.3 DNS Setup

Point your domain (e.g., `dataviz.yourcompany.com`) to your server's public IP address using an `A` record.

### 1.4 Persistent Storage

Ensure your `pgdata` and `redisdata` volumes (defined in `docker-compose.yml`) are stored on reliable, persistent storage. For cloud environments, consider using cloud-managed database and Redis services (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud Memorystore) instead of self-hosting in Docker for better scalability, backups, and operational ease.

## 2. Environment Variables

Create `.env.production` files for both backend and frontend. These files should contain production-specific values, especially:

**`backend/.env.production`**
```
PORT=3000
FRONTEND_URL=https://dataviz.yourcompany.com # Your actual domain
DATABASE_URL="postgresql://<user>:<password>@<db-host>:<db-port>/data_viz_db?schema=public" # Use strong credentials, dedicated host
JWT_SECRET="YOUR_MUCH_STRONGER_AND_LONGER_SECRET_KEY" # Generate a truly random, long key
JWT_EXPIRATION_TIME="1h"
REDIS_HOST=<redis-host> # e.g., 'redis' if in same compose, or external Redis endpoint
REDIS_PORT=6379
# Add any other production-specific secrets or configurations
```

**`frontend/.env.production.local`** (or via environment variables injected by deployment platform)
```
NEXT_PUBLIC_BACKEND_URL=https://dataviz.yourcompany.com/api # Your actual backend API endpoint
# Add any other production-specific frontend configurations
```

**Security Best Practices for Secrets:**
*   **DO NOT** commit `.env.production` files to version control.
*   Use a secrets management solution (e.g., HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Kubernetes Secrets) to inject these environment variables into your containers at runtime.

## 3. Building and Pushing Docker Images

If not using a CI/CD pipeline, you'll need to build and push your Docker images manually.

1.  **Build Images:**
    ```bash
    docker-compose -f docker-compose.yml build backend frontend nginx # Build specific services if needed
    ```
2.  **Tag Images:** Tag your images with your Docker registry and a version (e.g., commit SHA, semantic version).
    ```bash
    docker tag data-viz-backend:latest your-registry/data-viz-backend:v1.0.0
    docker tag data-viz-frontend:latest your-registry/data-viz-frontend:v1.0.0
    docker tag nginx:latest your-registry/data-viz-nginx:v1.0.0 # If you customized Nginx image
    ```
3.  **Log in to Registry:**
    ```bash
    docker login your-registry
    ```
4.  **Push Images:**
    ```bash
    docker push your-registry/data-viz-backend:v1.0.0
    docker push your-registry/data-viz-frontend:v1.0.0
    docker push your-registry/data-viz-nginx:v1.0.0
    ```

## 4. Deploying to Server

1.  **SSH into your server:**
    ```bash
    ssh user@your-server-ip
    ```
2.  **Create a deployment directory:**
    ```bash
    sudo mkdir /opt/dataviz-pro
    sudo chown user:user /opt/dataviz-pro
    cd /opt/dataviz-pro
    ```
3.  **Transfer files:** Copy `docker-compose.yml`, `nginx.conf`, and your `.env.production` files to this directory.
    You can use `scp` from your local machine:
    ```bash
    scp docker-compose.yml user@your-server-ip:/opt/dataviz-pro/
    scp nginx.conf user@your-server-ip:/opt/dataviz-pro/
    scp backend/.env.production user@your-server-ip:/opt/dataviz-pro/backend.env # Rename to avoid conflicts
    scp frontend/.env.production.local user@your-server-ip:/opt/dataviz-pro/frontend.env
    ```
    Then, rename them on the server:
    ```bash
    mv backend.env backend/.env.production
    mv frontend.env frontend/.env.production.local # Or directly into the container env variables
    ```
    Alternatively, for secrets, use a secret manager as mentioned above.

4.  **Database Migrations:** Before starting the application containers, run database migrations.
    If you're using a managed DB, you might connect directly. If PostgreSQL is in Docker Compose:
    ```bash
    # Ensure DB container is running first if not starting all at once
    docker-compose up -d db
    # Run migrations from the backend image (replace image name and tag if custom)
    docker run --rm \
      --network=host \
      -e DATABASE_URL="postgresql://postgres:password@localhost:5432/data_viz_db?schema=public" \
      your-registry/data-viz-backend:v1.0.0 npx prisma migrate deploy
    ```
    *Note:* Adjust `DATABASE_URL` for external managed DBs.

5.  **Start the Application:**
    Update `docker-compose.yml` to use your tagged images from the registry instead of `build` context.
    For example:
    ```yaml
    # ...
    services:
      backend:
        image: your-registry/data-viz-backend:v1.0.0
        # ...
      frontend:
        image: your-registry/data-viz-frontend:v1.0.0
        # ...
      nginx:
        image: your-registry/data-viz-nginx:v1.0.0 # Or use official nginx:alpine and mount your conf
        # ...
    # ...
    ```
    Now, start all services:
    ```bash
    docker-compose up -d
    ```

## 5. Post-Deployment Steps

### 5.1 HTTPS Configuration (Critical for Production)

Use `certbot` (Let's Encrypt) to get free SSL certificates and configure Nginx for HTTPS.

1.  **Install Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
2.  **Update Nginx Config:**
    Enable the commented-out HTTPS server block in `nginx.conf` and configure your domain.
3.  **Run Certbot:**
    ```bash
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```
    Certbot will automatically modify your Nginx configuration and set up renewal.

### 5.2 Monitoring and Logging

*   **Log Aggregation:** Integrate Winston logs from your backend with a log aggregation service (e.g., ELK Stack, Splunk, Datadog Logs, AWS CloudWatch Logs).
*   **Performance Monitoring:** Use APM tools (e.g., Prometheus/Grafana, New Relic, Datadog) to monitor CPU, memory, network, request rates, error rates, and response times.
*   **Alerting:** Set up alerts for critical errors, high latency, or resource exhaustion.

### 5.3 Backups

*   **Database:** Implement a robust backup strategy for your PostgreSQL database. For managed services, this is usually built-in. For self-hosted, use tools like `pg_dump` on a schedule.
*   **Configuration:** Back up your `docker-compose.yml`, `nginx.conf`, and relevant `.env` files.

### 5.4 Regular Updates

Keep your dependencies (Node.js, npm packages, Docker images) and server operating system up-to-date to patch security vulnerabilities.

## 6. Scaling (Kubernetes)

For larger deployments, consider migrating from Docker Compose to Kubernetes:

*   **Container Images:** Reuse your Docker images.
*   **Kubernetes Manifests:** Define `Deployments`, `Services`, `Ingress`, `Secrets`, and `PersistentVolumeClaims` for your applications.
*   **Managed Kubernetes:** Use services like GKE, EKS, AKS for simplified cluster management.
*   **CI/CD Integration:** Extend your GitHub Actions to deploy to Kubernetes using `kubectl` or Helm.

This guide provides a solid foundation for deploying DataViz Pro. Always adapt these instructions to your specific cloud provider and organizational security policies.
```