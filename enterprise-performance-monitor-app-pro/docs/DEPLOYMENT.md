# PerfMon Deployment Guide

This guide outlines the steps to deploy the PerfMon application to a production environment using Docker and a conceptual CI/CD pipeline with GitHub Actions.

## 1. Prerequisites for Production Deployment

*   **Cloud Provider**: An account with a cloud provider (e.g., AWS, Azure, Google Cloud, DigitalOcean, Vultr) or a dedicated server.
*   **Docker & Docker Compose**: Installed on your deployment server(s).
*   **Domain Name**: A registered domain name (e.g., `perfmon.yourdomain.com`).
*   **SSL/TLS Certificate**: Recommended for all production environments (e.g., Let's Encrypt via Certbot or your cloud provider's certificate manager).
*   **Reverse Proxy**: Nginx or Caddy to handle incoming requests, SSL termination, and routing to frontend/backend containers. (Frontend Dockerfile already uses Nginx, but an external one might be needed for full setup).
*   **Database Service**: Managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL) or a self-hosted PostgreSQL instance.
*   **CI/CD System**: GitHub Actions (configured below), GitLab CI/CD, Jenkins, etc.

## 2. Environment Variables

Before deployment, ensure your `.env` file (or equivalent environment configuration) for the production environment is correctly set up.

```dotenv
# .env (production values)
NODE_ENV=production
PORT=5000 # Internal port for backend container

# Database Configuration (Managed Service Recommended)
DB_HOST=your_production_db_host.rds.amazonaws.com # e.g., from AWS RDS
DB_PORT=5432
DB_USER=your_db_username
DB_PASSWORD=your_strong_db_password
DB_NAME=perfmondb

# JWT Secret (VERY IMPORTANT: Generate a strong, random key)
JWT_SECRET=SUPER_LONG_RANDOM_SECRET_FOR_JWT
JWT_EXPIRES_IN=1d

# API Key Secret (VERY IMPORTANT: Generate a strong, random key)
API_KEY_SECRET=SUPER_LONG_RANDOM_SECRET_FOR_API_KEYS

# Caching (adjust as needed)
CACHE_TTL=300

# Rate Limiting (adjust as needed for expected traffic)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200 # Higher for production if needed
PERF_DATA_RATE_LIMIT_MAX_REQUESTS=2000 # Higher for production if needed

# Frontend Environment (Points to your public backend URL)
REACT_APP_API_BASE_URL=https://api.perfmon.yourdomain.com/api # Use your actual backend public URL
```
**Security Note**: Never hardcode secrets. Use environment variables, secret management services (e.g., AWS Secrets Manager, HashiCorp Vault), or your CI/CD's secret management.

## 3. Database Setup

1.  **Provision PostgreSQL**: Set up a managed PostgreSQL instance or install it on a server.
2.  **Create Database and User**: Create the `perfmondb` database and the `perfmonuser` with appropriate permissions.
3.  **Run Migrations**: Connect to your production database from a secure environment (e.g., CI/CD pipeline, bastion host) and run the migrations.

    ```bash
    # From backend directory, with DB environment variables set
    npm install # Ensure TypeORM and pg are installed
    npm run migrate:run
    ```
    This step ensures your production database schema is up-to-date.

## 4. Docker Deployment

The `docker-compose.yml` file is configured for local development but can be adapted for production.

### Adjustments for Production `docker-compose.prod.yml` (Example)

For production, you might:
*   Remove `ports` mappings for `db` (if using a managed DB) or keep internal port 5432.
*   Ensure proper network configuration if services are on different hosts or private networks.
*   Use a proper Nginx configuration for the frontend with SSL and potentially rate limiting.
*   Consider using Kubernetes for orchestration if your scale requires it.

```yaml
# docker-compose.prod.yml (Example - simplified for illustration)
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: perfmon-backend:latest # Tag your images for easier management
    restart: always
    environment:
      # Inject production environment variables from host or secret manager
      DB_HOST: ${DB_HOST}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      API_KEY_SECRET: ${API_KEY_SECRET}
      NODE_ENV: production
      # ... other production environment variables
    volumes:
      - /var/log/perfmon/backend:/app/backend/logs # Persistent logs
    # No direct port exposure if behind a reverse proxy/load balancer
    # ports:
    #   - "5000:5000"
    command: ["node", "dist/server.js"] # Migrations should be run separately

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: perfmon-frontend:latest
    restart: always
    environment:
      REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL}
    # No direct port exposure, Nginx reverse proxy will handle it
    # ports:
    #   - "80:80"

  # Optional: External Nginx Reverse Proxy container (or use host Nginx)
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443" # For HTTPS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf # Your custom Nginx config
      - /etc/letsencrypt:/etc/letsencrypt # For Certbot/SSL certificates
    depends_on:
      - backend
      - frontend

```

### Basic Nginx Configuration (`nginx/nginx.conf`)

If using an Nginx reverse proxy, here's a basic example:

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name perfmon.yourdomain.com api.perfmon.yourdomain.com; # Add your domain names

    location / {
        # Redirect all HTTP to HTTPS in production
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name perfmon.yourdomain.com; # Frontend domain

    ssl_certificate /etc/letsencrypt/live/perfmon.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/perfmon.yourdomain.com/privkey.pem;

    # Frontend (React App)
    location / {
        root /usr/share/nginx/html; # Points to frontend build output
        index index.html index.htm;
        try_files $uri $uri/ /index.html; # Handle client-side routing
    }

    # Backend API proxy
    location /api {
        proxy_pass http://backend:5000; # Use service name 'backend' and its internal port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Optional: Add rate limiting here if Nginx handles it
    }

    # Performance Data Ingestion specific proxy if needed
    location /api/performance/metrics {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M; # Increase if large payload batches are expected
        # Can add specific Nginx rate limiting here too
    }
}
```

## 5. CI/CD Pipeline Configuration (GitHub Actions Example)

This conceptual GitHub Actions workflow demonstrates how to automate building, testing, and deployment.

**`.github/workflows/ci-cd.yml`**
```yaml