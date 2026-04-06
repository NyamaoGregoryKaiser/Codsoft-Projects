# CMS System Deployment Guide

This document outlines the steps to deploy the CMS System to a production environment. The recommended deployment strategy involves Docker containers orchestrated by Docker Compose for smaller deployments or Kubernetes for larger, more scalable ones.

## 1. Prerequisites

*   **Server Environment:** A Linux-based server (e.g., Ubuntu, CentOS)
*   **Docker & Docker Compose:** Installed and configured.
*   **Git:** To clone the repository.
*   **Network Configuration:** Ensure firewall rules allow inbound traffic on required ports (e.g., 80, 443 for web, 5432 for PostgreSQL if exposed externally - though not recommended).
*   **Reverse Proxy:** Nginx or Apache for SSL termination, request routing, and potentially further load balancing.
*   **Database:** A PostgreSQL instance. While Docker Compose sets up one, for production, a managed cloud database (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) is highly recommended for reliability, backups, and scaling.

## 2. Production Environment Setup

### 2.1. SSH into Your Server

```bash
ssh user@your_server_ip
```

### 2.2. Clone the Repository

Choose a deployment directory on your server (e.g., `/opt/cms-system`).

```bash
sudo mkdir -p /opt/cms-system
sudo chown -R user:user /opt/cms-system # Grant ownership to your deploy user
cd /opt/cms-system
git clone https://github.com/your-username/cms-system.git .
```

### 2.3. Configure Environment Variables

Create a `.env` file in the root of your deployment directory (`/opt/cms-system/.env`).
**IMPORTANT:** These values must be strong and unique for production.

```env
# Database Configuration (for external managed DB, replace localhost with DB endpoint)
DB_HOST=your_production_db_host # e.g., an AWS RDS endpoint
DB_PORT=5432
DB_NAME=your_production_db_name
DB_USERNAME=your_production_db_user
DB_PASSWORD=your_production_db_password

# JWT Secret Key (MUST be strong and securely generated, e.g., openssl rand -base64 32)
JWT_SECRET_KEY=a_very_long_and_complex_secret_key_for_jwt_signing

# Spring Profile for Production
SPRING_PROFILES_ACTIVE=prod

# Other potential variables (e.g., email service credentials, monitoring keys)
# ...
```

### 2.4. Build Docker Image

Use the provided `Dockerfile` to build the application image.
```bash
docker build -t cms-system:latest .
```
For CI/CD, this step is usually done by the pipeline and the image pushed to a Docker registry.

### 2.5. Run with Docker Compose (Single-Server Deployment)

If using a managed PostgreSQL instance, modify `docker-compose.yml` to remove the `db` service and point the `app` service to your external database using the `DB_HOST`, `DB_PORT`, etc., defined in your `.env`.

**Example `docker-compose.yml` for external DB:**

```yaml
version: '3.8'

services:
  app:
    image: cms-system:latest # Or pull from your Docker registry: your-registry/cms-system:latest
    container_name: cms-app
    restart: unless-stopped
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}
    ports:
      - "8080:8080" # Map container port 8080 to host port 8080
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
```

After modifying `docker-compose.yml` (if needed) and having your `.env` file ready:

```bash
docker-compose up -d
```
This will start your application. Verify it's running:
```bash
docker-compose ps
```

### 2.6. Configure a Reverse Proxy (Nginx Example)

It's crucial to put a reverse proxy like Nginx in front of your application for:
*   **SSL/TLS Termination:** Secure communication with HTTPS.
*   **Port Forwarding:** Route traffic from standard ports (80/443) to your application's port (8080).
*   **Load Balancing:** If you have multiple application instances.
*   **Caching/Compression:** Further performance optimizations.

1.  **Install Nginx:**
    ```bash
    sudo apt update
    sudo apt install nginx
    ```
2.  **Create an Nginx configuration file** (e.g., `/etc/nginx/sites-available/cms.conf`):
    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name your_domain.com www.your_domain.com; # Replace with your domain

        # Redirect all HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name your_domain.com www.your_domain.com; # Replace with your domain

        # SSL certificates (get these from Let's Encrypt or your CA)
        ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

        # Standard SSL configurations (e.g., from certbot or Mozilla SSL Config Generator)
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            proxy_pass http://localhost:8080; # Or your Docker internal IP if not on localhost network
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 600;
            proxy_send_timeout 600;
            proxy_read_timeout 600;
            send_timeout 600;
        }

        # Optional: Proxy for Actuator endpoints if you want to expose them publicly (USE WITH CAUTION!)
        # location /actuator {
        #     proxy_pass http://localhost:8080;
        #     # Add authentication here or restrict by IP for security
        #     allow 192.168.1.0/24; # Allow only specific IPs
        #     deny all;
        # }
    }
    ```
3.  **Enable the configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/cms.conf /etc/nginx/sites-enabled/
    sudo nginx -t # Test Nginx configuration
    sudo systemctl restart nginx
    ```
4.  **Obtain SSL Certificates (e.g., with Certbot/Let's Encrypt):**
    ```bash
    sudo snap install --classic certbot
    sudo certbot --nginx -d your_domain.com -d www.your_domain.com
    ```

## 3. CI/CD Deployment (GitHub Actions)

The `ci-cd.yml` in `.github/workflows/` provides a template for automated deployment using GitHub Actions.

**Key steps:**

1.  **Build & Test:** On `push` or `pull_request` to `main`, the application is built, unit/integration tests run, and a JaCoCo coverage report is generated.
2.  **Docker Build & Push:** If tests pass on `main` branch pushes, a Docker image is built and pushed to Docker Hub (or your private registry). Requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets.
3.  **Remote Deployment:** After successful image push, the `deploy` job uses SSH to connect to your server, pull the latest image, stop existing containers, and start new ones using `docker-compose`. This requires `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY` secrets.

**To set up CI/CD:**

1.  Configure the required GitHub Secrets in your repository settings (`Settings -> Secrets and variables -> Actions`).
2.  Adjust `ci-cd.yml` to match your server's deployment path (`/path/to/your/cms-deployment`).
3.  Ensure your server has Docker and Docker Compose installed.

## 4. Monitoring

*   **Spring Boot Actuator:** Provides endpoints like `/actuator/health`, `/actuator/info`, `/actuator/metrics` for application health and metrics. Secure these endpoints in production.
*   **External Monitoring:** Integrate with Prometheus for metrics collection and Grafana for dashboard visualization.
*   **Logging:** Centralize logs using tools like ELK stack (Elasticsearch, Logstash, Kibana) or Splunk.

## 5. Backups

*   **Database:** Regularly backup your PostgreSQL database (especially if using a self-hosted instance). Managed database services usually handle this automatically.
*   **Application Code & Configuration:** Ensure your Git repository is regularly backed up.

## 6. Updates & Maintenance

To update the application:

1.  Push new code to the `main` branch.
2.  The CI/CD pipeline will automatically build, test, and deploy the new version.
3.  If deploying manually, repeat steps from "Build Docker Image" and "Run with Docker Compose".

This guide provides a robust foundation for deploying the CMS System. Always tailor the specifics to your organization's security policies, infrastructure, and operational practices.