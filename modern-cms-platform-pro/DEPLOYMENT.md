# CMS-CPP Deployment Guide

This guide outlines the steps to deploy the CMS-CPP application to a production environment. It assumes a basic understanding of Docker, Docker Compose, and Linux server administration. For a highly available and scalable setup, consider Kubernetes or cloud-specific container services.

## 1. Prerequisites

*   **Production Server:** A Linux server (e.g., Ubuntu, CentOS) with at least 2 vCPUs and 4GB RAM (adjust based on expected load).
*   **Docker & Docker Compose:** Installed and configured on the server.
*   **Nginx (Recommended):** For reverse proxying, SSL termination, and static file serving.
*   **Domain Name:** A registered domain name pointing to your server's IP address.
*   **SSL Certificate:** (e.g., Let's Encrypt) for HTTPS.
*   **Firewall:** Configured to allow incoming traffic on ports 80 (HTTP) and 443 (HTTPS).

## 2. Environment Preparation

### 2.1. SSH into your server

```bash
ssh user@your_server_ip
```

### 2.2. Install Docker and Docker Compose

Follow the official Docker documentation for installation:
*   [Install Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
*   [Install Docker Compose](https://docs.docker.com/compose/install/)

Ensure your user is in the `docker` group to run Docker commands without `sudo`:
```bash
sudo usermod -aG docker ${USER}
newgrp docker # Apply group changes
```

### 2.3. Clone the Repository

```bash
git clone https://github.com/your-username/cms-cpp.git
cd cms-cpp
```

## 3. Configuration for Production

### 3.1. `src/config.json`

Review and update `src/config.json` for production settings. **Crucially, ensure your JWT secret is strong and unique.** Consider using environment variables or Docker secrets for sensitive information.

```json
{
    "app": {
        "port": 8080, // Internal port, Nginx will proxy to this
        "document_root": "./static",
        "log_path": "/var/log/cms-cpp", // Use a persistent volume for logs
        "log_file": "cms.log",
        "server_header": "CMS-CPP-Production/1.0",
        "idle_timeout": 60,
        "keepalive_requests": 0
    },
    "db": {
        "client_type": "postgresql",
        "host": "postgres",
        "port": 5432,
        "user": "cms_prod_user",      // Change for production
        "password": "cms_prod_password", // Change for production
        "database": "cms_prod_db",    // Change for production
        "auto_reconnect": true,
        "connections_number": 20      // Adjust based on load
    },
    "jwt": {
        "secret": "YOUR_VERY_LONG_AND_COMPLEX_PRODUCTION_JWT_SECRET_HERE_CHANGE_ME",
        "expires_in_seconds": 3600,
        "refresh_token_expires_in_seconds": 604800
    },
    "rate_limit": {
        "max_requests": 500,  // Adjust for production traffic
        "window_seconds": 60
    },
    "cache": {
        "enabled": true,
        "default_ttl_seconds": 300
    }
}
```
**Important:**
*   For a true production setup, the `config.json` might only contain defaults, and sensitive values (DB credentials, JWT secret) should be passed via Docker environment variables or Docker secrets.
*   You might remove `volumes: - ./src/config.json:/app/config.json` from `docker-compose.yml` if you bake the config into the image for security, or use a dedicated config management solution.

### 3.2. `docker-compose.yml`

Update `docker-compose.yml` for production.

*   **Database Credentials:** Change `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` to strong, unique production values.
*   **Persistent Volumes:** Ensure `pgdata` volume is correctly configured for data persistence. Consider using named volumes for logs and potentially uploaded media.
*   **Networks:** Use custom networks for better isolation if running multiple services.
*   **Healthchecks:** Ensure healthchecks are configured.
*   **Build Context:** For production, it's generally recommended to push pre-built Docker images to a registry rather than building on the server. If building on server, ensure `build` context is accurate.

```yaml
# ... (existing docker-compose.yml content)
services:
  app:
    # ...
    # For production, consider using a pre-built image from a registry
    # image: your-registry/cms-cpp:latest
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    volumes:
      # Remove or modify these for production.
      # config.json should ideally be baked in or mounted securely.
      # static assets might be served directly by Nginx.
      # - ./src/config.json:/app/config.json
      # - ./static:/app/static
      - cms-cpp-logs:/var/log/cms-cpp # Persistent volume for logs
    environment:
      # Pass sensitive environment variables here or use a .env file/Docker secrets
      JWT_SECRET: "YOUR_VERY_LONG_AND_COMPLEX_PRODUCTION_JWT_SECRET_HERE_CHANGE_ME"
      DROGON_DB_USER: "cms_prod_user"
      DROGON_DB_PASSWORD: "cms_prod_password"
      DROGON_DB_DATABASE: "cms_prod_db"
      # ... other environment variables
    # ...
  postgres:
    # ...
    environment:
      POSTGRES_USER: cms_prod_user
      POSTGRES_PASSWORD: cms_prod_password
      POSTGRES_DB: cms_prod_db
      PGDATA: /var/lib/postgresql/data/pgdata
      TZ: "UTC"
    # ...
volumes:
  pgdata:
  cms-cpp-logs: # New volume for application logs
# ...
```

## 4. Deploying the Application

### 4.1. Build and Run Containers

```bash
docker-compose up --build -d
```
*   `--build`: Builds the Docker images (if not using pre-built images).
*   `-d`: Runs containers in detached mode.

Verify containers are running:
```bash
docker-compose ps
```

Check logs for any errors:
```bash
docker-compose logs app
docker-compose logs postgres
```

### 4.2. Configure Nginx (Recommended)

Nginx will act as a reverse proxy, handle static files, and terminate SSL.

#### 4.2.1. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 4.2.2. Create Nginx Configuration

Create a new Nginx configuration file for your domain (e.g., `/etc/nginx/sites-available/yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (replace with your actual certificate paths)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
    ssl_prefer_server_ciphers on;
    # A+ score on SSL Labs
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "no-referrer-when-downgrade";

    # Proxy buffer sizes
    proxy_buffer_size   128k;
    proxy_buffers   4 256k;
    proxy_busy_buffers_size   256k;

    # Root for static files served by Nginx directly (if not served by Drogon)
    # This assumes Nginx serves your static/ directory. Copy 'static/' to e.g. /var/www/yourdomain.com/static
    # location / {
    #     root /var/www/yourdomain.com;
    #     index index.html;
    # }

    # Serve static assets directly from the Drogon app's static directory
    # Drogon handles serving files from its `document_root` config
    location / {
        proxy_pass http://localhost:8080; # Or the Docker Compose service name if Nginx is also in Docker
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # API requests (optional, you can combine / and /api/v1 if / is proxied to app)
    # location /api/v1/ {
    #     proxy_pass http://localhost:8080/api/v1/;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    #     proxy_connect_timeout 600;
    #     proxy_send_timeout 600;
    #     proxy_read_timeout 600;
    #     send_timeout 600;
    # }

    error_log /var/log/nginx/yourdomain.com.error.log;
    access_log /var/log/nginx/yourdomain.com.access.log;
}
```
**Notes:**
*   Replace `yourdomain.com` with your actual domain.
*   The `ssl_certificate` and `ssl_certificate_key` paths will depend on how you obtain your SSL certificates (e.g., Certbot/Let's Encrypt).
*   If Nginx is running inside a Docker container, `proxy_pass` should use the Docker Compose service name (e.g., `http://app:8080`). If Nginx is on the host, `http://localhost:8080` is correct.
*   It's simpler to let Drogon serve static assets from its configured `document_root` and just proxy all requests from Nginx to Drogon. If you have many static assets and want Nginx to handle them directly, uncomment the `root` and `location /` block and copy `static/` content to that `root`.

#### 4.2.3. Enable the Nginx configuration

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t # Test Nginx configuration for syntax errors
sudo systemctl restart nginx
```

### 4.3. Set up SSL with Certbot (Let's Encrypt)

If you use Certbot, it can automatically configure Nginx for SSL.

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the prompts. This will automatically set up HTTPS and redirect HTTP traffic.

## 5. Monitoring and Logging

*   **Drogon Logs:** Drogon logs to the console by default, and to a file (`cms.log` in `/var/log/cms-cpp` if configured with a volume). Monitor these logs for application errors.
*   **Docker Logs:** Use `docker-compose logs -f app` to follow application logs.
*   **Nginx Logs:** Check Nginx access and error logs (`/var/log/nginx/yourdomain.com.access.log`, `/var/log/nginx/yourdomain.com.error.log`).
*   **System Monitoring:** Use tools like `htop`, `top`, ` glances` to monitor server resources (CPU, RAM, disk I/O).
*   **Distributed Logging (Future):** For larger deployments, integrate with a logging aggregation system like ELK stack (Elasticsearch, Logstash, Kibana) or Splunk.
*   **Metrics & Alerting (Future):** Use Prometheus and Grafana for collecting metrics and setting up alerts.

## 6. Maintenance and Updates

*   **Database Backups:** Regularly back up your PostgreSQL data volume (`pgdata`).
*   **Application Updates:** To update the C++ application:
    1.  Pull the latest code: `git pull origin main`
    2.  Stop current services: `docker-compose down`
    3.  Rebuild and restart: `docker-compose up --build -d`
*   **OS/Docker Updates:** Keep your server's operating system and Docker environment updated for security and performance.

## 7. Rollback Strategy

In case of a failed deployment, ensure you have a rollback plan. This typically involves:
1.  Stopping the new version of containers: `docker-compose down`
2.  Deploying the previous stable version of the Docker images. This might require tagging your Docker images with version numbers (e.g., `cms-cpp:v1.0`) and referencing them in `docker-compose.yml`.

This comprehensive guide should provide a solid foundation for deploying your C++ CMS application to a production environment. Remember to always prioritize security and regularly review your configurations.