# Deployment Guide: DB Health Monitor & Optimizer

This guide provides instructions and considerations for deploying the DB Health Monitor & Optimizer application to a production environment. The recommended approach leverages Docker and Docker Compose for ease of deployment and management.

## 1. Prerequisites

*   **Server/VM:** A Linux-based server (e.g., Ubuntu, CentOS) with at least 2 CPU cores and 4GB RAM (adjust based on load).
*   **Docker & Docker Compose:** Installed and running on your server.
*   **Nginx (or other reverse proxy):** Recommended for SSL termination and potentially serving static files, especially if not using the frontend's Nginx Docker image directly.
*   **DNS Configuration:** A domain name pointing to your server's IP address (e.g., `dbmonitor.yourdomain.com`).
*   **SSL Certificate:** (Optional but highly recommended) A certificate for your domain (e.g., from Let's Encrypt via Certbot).
*   **Environment Variables:** All sensitive information should be stored securely as environment variables or using a secrets management system.

## 2. Prepare Environment Variables

Copy `backend/.env.example` to `backend/.env` (or a similar name) on your server. **Crucially, ensure you generate strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`.**

```ini
# backend/.env on your production server
NODE_ENV=production
PORT=5000

DB_CLIENT=pg
DB_HOST=db_health_monitor_pg # Service name within Docker network
DB_PORT=5432
DB_USER=your_secure_db_user
DB_PASSWORD=your_secure_db_password # Strong password
DB_NAME=dbmonitor_db

JWT_SECRET=YOUR_VERY_LONG_AND_SECURE_JWT_SECRET # !!! GENERATE A NEW, STRONG KEY !!!
JWT_EXPIRES_IN=1d

REDIS_HOST=redis # Service name within Docker network
REDIS_PORT=6379

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000 # Adjusted for production

MONITORING_INTERVAL_MS=300000 # 5 minutes

ENCRYPTION_KEY=YOUR_32_BYTE_HEX_ENCRYPTION_KEY # !!! GENERATE A NEW, STRONG KEY (64 hex chars) !!!

FRONTEND_URL=https://dbmonitor.yourdomain.com # For CORS restrictions in backend
```
**Security Warning:** Do not commit `backend/.env` to version control. Use secure methods to transfer it to your server. For advanced deployments, consider Docker Secrets or Kubernetes Secrets.

## 3. Deployment with Docker Compose

This method uses the `docker-compose.yml` file to orchestrate all services.

1.  **Transfer Files:** Copy your project directory (or at least `docker-compose.yml`, `backend/`, `frontend/`, `frontend/nginx/`) and the `backend/.env` file to your production server.

2.  **Navigate to Project Root:**
    ```bash
    cd /path/to/your/db-health-monitor
    ```

3.  **Ensure `.env` file is present in `backend/`**
    
4.  **Edit `docker-compose.yml` (if necessary):**
    *   **External Database (Target DBs):** If the external databases you plan to monitor are running on your Docker host or elsewhere, ensure your firewall allows outbound connections from the `backend` container to their IPs/ports.
    *   **Frontend `REACT_APP_API_BASE_URL`:** In `docker-compose.yml`, the `frontend` service has an `environment` variable `REACT_APP_API_BASE_URL`. For production, if Nginx is proxying `/api` requests (as shown in the commented out section of `frontend/nginx/nginx.conf`), set this to `/api`. Otherwise, use the full URL of your backend (e.g., `https://dbmonitor.yourdomain.com/api`).
    ```yaml
    # In docker-compose.yml, under 'frontend' service:
    environment:
      REACT_APP_API_BASE_URL: /api # Or https://yourdomain.com/api if not using Nginx proxy for /api
    ```
    *   **Nginx Configuration for Frontend:** The `frontend/nginx/nginx.conf` file is set up to serve static files. If you need to proxy `/api` requests from the frontend domain to the backend service *within Docker*, you can uncomment and adjust the `location /api/` block in `frontend/nginx/nginx.conf` and update `docker-compose.yml` to use this config. For simplicity, the current `docker-compose.yml` directly exposes the backend on port 5000 and the frontend on port 3000. For a single domain, you would typically run a separate Nginx reverse proxy *outside* of the `frontend` container to handle both static files and API proxying.

5.  **Build and Run in Production Mode:**
    ```bash
    docker-compose -f docker-compose.yml --env-file ./backend/.env up --build -d
    ```
    *   `--env-file ./backend/.env`: Specifies the environment variables for the backend.
    *   `--build`: Rebuilds images (useful for first deployment or code changes).
    *   `-d`: Runs containers in detached mode (background).

6.  **Verify Services:**
    ```bash
    docker-compose ps
    docker-compose logs -f
    ```
    Check logs for any errors. Ensure all services (`db_health_monitor_pg`, `redis`, `backend`, `frontend`) are healthy.

7.  **Access the Application:**
    *   Frontend: By default, `http://your_server_ip:3000`.
    *   Backend API: By default, `http://your_server_ip:5000/api`.

## 4. Setting up a Reverse Proxy (Nginx for HTTPS) - Highly Recommended

For production, you should run your application behind a reverse proxy (like Nginx) to handle SSL/TLS termination, serve on standard HTTP/HTTPS ports (80/443), and potentially serve both frontend static files and proxy API requests from a single domain.

1.  **Install Nginx on Host Machine:**
    ```bash
    sudo apt update
    sudo apt install nginx
    ```

2.  **Configure Nginx:** Create a new Nginx configuration file (e.g., `/etc/nginx/sites-available/dbmonitor.conf`).

    ```nginx
    # /etc/nginx/sites-available/dbmonitor.conf
    server {
        listen 80;
        listen [::]:80;
        server_name dbmonitor.yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name dbmonitor.yourdomain.com;

        # SSL Configuration (replace with your actual certificate paths)
        ssl_certificate /etc/letsencrypt/live/dbmonitor.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/dbmonitor.yourdomain.com/privkey.pem;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
        ssl_prefer_server_ciphers on;

        # Frontend static files (served by the frontend container's Nginx)
        # Or, if you build frontend locally and copy to Nginx host:
        # root /var/www/dbmonitor/html;
        # index index.html index.htm;
        # try_files $uri $uri/ /index.html;

        # Proxy requests to the frontend service (container name in docker-compose)
        location / {
            proxy_pass http://localhost:3000; # The port frontend container is mapped to on host
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Proxy API requests to the backend service (container name in docker-compose)
        location /api/ {
            proxy_pass http://localhost:5000/api/; # The port backend container is mapped to on host
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Optional: Proxy websocket connections for BullMQ dashboard if needed
        # location /bullmq-dashboard/ {
        #     proxy_pass http://localhost:5000/bullmq-dashboard/;
        #     proxy_http_version 1.1;
        #     proxy_set_header Upgrade $http_upgrade;
        #     proxy_set_header Connection "upgrade";
        #     proxy_set_header Host $host;
        # }
    }
    ```

3.  **Enable Configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/dbmonitor.conf /etc/nginx/sites-enabled/
    sudo nginx -t # Test Nginx config
    sudo systemctl restart nginx
    ```

4.  **Obtain SSL Certificate (e.g., with Certbot):**
    ```bash
    sudo certbot --nginx -d dbmonitor.yourdomain.com
    ```
    Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

## 5. Continuous Integration / Continuous Deployment (CI/CD)

The `.github/workflows/main.yml` provides a basic CI workflow for testing. For full CD, you would extend this to:

1.  **Build Docker Images:** After tests pass, build and tag Docker images for backend and frontend.
2.  **Push to Container Registry:** Push the tagged images to Docker Hub or a private registry (e.g., AWS ECR, GCR).
3.  **Deployment Trigger:** On successful push to the `main` branch, trigger a deployment to your production server. This can be:
    *   SSH to the server and run `docker-compose pull && docker-compose up -d`.
    *   Using a cloud provider's deployment tools (e.g., AWS CodeDeploy, Azure DevOps, Google Cloud Deploy).
    *   Kubernetes deployments if running on a cluster.

**Example `deploy` step in `main.yml` (placeholder):**

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: [build-and-push] # Depends on a job that builds and pushes Docker images
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production Server
        uses: appleboy/ssh-action@v0.1.10 # Example SSH action
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/your/db-health-monitor # Or where your docker-compose.yml is
            docker-compose pull
            docker-compose up -d --remove-orphans # Pulls new images and restarts services
            docker system prune -f # Clean up old Docker images/volumes
```
**Remember to add `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY` (and `DOCKER_USERNAME`, `DOCKER_PASSWORD` if pushing to Docker Hub) as GitHub Secrets.**

## 6. Monitoring and Logging in Production

*   **Host-level Monitoring:** Use tools like Prometheus, Grafana, Datadog, or cloud provider monitoring (CloudWatch, Stackdriver) to monitor CPU, memory, disk I/O, network usage of your server and Docker containers.
*   **Application Logging:** Ensure `winston` logs are configured to output to files or a centralized logging system (ELK stack, Splunk, LogDNA) for easy debugging and auditing. Docker's default logging driver can send logs to stdout/stderr, which can then be collected by log aggregators.
*   **Database Monitoring:** Beyond what this application provides, monitor your *system's own* PostgreSQL and Redis instances for health, performance, and resource usage.

## 7. Backup Strategy

*   **Database (Internal):** Implement regular backups for the `db_health_monitor_pg` database. This can be done via `pg_dump` from a cron job on the host or a dedicated backup container.
*   **Volumes:** Ensure Docker volumes (`pg_data`, `redis_data`) are mapped to persistent storage that is also backed up.

By following these steps, you can deploy your DB Health Monitor & Optimizer system robustly in a production environment.