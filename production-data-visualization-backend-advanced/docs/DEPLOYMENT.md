# DataViz Pro: Deployment Guide

This guide outlines the steps to deploy the DataViz Pro application to a production environment using Docker and Docker Compose. For more complex, high-availability deployments (e.g., Kubernetes), this guide serves as a foundation.

## 1. Prerequisites

1.  **Server:** A Linux-based server (e.g., Ubuntu, CentOS) with sufficient resources (CPU, RAM, Disk).
2.  **Domain Name:** A registered domain name pointing to your server's IP address.
3.  **Docker & Docker Compose:** Installed on your server.
    *   Install Docker: `sudo apt-get update && sudo apt-get install docker.io`
    *   Install Docker Compose: `sudo apt-get install docker-compose` (or use `sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose`)
4.  **SSH Access:** To your server.
5.  **Git:** Installed on your server or locally to clone the repository.
6.  **Container Registry Account:** (e.g., Docker Hub, AWS ECR, GCP Container Registry) if you plan to push your Docker images for CI/CD.

## 2. Server Setup

### 2.1. Clone Repository

SSH into your server and clone the project:

```bash
ssh user@your_server_ip
git clone https://github.com/your-username/data-viz-system.git
cd data-viz-system
```

### 2.2. Environment Variables

Create a `.env` file in the root directory of your cloned project (`data-viz-system/.env`).
**Crucially, adjust `DB_HOST` and `REACT_APP_API_BASE_URL` for production.**

```dotenv
# Production .env (data-viz-system/.env)

# Backend
NODE_ENV=production
PORT=5000
JWT_SECRET=YOUR_SECURE_RANDOM_JWT_SECRET # !!! GENERATE A STRONG, UNIQUE SECRET !!!
JWT_EXPIRATION=7d
FRONTEND_URL=https://your-domain.com # Your actual production frontend URL

# Database (Ensure these are strong and unique for production)
DB_NAME=dataviz_prod
DB_USER=prod_datavizuser
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD # !!! GENERATE A STRONG, UNIQUE PASSWORD !!!
DB_HOST=db # 'db' is the service name within the Docker network
DB_PORT=5432

# Cache (Adjust as needed for production load)
CACHE_TTL_SECONDS=600 # 10 minutes

# Rate Limiting (Adjust as needed for expected production traffic)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=500 # 500 requests per minute

# Frontend (for Nginx proxy, relative path)
REACT_APP_API_BASE_URL=/api
```
**Generate secure secrets:**
*   For `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
*   For `DB_PASSWORD`: Use a strong password generator.

### 2.3. Docker Compose Configuration for Production

The provided `docker-compose.yml` is generally suitable, but ensure:
*   Frontend `Dockerfile` is built for production (serving static assets with Nginx).
*   Backend `Dockerfile` uses `CMD ["npm", "start"]` (not `npm run dev`).
*   Database volume is persistent.

Check `frontend/nginx/nginx.conf` and `frontend/Dockerfile` for how the Nginx proxy to the backend is configured. Ensure the `proxy_pass` in `nginx.conf` points to `http://backend:5000/api/` as `backend` is the service name in `docker-compose.yml`.

## 3. Deployment Steps

### 3.1. Build Docker Images

From the root `data-viz-system` directory on your server:

```bash
docker compose build
```
This will build the `backend` and `frontend` images. The frontend will be built with Nginx serving static files and proxying API requests.

### 3.2. Run Database Migrations and Seed Data

It's recommended to run migrations and seeding separately for production, rather than in the `docker-compose.yml` `command` which is better for dev.

First, start *only* the database service:
```bash
docker compose up -d db
```

Wait for the database to be healthy:
```bash
docker compose logs db # Look for "database system is ready to accept connections"
```
Or use the health check:
```bash
docker compose ps db # Should show 'healthy' status
```

Then, run migrations and seed data using a temporary backend container:
```bash
# Run migrations
docker compose run --rm backend npx sequelize-cli db:migrate
# Run seeders (only if you want initial data in prod, be cautious)
docker compose run --rm backend node src/seeders/seed.js
```
The `--rm` flag ensures the temporary container is removed after execution.

### 3.3. Start the Application

Once migrations and seeding are done, start all services:

```bash
docker compose up -d --remove-orphans
```
*   `-d`: Run in detached mode.
*   `--remove-orphans`: Removes containers for services not defined in the Compose file anymore.

### 3.4. Verify Deployment

*   Check logs:
    ```bash
    docker compose logs -f
    ```
    Look for messages indicating backend and frontend services are running without errors.
*   Check container status:
    ```bash
    docker compose ps
    ```
    All services should be `Up` and `healthy` (for the database).
*   Access the application:
    *   Frontend (React app served by Nginx): Accessible on port `80` (or `3000` if you changed Nginx config) of your server's IP address or domain name.
    *   Backend API: Accessible internally via `http://backend:5000` or externally if you explicitly exposed its port (not recommended in typical production setup when Nginx proxies for it).

## 4. Setting up a Reverse Proxy (Nginx on Host / Traefik / Caddy)

If you are using the frontend Dockerfile that bundles Nginx, it will serve on port 80 inside its container. To expose it to your domain, you'd typically have another Nginx instance directly on your host machine or a dedicated reverse proxy like Traefik or Caddy.

Example for **Nginx on Host**:

1.  Ensure your Dockerized frontend publishes its HTTP port (e.g., `80:80` in `docker-compose.yml`).
2.  Configure Nginx on your host machine to proxy requests from your domain to the Docker container.

**`sudo nano /etc/nginx/sites-available/your-domain.com`**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration (Replace with your actual cert paths)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy to the Dockerized frontend service
    # Assuming the frontend container's Nginx is listening on port 80 and mapped to host port 80
    location / {
        proxy_pass http://localhost:80; # Or the mapped port if different
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```
*   **Generate SSL Certificates:** Use Certbot for Let's Encrypt certificates:
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com -d www.your-domain.com
    ```
*   **Enable Nginx config:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## 5. Continuous Deployment Integration (Using GitHub Actions)

The `cd.yml` in `.github/workflows/` provides a template for automated deployment.

1.  **Configure GitHub Secrets:**
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_PASSWORD`: Your Docker Hub Access Token or password.
    *   `SSH_PRIVATE_KEY`: An SSH private key with access to your production server.
    *   `PROD_SERVER_USER`: Username for SSH login on your production server.
    *   `PROD_SERVER_HOST`: IP address or hostname of your production server.
2.  **Adjust `cd.yml`:**
    *   Update `your_docker_username` in the image tags to your actual Docker Hub username.
    *   Modify the `Deploy to Server` step to match your server's directory structure and deployment strategy. For minimal downtime, consider:
        *   **Blue/Green Deployment:** Deploy new version alongside old, switch traffic.
        *   **Rolling Updates:** Update containers one by one (supported by Kubernetes, not plain Docker Compose).
        *   **Reverse Proxy Reloads:** Update images and then gracefully reload your host Nginx or other proxy.

**Important Note:** The provided `cd.yml` performs a simple `docker compose pull && docker compose up -d` which will cause a brief downtime during deployment. For zero-downtime production deployments, explore more advanced techniques with orchestrators like Kubernetes.

## 6. Maintenance & Monitoring

*   **Logs:** Regularly check container logs for errors: `docker compose logs -f [service_name]`
*   **Resource Usage:** Monitor CPU, memory, and disk usage of your server and containers.
*   **Database Backups:** Implement a robust backup strategy for your PostgreSQL data (e.g., cron jobs running `pg_dump` to an S3 bucket).
*   **Updates:** Keep Node.js, npm, Docker, and system packages updated. Regularly rebuild and redeploy your application to pick up base image security patches.
*   **Security Scans:** Periodically scan your Docker images for vulnerabilities.

---