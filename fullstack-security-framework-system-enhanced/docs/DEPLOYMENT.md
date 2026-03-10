# Deployment Guide

This document outlines the steps and considerations for deploying the Secure Enterprise Web Application to a production environment. While this guide focuses on a general Docker-based deployment, specifics may vary based on your chosen cloud provider (AWS, GCP, Azure, DigitalOcean, etc.).

## 1. Production Environment Setup

### 1.1 Server Provisioning

Provision at least one Linux server (e.g., Ubuntu, CentOS) with:
*   Docker and Docker Compose installed.
*   Sufficient CPU, RAM, and disk space for your expected load.
*   Open ports:
    *   `80` (HTTP) / `443` (HTTPS) for web traffic.
    *   `22` (SSH) for administration.
    *   Other ports (`5000`, `5432`, `6379`) should ideally not be exposed directly to the public internet but only within the Docker network.

### 1.2 Domain and DNS

*   Acquire a domain name for your application.
*   Configure DNS records (e.g., A record pointing to your server's IP address).

### 1.3 HTTPS (Crucial for Production)

*   **Never deploy without HTTPS!** Our JWTs are sent via `Secure` HttpOnly cookies, which will only work over HTTPS.
*   Use Certbot with Nginx (or your chosen web server) to provision and manage SSL certificates from Let's Encrypt. This is generally free and automated.
*   Example for Nginx:
    ```bash
    sudo apt update
    sudo apt install nginx certbot python3-certbot-nginx
    # Ensure Nginx config is ready (see frontend/nginx.conf)
    # Then run:
    sudo certbot --nginx -d your-domain.com -d www.your-domain.com
    ```
    This command will automatically configure Nginx to use HTTPS.

## 2. Environment Variables

**CRITICAL: DO NOT store sensitive information (e.g., `JWT_SECRET`, database passwords) directly in your repository.**

In production, manage environment variables securely:

*   **Docker Compose:** You can use a `.env` file for Docker Compose or pass them directly.
*   **Cloud Providers:**
    *   **AWS ECS/EKS:** Use Task Definitions with secrets from AWS Secrets Manager or SSM Parameter Store.
    *   **GCP Cloud Run/GKE:** Use Google Secret Manager.
    *   **Azure App Services/AKS:** Use Azure Key Vault.
    *   **Kubernetes:** Use Kubernetes Secrets.

**Required Backend Environment Variables:**

*   `NODE_ENV=production`
*   `PORT=5000` (Internal Docker port, typically exposed via Nginx or Load Balancer)
*   `DATABASE_URL="postgresql://user:password@db-host:5432/secure_app_db?schema=public"`: **Replace `db-host` with your actual database host/IP.**
*   `JWT_SECRET`: **A strong, long, randomly generated secret (min 32 chars).**
*   `JWT_ACCESS_EXPIRATION_MINUTES`: E.g., `15` (shorter than dev).
*   `JWT_REFRESH_EXPIRATION_DAYS`: E.g., `30`.
*   `JWT_COOKIE_NAME_ACCESS`: E.g., `accessToken`
*   `JWT_COOKIE_NAME_REFRESH`: E.g., `refreshToken`
*   `CORS_ORIGINS`: Your production frontend URL (e.g., `https://your-domain.com`).
*   `REDIS_HOST`: Redis host/IP.
*   `REDIS_PORT`: Redis port (e.g., `6379`).
*   `RATE_LIMIT_WINDOW_MS`: E.g., `60000` (1 minute).
*   `RATE_LIMIT_MAX_REQUESTS`: E.g., `100`.
*   `CACHE_TTL_SECONDS`: E.g., `3600`.
*   `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `RESET_PASSWORD_URL`: Configure for actual email sending.

**Required Frontend Environment Variables:**

*   `REACT_APP_API_BASE_URL`: Your backend API URL (e.g., `https://your-domain.com/api/v1`).

## 3. Database & Redis Deployment

For production, it's highly recommended to use **managed services** for your database and Redis:

*   **PostgreSQL:**
    *   AWS RDS PostgreSQL
    *   Google Cloud SQL for PostgreSQL
    *   Azure Database for PostgreSQL
    *   DigitalOcean Managed Databases
*   **Redis:**
    *   AWS ElastiCache for Redis
    *   Google Cloud Memorystore for Redis
    *   Azure Cache for Redis
    *   DigitalOcean Managed Databases (Redis)

These managed services handle backups, patching, scaling, and high availability, significantly reducing operational overhead.

## 4. Deploying with Docker Compose (Single Server - for simplicity, not high-availability)

This assumes you are deploying to a single server where Docker and Docker Compose are installed.

1.  **SSH into your server.**
    ```bash
    ssh user@your-server.com
    ```

2.  **Clone your repository.**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

3.  **Create production `.env` files.**
    *   Place your production `.env` files for `backend` and `frontend` in their respective directories.
    *   **Crucially, modify `docker-compose.yml`**:
        *   Change `DATABASE_URL` and `REDIS_HOST` in `backend` service to point to your **managed database/Redis instances**, not the `db` and `redis` services in `docker-compose.yml`.
        *   Remove the `db` and `redis` services from `docker-compose.yml` if you're using managed external services. If you still want them in Docker Compose for production, ensure they are hardened, backed up, and only accessible internally.
        *   Update `frontend` service's `REACT_APP_API_BASE_URL` to your production backend URL.
        *   Consider removing `volumes: - ./backend:/app` from the backend service to use the built image fully, rather than syncing code from host.
        *   Change `command: sh -c "pnpm prisma migrate deploy && pnpm prisma db seed && pnpm dev"` to `command: pnpm start` in the `backend` service.

4.  **Pull latest Docker images and build:**
    ```bash
    docker compose pull # Pull base images
    docker compose build # Build your application images
    ```

5.  **Run Database Migrations and Seed (if needed):**
    *   It's generally safer to run migrations as a separate step or via the `CMD` in your `Dockerfile` as shown, to ensure the database is ready before the application starts.
    *   If you choose to run `prisma db seed` in production, ensure your seed script is idempotent and handles existing data gracefully. Often, seeding is a one-time operation or managed differently in prod.
    *   The `backend/Dockerfile` already has `pnpm prisma migrate deploy` as part of its `CMD`, which applies pending migrations.

6.  **Start the services in detached mode:**
    ```bash
    docker compose up -d
    ```

7.  **Verify services are running:**
    ```bash
    docker compose ps
    docker compose logs -f
    ```

## 5. Advanced Deployment (Cloud Providers - High Availability)

For high-availability, scalability, and robust operations, consider using a cloud-native deployment:

*   **Container Orchestration:**
    *   **Kubernetes (GKE, AKS, EKS):** For complex, large-scale deployments requiring fine-grained control and auto-scaling.
    *   **AWS ECS / Fargate:** Simpler container orchestration managed service, good for Dockerized applications.
    *   **Google Cloud Run:** Fully managed serverless container platform, excellent for event-driven or web applications with unpredictable traffic.

*   **CI/CD Integration:**
    *   Integrate your CI/CD pipeline (e.g., GitHub Actions) to automatically build Docker images, push them to a container registry (ECR, GCR, Docker Hub), and trigger deployments to your chosen orchestration platform.

*   **Monitoring & Alerting:**
    *   Set up centralized logging (e.g., ELK Stack, AWS CloudWatch Logs, Datadog).
    *   Implement application performance monitoring (APM) (e.g., Prometheus/Grafana, Datadog, New Relic).
    *   Configure alerts for critical errors, performance bottlenecks, and security incidents.

## 6. Post-Deployment Checklist

*   **Verify HTTPS:** Ensure your application is accessible only via HTTPS.
*   **Check Logs:** Monitor application logs for errors or unusual activity.
*   **Test End-to-End:** Perform critical user flows (register, login, CRUD operations) to ensure functionality.
*   **Security Scans:** Run DAST (Dynamic Application Security Testing) tools against the deployed application.
*   **Backup Strategy:** Ensure your database and any persistent storage are regularly backed up.
*   **Firewall Rules:** Harden server firewalls to only allow necessary incoming connections.
*   **Resource Monitoring:** Keep an eye on CPU, memory, and network usage.

---
**Disclaimer:** This guide provides a general framework. Production deployments are complex and require careful planning, testing, and continuous monitoring tailored to your specific needs and infrastructure.