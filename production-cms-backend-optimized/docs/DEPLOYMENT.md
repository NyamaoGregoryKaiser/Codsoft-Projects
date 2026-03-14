```markdown
# Deployment Guide

This document provides a general guide for deploying the Enterprise-Grade CMS to a production environment. The recommended approach leverages Docker and Docker Compose for container orchestration, but conceptual steps for other environments are also mentioned.

## 1. Prerequisites

Before deployment, ensure you have:

*   **A cloud provider account:** (e.g., AWS, Google Cloud, Azure, DigitalOcean, Vultr)
*   **A Linux server/VM:** (e.g., Ubuntu, CentOS) with at least 2 CPU cores and 4GB RAM (more for high traffic).
*   **Docker and Docker Compose:** Installed on your server.
*   **Git:** Installed on your server.
*   **Domain Name:** A registered domain name pointing to your server's IP address.
*   **SSL/TLS Certificates:** For HTTPS (e.g., Let's Encrypt with Certbot).
*   **Environment Variables:** Production-ready `.env` files for both `backend` and `frontend`. **Crucially, ensure `JWT_SECRET` is strong and unique, and database credentials are secure.**
*   **Dedicated Database Instance:** For robust production, consider using a managed PostgreSQL service (AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL) instead of running PostgreSQL in Docker on the same server.
*   **Dedicated Redis Instance:** Similarly, a managed Redis service (AWS ElastiCache, GCP Memorystore) is recommended.
*   **Cloud Storage for Media:** For media uploads, integrate with a cloud storage service like AWS S3, Google Cloud Storage, or Azure Blob Storage, rather than storing directly on the server's disk (which is not scalable or fault-tolerant). This will require modifying the `media.controller.js` and `media.service.js` to use the cloud provider's SDK.

## 2. Server Setup (Example: Ubuntu)

1.  **SSH into your server:**
    ```bash
    ssh your_user@your_server_ip
    ```
2.  **Update system packages:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
3.  **Install Docker:**
    Follow the official Docker installation guide for your OS: [Get Docker](https://docs.docker.com/get-docker/)
    Typically:
    ```bash
    sudo apt install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io -y
    sudo usermod -aG docker $USER # Add your user to the docker group
    newgrp docker # Apply group changes immediately
    ```
4.  **Install Docker Compose:**
    ```bash
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.10.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    ```
5.  **Install Nginx (if not using Nginx in Docker Compose):**
    If you're using the `nginx` service in `docker-compose.yml`, you don't need to install Nginx separately on the host. However, you might want it for Certbot/SSL termination or if you decide to serve frontend statically.
    ```bash
    sudo apt install nginx -y
    sudo ufw allow 'Nginx Full' # If using UFW firewall
    ```
6.  **Install Certbot (for SSL):**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

## 3. Deployment Steps

### A. Clone the Repository

```bash
git clone https://github.com/your-username/your-cms.git
cd your-cms
```

### B. Configure Environment Variables

Create `.env` file in the root directory (where `docker-compose.yml` is) and populate it with production-ready values. **DO NOT commit this file to Git.**

```dotenv
# Production Configuration (.env in root)
NODE_ENV=production
PORT=5000 # Internal port for backend service

# Frontend URL that backend will allow CORS requests from
CLIENT_URL=https://your-cms-domain.com

# Database Configuration (for managed DB service)
# Replace with your actual managed database credentials and endpoint
DB_HOST=your-managed-db-endpoint.com
DB_PORT=5432
DB_USER=prod_db_user
DB_PASSWORD=your_strong_prod_db_password
DB_NAME=prod_cms_db
DB_SSL=true # Typically true for managed DBs, ensure your client can connect securely

# JWT Configuration
JWT_SECRET=YOUR_VERY_LONG_AND_RANDOM_SECRET_KEY_FOR_PRODUCTION
JWT_EXPIRATION=7d # Shorter expiration might require refresh token logic
                  # Longer expiration (e.g., 7d, 30d) for convenience if no refresh token

# Redis Configuration (for managed Redis service)
REDIS_URL=rediss://your-managed-redis-endpoint.com:6379 # Use 'rediss' for SSL
CACHE_DURATION_SECONDS=3600

# Logging (e.g., send to external log management system if configured)
LOG_LEVEL=info

# Frontend specific variables (if needed for build, but typically handled by Nginx proxy for API_BASE_URL)
# REACT_APP_API_BASE_URL=https://your-cms-domain.com/api
```

### C. Configure Nginx for Production

Modify `nginx/default.conf` to reflect your domain name and HTTPS configuration.
**(If you are using the `nginx` service in docker-compose)**

```nginx
server {
    listen 80;
    server_name your-cms-domain.com www.your-cms-domain.com; # Add your domain(s)
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-cms-domain.com www.your-cms-domain.com; # Add your domain(s)

    ssl_certificate /etc/nginx/ssl/live/your-cms-domain.com/fullchain.pem; # Managed by Certbot
    ssl_certificate_key /etc/nginx/ssl/live/your-cms-domain.com/privkey.pem; # Managed by Certbot
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
    ssl_prefer_server_ciphers on;

    root /usr/share/nginx/html; # Points to the frontend build directory
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000; # Forward API requests to the backend service
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 500 502 503 504 /500.html;
    location = /500.html {
        root /usr/share/nginx/html;
    }
}
```

### D. Build and Deploy Docker Images

```bash
docker-compose build
```
This builds your `backend` and `frontend` Docker images.

### E. Database Migrations and Seeding (Production)

**Important:** In a production environment, you should carefully manage database migrations. Running `npm run db:migrate && npm run db:seed` on every `docker-compose up` might not be ideal, especially for `db:seed`. It's often better to run migrations as a separate step or via a CI/CD pipeline, and seed only once for initial data or via specific scripts.

If this is the *first deployment* and you are using the database service in Docker Compose (not a managed DB):
```bash
docker-compose up -d db redis # Start DB and Redis
# Wait for DB to be healthy (check logs or use `docker-compose exec db pg_isready -U cms_user`)
docker-compose run --rm backend npm run db:migrate # Run migrations
docker-compose run --rm backend npm run db:seed    # Seed initial data (run only once for initial setup)
```
If you're using a managed DB, you might connect directly to it from your local machine to run migrations and seeds before deployment or use a dedicated migration job in CI/CD.

### F. Start the Application

```bash
docker-compose up -d backend frontend nginx # Start all application services
```

### G. Set up HTTPS (Certbot)

If you're running Nginx on the host (not as a Docker service) or if the Dockerized Nginx requires host-level Certbot integration:

1.  Stop Nginx (if running on host): `sudo systemctl stop nginx`
2.  Obtain SSL certificate (replace with your domain):
    ```bash
    sudo certbot --nginx -d your-cms-domain.com -d www.your-cms-domain.com
    ```
    Follow the prompts. Certbot will automatically configure Nginx.
3.  Restart Nginx: `sudo systemctl start nginx`

If using Dockerized Nginx, you'll need to use a Docker-friendly Certbot approach, such as running Certbot in a temporary container or using a proxy like Traefik/Caddy that handles SSL automatically. For simplicity, the `docker-compose.yml` assumes certs are already in `/etc/nginx/ssl` (e.g., mounted via a volume from host for Certbot-generated certs, or copied manually).

## 4. Post-Deployment Checks

*   Access your CMS at `https://your-cms-domain.com`.
*   Check backend API health: `curl https://your-cms-domain.com/api/health`
*   Monitor Docker logs: `docker-compose logs -f`
*   Verify your `.env` variables are correctly loaded within the containers.

## 5. Updates and Maintenance

*   **Code Updates:**
    1.  `git pull origin main` (on your server)
    2.  `docker-compose build`
    3.  `docker-compose up -d --no-deps --force-recreate backend frontend nginx` (Recreate specific services)
    4.  Run any new database migrations: `docker-compose run --rm backend npm run db:migrate`
*   **Database Backups:** Regularly back up your PostgreSQL database. Use your managed DB provider's backup features or set up automated cron jobs for a self-hosted DB.
*   **Security Patches:** Keep your server OS, Docker, Node.js, and npm packages updated.
*   **Monitoring:** Implement robust monitoring for server resources, application health, and logs.

## 6. Cloud Storage for Media (Crucial for Production)

The current setup saves media files locally within the `backend/public/uploads` directory. For production, this is **not scalable or resilient**. Implement cloud storage:

1.  **Choose a service:** AWS S3, Google Cloud Storage, Azure Blob Storage.
2.  **Install SDK:** Add the relevant cloud SDK to `backend/package.json` (e.g., `@aws-sdk/client-s3`).
3.  **Modify `media.controller.js` & `media.service.js`:**
    *   Change `multer` configuration to use an appropriate storage engine (e.g., `multer-s3`, `multer-google-cloud-storage`).
    *   Update file upload logic to send files to the cloud storage.
    *   Update file retrieval logic to return URLs from the cloud storage.
    *   Ensure appropriate IAM roles/service accounts are configured for your backend service to access the cloud storage.
4.  **Update `Media` model:** Store the full public URL from the cloud storage.

This comprehensive guide should provide a strong foundation for deploying your CMS project. Remember to adapt it to your specific cloud provider and infrastructure choices.
```