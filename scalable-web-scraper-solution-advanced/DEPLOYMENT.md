# Deployment Guide: Web Scraping Tools System

This document outlines the steps to deploy the Web Scraping Tools System, focusing on a Docker-based deployment suitable for various environments. The provided `docker-compose.yml` serves as a blueprint for local development and a simple single-server production deployment. For enterprise-grade, high-availability, and scalable production, consider Kubernetes.

## 1. Local Deployment with Docker Compose (as in `README.md`)

This section is primarily for local development and testing.

**Steps:**

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/your-username/web-scraping-system.git
    cd web-scraping-system
    ```
2.  **Configure `.env`:**
    *   Create `.env` from `.env.example`: `cp .env.example .env`
    *   Update `SECRET_KEY` with a strong, random value (e.g., `openssl rand -hex 32`).
    *   Ensure database and Redis credentials are set as desired.
    *   For `REACT_APP_API_URL` in `frontend/Dockerfile` build args, ensure it points to `http://localhost:8000/api/v1`.
3.  **Build and Run Services:**
    ```bash
    docker-compose build
    docker-compose up -d
    ```
4.  **Verify:**
    *   Frontend: `http://localhost:3000`
    *   Backend API (Swagger UI): `http://localhost:8000/api/v1/docs`
    *   Celery Flower: `http://localhost:5555`

## 2. Production Deployment Considerations

For a production environment, several aspects need careful consideration beyond a simple `docker-compose up`.

### 2.1. Server Requirements

*   **Operating System:** Linux (Ubuntu, CentOS, Debian) is recommended.
*   **RAM:** Minimum 8GB, preferably 16GB+ depending on the number of concurrent scraping jobs and data volume. Playwright browsers can be memory-intensive.
*   **CPU:** Multi-core CPU is essential, especially for concurrent scraping.
*   **Storage:** Sufficient disk space for PostgreSQL data and application logs. SSDs are highly recommended for database performance.

### 2.2. Environment Variables

*   **Security:** Never hardcode sensitive information. Use a robust environment variable management system.
*   **`SECRET_KEY`:** Must be a long, randomly generated string. Keep it secret and rotate periodically.
*   **Database Credentials:** Use strong, unique passwords for `POSTGRES_USER` and `POSTGRES_PASSWORD`.
*   **`DEBUG=False`:** Always set this in production to disable FastAPI's debug mode and detailed error messages.
*   **`PLAYWRIGHT_HEADLESS=True`:** Ensure Playwright runs in headless mode for efficiency.
*   **`REACT_APP_API_URL`:** For the frontend, this must point to the *publicly accessible URL* of your backend API.
*   **CORS:** Restrict `allow_origins` in `backend/app/main.py` to your actual frontend domain(s).

### 2.3. HTTPS/SSL

*   **Mandatory for Production:** All traffic (frontend to backend, user to frontend) should be encrypted with HTTPS.
*   **Reverse Proxy:** Use a reverse proxy like Nginx or Caddy (outside the `frontend` container if using `nginx:stable-alpine`) to handle SSL termination and routing.
    *   **Example Nginx Configuration (`nginx.conf`):**
        ```nginx
        server {
            listen 80;
            listen [::]:80;
            server_name your_domain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl http2;
            listen [::]:443 ssl http2;
            server_name your_domain.com;

            ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
            include /etc/letsencrypt/options-ssl-nginx.conf;
            ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

            location /api/ { # Backend API
                proxy_pass http://backend:8000; # Use internal Docker service name
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location /flower/ { # Celery Flower
                proxy_pass http://celery_flower:5555; # Use internal Docker service name
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location / { # Frontend
                root /usr/share/nginx/html; # Default path for Nginx frontend container
                index index.html index.htm;
                try_files $uri $uri/ /index.html;
            }
        }
        ```
    *   Use Certbot (Let's Encrypt) to obtain and manage SSL certificates.

### 2.4. Database Backups

*   Implement a regular backup strategy for your PostgreSQL database.
*   Tools like `pg_dump` or cloud provider managed database services with automated backups are crucial.

### 2.5. Logging and Monitoring

*   **Centralized Logging:** For production, redirect logs from containers to a centralized logging system (ELK stack, Splunk, Loki/Grafana, cloud-native solutions).
*   **Metrics:** Monitor CPU, RAM, disk I/O for all services (PostgreSQL, Redis, Backend, Workers).
    *   FastAPI can integrate with Prometheus for application-level metrics.
    *   Celery Flower provides basic task metrics.
*   **Health Checks:** Leverage Docker Compose/Kubernetes health checks (`healthcheck` in `docker-compose.yml`) to ensure services are responsive.

### 2.6. Docker Image Registry

*   Push your custom Docker images to a private registry (e.g., Docker Hub, AWS ECR, GCP Container Registry) for reliable deployments.

### 2.7. Container Orchestration (Kubernetes)

For enterprise-grade, highly available, and scalable deployments, Docker Compose is often replaced by Kubernetes.

*   **Pods:** Each service (backend, frontend, db, redis, worker, flower) would run in its own Kubernetes Pod(s).
*   **Deployments:** Manage rolling updates and scaling of your services.
*   **Services:** Define how to access your Pods (e.g., LoadBalancer for public access, ClusterIP for internal).
*   **Persistent Volumes:** For PostgreSQL data.
*   **Ingress:** For HTTP/HTTPS routing and SSL termination.
*   **Secrets:** For managing sensitive environment variables securely.
*   **Horizontal Pod Autoscalers (HPA):** Automatically scale backend and worker pods based on CPU/memory usage or custom metrics.

## 3. CI/CD Pipeline (GitHub Actions)

Refer to `.github/workflows/ci-cd.yml` for an example of a GitHub Actions pipeline.

**Typical Production CI/CD Steps:**

1.  **Trigger:** On push to `main` branch or tag creation.
2.  **Linting & Formatting:** Ensure code quality.
3.  **Unit & Integration Tests:** Run all tests for backend and frontend.
4.  **Build Docker Images:**
    *   Build `backend` and `frontend` Docker images.
    *   Tag images with commit SHA or version.
5.  **Push Docker Images:** Push tagged images to a Docker Registry.
6.  **Deploy to Staging/Production:**
    *   **Docker Compose (single server):** SSH into the server, pull latest images, and run `docker-compose up -d`. This is a simpler approach for smaller deployments.
    *   **Kubernetes:** Update Kubernetes deployment manifests to use new image tags, then apply changes (`kubectl apply -f .`).
7.  **Post-Deployment Tests:** Run smoke tests or performance tests against the deployed application.

## 4. Troubleshooting

*   **Check Docker Logs:** `docker-compose logs -f <service_name>`
*   **Container Health:** `docker-compose ps`
*   **Database Connection:** Ensure `db` service is healthy and `DATABASE_URL` is correct.
*   **Redis Connection:** Ensure `redis` service is healthy and `CELERY_BROKER_URL` / `REDIS_HOST` are correct.
*   **Celery Worker:** Check Flower UI for task failures.
*   **Frontend Issues:** Check browser console for errors and network requests.
*   **Playwright Issues:** Set `PLAYWRIGHT_HEADLESS=False` in `.env` (development only) to see the browser UI during a scrape if debugging locally.

By following these guidelines, you can set up a robust and scalable deployment for your Web Scraping Tools System.