```markdown
# ApexContent Deployment Guide

This guide outlines the steps to deploy ApexContent to a production environment using Docker and Docker Compose. It assumes you have a Linux server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed, and potentially a reverse proxy like Nginx or Caddy.

## 1. Prerequisites

*   **Linux Server:** A virtual private server (VPS) or dedicated server.
*   **Docker:** Installed on your server. Follow the official Docker installation guide for your OS.
*   **Docker Compose:** Installed on your server.
*   **Git:** To clone the repository.
*   **Domain Name:** A registered domain name pointing to your server's IP address (e.g., `api.yourdomain.com`).
*   **Reverse Proxy (Recommended):** Nginx or Caddy to handle HTTPS termination, load balancing (if multiple app instances), and static file serving.
*   **Firewall:** Configured to allow incoming traffic on ports 80 (HTTP) and 443 (HTTPS).

## 2. Server Setup

### a) Install Docker and Docker Compose

Follow the official guides:
*   [Install Docker Engine](https://docs.docker.com/engine/install/)
*   [Install Docker Compose](https://docs.docker.com/compose/install/)

### b) Install Git

```bash
sudo apt update
sudo apt install git -y # For Debian/Ubuntu
# For CentOS/RHEL: sudo yum install git -y
```

### c) Install and Configure Nginx/Caddy (Reverse Proxy - **Highly Recommended for HTTPS**)

Choose one:

#### Nginx
```bash
sudo apt install nginx -y # For Debian/Ubuntu
# For CentOS/RHEL: sudo yum install epel-release && sudo yum install nginx -y
```

Configure Nginx (e.g., `/etc/nginx/sites-available/apexcontent.conf`):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com; # Your domain name

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com; # Your domain name

    # Configure SSL certificates (e.g., from Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Basic security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "no-referrer-when-downgrade";

    location / {
        proxy_pass http://localhost:8080; # Or the IP:port of your Docker container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off; # Important for SSE/websockets, generally good
    }

    # Optional: Serve static assets directly from Nginx if you have a separate frontend build
    # location /static/ {
    #     root /var/www/apexcontent/frontend-build/;
    #     try_files $uri $uri/ =404;
    # }
}
```
Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/apexcontent.conf /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```
Obtain SSL certificates (e.g., with Certbot):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

#### Caddy
Caddy automatically handles HTTPS, which simplifies setup.
Follow the [Caddy installation guide](https://caddyserver.com/docs/install).

Configure Caddy (e.g., `/etc/caddy/Caddyfile`):
```caddy
api.yourdomain.com {
    reverse_proxy localhost:8080 # Or the IP:port of your Docker container
    # Optional: Serve static assets directly from Caddy if you have a separate frontend build
    # handle /static/* {
    #     root * /var/www/apexcontent/frontend-build
    #     file_server
    # }
}
```
Restart Caddy:
```bash
sudo systemctl restart caddy
```

## 3. Deployment Steps

### a) Clone the Repository on Your Server

```bash
git clone https://github.com/yourusername/apexcontent.git
cd apexcontent
```

### b) Configure Environment Variables

Create a `.env` file in the project root on your server:

```bash
cp .env.example .env
```
**Edit `.env`:**
*   **`JWT_SECRET`**: Set a strong, unique, and long random string. **DO NOT use the example value.**
*   **Database Credentials**: Use strong, unique passwords for `POSTGRES_PASSWORD`.
*   You might want to change `POSTGRES_HOST` to `localhost` if running Postgres directly on the host, but for Docker Compose, `postgres` is correct.

**Example Production `.env` considerations:**
*   You might want to make the `postgres` container's port NOT exposed publicly (`"5432:5432"` -> `5432`). It should only be accessible by the `app` container.
*   Consider a dedicated PostgreSQL server or managed service for high-availability.

### c) Build and Deploy with Docker Compose

```bash
docker-compose pull # Pull latest base images
docker-compose up --build -d # Build ApexContent image and start containers
```
This command will:
*   Build the `app` Docker image.
*   Pull the `postgres` Docker image.
*   Create and start the `app` and `postgres` containers.
*   Mount persistent volumes for database data, application logs, and uploaded media.
*   Run the database migration and seed scripts (`init_db.sh` will execute within the `postgres` container on first run).

Wait for containers to initialize. Check logs:
```bash
docker-compose logs -f
```
Look for `ApexContent application starting...` in the `app` service logs and `Database migrations and seeding complete.` in `postgres` service logs.

### d) Verify Deployment

1.  **Check Container Status:**
    ```bash
    docker-compose ps
    ```
    Ensure both `app` and `postgres` containers are `Up`.
2.  **Access the API:**
    Make an initial request to your API endpoint (e.g., `https://api.yourdomain.com/api/v1/auth/login`) using `curl` or Postman to confirm it's reachable and responding.

    ```bash
    curl -v https://api.yourdomain.com/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin", "password":"your_admin_password"}'
    ```
    Replace `your_admin_password` with the password you seeded for the 'admin' user.

## 4. Updates and Redeployment

To deploy new code changes:

1.  **Pull latest changes:**
    ```bash
    git pull origin main # Or your deployment branch
    ```
2.  **Rebuild and restart containers:**
    ```bash
    docker-compose down # Stop and remove old containers
    docker-compose up --build -d # Build new image and start
    ```
    *Note: `docker-compose up --build -d` will detect changes in your `Dockerfile` or source code and rebuild only the necessary images. It will restart containers if their images have changed.*
    *If you have new database migrations, they will automatically run when the `postgres` container restarts (due to `init_db.sh`).*

## 5. Maintenance and Monitoring

*   **Logs:** Monitor application logs (`docker-compose logs -f app`) for errors and performance issues. You can also mount a log aggregation tool (e.g., ELK stack, Grafana Loki) volume.
*   **Resource Usage:** Monitor CPU, memory, and disk usage of your server and Docker containers.
*   **Database Backups:** Regularly back up your PostgreSQL data volume (`postgres_data`).
*   **Security Updates:** Keep your server OS, Docker, and C++ dependencies updated.
*   **Firewall:** Ensure only necessary ports are open to the public internet (typically 80/443 for web traffic).

## 6. Rollback Strategy

In case of a critical issue after deployment:

1.  **Revert Code:** Revert your `git` repository to a known good commit.
    ```bash
    git revert <bad_commit_hash>
    # OR for a quick rollback to previous state:
    git reset --hard HEAD~1
    ```
2.  **Redeploy:** Follow the "Updates and Redeployment" steps.
    ```bash
    docker-compose down
    docker-compose up --build -d
    ```
    *Note: Database schema rollbacks are complex. Ensure your migrations are designed to be reversible or plan for manual intervention if a schema change is problematic.*

---
```