# Deployment Guide: Enterprise-Grade CMS

This document outlines the steps and considerations for deploying the CMS to a production environment. The recommended deployment strategy leverages Docker and Docker Compose for ease of management and scalability. For a production environment, it is highly recommended to use a robust orchestration platform like Kubernetes (K8s) or a managed container service (e.g., AWS ECS, Google Cloud Run) with a reverse proxy like Nginx or Caddy.

## 1. Prerequisites for Production Server

*   **Operating System:** Linux (e.g., Ubuntu, CentOS)
*   **Docker:** Installed and running.
*   **Docker Compose:** Installed.
*   **Git:** To clone the repository.
*   **SSH Access:** To connect to your server.
*   **Domain Name:** Configured with DNS records pointing to your server's IP address.
*   **SSL/TLS Certificate:** (e.g., Let's Encrypt with Certbot) for HTTPS.
*   **Environment Variables:** Securely managed.

## 2. Environment Variables

In a production environment, sensitive information must not be hardcoded or checked into source control. Utilize environment variables.
Create a `.env` file in the root of your project on the server with all necessary variables.

Example `.env` content:

```ini
# Production .env for docker-compose

NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com # Must match your actual domain

# Database
DB_HOST=db # Internal Docker service name
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_strong_db_password
DB_DATABASE=your_cms_database

# JWT - GENERATE STRONG, UNIQUE SECRETS
JWT_SECRET=super_secret_jwt_key_for_production_CHANGE_ME_IMMEDIATELY
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=another_super_secret_refresh_key_CHANGE_ME_IMMEDIATELY
JWT_REFRESH_EXPIRES_IN=7d

# Redis Cache
REDIS_HOST=redis # Internal Docker service name
REDIS_PORT=6379
REDIS_TTL_SECONDS=3600 # Cache for 1 hour

# Logging
LOG_LEVEL=info # Or warn, error
LOG_DIR=/app/logs # Logs will be stored in a Docker volume

# Frontend build-time variable
REACT_APP_API_BASE_URL=https://yourdomain.com/api # Frontend talks to its own domain/proxy
```

**Important:**
*   Replace placeholder values with strong, unique secrets.
*   `FRONTEND_URL` and `REACT_APP_API_BASE_URL` must reflect your actual production domain.
*   Ensure your database and Redis hosts are correctly configured for internal Docker communication (e.g., `db`, `redis` as defined in `docker-compose.yml`).

## 3. Deployment Steps (Docker Compose)

This guide assumes you are deploying to a single server using Docker Compose.

### 3.1. Server Setup

1.  **SSH into your server:**
    ```bash
    ssh user@your_server_ip
    ```
2.  **Create a deployment directory:**
    ```bash
    sudo mkdir -p /opt/cms-project
    sudo chown -R user:user /opt/cms-project # Adjust user:user to your SSH user
    cd /opt/cms-project
    ```
3.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cms-project.git .
    ```
    (Or copy the project files to `/opt/cms-project`)
4.  **Create `.env` file:** Place your production `.env` file in the root of the project (`/opt/cms-project/.env`).
5.  **Configure Nginx (Host):**
    For a production environment, you'll likely want to run an Nginx instance directly on your host machine to handle SSL termination, multiple domains, and proxy requests to your Docker containers.

    **Example Host Nginx Configuration (`/etc/nginx/sites-available/yourdomain.com`):**

    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Path to your SSL cert
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # Path to your SSL key

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
        add_header Referrer-Policy "no-referrer-when-downgrade";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";

        # Frontend SPA
        location / {
            proxy_pass http://localhost:3000; # Points to the frontend container exposed on host port 3000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # Backend API
        location /api/ {
            proxy_pass http://localhost:5000/api/; # Points to the backend container exposed on host port 5000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # Handle static files directly if needed (e.g., for media uploads)
        # location /uploads/ {
        #     alias /path/to/your/upload/volume/;
        # }

        error_log /var/log/nginx/yourdomain.com-error.log;
        access_log /var/log/nginx/yourdomain.com-access.log;
    }
    ```
    *   **Install Certbot:** Use Certbot to get free SSL certificates for your domain: `sudo apt install certbot python3-certbot-nginx` then `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`.
    *   **Enable Nginx config:** `sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/`
    *   **Test Nginx config:** `sudo nginx -t`
    *   **Restart Nginx:** `sudo systemctl restart nginx`

### 3.2. Deploy Application

1.  **Build and Run Docker Containers:**
    From `/opt/cms-project` on your server:
    ```bash
    docker compose pull            # Pull latest images if pre-built on Docker Hub
    docker compose build           # Build images locally if not using Docker Hub or for changes
    docker compose up -d           # Start all services in detached mode
    ```
    *   If you're pushing images to Docker Hub (as shown in the CI/CD example), you'd typically run `docker compose pull` first, then `docker compose up -d`. If you have local changes or aren't using a registry, `docker compose build` is needed.

2.  **Run Database Migrations:**
    ```bash
    docker compose exec backend npm run migration:run
    ```

3.  **Seed Database (Optional, for first-time deployment):**
    ```bash
    docker compose exec backend npm run seed:run
    ```

4.  **Verify Services:**
    ```bash
    docker compose ps
    docker compose logs -f # Follow logs for all services to check for errors
    ```

## 4. Considerations for Production

*   **Managed Database/Redis:** For high availability and easier management, consider using managed services for PostgreSQL (e.g., AWS RDS, Azure Database for PostgreSQL) and Redis (e.g., AWS ElastiCache). If so, update `docker-compose.yml` to remove these services and point your `backend/.env` `DB_HOST` and `REDIS_HOST` to the external endpoints.
*   **Persistent Volumes:** Ensure your database data (`db_data`) and Redis data (`redis_data`) volumes are properly managed and backed up. For file uploads (media), a separate persistent volume or an object storage solution (AWS S3, Google Cloud Storage) should be used.
*   **Secrets Management:** Do not store sensitive environment variables directly in `.env` files on production servers. Use dedicated secret management services (e.g., AWS Secrets Manager, HashiCorp Vault) or your orchestration platform's secret management capabilities.
*   **Monitoring & Alerting:** Integrate with monitoring tools (Prometheus, Grafana) for metrics, and an error tracking system (Sentry, Bugsnag) for alerts.
*   **Health Checks:** Configure health checks in your orchestration platform to automatically restart unhealthy containers.
*   **Backup Strategy:** Implement a regular backup strategy for your database and any user-uploaded files.
*   **Security Updates:** Keep your OS, Docker, Node.js, and application dependencies updated.
*   **Firewall:** Restrict incoming traffic to only necessary ports (80, 443 for web; 22 for SSH).
*   **CI/CD Pipeline:** Leverage the provided GitHub Actions example to automate testing, building Docker images, and deploying to your production environment. This ensures consistent and reliable deployments.

## 5. Rollback Strategy

In case of a failed deployment or critical bug, have a rollback plan:

1.  **Docker Compose:** If using `docker compose up`, you can roll back to a previous image tag if your `docker-compose.yml` references specific tags.
2.  **Database:** Ensure you have database backups before running migrations in production. If a migration fails or introduces issues, you need to be able to restore to a previous state.
3.  **Version Control:** Always tag stable releases in Git.

By following these guidelines, you can establish a robust and reliable deployment process for your enterprise-grade CMS.
```

---

### **Frontend Implementation (React with TypeScript)**

#### **F.1 Frontend - `frontend/package.json`**

*(Already provided above in `4.5 Frontend - backend/package.json`)*

#### **F.2 Frontend - `frontend/tsconfig.json`**

```json