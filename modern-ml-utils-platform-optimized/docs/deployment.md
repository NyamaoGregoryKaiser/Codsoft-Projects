# Deployment Guide: ML Utilities Hub

This guide provides conceptual steps for deploying the ML Utilities Hub to a production environment. The recommended approach leverages Docker for containerization and a CI/CD pipeline for automation.

---

## 1. Production Environment Setup

Before deployment, ensure you have a suitable production environment. This typically involves:

*   **Cloud Provider**: AWS, Google Cloud Platform (GCP), Azure, DigitalOcean, etc.
*   **Container Orchestration**: Kubernetes (EKS, GKE, AKS), Docker Swarm, or a simpler server with Docker Compose.
*   **Domain Name**: A registered domain name for your application.
*   **SSL/TLS Certificates**: For HTTPS (e.g., Let's Encrypt, Cloudflare).
*   **Load Balancer/Reverse Proxy**: To distribute traffic and handle SSL termination (e.g., Nginx, Caddy, AWS ALB, GCP Load Balancer).
*   **Managed Database**: For PostgreSQL (e.g., AWS RDS, GCP Cloud SQL) and Redis (e.g., AWS ElastiCache, GCP Memorystore) for high availability and backups.
*   **Secrets Management**: A secure way to store sensitive environment variables (e.g., AWS Secrets Manager, GCP Secret Manager, Vault).

---

## 2. Prepare Environment Variables

Create production-ready `.env` files for both backend and frontend. These should contain strong, unique secrets and production-specific values.

**backend/.env**
*   **`NODE_ENV=production`**: Crucial for performance optimizations and logging levels.
*   **`PORT=5000`**: Internal port for the backend container.
*   **`DB_HOST`**, **`DB_PORT`**, **`DB_USERNAME`**, **`DB_PASSWORD`**, **`DB_DATABASE`**: Connection details for your **managed PostgreSQL instance**.
*   **`JWT_SECRET`**: A very long, random, and secret string. **Do NOT use the example secret!**
*   **`REDIS_HOST`**, **`REDIS_PORT`**, **`REDIS_PASSWORD`**: Connection details for your **managed Redis instance**.
*   **`RATE_LIMIT_WINDOW_MS`**, **`RATE_LIMIT_MAX_REQUESTS`**: Adjust based on expected traffic.

**frontend/.env**
*   **`VITE_API_BASE_URL`**: The public URL of your backend API (e.g., `https://api.yourdomain.com/api/v1`).

**Secrets Management**: Instead of putting these directly on the server, integrate with your cloud provider's secrets management service or use environment variables injected during CI/CD.

---

## 3. Container Images

The `Dockerfile`s provided are suitable for production.

*   **Backend (`backend/Dockerfile`)**: A multi-stage build process ensures a small final image with only production dependencies.
*   **Frontend (`frontend/Dockerfile`)**: Also uses a multi-stage build. In a true production setup, the final stage might use Nginx or Caddy to serve the static React build, instead of a simple Node.js `serve` command, for better performance and configuration options. For this example, `serve` is used for simplicity and consistent port mapping.

**Build and Push Images**:
1.  **Build**:
    ```bash
    docker build -t your-dockerhub-user/ml-utilities-backend:latest ./backend
    docker build -t your-dockerhub-user/ml-utilities-frontend:latest ./frontend --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
    ```
    *Note*: Pass `VITE_API_BASE_URL` as a build argument for the frontend, as `import.meta.env` variables are statically replaced at build time.
2.  **Push to Registry**: Push your images to a container registry (Docker Hub, AWS ECR, GCP Container Registry, etc.).
    ```bash
    docker push your-dockerhub-user/ml-utilities-backend:latest
    docker push your-dockerhub-user/ml-utilities-frontend:latest
    ```

---

## 4. Database Migrations

**Crucial**: Database migrations (`npm run migrate`) should be run **before** your application code starts up in a production environment. This ensures your database schema is up-to-date with your application's expectations.

**Recommended Approach**:
1.  **CI/CD Step**: Include a step in your CI/CD pipeline to explicitly run migrations on your production database *before* deploying new application containers.
    *   This could involve a temporary container that connects to the DB and runs the migration command, or an SSH command to an existing backend container.
2.  **Kubernetes**: Use a Kubernetes Job or an Init Container to run migrations.
3.  **Docker Compose (Simplified)**: While the `docker-compose.yml` has `command: sh -c "npm run migrate && npm run seed && npm start"`, this is generally **not recommended for production**. Running migrations on every container start can be slow, redundant, and problematic in scaled environments. It's better to manage migrations as a separate, orchestrated step.

**Seeding**: Initial data seeding (`npm run seed`) should generally be a one-time operation for initial setup, or managed carefully if used for configuration data.

---

## 5. Deployment with Docker Compose (Single Server Example)

For smaller deployments, Docker Compose on a single (or a few) server(s) can be sufficient.

1.  **SSH into your server**.
2.  **Install Docker & Docker Compose**.
3.  **Place `docker-compose.yml`** (modified for production), `.env` files, and any required `.env` files on the server.
    *   Ensure `db` and `redis` services in `docker-compose.yml` point to your **managed cloud instances**, not local containers. Remove the `db` and `redis` service definitions if using external managed services and update `DB_HOST`/`REDIS_HOST` in `backend/.env` accordingly.
    *   Update image names to point to your pushed images (e.g., `image: your-dockerhub-user/ml-utilities-backend:latest`).
4.  **Run migrations manually (first time or major update)**:
    ```bash
    docker run --rm -v $(pwd)/backend:/app -w /app \
      --env-file ./backend/.env \
      your-dockerhub-user/ml-utilities-backend:latest \
      npm run migrate
    ```
5.  **Start Services**:
    ```bash
    docker compose pull # Pull the latest images
    docker compose up -d # Start in detached mode
    ```
6.  **Setup Reverse Proxy (Nginx/Caddy)**: Configure Nginx/Caddy on the host machine to proxy requests to your frontend (port 3000) and backend (port 5000) containers, handle SSL, and manage domain routing.

    *Example Nginx config snippet (adjust paths/ports)*:
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com; # Frontend domain

        ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
        ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;

        location / {
            proxy_pass http://localhost:3000; # Frontend container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 443 ssl;
        server_name api.yourdomain.com; # Backend API domain

        ssl_certificate /etc/nginx/ssl/api.yourdomain.com.crt;
        ssl_certificate_key /etc/nginx/ssl/api.yourdomain.com.key;

        location / {
            proxy_pass http://localhost:5000; # Backend container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

---

## 6. Deployment with Kubernetes (Conceptual)

For highly scalable and available deployments, Kubernetes is the standard.

1.  **Containerize**: Ensure backend and frontend applications are containerized (as per Section 3).
2.  **Kubernetes Manifests**: Create `Deployment`, `Service`, `Ingress`, and `Secret` manifests for your application.
    *   **Secrets**: Store sensitive `backend/.env` variables as Kubernetes Secrets.
    *   **Deployments**: Define backend and frontend deployments, specifying container images, replicas, resource limits/requests, and environment variables (loaded from Secrets).
    *   **Services**: Define internal ClusterIP services for backend and frontend.
    *   **Ingress**: Configure an Ingress resource to expose your frontend and backend services to the internet, handle SSL termination, and route traffic based on hostnames (e.g., `yourdomain.com` for frontend, `api.yourdomain.com` for backend).
    *   **Persistent Volumes**: If you implement file storage, ensure you use Persistent Volumes.
3.  **Managed Services**: Configure your Kubernetes cluster to use managed PostgreSQL and Redis instances (e.g., via connection strings in environment variables).
4.  **CI/CD Integration**: Extend the GitHub Actions `ci-cd.yml` to:
    *   Build and push Docker images to a registry (e.g., GCR, ECR).
    *   Update Kubernetes manifests with new image tags.
    *   Apply Kubernetes manifests using `kubectl` (after setting up kubeconfig).
    *   Optionally, use Helm or Kustomize for templating and managing Kubernetes configurations.

---

## 7. Monitoring and Logging

*   **Centralized Logging**: Ensure container logs are collected and sent to a centralized logging system (e.g., ELK Stack, Splunk, Datadog, cloud provider's logging services like CloudWatch, Stackdriver Logging). Winston is already configured in the backend to output to console, which Docker picks up.
*   **Application Performance Monitoring (APM)**: Integrate with APM tools (e.g., New Relic, Datadog, Sentry, OpenTelemetry) to monitor application health, performance bottlenecks, and errors.
*   **Infrastructure Monitoring**: Monitor your Docker hosts, Kubernetes cluster, and managed database/Redis instances for resource utilization, health, and availability.

---

## 8. Rollback Strategy

Always have a rollback plan. In containerized environments, this typically means:
*   **Immutable Infrastructure**: Deploy new versions by building new images, not by modifying existing containers.
*   **Versioned Images**: Tag your Docker images with version numbers (e.g., `v1.0.0`, `git-sha`) so you can easily revert to a previous working version.
*   **CI/CD**: Your CI/CD pipeline should support rolling back to a previous deployment version if issues are detected post-deployment.
*   **Database Backups**: Ensure regular, automated backups of your PostgreSQL database.