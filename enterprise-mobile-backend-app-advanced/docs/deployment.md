# Deployment Guide

This document outlines a basic deployment strategy for the Mobile App Backend System using Docker. This guide focuses on deploying to a single server or a basic cloud VM; for Kubernetes or advanced cloud-native deployments, additional configuration would be required.

## 1. Production Environment Setup

Before deploying, ensure your production environment meets the following requirements:

*   **Server:** A Linux-based server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed.
*   **Domain Name:** A registered domain name pointing to your server's IP address.
*   **SSL/TLS Certificate:** For HTTPS, you will need an SSL/TLS certificate (e.g., from Let's Encrypt using Certbot).
*   **Environment Variables:** Production-ready environment variables. **NEVER use default/development secrets in production.**

## 2. Prepare Environment Variables

Create a `.env` file for your production environment. This file should be securely stored and *not* committed to version control.

```dotenv
# Production Environment Variables (.env)
NODE_ENV=production
PORT=3000

# Database Configuration (replace with your production database credentials)
# Ensure your PostgreSQL instance is robust (e.g., AWS RDS, Azure DB, or a managed service)
DATABASE_URL="postgresql://prod_user:prod_password@your_prod_db_host:5432/prod_db_name?schema=public"

# JWT Authentication - IMPORTANT: Generate a STRONG, UNIQUE secret for production
JWT_SECRET="YOUR_VERY_STRONG_AND_UNIQUE_PRODUCTION_JWT_SECRET_HERE"
JWT_ACCESS_EXPIRATION_MINUTES=15 # Shorter expiration for access tokens is common
JWT_REFRESH_EXPIRATION_DAYS=30 # Longer expiration for refresh tokens

# Redis Cache - Ensure your Redis instance is robust (e.g., AWS ElastiCache, Azure Cache for Redis)
REDIS_URL="redis://your_prod_redis_host:6379"
CACHE_TTL_SECONDS=3600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60 # Example: 60 requests per minute

# Logging
LOG_LEVEL=info # Only info, warn, error in production to reduce verbosity
```

**Security Best Practices for `.env`:**
*   Store it securely on your server.
*   Use secrets management tools (e.g., AWS Secrets Manager, HashiCorp Vault) for more robust solutions.
*   Avoid hardcoding secrets directly into Dockerfiles or deployment scripts.

## 3. Build and Push Docker Images (CI/CD)

Ideally, your CI/CD pipeline (e.g., GitHub Actions, GitLab CI, Jenkins) should handle building and pushing your Docker images to a container registry (e.g., Docker Hub, AWS ECR, Google Container Registry).

1.  **Tagging:** Tag your Docker images with version numbers or commit SHAs for better traceability.
    ```bash
    docker build -t your-registry/mobile-app-backend:v1.0.0 ./backend
    docker push your-registry/mobile-app-backend:v1.0.0
    ```
    (Replace `your-registry` and `v1.0.0` accordingly).

## 4. Deployment to a Server (using Docker Compose)

This approach uses Docker Compose to orchestrate your application, database (if self-hosted), and Redis on a single server. For production, it's generally recommended to use managed services for PostgreSQL and Redis rather than self-hosting them in Docker Compose on the same VM as your app.

1.  **SSH into your production server:**
    ```bash
    ssh user@your-server-ip
    ```

2.  **Create project directory and `.env` file:**
    ```bash
    mkdir ~/mobile-app-backend
    cd ~/mobile-app-backend
    # Securely create your .env file here
    vim .env
    ```

3.  **Create a production `docker-compose.prod.yml`:**
    This file will be similar to `docker-compose.yml` but will use your pre-built image and remove development-specific volumes/commands. It will also use `restart: always` to ensure services recover from failures.

    ```yaml
    # docker-compose.prod.yml
    version: '3.8'

    services:
      backend:
        image: your-registry/mobile-app-backend:v1.0.0 # Use your pre-built image
        restart: always
        env_file:
          - ./.env # Load environment variables from .env file
        ports:
          - "3000:3000" # Expose backend on port 3000
        depends_on:
          # If using managed DB/Redis, these sections would be removed.
          # For self-hosted, ensure they are running or remove healthchecks if external.
          db:
            condition: service_healthy
          redis:
            condition: service_healthy
        # No volumes for source code in production to keep images immutable
        # You may add a volume for logs if you want them persisted outside the container.
        # volumes:
        #   - ./logs:/app/logs
        command: ["node", "dist/server.js"] # The entrypoint.sh handles migrations/seeding at container start

      # Only include db and redis services if you are self-hosting them on the same server.
      # For production, it's highly recommended to use managed cloud services (AWS RDS, AWS ElastiCache, etc.)
      db:
        image: postgres:16-alpine
        restart: always
        environment:
          POSTGRES_DB: ${POSTGRES_DB} # Use values from .env or override here
          POSTGRES_USER: ${POSTGRES_USER}
          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
        volumes:
          - db-data:/var/lib/postgresql/data
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
          interval: 5s
          timeout: 5s
          retries: 5
      
      redis:
        image: redis:7-alpine
        restart: always
        volumes:
          - redis-data:/data
        healthcheck:
          test: ["CMD", "redis-cli", "ping"]
          interval: 5s
          timeout: 5s
          retries: 5

    volumes:
      db-data:
      redis-data:
    ```
    **Important:** If using managed PostgreSQL and Redis services (recommended for production), *do not* include the `db` and `redis` services in `docker-compose.prod.yml`. Configure `DATABASE_URL` and `REDIS_URL` in your `.env` to point to the external service endpoints.

4.  **Run Docker Compose:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```
    The `-d` flag runs the containers in detached mode (in the background).

5.  **Verify deployment:**
    Check the logs to ensure everything started correctly:
    ```bash
    docker-compose -f docker-compose.prod.yml logs -f backend
    ```
    Your application should now be running on port `3000` of your server.

## 5. Reverse Proxy and SSL (HTTPS)

For production, exposing your Node.js application directly is not recommended. Use a reverse proxy like Nginx or Caddy to:
*   Handle SSL/TLS termination (HTTPS).
*   Serve static files.
*   Manage request routing and load balancing (if multiple instances).
*   Add additional security layers.

**Example Nginx Configuration (`/etc/nginx/sites-available/your-domain.com`):**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf; # Recommended SSL settings
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # Diffie-Hellman parameters

    location / {
        proxy_pass http://localhost:3000; # Forward requests to your Node.js app
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: Serve frontend static files if running on same domain
    # location /static/ {
    #     alias /path/to/your/frontend/build/;
    #     try_files $uri $uri/ =404;
    # }

    # Optional: API docs if you want to expose them publicly
    location /api-docs/ {
        proxy_pass http://localhost:3000/api-docs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_log /var/log/nginx/your-domain.com.error.log;
    access_log /var/log/nginx/your-domain.com.access.log;
}
```

**Steps for Nginx and Certbot:**
1.  Install Nginx: `sudo apt update && sudo apt install nginx`
2.  Install Certbot: `sudo apt install certbot python3-certbot-nginx`
3.  Create the Nginx config file (as shown above) and replace placeholders.
4.  Enable the Nginx config: `sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/`
5.  Test Nginx config: `sudo nginx -t`
6.  Restart Nginx: `sudo systemctl restart nginx`
7.  Obtain SSL certificate with Certbot: `sudo certbot --nginx -d your-domain.com -d www.your-domain.com`

## 6. Monitoring and Logging

*   **Logs:** Configure your system to collect and centralize logs from Docker containers. Tools like Fluentd, Logstash, or cloud logging services (AWS CloudWatch, Google Cloud Logging) can pull logs from Docker and send them to a centralized logging platform (e.g., ELK stack, Datadog).
*   **Monitoring:** Use tools like Prometheus + Grafana to monitor server resources (CPU, memory), application metrics (request rates, error rates), and database performance.
*   **Health Checks:** Leverage Docker Compose health checks and integrate them with your monitoring system.

## 7. Rolling Updates (for zero-downtime deployments)

For true production-grade, zero-downtime deployments, you'd move beyond basic Docker Compose to orchestrators like Kubernetes, AWS ECS, or similar services that support rolling updates.
With Docker Compose, you can achieve near-zero downtime by:
1.  Starting new containers with the updated image.
2.  Ensuring new containers are healthy.
3.  Gradually shifting traffic to new containers (e.g., by updating reverse proxy).
4.  Stopping old containers.

This typically involves more advanced scripting or using tools like `docker-compose up --scale` and careful Nginx reloads.
```