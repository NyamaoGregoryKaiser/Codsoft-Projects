```markdown
# Deployment Guide: Database Performance Monitor & Optimizer

This document provides instructions for deploying the Database Performance Monitor & Optimizer application to a production environment. The recommended approach is using Docker Compose, which simplifies the orchestration of the backend, frontend, PostgreSQL, and Redis services.

## 1. Prerequisites

Before you begin, ensure you have the following:

*   **A server/VM** with Docker and Docker Compose installed.
*   **Domain name** (optional, but recommended for production) pointing to your server's IP.
*   **HTTPS/SSL certificates** (e.g., from Let's Encrypt with Certbot) if you plan to use HTTPS.
*   **Environment Variables:** Securely store and inject sensitive configuration like `JWT_SECRET`, database credentials, and `REDIS_PASSWORD` (if used). Avoid committing production secrets to your repository.

## 2. Prepare for Production Deployment

### 2.1 Clone the Repository

```bash
git clone https://github.com/your-username/db-optimizer.git
cd db-optimizer
```

### 2.2 Configure Environment Variables

**Crucial Step:** Do NOT use `.env` files directly in production for sensitive data. Instead, set environment variables directly on your host machine or via your deployment platform's secrets management.

**Mandatory Environment Variables:**

These should be set where your `docker-compose.yml` runs:

*   **Backend (`backend/.env` equivalent, but as host env vars):**
    *   `NODE_ENV=production`
    *   `PORT=5000`
    *   `JWT_SECRET=YOUR_VERY_STRONG_AND_UNIQUE_JWT_SECRET` (Use a complex, random string)
    *   `DB_HOST=postgres_app_db` (or the IP/hostname of your PostgreSQL server)
    *   `DB_PORT=5432`
    *   `DB_USERNAME=your_prod_db_user`
    *   `DB_PASSWORD=your_prod_db_password` (Strong password for the application's DB)
    *   `DB_DATABASE=dboptimizer_app_db`
    *   `REDIS_HOST=redis` (or the IP/hostname of your Redis server)
    *   `REDIS_PORT=6379`
    *   `REDIS_PASSWORD=YOUR_REDIS_PASSWORD` (If your Redis instance is secured)
    *   `ADMIN_USERNAME=prod_admin` (Change default 'admin')
    *   `ADMIN_PASSWORD=your_prod_admin_password` (Strong password for initial admin)
    *   `RATE_LIMIT_WINDOW_MS=60000`
    *   `RATE_LIMIT_MAX_REQUESTS=100`

*   **Frontend (`frontend/.env` equivalent, but passed during Docker build):**
    *   `REACT_APP_API_BASE_URL=https://your-domain.com/api` (The public URL of your backend API)

### 2.3 Build Docker Images for Production

Ensure your Dockerfiles are optimized for production. The provided `Dockerfile`s are multi-stage builds.

To build the images:

```bash
docker-compose build --no-cache
```
*   `--no-cache`: Ensures fresh builds, pulling latest dependencies.

For the frontend, you must pass the `REACT_APP_API_BASE_URL` as a build argument:

```bash
# This is handled by docker-compose for simplicity, but if building manually:
docker build -f frontend/Dockerfile -t dboptimizer-frontend:latest \
  --build-arg REACT_APP_API_BASE_URL=https://your-domain.com/api ./frontend
```
*The `docker-compose.yml` handles `REACT_APP_API_BASE_URL` via the `environment` block which is picked up during the build process.*

### 2.4 Update `docker-compose.yml` for Production (Optional, but good practice)

While the default `docker-compose.yml` can work, for production you might want to:

*   **Remove volume mounts for source code:** The `backend` and `frontend` services currently have `./backend:/app` and `./frontend:/app` which are great for development but mean your source code is live in the container and changes persist. For production, you only need the built artifacts. Remove these lines if you want immutable containers.
*   **Set `restart: always`:** Ensures services automatically restart if they crash or the server reboots. (Already present in provided `docker-compose.yml`).
*   **Configure Nginx for HTTPS:** The frontend `Dockerfile` includes a basic Nginx config. For HTTPS, you'd likely use another Nginx container as a reverse proxy with Certbot.

## 3. Deploying with Docker Compose

1.  **Stop any existing containers** that might conflict (e.g., local development setup).
2.  **Set environment variables** on your host machine. Example (Bash):
    ```bash
    export JWT_SECRET="YOUR_VERY_STRONG_AND_UNIQUE_JWT_SECRET"
    export DB_USERNAME="your_prod_db_user"
    # ... set all other env vars as listed in 2.2
    export REACT_APP_API_BASE_URL="https://your-domain.com/api" # Public URL of your backend
    ```
3.  **Run Docker Compose in detached mode:**
    ```bash
    docker-compose up -d
    ```

    This command will:
    *   Pull/build necessary images.
    *   Create and start `postgres_app_db`, `redis`, `backend`, and `frontend` services.
    *   The `backend` will run TypeORM migrations and seed data automatically on startup (as configured in `Dockerfile` `CMD`).

## 4. Post-Deployment Steps

1.  **Verify Services:**
    *   Check container logs: `docker-compose logs -f`
    *   Ensure all containers are running: `docker-compose ps`
    *   Access the frontend in your browser: `http://your-server-ip:3000` (or `https://your-domain.com` if using reverse proxy)
    *   Verify backend health: `http://your-server-ip:5000/api/health`

2.  **Initial Admin Login:**
    *   Log in to the frontend using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you configured.
    *   **Immediately change the admin password** via the UI (if this feature were exposed, or directly via DB for a first-time setup for security). In this app, only `/users/profile` exists. For a real app, a password change endpoint is crucial.

3.  **Configure a Reverse Proxy (Nginx/Apache) for HTTPS and domain routing (HIGHLY RECOMMENDED for Production):**

    The `docker-compose.yml` exposes frontend on port 3000 and backend on port 5000 directly. For a production setup, you should place a reverse proxy like Nginx in front of your Docker containers to handle:
    *   **HTTPS (SSL/TLS termination):** Essential for secure communication.
    *   **Domain Routing:** Map `your-domain.com` to your frontend and `your-domain.com/api` to your backend.

    **Example Nginx Configuration (on host machine, not in Docker):**

    ```nginx
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        # SSL Configuration (replace with your actual certificate paths)
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            proxy_pass http://localhost:3000; # Points to the frontend service
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            proxy_pass http://localhost:5000/api/; # Points to the backend service
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    *Make sure to update `REACT_APP_API_BASE_URL` in `frontend/.env` (or during Docker build) to match your public backend URL (e.g., `https://your-domain.com/api`).*

4.  **Logging and Monitoring:**
    *   Integrate with a centralized logging system (ELK stack, Splunk, DataDog, etc.) for easier debugging and monitoring of application logs.
    *   Set up infrastructure monitoring (CPU, Memory, Disk I/O) for your server and Docker containers.
    *   Configure alerts for critical events (e.g., high error rates, service restarts).

## 5. Maintenance & Updates

*   **Backup Strategy:** Implement regular backups for your `postgres_app_db` data volume (`postgres_app_data`).
*   **Security Updates:** Regularly update your base Docker images and dependencies.
*   **Application Updates:** To deploy a new version of your code:
    1.  Pull the latest code: `git pull origin main` (or your main branch).
    2.  Rebuild images: `docker-compose build --no-cache`.
    3.  Restart services: `docker-compose up -d`. This will replace old containers with new ones. For zero-downtime deployments, consider more advanced orchestration like Kubernetes.

---
```