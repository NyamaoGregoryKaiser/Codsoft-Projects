```markdown
# CppDBOptimizer - Product Catalog Management System Deployment Guide

This document provides instructions for deploying the CppDBOptimizer application to a production environment. The recommended deployment strategy leverages Docker and Docker Compose for ease of management and portability.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
  - [1. Server Setup](#1-server-setup)
  - [2. Clone Repository](#2-clone-repository)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Database Initialization](#4-database-initialization)
  - [5. Deploy with Docker Compose](#5-deploy-with-docker-compose)
  - [6. Configure DNS and Reverse Proxy (Optional, Recommended)](#6-configure-dns-and-reverse-proxy-optional-recommended)
  - [7. Monitoring and Logging](#7-monitoring-and-logging)
- [Updating the Application](#updating-the-application)
- [Backup and Restore](#backup-and-restore)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

*   **A cloud server or VM**: (e.g., AWS EC2, Google Cloud Compute Engine, DigitalOcean Droplet) running a compatible Linux distribution (e.g., Ubuntu, Debian, CentOS).
*   **SSH Access**: To your server with `sudo` privileges.
*   **Docker & Docker Compose**: Installed on your server.
    *   [Install Docker](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)
*   **Git**: Installed on your server.
*   **A domain name (optional but recommended)**: For public access and SSL/TLS.
*   **(Optional) An external PostgreSQL database**: For high availability and managed service benefits (e.g., AWS RDS, Google Cloud SQL).

## Deployment Steps

### 1. Server Setup

Connect to your server via SSH and perform initial updates:

```bash
ssh user@your_server_ip
sudo apt update && sudo apt upgrade -y
```

Install Docker, Docker Compose, and Git if not already present.

### 2. Clone Repository

Clone the application repository to your server:

```bash
git clone https://github.com/your-username/cpp-db-optimizer.git
cd cpp-db-optimizer
```

### 3. Configure Environment Variables

Create a production `.env` file for the backend. **Do not use `backend/.env.example` directly in production.**

```bash
cp backend/.env.example backend/.env.production
# Edit backend/.env.production with your actual production values
nano backend/.env.production
```

**Key variables to review/change:**

*   `SERVER_HOST`: Usually `0.0.0.0` to listen on all interfaces within the Docker container.
*   `SERVER_PORT`: `9080` (internal container port).
*   `DB_HOST`: If using the `db` service in `docker-compose.yml`, this will be `db`. If using an external managed PostgreSQL service, set this to its public IP or hostname.
*   `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Set strong, unique passwords for production.
*   `JWT_SECRET`: **CRITICAL**: Generate a very long, strong, random key. Never use the default from `.env.example`.
*   `LOG_LEVEL`: `info` or `warn` for production, `debug` for troubleshooting.
*   `RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`: Adjust according to your traffic expectations.

Modify `docker-compose.yml` to use `backend/.env.production`:

```yaml
# In docker-compose.yml, change:
# From:
#     env_file:
#       - ./backend/.env.example
# To:
#     env_file:
#       - ./backend/.env.production
```

### 4. Database Initialization

**If using the `db` service from `docker-compose.yml` (for simplicity):**
The `docker-compose up` command will automatically initialize the database schema (`database/schema.sql`) and seed data (`database/seed.sql`) on the *first* startup.

**If using an external managed PostgreSQL (recommended for production):**
1.  Connect to your external PostgreSQL instance using `psql` or a client tool.
2.  Create the database and user:
    ```sql
    CREATE DATABASE cppdboptimizer_db;
    CREATE USER my_production_user WITH PASSWORD 'your_strong_password';
    GRANT ALL PRIVILEGES ON DATABASE cppdboptimizer_db TO my_production_user;
    ```
3.  Apply the schema and migrations:
    ```bash
    # From your server
    psql -U my_production_user -d cppdboptimizer_db -h your_external_db_host -f database/schema.sql
    psql -U my_production_user -d cppdboptimizer_db -h your_external_db_host -f database/migrations/002_add_indexes.sql
    psql -U my_production_user -d cppdboptimizer_db -h your_external_db_host -f database/seed.sql # Optional: for initial data
    ```
4.  **Important**: In `docker-compose.yml`, comment out the `db` service or remove it if you're using an external database. Ensure the `backend` service is configured to connect to your external DB.

### 5. Deploy with Docker Compose

From the root directory of your project on the server:

```bash
docker-compose build # Build images (or pull if using a registry)
docker-compose up -d # Start services in detached mode
```

Verify that all containers are running:
```bash
docker-compose ps
```
Check logs for any errors:
```bash
docker-compose logs -f
```

The application should now be accessible:
-   Frontend (Nginx): `http://your_server_ip` (on port 80)
-   Backend API: `http://your_server_ip:9080/api/v1/` (if port 9080 is exposed and Nginx is not proxying)

### 6. Configure DNS and Reverse Proxy (Optional, Recommended)

For production, you'll want to expose your application via a domain name and secure it with SSL/TLS.

1.  **DNS Configuration**: Point your domain's A record (e.g., `app.yourdomain.com`) to your server's IP address.

2.  **HTTPS with Certbot/Nginx**:
    -   Install Certbot on your host machine: `sudo snap install --classic certbot && sudo ln -s /snap/bin/certbot /usr/bin/certbot`
    -   Stop existing Nginx if running: `sudo systemctl stop nginx` (or `docker-compose stop frontend` if Nginx is in Docker)
    -   Obtain a certificate:
        ```bash
        sudo certbot certonly --nginx -d app.yourdomain.com
        # Follow prompts. If Nginx is in Docker, you might need to use `--standalone`
        # or temporarily expose 80/443 directly on the host.
        ```
    -   Modify `nginx.conf` (or create a new one) to listen on 443, use your SSL certificates, and force HTTPS.
        ```nginx
        server {
            listen 80;
            listen [::]:80;
            server_name app.yourdomain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl http2;
            listen [::]:443 ssl http2;
            server_name app.yourdomain.com;

            ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_ciphers "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256";
            ssl_prefer_server_ciphers on;

            root /usr/share/nginx/html;
            index index.html;

            location / {
                try_files $uri $uri/ =404;
            }

            location /api/v1/ {
                proxy_pass http://backend:9080/api/v1/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_buffering off;
                proxy_request_buffering off;
            }
        }
        ```
    -   Restart your `frontend` Nginx service with the updated configuration and mapped SSL certs:
        ```bash
        # Make sure to bind your /etc/letsencrypt volume to the Nginx container
        # in docker-compose.yml, e.g.:
        # frontend:
        #   volumes:
        #     - ./frontend:/usr/share/nginx/html
        #     - ./nginx.conf:/etc/nginx/conf.d/default.conf
        #     - /etc/letsencrypt:/etc/letsencrypt:ro
        docker-compose restart frontend
        ```

### 7. Monitoring and Logging

*   **Docker Logs**: Use `docker-compose logs -f <service_name>` to view real-time logs for individual services.
*   **Backend Logging**: The C++ backend uses `spdlog`, which can be configured to write to files (`LOG_FILE_PATH` in `.env.production`). These logs can then be collected by a log aggregation system (e.g., ELK stack, Grafana Loki, CloudWatch Logs).
*   **System Monitoring**: Monitor server resources (CPU, RAM, disk I/O, network) using tools like `htop`, `netdata`, or cloud provider monitoring dashboards.
*   **Database Monitoring**: Use PostgreSQL's built-in tools (`pg_stat_activity`, `pg_stat_statements`) or dedicated monitoring solutions to track query performance, active connections, and resource utilization.

## Updating the Application

To deploy a new version of your application:

1.  **Pull latest changes**:
    ```bash
    git pull origin main # Or your deployment branch
    ```
2.  **Rebuild and redeploy**:
    ```bash
    docker-compose down # Stop and remove old containers
    docker-compose build --no-cache # Build new images from scratch
    docker-compose up -d # Start new containers
    ```
    If you're using a Docker registry, you would instead `docker-compose pull` after `docker-compose down`.

3.  **Run migrations (if any)**: If you have new database migrations, you'll need to apply them. This typically involves a separate migration service or manual `psql` execution:
    ```bash
    # Example for applying a new migration
    psql -U my_production_user -d cppdboptimizer_db -h your_external_db_host -f database/migrations/003_new_feature.sql
    ```

## Backup and Restore

*   **Database**: Regularly back up your PostgreSQL database using `pg_dump`. For managed services, rely on their automated backup features.
*   **Configuration**: Back up your `.env.production` file.
*   **Volumes**: If you're using Docker volumes (like `db_data`), ensure these are also backed up.

## Scaling

*   **Backend**: For horizontal scaling, run multiple instances of the `backend` service behind a load balancer. Docker Swarm or Kubernetes are ideal for this.
*   **Database**: PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding, though the latter is more complex). For critical applications, consider a managed PostgreSQL service.
*   **Frontend**: Nginx is highly efficient. Scaling the frontend typically involves deploying multiple Nginx instances behind a load balancer and using a CDN for static assets.

## Troubleshooting

*   **Check Docker logs**: `docker-compose logs -f` is your first stop.
*   **Container status**: `docker-compose ps` to see if containers are running.
*   **Network issues**: Ensure firewalls (server firewall, cloud security groups) allow traffic on ports 80, 443, and 9080 (if directly exposed).
*   **Database connectivity**: Double-check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env.production`. Try connecting to the database directly from the backend container:
    ```bash
    docker-compose exec backend psql -h db -U user -d cppdboptimizer_db
    ```
    (Adjust `db`, `user`, `cppdboptimizer_db` as per your setup).
*   **Application errors**: Increase `LOG_LEVEL` to `debug` or `trace` in `.env.production` to get more detailed insights from the backend logs.
```