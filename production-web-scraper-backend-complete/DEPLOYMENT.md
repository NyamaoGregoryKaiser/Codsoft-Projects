# Deployment Guide

This guide provides instructions for deploying the Web Scraping Tools System to a production environment using Docker and Docker Compose. While Docker Compose is suitable for smaller deployments or single-server setups, for larger, highly available, and scalable deployments, consider Kubernetes or cloud-native orchestration services (e.g., AWS ECS, Google Cloud Run, Azure Container Apps).

## 1. Prerequisites

*   A Linux server (e.g., Ubuntu, CentOS) with `ssh` access.
*   `git` installed on the server.
*   `Docker` and `Docker Compose` installed on the server.
    *   Follow the official Docker installation guide: [Get Docker](https://docs.docker.com/get-docker/)
    *   Follow the official Docker Compose installation guide: [Install Docker Compose](https://docs.docker.com/compose/install/)
*   A domain name (optional, but recommended for production).
*   SSL/TLS certificate (e.g., Let's Encrypt with Certbot, essential for HTTPS).

## 2. Server Setup

### 2.1. Update and Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw
```

### 2.2. Configure Firewall (UFW)

Allow necessary ports. If using Nginx as a reverse proxy, you'll open port 80 and 443. If accessing services directly (less recommended for prod), open their respective ports.

```bash
sudo ufw allow ssh
sudo ufw allow http  # For Nginx/Caddy (port 80)
sudo ufw allow https # For Nginx/Caddy (port 443)
# If you want to expose Flower or other ports directly (not recommended for production):
# sudo ufw allow 5555/tcp # Celery Flower
sudo ufw enable
sudo ufw status
```

### 2.3. Clone the Repository

Clone your project to the server, ideally into a non-root user's home directory.

```bash
git clone https://github.com/yourusername/web-scraping-system.git
cd web-scraping-system
```

## 3. Environment Configuration

### 3.1. Create `.env` files

Create `backend/.env` and `frontend/.env` files on your server. **Crucially, generate strong, unique secrets for `SECRET_KEY` and ensure all sensitive credentials are not hardcoded.**

#### `backend/.env` (Production Example)

```ini
APP_NAME="WebScrapingSystemProd"
ENVIRONMENT="production"
DEBUG="False" # IMPORTANT: Set to False in production
SECRET_KEY="YOUR_VERY_LONG_AND_RANDOM_PRODUCTION_SECRET_KEY" # Use a tool to generate, e.g., openssl rand -hex 32
ACCESS_TOKEN_EXPIRE_MINUTES="30" # Shorter expiry for production

POSTGRES_USER="prod_user"
POSTGRES_PASSWORD="YOUR_DATABASE_PASSWORD" # Strong, random password
POSTGRES_DB="prod_scraper_db"
POSTGRES_HOST="db" # Name of the DB service in docker-compose
POSTGRES_PORT="5432"
DATABASE_URL="postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}/0"
CELERY_BROKER_URL="redis://${REDIS_HOST}:${REDIS_PORT}/1"
CELERY_RESULT_BACKEND="redis://${REDIS_HOST}:${REDIS_PORT}/2"

# Initial superuser is only for first setup, remove or secure after first run
# For production, consider creating admin users through a secure interface/script.
FIRST_SUPERUSER_EMAIL="admin_prod@yourdomain.com"
FIRST_SUPERUSER_PASSWORD="YOUR_STRONG_ADMIN_PASSWORD"
```

#### `frontend/.env` (Production Example)

```ini
# If using Nginx as a reverse proxy, this will be your domain.
VITE_API_BASE_URL="https://api.yourdomain.com/api/v1"
```

## 4. Reverse Proxy Setup (Recommended: Nginx)

In a production environment, it's highly recommended to place a reverse proxy (like Nginx or Caddy) in front of your FastAPI backend and React frontend. This handles:
*   SSL/TLS termination (HTTPS).
*   Routing requests to the correct Docker service.
*   Serving static files efficiently.
*   Load balancing (if scaling).

### 4.1. Nginx Configuration (Example)

Create an Nginx configuration file for your domain, e.g., `/etc/nginx/sites-available/yourdomain.com`:

```nginx
# /etc/nginx/sites-available/yourdomain.com

upstream backend_app {
    server backend:8000; # Name of backend service in docker-compose
}

upstream frontend_app {
    server frontend:3000; # Name of frontend service in docker-compose
}

server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com; # Add your domain(s)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com; # Your frontend domain

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Path to your SSL cert
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # Path to your SSL key
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # Add other headers as needed
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com; # Your API subdomain

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem; # Path to your SSL cert
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem; # Path to your SSL key
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://backend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # For WebSocket support if using (e.g., for Celery Flower)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    # Optional: Expose Celery Flower through a path
    location /flower/ {
        proxy_pass http://flower:5555; # Name of flower service in docker-compose
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site and test Nginx config:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.2. Obtain SSL Certificates (Certbot)

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com # Add all your domains/subdomains
```
Certbot will automatically configure Nginx for HTTPS. Remember to adjust `ssl_certificate` and `ssl_certificate_key` paths in your Nginx config if they differ.

## 5. Deploy with Docker Compose

### 5.1. Adjust `docker-compose.yml` for Production

For production, you might want to:
*   Remove port bindings from `backend` and `frontend` services if Nginx is handling external exposure.
*   Add restart policies (e.g., `restart: unless-stopped`).
*   Mount persistent volumes for the database and potentially for logs.

Example `docker-compose.prod.yml` (can be used instead of `docker-compose.yml` for production builds):

```yaml
# Use this instead of docker-compose.yml for prod if you remove ports and add Nginx.
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: scraper_db
    env_file:
      - ./backend/.env
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    restart: unless-stopped
    healthcheck:
      test: ["CMD-HEALHTCHECK", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: scraper_redis
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: scraper_backend
    env_file:
      - ./backend/.env
    # No port binding here if Nginx is proxying
    # ports:
    #   - "8000:8000" # Only for direct access, remove if using Nginx
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: /usr/local/bin/gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
    restart: unless-stopped

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: scraper_celery_worker
    env_file:
      - ./backend/.env
    command: celery -A app.core.celery worker --loglevel=info --concurrency=2 # Adjust concurrency based on server resources
    depends_on:
      redis:
        condition: service_started
      backend:
        condition: service_started
    restart: unless-stopped

  flower:
    image: mher/flower:2.0
    container_name: scraper_flower
    env_file:
      - ./backend/.env
    environment:
      CELERY_BROKER_URL: ${CELERY_BROKER_URL}
      CELERY_RESULT_BACKEND: ${CELERY_RESULT_BACKEND}
    # ports:
    #   - "5555:5555" # Only for direct access, remove if proxying via Nginx
    depends_on:
      redis:
        condition: service_started
      celery_worker:
        condition: service_started
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: scraper_frontend
    env_file:
      - ./frontend/.env
    # No port binding here if Nginx is proxying
    # ports:
    #   - "3000:3000" # Only for direct access, remove if using Nginx
    depends_on:
      backend:
        condition: service_started
    restart: unless-stopped

volumes:
  postgres_data:
```

### 5.2. Build and Run

From the project root on your server:

```bash
# Build images and start services in detached mode
# If using a separate prod docker-compose file:
docker-compose -f docker-compose.prod.yml up --build -d
# Otherwise, use the default:
# docker-compose up --build -d
```

### 5.3. Apply Database Migrations and Seed Data

Just like local setup, run migrations and seed the superuser.

```bash
docker-compose exec backend /bin/bash -c "alembic upgrade head && python -c 'from app.crud.user import seed_initial_superuser; seed_initial_superuser()'"
```

### 5.4. Verify Deployment

*   Access your frontend at `https://yourdomain.com`.
*   Access your API documentation at `https://api.yourdomain.com/docs`.
*   Access Celery Flower (if proxied) at `https://api.yourdomain.com/flower`.
*   Check Docker logs: `docker-compose logs -f`

## 6. Maintenance and Updates

### 6.1. Updating Code

1.  Pull the latest changes: `git pull origin main`
2.  Rebuild and restart services: `docker-compose up --build -d`
3.  Run migrations if necessary: `docker-compose exec backend alembic upgrade head`

### 6.2. Backups

Regularly back up your `postgres_data` volume. You can use tools like `pg_dump` from within the `db` container or directly back up the Docker volume.

```bash
# Example pg_dump from host
docker-compose exec db pg_dump -U prod_user prod_scraper_db > backup_$(date +%F).sql
```

### 6.3. Monitoring

*   **Docker Logs**: Use `docker-compose logs -f <service_name>` to view real-time logs. For production, consider a centralized logging solution (e.g., ELK stack, Grafana Loki, cloud logging services).
*   **Celery Flower**: Provides a web UI for monitoring Celery tasks and workers.
*   **Prometheus/Grafana**: For comprehensive metrics on resource usage, API performance, etc.

## 7. Scaling

*   **FastAPI Backend**: Increase `workers` in the Gunicorn command or scale the `backend` service horizontally by adding more replicas in a Kubernetes/ECS environment.
*   **Celery Worker**: Increase `concurrency` in the Celery worker command or scale the `celery_worker` service horizontally.
*   **Database**: For heavy loads, consider PostgreSQL clustering, read replicas, or cloud-managed database services.
*   **Redis**: For high availability, set up Redis Sentinel or Redis Cluster.

---