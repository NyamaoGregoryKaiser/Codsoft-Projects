# CMS Project: Deployment Guide

This guide outlines the steps and considerations for deploying the CMS Project to a production environment using Docker and Nginx. The provided `docker-compose.yml` serves as a blueprint, but for true production, more robust orchestration (like Kubernetes or cloud-managed services) and infrastructure setup will be necessary.

## 1. Production Environment Setup

### 1.1. Server Requirements

*   **Operating System**: Linux (e.g., Ubuntu, CentOS)
*   **Docker & Docker Compose**: Installed and running.
*   **Git**: For cloning the repository.
*   **SSH Access**: For secure remote access to your server.
*   **Sufficient Resources**: CPU, RAM, and Disk space for your application, database, and cache.

### 1.2. Domain and DNS Configuration

*   Acquire a domain name (e.g., `yourcms.com`).
*   Configure DNS records (A/AAAA records) to point your domain to your server's public IP address.

### 1.3. SSL/TLS Certificates

*   **Crucial for Production**: All traffic (especially API) should be encrypted with HTTPS.
*   Use Certbot with Nginx to easily obtain and renew Let's Encrypt SSL certificates.

## 2. Prepare for Production Deployment

### 2.1. Update `.env` Files

**`backend/.env`**:
*   `DEBUG=False`: **Crucial for security and performance.**
*   `SECRET_KEY`: Generate a **new, very strong, and truly secret key**.
*   `DATABASE_URL`: Point to your production PostgreSQL instance (if not running in Docker Compose).
*   `REDIS_URL`: Point to your production Redis instance.
*   `ALLOWED_HOSTS`: List your production domain(s) (e.g., `yourcms.com`, `api.yourcms.com`).
*   `CORS_ALLOWED_ORIGINS`: List your frontend domain(s) (e.g., `https://yourcms.com`).
*   `MEDIA_ROOT`, `STATIC_ROOT`: Ensure these paths are configured to persistent Docker volumes.
*   `LOG_LEVEL`: Set to `INFO` or `WARNING` for production.

**`frontend/.env`**:
*   `REACT_APP_API_BASE_URL`: Should point to your production backend API endpoint (e.g., `https://api.yourcms.com/`). In the Nginx config, we're proxying `/api` so it might be `/api`.

### 2.2. Production `docker-compose.yml` Adjustments

The provided `docker-compose.yml` is suitable for development. For production:

*   **Backend Command**: Change `command` for `backend` service from `python manage.py runserver ...` to `gunicorn cms_project.wsgi:application --bind 0.0.0.0:8000`. Gunicorn is a production-ready WSGI server.
*   **Frontend Nginx Configuration**:
    *   Modify `frontend/nginx.conf` to use your actual domain `server_name yourcms.com;`.
    *   Add SSL configuration to `nginx.conf` (paths to certificate files).
*   **Volumes**: Ensure all critical data (PostgreSQL, Redis, Media, Static files) are mapped to persistent Docker volumes or external storage.
*   **Resource Limits**: Add `deploy: resources: limits:` to services for resource management.
*   **Restart Policy**: Add `restart: always` to services for automatic recovery.
*   **Healthchecks**: Ensure healthchecks are configured to ensure services start in the correct order.
*   **Networking**: Consider custom Docker networks for more controlled service communication.
*   **Monitoring**: Integrate monitoring agents if not using host-level monitoring.

**Example `backend/Dockerfile` production CMD:**
```dockerfile
# ... previous steps ...
# Run collectstatic for static files
RUN python manage.py collectstatic --noinput

# Define the command to run your app with Gunicorn
CMD ["gunicorn", "cms_project.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**Example `frontend/nginx.conf` (simplified for prod):**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourcms.com www.yourcms.com; # Your actual domain

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourcms.com www.yourcms.com;

    ssl_certificate /etc/letsencrypt/live/yourcms.com/fullchain.pem; # Path to your certificate
    ssl_certificate_key /etc/letsencrypt/live/yourcms.com/privkey.pem; # Path to your private key

    root /usr/share/nginx/html; # Frontend build files
    index index.html;

    location / {
        try_files $uri $uri/ /index.html; # Handle client-side routing
    }

    # Proxy API requests to the backend Django application
    location /api {
        proxy_pass http://backend:8000; # 'backend' is the service name in docker-compose
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve media files directly from the backend
    location /media {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Optional: Cache static files (JavaScript, CSS, images) on the browser for longer periods
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### 2.3. Build Production Images (for CI/CD or manual deployment)

If you're pushing images to a registry:
```bash
docker-compose build
docker tag cms_project_backend yourdockerhub/cms-backend:latest
docker tag cms_project_frontend yourdockerhub/cms-frontend:latest
docker push yourdockerhub/cms-backend:latest
docker push yourdockerhub/cms-frontend:latest
```

## 3. Deployment Steps

### 3.1. Manual Deployment (SSH to server)

1.  **Clone on Server**:
    ```bash
    git clone https://github.com/your-username/cms-project.git
    cd cms-project
    ```
2.  **Place `.env` files**: Copy your production `.env` files into `backend/.env` and `frontend/.env` on the server. **Do not commit these to Git.**
3.  **Run Docker Compose**:
    ```bash
    docker-compose -f docker-compose.yml up --build -d
    ```
    *   The `--build` flag will rebuild images if local changes exist. For CI/CD, you might use `docker-compose pull` if images are pre-built and pushed to a registry.
    *   `-d` runs containers in detached mode.
4.  **Initial Database Setup**:
    ```bash
    docker-compose exec backend python manage.py makemigrations # If new apps/models
    docker-compose exec backend python manage.py migrate
    docker-compose exec backend python manage.py collectstatic --noinput # Important for production
    # docker-compose exec backend python scripts/seed_data.py # Only if you need seed data in production
    ```
5.  **SSL Configuration (Nginx & Certbot)**:
    *   Install Certbot on your host machine.
    *   Stop Nginx container temporarily: `docker-compose stop frontend`.
    *   Run Certbot to obtain certificates for your domain (e.g., `sudo certbot certonly --nginx -d yourcms.com -d www.yourcms.com`). This will update your host Nginx config or save certs to `/etc/letsencrypt`.
    *   Update `frontend/nginx.conf` to point to these new certificate paths.
    *   Restart Nginx container: `docker-compose up -d frontend`.
    *   Set up automatic renewal for Certbot.

### 3.2. CI/CD Deployment (Automated)

As configured in `.github/workflows/main.yml`, the deployment job would typically involve:

1.  **Build and Push Docker Images**: GitHub Actions builds and pushes the backend and frontend Docker images to a container registry (e.g., Docker Hub, AWS ECR).
2.  **SSH to Server & Deploy**: The workflow then connects to your production server via SSH.
3.  **Pull Latest Images**: On the server, it pulls the newly pushed Docker images.
4.  **Orchestrate Deployment**: Uses `docker-compose` to stop old containers, start new ones with the updated images, perform migrations, and collect static files.

    ```bash
    # Example script for deployment via SSH
    cd /path/to/your/app-root
    git pull origin main # Ensure docker-compose.yml and Dockerfiles are latest
    docker-compose pull   # Pull latest images from registry
    docker-compose up -d --build # Recreate containers with new images
    docker-compose exec backend python manage.py migrate --noinput
    docker-compose exec backend python manage.py collectstatic --noinput
    docker image prune -f # Clean up old images
    ```

## 4. Post-Deployment Checks

*   **Access Frontend**: Verify your CMS is accessible at `https://yourcms.com`.
*   **API Access**: Confirm API endpoints are working and secured (e.g., `https://api.yourcms.com/api/v1/posts/`).
*   **Admin Panel**: Log into Django Admin (`https://yourcms.com/admin/`).
*   **User Registration/Login**: Test user flows.
*   **Content Creation**: Create a test post, page, and upload media to ensure storage works.
*   **Logs**: Check Docker logs (`docker-compose logs -f`) for any errors.
*   **Monitoring**: Ensure your monitoring tools are collecting data and no critical alerts are firing.
*   **Security Headers**: Verify appropriate security headers (e.g., HSTS, Content Security Policy) are set by Nginx.

## 5. Scaling Considerations

*   **Load Balancing**: For high traffic, run multiple instances of the `backend` and `frontend` services behind a load balancer.
*   **Database Scaling**: Consider read replicas, sharding, or managed database services (AWS RDS, Google Cloud SQL).
*   **Media Storage**: For large-scale media, use cloud object storage (AWS S3, Google Cloud Storage) instead of local Docker volumes.
*   **Message Queues**: Integrate Celery for background tasks.
*   **Horizontal Pod Autoscaling**: If using Kubernetes, configure autoscaling for services.

---
```