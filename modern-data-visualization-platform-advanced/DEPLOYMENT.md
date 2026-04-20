# DataViz System Deployment Guide

This guide provides instructions for deploying the DataViz system using Docker and Docker Compose for a production environment. For larger-scale production deployments, consider orchestrators like Kubernetes.

## 1. Prerequisites

*   A server (e.g., AWS EC2, DigitalOcean Droplet, Linode) running a Linux distribution.
*   Docker installed on the server.
*   Docker Compose installed on the server.
*   `git` installed on the server.
*   A domain name (optional, but recommended for production).
*   SSL/TLS certificates (e.g., from Let's Encrypt) for HTTPS (recommended for production).

## 2. Server Setup

1.  **Connect to your server:**
    ```bash
    ssh user@your_server_ip
    ```

2.  **Install Docker and Docker Compose:**
    Follow the official Docker documentation for your specific Linux distribution.
    A common command for Ubuntu might be:
    ```bash
    sudo apt update
    sudo apt install docker.io docker-compose
    sudo systemctl enable docker --now
    sudo usermod -aG docker ${USER} # Add your user to the docker group
    # Log out and log back in for group changes to take effect
    ```

## 3. Deployment Steps

### 3.1. Clone the Repository

On your server, clone the DataViz repository.

```bash
git clone https://github.com/your-username/dataviz.git
cd dataviz
```

### 3.2. Configure Environment Variables

Create a `.env` file in the root directory. This file will contain sensitive information and configuration specific to your production environment.

**Create `.env`:**
```bash
cp .env.example .env
```

**Edit `.env`:**
Open `.env` with a text editor (e.g., `nano .env`) and fill in the values.

```ini
# --- Database Configuration (PostgreSQL) ---
POSTGRES_USER=your_db_user # Change this
POSTGRES_PASSWORD=your_strong_db_password # Change this to a very strong password
POSTGRES_SERVER=db # Service name in docker-compose
POSTGRES_PORT=5432
POSTGRES_DB=dataviz_prod_db # Change this

# --- JWT Authentication ---
# VERY IMPORTANT: Generate a strong, random key.
# Example: python -c "import os; print(os.urandom(32).hex())"
SECRET_KEY=your_very_long_and_random_secret_key_for_jwt_signing # CHANGE THIS!
ACCESS_TOKEN_EXPIRE_MINUTES=1440 # 24 hours

# --- Redis Configuration ---
REDIS_HOST=redis # Service name in docker-compose
REDIS_PORT=6379
REDIS_DB=0

# --- Application Environment ---
ENVIRONMENT=production # Set to 'production' for optimal performance and logging
LOG_LEVEL=INFO # Recommended for production
DEBUG=False # Always False in production
```

### 3.3. Build and Run Docker Containers

Ensure your `docker-compose.yml`, `Dockerfile`, `Dockerfile.frontend`, and `nginx.conf` files are configured correctly for production (e.g., `uvicorn` using Gunicorn workers, Nginx serving frontend). The provided `docker-compose.yml` uses `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` which is suitable for development; for true production, you'd typically use `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000`.

To build the images and start the services:

```bash
docker compose up --build -d
```

*   `--build`: This forces Docker to rebuild the images, ensuring you're using the latest code.
*   `-d`: Runs the containers in detached mode (in the background).

This command will:
1.  Build the backend Docker image using `Dockerfile`.
2.  Build the frontend Docker image using `Dockerfile.frontend`.
3.  Start the `db` (PostgreSQL), `redis`, `backend` (FastAPI), and `frontend` (Nginx) services.
4.  The `backend` service will automatically run `alembic upgrade head` to apply database migrations and then `python scripts/seed_db.py` to create initial users and data.

### 3.4. Verify Deployment

Check the status of your services:

```bash
docker compose ps
```
All services should be `Up`. You can view logs for any service to debug issues, e.g.:
```bash
docker compose logs backend
docker compose logs frontend
```

Access the application:
*   The frontend should be accessible on `http://your_server_ip:3000` (or whichever port you mapped in `docker-compose.yml`).
*   The backend API documentation will be at `http://your_server_ip:8000/api/docs`.

**Important Security Note:** For production, **never expose port 8000 (backend) directly to the internet**. All traffic should go through Nginx (which is already configured to proxy `/api` requests) and ideally behind an HTTPS/SSL certificate.

## 4. HTTPS (SSL/TLS) Configuration (Highly Recommended for Production)

For a production environment, you *must* use HTTPS. This typically involves:

1.  **Obtain SSL Certificates:** Get certificates for your domain (e.g., using Certbot with Let's Encrypt).
2.  **Configure Nginx:** Update the `nginx.conf` to handle HTTPS traffic, redirect HTTP to HTTPS, and specify your certificate paths.

**Example `nginx.conf` snippet for HTTPS (conceptual, replace with your actual paths):**

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    ssl_certificate /etc/nginx/ssl/your_domain.com/fullchain.pem; # Path to your fullchain cert
    ssl_certificate_key /etc/nginx/ssl/your_domain.com/privkey.pem; # Path to your private key
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256';
    ssl_prefer_server_ciphers on;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000; # 'backend' is the service name in docker-compose
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

You would need to mount your SSL certificate files into the Nginx container using a Docker volume.

## 5. Maintenance and Updates

### 5.1. Updating Code

1.  **Pull latest changes:**
    ```bash
    git pull origin main
    ```
2.  **Rebuild and restart services:**
    ```bash
    docker compose up --build -d --force-recreate
    ```
    `--force-recreate` ensures new images are used even if service definitions haven't changed.

### 5.2. Database Migrations

Alembic migrations are automatically applied by the `backend` service on startup (via `alembic upgrade head`). When you update your code and there are new migrations:

1.  Make sure new migrations are generated and committed in your local dev environment (`alembic revision --autogenerate -m "Description"`).
2.  Push these changes to your repository.
3.  On the server, `git pull` the changes.
4.  Run `docker compose up --build -d` to pull the new backend image and apply migrations.

### 5.3. Backup and Restore

*   **Database:** Regularly back up your PostgreSQL data volume (`postgres_data`). You can use `pg_dump` from within the `db` container or set up a dedicated backup solution.
*   **Configuration:** Keep your `.env` file secure and backed up.

### 5.4. Monitoring

*   **Docker Logs:** Use `docker compose logs -f <service_name>` to tail logs.
*   **System Metrics:** Monitor server CPU, memory, disk I/O, and network usage.
*   **FastAPI Health Check:** `http://your_server_ip:8000/health` (or `http://your_domain.com/api/health` if using Nginx proxy).

## 6. Cleanup

To stop and remove all containers, networks, and volumes created by Docker Compose:

```bash
docker compose down --volumes
```
`--volumes` is important to remove the `postgres_data` volume, which contains your database. Use with caution in production.

This guide covers the essential steps for deploying the DataViz system. Always adapt these instructions to your specific production environment and security best practices.