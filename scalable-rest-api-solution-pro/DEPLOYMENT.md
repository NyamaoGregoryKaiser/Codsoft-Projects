```markdown
# Project Management API Deployment Guide

This guide provides instructions for deploying the C++ Project Management API to a production environment. The recommended approach involves using Docker and Docker Compose for ease of deployment, scaling, and management. For more complex production environments, container orchestration platforms like Kubernetes are recommended.

## 1. Prerequisites

*   **Production Server**: A Linux server (e.g., Ubuntu, CentOS) with SSH access.
*   **Docker & Docker Compose**: Installed on the production server.
*   **Git**: For cloning the repository.
*   **HTTPS/SSL Certificates**: Essential for securing API traffic in production. You'll typically use a reverse proxy/load balancer (e.g., Nginx, Caddy, AWS ALB) for SSL termination.
*   **Environment Variables**: A `.env` file with production-specific values (e.g., strong `JWT_SECRET`, PostgreSQL credentials).
*   **Persistent Storage**: For database data and application logs.

## 2. Prepare the Production Environment

### 2.1. Server Setup

1.  **Update System**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Install Docker & Docker Compose**:
    Follow the official Docker installation guide for your operating system: [Get Docker](https://docs.docker.com/get-docker/).
    Ensure your user is in the `docker` group to run Docker commands without `sudo`:
    ```bash
    sudo usermod -aG docker $USER
    newgrp docker # Apply group changes immediately
    ```
3.  **Create Project Directory**:
    Choose a directory on your server for the project files:
    ```bash
    mkdir -p /opt/project-management-api
    cd /opt/project-management-api
    ```
4.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/project-management-api.git .
    ```
5.  **Set up `.env` file**:
    Create a `.env` file in the project root directory (`/opt/project-management-api/.env`) with your production configurations. **Crucially, use a very strong, long, and unique `JWT_SECRET` for production.**
    ```bash
    # Example .env for production
    SERVER_HOST=0.0.0.0
    SERVER_PORT=9080
    SERVER_THREADS=8 # Adjust based on server CPU cores

    # PostgreSQL Database Configuration (recommended for production)
    POSTGRES_DB=project_management_db
    POSTGRES_USER=your_pg_user
    POSTGRES_PASSWORD=your_strong_pg_password
    DB_PATH="postgresql://your_pg_user:your_strong_pg_password@db:5432/project_management_db"

    JWT_SECRET=YOUR_SUPER_STRONG_AND_UNIQUE_SECRET_FOR_PRODUCTION_ONLY
    JWT_ISSUER=your-domain.com
    JWT_EXPIRY_MINUTES=120

    RATE_LIMIT_MAX_REQUESTS=200
    RATE_LIMIT_TIME_WINDOW_SECONDS=60

    LOG_CONFIG_PATH=config/log_config.json
    ```
    Make sure the `.env` file is secure (e.g., `chmod 600 .env`).

### 2.2. Persistent Storage

The `docker-compose.yml` uses Docker volumes to ensure database data and application logs persist even if containers are removed or rebuilt.

*   **Database Volume**: `pgdata` named volume is defined in `docker-compose.yml`. Docker will manage this.
*   **Application Logs**: A bind mount `./logs:/app/logs` is used, meaning logs will be stored in `/opt/project-management-api/logs` on your host. Ensure this directory exists and has correct permissions.
*   **Database Files (for SQLite if used for production)**: If you were using SQLite in production (not recommended for multi-instance deployments), the `./database:/app/database` bind mount would store `project_management.db` on your host.

## 3. Deploying the Application

1.  **Build and Run with Docker Compose**:
    Navigate to your project directory on the server:
    ```bash
    cd /opt/project-management-api
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    ```
    *   `--build`: Forces Docker to rebuild the images from the Dockerfiles, ensuring you have the latest code. Omit this for faster restarts if code hasn't changed.
    *   `-d`: Runs containers in detached mode (in the background).
    *   `docker-compose.prod.yml`: (Optional, but highly recommended) Create a `docker-compose.prod.yml` to override development settings (e.g., using PostgreSQL image directly instead of `Dockerfile.db`, more robust logging, resource limits). See "Production Docker Compose Overrides" below.

2.  **Verify Deployment**:
    Check the status of your running containers:
    ```bash
    docker-compose ps
    ```
    View application logs for any errors:
    ```bash
    docker-compose logs -f api
    ```
    You should see the API server starting up and connecting to the database.

## 4. Database Initialization and Migrations (PostgreSQL)

When using PostgreSQL with `docker-compose.yml`, the `Dockerfile.db` uses the official `postgres` image. Initial schema creation and migrations can be handled in a few ways:

1.  **`docker-entrypoint-initdb.d`**: The PostgreSQL image automatically runs `.sql` scripts placed in `/docker-entrypoint-initdb.d/` on first run. You could copy your `database/migrations/*.sql` and `database/seed/*.sql` there. This approach is good for initial setup but less ideal for dynamic migrations after the first deploy.

2.  **External Migration Tool**: For robust production deployments, use a dedicated database migration tool like [Flyway](https://flywaydb.org/) or [Liquibase](https://www.liquibase.org/). You'd run these tools as part of your CI/CD pipeline or manually against the deployed database.

3.  **Manual `psql`**: Connect to the database container and run scripts manually.
    ```bash
    docker exec -it pm_db psql -U your_pg_user -d project_management_db
    # Inside psql:
    -- \i /path/to/migrations/001_create_users_table.sql
    -- ... and so on
    ```
    For the current system, if `DB_PATH` in `api` container points to PostgreSQL, `init_db.sh` would need to be adapted to use `psql` CLI instead of `sqlite3`. For simplicity, the `docker-compose.yml` initially uses SQLite. To switch to PostgreSQL for the API container, uncomment the PostgreSQL `DB_PATH` in `docker-compose.yml` and ensure your C++ SOCI build includes PostgreSQL support (`libsoci-postgresql-dev`).

## 5. Reverse Proxy / Load Balancer (Recommended)

In a production environment, you should place a reverse proxy (like Nginx or Caddy) in front of your API. This provides:

*   **SSL/TLS Termination**: Encrypts traffic between clients and your server.
*   **Load Balancing**: Distributes requests across multiple API instances (for scaling).
*   **Domain Routing**: Maps your domain (e.g., `api.your-domain.com`) to the API.
*   **Rate Limiting / WAF**: Additional security and traffic control.
*   **Static File Serving**: If your frontend is served from the same domain.

**Example Nginx Configuration (`/etc/nginx/sites-available/your-api.conf`)**:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem; # Your SSL cert
    ssl_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;       # Your SSL key

    location / {
        proxy_pass http://localhost:9080; # Or your Docker API service IP/port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off; # Important for long-polling/streaming
    }

    # Optional: Basic rate limiting at Nginx level
    # limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    # location /api/ {
    #     limit_req zone=api_limit burst=20 nodelay;
    #     proxy_pass http://localhost:9080;
    #     # ... other proxy headers
    # }
}
```
Remember to activate the Nginx config (`sudo ln -s /etc/nginx/sites-available/your-api.conf /etc/nginx/sites-enabled/`) and restart Nginx (`sudo systemctl restart nginx`).

## 6. Monitoring & Logging

*   **Application Logs**: The API container mounts `./logs:/app/logs`. You can view raw log files in `/opt/project-management-api/logs` on your host. For production, integrate with a centralized logging solution (e.g., ELK Stack, Grafana Loki, Datadog).
*   **Container Monitoring**: Use `docker stats` for basic resource usage. For advanced monitoring, integrate with Prometheus/Grafana or cloud-provider monitoring tools.
*   **Health Checks**: The `docker-compose.yml` includes a basic `healthcheck` for the database. Implement more sophisticated health checks for the API (e.g., a `/health` endpoint) and integrate them with your load balancer or orchestration platform.

## 7. Scaling

*   **API Service**: With `docker-compose` (Docker Swarm mode enabled):
    ```bash
    docker-compose up --scale api=3 -d
    ```
    This will run 3 instances of your `api` service. A load balancer (like Nginx or a cloud ALB) is then needed to distribute traffic among these instances.
*   **Database**: Scaling relational databases (like PostgreSQL) typically involves read replicas, sharding, or moving to a managed database service (e.g., AWS RDS, Google Cloud SQL).

## 8. CI/CD Integration

The provided `.github/workflows/ci-cd.yml` demonstrates a basic GitHub Actions pipeline:
1.  **Build and Test**: Runs unit, integration, and basic API tests.
2.  **Deployment (Commented out)**: Includes a conceptual step to build and push Docker images to a registry, then deploy to a server. For real-world deployment:
    *   Configure GitHub Secrets for Docker Hub/Registry credentials and SSH keys for your deployment server.
    *   Implement deployment scripts (e.g., SSH into server, `git pull`, `docker-compose pull`, `docker-compose up -d`).

## 9. Rollbacks

If a new deployment introduces issues, you can roll back to a previous working version.
*   **Docker Images**: Tag your Docker images with version numbers (e.g., `v1.0.0`, `v1.0.1`). If a new deployment fails, redeploy the previous stable image tag.
*   **Database Migrations**: Ensure your migration strategy supports rollbacks (e.g., `down` migration scripts in Flyway).
```