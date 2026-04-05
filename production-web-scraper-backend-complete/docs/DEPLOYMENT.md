# Deployment Guide - Web Scraping Tools System

This document provides instructions and considerations for deploying the Web Scraping Tools System to a production environment. The recommended approach leverages Docker for containerization and orchestration.

## 1. Prerequisites

*   **Cloud Provider:** AWS, Google Cloud, Azure, DigitalOcean, Heroku, etc.
*   **Container Orchestration:** Docker Swarm, Kubernetes (EKS, GKE, AKS), or a managed container service (ECS, App Runner, Render, Railway).
*   **Database:** Managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL).
*   **Cache/Queue:** Managed Redis service (AWS ElastiCache, Google Cloud Memorystore for Redis).
*   **Domain Name:** Configured with appropriate DNS records.
*   **SSL/TLS Certificates:** For HTTPS (e.g., Let's Encrypt, ACM).
*   **CI/CD Pipeline:** (Optional but highly recommended) GitHub Actions, GitLab CI, Jenkins, etc.

## 2. Environment Variables

All sensitive information MUST be managed via environment variables and **NOT** hardcoded or committed to source control.

Update `backend/.env` and `frontend/.env` with production-ready values. For production, these should be managed by your deployment platform's secrets management (e.g., Kubernetes Secrets, AWS Secrets Manager, .env configuration in platform settings).

**Key Environment Variables to Configure for Production:**

*   **`NODE_ENV=production`**
*   **`PORT=80`** (or `443` if your load balancer handles SSL) - Docker containers will listen on 5000 (backend) and 3000 (frontend), but external access might be routed via 80/443.
*   **Database:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Use the connection details for your managed PostgreSQL instance. If your platform provides a `DATABASE_URL`, use that instead.
*   **Redis:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`. Use connection details for your managed Redis instance.
*   **JWT Secret:** `JWT_SECRET` - **Generate a very long, strong, random secret key.**
*   **Puppeteer:** `PUPPETEER_HEADLESS=new` is generally preferred for production to avoid UI. `PUPPETEER_ARGS` for fine-tuning browser behavior.
*   **Frontend:** `REACT_APP_API_BASE_URL` - Should point to your **publicly accessible** backend API URL (e.g., `https://api.yourdomain.com/api`).

## 3. Building Docker Images

For production deployment, you'll want to build optimized Docker images.

1.  **Login to your Docker Registry** (e.g., Docker Hub, AWS ECR, Google Container Registry):
    ```bash
    docker login
    ```

2.  **Build Backend Image:**
    Navigate to the `backend` directory.
    ```bash
    docker build -t your-docker-registry/web-scraping-backend:latest -f Dockerfile .
    ```

3.  **Push Backend Image:**
    ```bash
    docker push your-docker-registry/web-scraping-backend:latest
    ```

4.  **Build Frontend Image:**
    Navigate to the `frontend` directory.
    ```bash
    docker build -t your-docker-registry/web-scraping-frontend:latest -f Dockerfile .
    ```

5.  **Push Frontend Image:**
    ```bash
    docker push your-docker-registry/web-scraping-frontend:latest
    ```

## 4. Deployment Strategy (Example: Kubernetes/ECS)

A robust production deployment typically involves a few key components:

### a. Database (PostgreSQL)

*   **Use a Managed Service:** AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL are highly recommended for automated backups, scaling, and high availability.
*   **Initial Setup:** Connect to the managed database and run the Sequelize migrations.
    ```bash
    # Ensure your backend container can connect to the production DB
    docker run --rm \
      -e DB_HOST=<PROD_DB_HOST> \
      -e DB_PORT=<PROD_DB_PORT> \
      -e DB_USER=<PROD_DB_USER> \
      -e DB_PASSWORD=<PROD_DB_PASSWORD> \
      -e DB_NAME=<PROD_DB_NAME> \
      your-docker-registry/web-scraping-backend:latest \
      npx sequelize-cli db:migrate
    # Optional: Seed initial data if necessary (e.g., admin user)
    docker run --rm \
      -e DB_HOST=<PROD_DB_HOST> \
      -e DB_PORT=<PROD_DB_PORT> \
      -e DB_USER=<PROD_DB_USER> \
      -e DB_PASSWORD=<PROD_DB_PASSWORD> \
      -e DB_NAME=<PROD_DB_NAME> \
      your-docker-registry/web-scraping-backend:latest \
      npx sequelize-cli db:seed:all
    ```

### b. Redis (Cache & Queue)

*   **Use a Managed Service:** AWS ElastiCache, Google Cloud Memorystore for Redis, or Azure Cache for Redis. This provides high availability and reduces operational overhead.

### c. Backend Application

*   **Container Orchestration:** Deploy the backend Docker image to your chosen orchestrator.
    *   **Kubernetes:**
        *   Create `Deployment` for the backend application.
        *   Create `Service` to expose the deployment internally.
        *   Use `Ingress` (with an Ingress Controller like Nginx or Traefik) for external access and SSL termination.
        *   Manage environment variables using `Secrets` and `ConfigMaps`.
        *   Configure `HorizontalPodAutoscaler` for automatic scaling based on CPU/memory.
    *   **AWS ECS / Fargate:**
        *   Define `Task Definitions` for your backend container.
        *   Create an `ECS Service` to run and maintain the desired number of tasks.
        *   Use an `Application Load Balancer (ALB)` for external access, SSL termination, and routing.
        *   Configure `Auto Scaling` for the service.
    *   **Docker Swarm:** Deploy as a service: `docker service create --name backend --env-file .env -p 5000:5000 your-docker-registry/web-scraping-backend:latest`

*   **Health Checks:** Configure health checks in your orchestrator to ensure only healthy instances serve traffic.
*   **Resource Limits:** Set CPU and memory limits for containers to prevent resource exhaustion.
*   **Logging:** Configure containers to send logs to a centralized logging system (e.g., AWS CloudWatch Logs, ELK stack, Datadog).

### d. Frontend Application

*   **Container Orchestration:** Deploy the frontend Docker image similarly to the backend.
*   **Serving:** The `frontend/Dockerfile` uses `serve` to serve static files. In a production Kubernetes/ECS setup, this might be fronted by an Nginx container or directly served by the orchestration's load balancer.
*   **Static Hosting:** For maximum performance and cost-effectiveness, you could deploy the `build` output of the frontend directly to a static hosting service (AWS S3 + CloudFront, Netlify, Vercel, Firebase Hosting). This would bypass the need for a frontend Docker container in your orchestrator.

### e. BullMQ Worker

*   **Separate Deployment:** It's crucial to deploy the BullMQ worker (`scrapeWorker.js`) as a separate service from the main backend API.
*   **Resource Allocation:** Since scraping can be CPU/memory intensive, dedicate resources to worker instances.
*   **Scaling:** Scale worker instances independently based on the job queue's depth (number of pending jobs).
*   **Docker Swarm:** `docker service create --name scrape-worker --env-file .env --replicas 3 your-docker-registry/web-scraping-backend:latest npm start` (assuming `npm start` runs the worker too, or create a specific worker `CMD`). For this project, the `npm start` in `backend` runs the server AND sets up the worker in the same process, which is acceptable for simpler deployments. For true separation, you'd have a separate worker entry point.

## 5. CI/CD Pipeline

The `.github/workflows/ci-cd.yml` file provides an example of a GitHub Actions pipeline:

*   **Continuous Integration (CI):**
    *   On `push` or `pull_request` to `main` or `develop` branches.
    *   Runs backend tests (unit, integration, API) with a dedicated test database.
    *   Runs frontend tests and builds the frontend.
    *   (Optional: Lints code, security scans).
*   **Continuous Deployment (CD):**
    *   (Example only) Triggered on merge to `main` branch.
    *   Builds and pushes production-ready Docker images to a container registry.
    *   Deploys these images to your chosen production environment (Kubernetes, ECS, etc.). This step would involve specific commands for your cloud provider.

## 6. Monitoring and Alerting

*   **Backend Metrics:** Monitor CPU, memory, request latency, error rates, active connections, and queue depths (for BullMQ).
*   **Database Metrics:** Monitor connection pool, query performance, disk I/O, CPU, memory.
*   **Redis Metrics:** Monitor memory usage, connection count, command rates, key eviction.
*   **Application-level Logs:** Centralize all application logs (Winston logs from backend and worker) into a log management system (e.g., ELK stack, Splunk, Datadog, CloudWatch Logs).
*   **Alerting:** Set up alerts for critical issues:
    *   High error rates (API, scraping failures).
    *   Service downtime/unavailability.
    *   High resource utilization (CPU, memory, disk).
    *   Long queue processing times or growing queue backlog.

## 7. Security Best Practices

*   **Secrets Management:** Use platform-specific secrets management services.
*   **Network Security:** Implement strict firewall rules, security groups, and network ACLs. Only expose necessary ports.
*   **SSL/TLS:** Enforce HTTPS for all communication. Terminate SSL at the load balancer.
*   **Least Privilege:** Configure IAM roles/permissions with the principle of least privilege for application components and CI/CD.
*   **Regular Updates:** Keep Node.js, npm packages, Docker images, and underlying OS up-to-date to patch vulnerabilities.
*   **Vulnerability Scanning:** Use tools to scan Docker images and dependencies for known vulnerabilities.
*   **Backup Strategy:** Implement a robust backup and recovery strategy for your PostgreSQL database.
```