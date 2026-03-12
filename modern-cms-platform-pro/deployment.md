# CMS Project Deployment Guide

This guide outlines the steps for deploying the CMS project to a production environment using Docker and Nginx as a reverse proxy. This assumes you have a Linux server (e.g., Ubuntu) with Docker and Docker Compose installed, and a domain name configured.

## Prerequisites

*   A server (VM or dedicated) running Linux (e.g., Ubuntu).
*   Docker and Docker Compose installed on the server.
*   A registered domain name (e.g., `yourcms.com`) pointing to your server's IP address.
*   `git` installed on the server.
*   An SSH client on your local machine.

## 1. Server Setup

### 1.1 SSH into your Server

```bash
ssh username@your_server_ip
```

### 1.2 Update System and Install Docker

```bash
sudo apt update
sudo apt upgrade -y

# Install Docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Add your user to the docker group to run docker commands without sudo
sudo usermod -aG docker ${USER}
# Log out and log back in (or run `newgrp docker`) for changes to take effect
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

## 2. Project Deployment

### 2.1 Clone the Repository

```bash
git clone https://github.com/your-username/your-cms-project.git /opt/cms-project # Clone to a suitable directory
cd /opt/cms-project
```

### 2.2 Configure Environment Variables

Create your production `.env` file in the project root (`/opt/cms-project/.env`). This file will contain sensitive information and production-specific settings.

```bash
touch .env
```

Edit `.env` (using `nano .env` or `vim .env`) with your actual production values:

```
# Django Settings
SECRET_KEY=YOUR_VERY_LONG_AND_RANDOM_PRODUCTION_SECRET_KEY # GENERATE A NEW ONE!
DEBUG=False # MUST BE FALSE IN PRODUCTION
ALLOWED_HOSTS=yourcms.com,www.yourcms.com,your_server_ip # Comma-separated list

# Database (PostgreSQL) - Use strong, unique credentials
DB_NAME=cms_prod_db
DB_USER=cms_prod_user
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
DB_HOST=db # Docker service name
DB_PORT=5432

# Redis Cache
REDIS_URL=redis://redis:6379/1 # Docker service name

# Frontend Settings (API URL should point to your public domain)
REACT_APP_API_BASE_URL=https://yourcms.com/api/v1
REACT_APP_SITE_NAME=Your Production CMS

# Production Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# CORS
# For production, specify your frontend domains. Remove CORS_ALLOW_ALL_ORIGINS if uncommenting this.
CORS_ALLOWED_ORIGINS=https://yourcms.com,https://www.yourcms.com
```

### 2.3 Production Docker Compose Configuration

Modify your `docker-compose.yml` (or create a `docker-compose.prod.yml`) to suit production. This involves:
*   Using Gunicorn for the backend.
*   Having a dedicated Nginx service to handle both frontend static files and proxy requests to the backend.
*   Mounting volumes for static and media files.
*   Configuring port mappings.
*   **Crucially, adding an Nginx service that acts as the entry point.**

**Example `docker-compose.prod.yml`:**
*(You'd typically extend/override `docker-compose.yml` or have a separate prod file)*

```yaml
# docker-compose.prod.yml (if you choose to separate dev/prod configs)
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: cms_prod_db
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: cms_prod_redis
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cms_prod_backend
    env_file:
      - ./.env # This refers to the .env in the root
    environment:
      DJANGO_SETTINGS_MODULE: cms_project.settings.production # Use production settings
    volumes:
      - static_volume:/app/staticfiles # Volume for collected static files
      - media_volume:/app/mediafiles   # Volume for user-uploaded media
    expose:
      - "8000" # Expose to Nginx, not directly to host
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    command: sh -c "python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn cms_project.wsgi:application --bind 0.0.0.0:8000"
    # Ensure entrypoint.sh or command includes `collectstatic` and `migrate`

  frontend_builder: # Separate build stage for frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL}
    container_name: cms_frontend_builder
    command: ["yarn", "build"]
    volumes:
      - frontend_build:/app/build
    restart: "no" # This is a one-off build service

  nginx:
    image: nginx:alpine
    container_name: cms_prod_nginx
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf # Custom Nginx config
      - static_volume:/usr/share/nginx/html/static # Serve Django static files
      - media_volume:/usr/share/nginx/html/media   # Serve Django media files
      - frontend_build:/usr/share/nginx/html # Serve React build output
      # Optional: For SSL certificates (e.g., Let's Encrypt)
      # - ./certbot/conf:/etc/nginx/ssl
      # - ./certbot/www:/var/www/certbot
    ports:
      - "80:80"
      - "443:443" # For HTTPS
    depends_on:
      backend:
        condition: service_started
      frontend_builder: # Ensure frontend is built before Nginx starts
        condition: service_completed_successfully
    restart: unless-stopped

volumes:
  postgres_data:
  static_volume:
  media_volume:
  frontend_build: # Volume to share frontend build output between builder and Nginx

```

#### `nginx/nginx.prod.conf`

```nginx