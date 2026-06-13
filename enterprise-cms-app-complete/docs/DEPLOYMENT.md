# CMS Project Deployment Guide

This guide provides instructions for deploying the CMS project to a production environment. The recommended approach leverages Docker for containerization, which simplifies deployment to various cloud providers.

## 1. Production Environment Setup

Before deployment, ensure you have the following in your production environment:

*   **Server:** A Linux-based server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed.
*   **Database:** A managed PostgreSQL service (recommended, e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) or a self-hosted PostgreSQL instance.
*   **Caching:** A managed Redis service (recommended, e.g., AWS ElastiCache, Azure Cache for Redis, Google Cloud Memorystore) or a self-hosted Redis instance.
*   **Domain Name:** A registered domain name pointing to your server's IP address.
*   **SSL Certificate:** An SSL certificate (e.g., Let's Encrypt) for HTTPS to secure communication.
*   **Firewall:** Configured to allow traffic on ports 80 (HTTP) and 443 (HTTPS).

## 2. Environment Variables

Create a `.env` file on your production server (e.g., at `/path/to/cms-project/.env`) with production-ready values. **Do not commit this file to version control.**

```
NODE_ENV=production
PORT=5000 # Backend port

# Database Connection (use your managed service credentials)
DB_HOST=your_production_db_host.com
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cms_production_db

# JWT Secret (VERY IMPORTANT: Use a long, random, and secure key)
JWT_SECRET=super_long_random_secure_jwt_secret_for_production_env
JWT_EXPIRES_IN=1d

# Redis Cache (use your managed service credentials)
REDIS_HOST=your_production_redis_host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# File Uploads (adjust as needed)
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880 # 5MB

# Rate Limiting (adjust as needed for expected traffic)
RATE_LIMIT_WINDOW_MS=60000 # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
```

## 3. Docker Compose for Production

The `docker-compose.yml` provided in the root directory is primarily for development. For production, you'll want to:

*   **Build production Docker images.**
*   **Use an Nginx reverse proxy** to serve the frontend static files and proxy API requests to the backend, also handling SSL termination.
*   **Remove development-specific volumes** (like code mounting for live reload).
*   **Use `npm start`** in backend, not `npm run dev`.

Here's a conceptual `docker-compose.prod.yml` that you might use:

```yaml
# Conceptual docker-compose.prod.yml (NOT PROVIDED AS FILE, for illustrative purposes)
version: '3.8'

services:
  db: # If you're using a managed DB, this service would be removed.
    image: postgres:13-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data # Persist data
    # No ports exposed externally for security if used internally
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis: # If you're using a managed Redis, this service would be removed.
    image: redis:6-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data # Persist data
    # No ports exposed externally for security if used internally
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile # Production Dockerfile for backend
    restart: always
    environment: # Pass production env vars
      NODE_ENV: production
      PORT: 5000
      DB_HOST: ${DB_HOST} # Use host/IP of your actual DB
      DB_PORT: ${DB_PORT}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      REDIS_HOST: ${REDIS_HOST} # Use host/IP of your actual Redis
      REDIS_PORT: ${REDIS_PORT}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      UPLOAD_PATH: uploads/
      MAX_FILE_SIZE: ${MAX_FILE_SIZE}
      RATE_LIMIT_WINDOW_MS: ${RATE_LIMIT_WINDOW_MS}
      RATE_LIMIT_MAX_REQUESTS: ${RATE_LIMIT_MAX_REQUESTS}
    volumes:
      - ./backend/uploads:/app/uploads # Persist uploaded files
      - ./backend/logs:/app/logs     # Persist logs
    depends_on:
      db: # Only if self-hosting DB
        condition: service_healthy
      redis: # Only if self-hosting Redis
        condition: service_healthy
    command: npm start # Production start command

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile # Production Dockerfile for frontend
    restart: always
    # Nginx in the frontend container handles serving static files
    # and potentially proxies to backend
    # If Nginx is separate, this would just be the build stage then copy to Nginx
    # No direct ports exposed, Nginx reverse proxy will handle it.

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443" # For HTTPS
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf # Production Nginx config
      - ./certbot/conf:/etc/letsencrypt # For SSL certs
      - ./certbot/www:/var/www/certbot # For SSL certs
      - ./frontend/build:/usr/share/nginx/html # Mount React build output (alternative to multi-stage Docker build)
    depends_on:
      - backend
      - frontend # This implies frontend is also a service that built its static files
    restart: always

volumes:
  postgres_data: # Only if self-hosting DB
  redis_data:    # Only if self-hosting Redis
  # No anonymous volumes for production code, as code is baked into image
```

### 4. Build and Deploy Docker Images

1.  **Transfer Code:** Copy your entire `cms-project` directory to your production server.
2.  **Navigate to Project Root:** `cd /path/to/cms-project`
3.  **Place `.env` file:** Ensure your production `.env` file is in the root directory.
4.  **Build Images:**
    ```bash
    docker-compose -f docker-compose.prod.yml build
    ```
5.  **Run Containers:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```
    *Note: Replace `docker-compose.prod.yml` with your actual production compose file name.*

### 5. Database Migrations and Seeding (Production)

After containers are up, run migrations to set up the production database schema. **Do NOT `force: true` sync in production.**

```bash
docker-compose exec backend npm run migrate
# Only seed if it's the very first deployment and you need initial data
# docker-compose exec backend npm run seed
```

### 6. Nginx Configuration (for `nginx` service in compose)

The `frontend/nginx/nginx.conf` is a basic example. For production, you'd need a more robust configuration:

*   **SSL/TLS:** Redirect HTTP to HTTPS, configure SSL certificates (e.g., using Certbot).
*   **Caching:** Nginx can cache static assets.
*   **Gzip Compression:** Compress responses to speed up delivery.
*   **Logging:** Configure Nginx access and error logs.
*   **Reverse Proxy:** Correctly proxy `/api` requests to the backend service.

Example `nginx.prod.conf`:
```nginx
# frontend/nginx/nginx.prod.conf
server {
    listen 80;
    server_name your_domain.com www.your_domain.com; # Replace with your domain

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com; # Replace with your domain

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem; # Path to your cert
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem; # Path to your key
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:!DES:!3DES:!MD5:!RC4:!RC2';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /usr/share/nginx/html; # Path where frontend build is copied
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html; # For React routing
    }

    location /api/ {
        proxy_pass http://backend:5000/api/; # 'backend' is the service name from docker-compose
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://backend:5000/uploads/; # Serve media files from backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # For Certbot verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
```

## 7. Continuous Integration / Continuous Deployment (CI/CD)

The `.github/workflows/ci-cd.yml` file provides a basic example of a GitHub Actions pipeline.

```yaml