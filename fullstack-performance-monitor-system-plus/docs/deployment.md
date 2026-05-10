# AppInsight Deployment Guide

This guide outlines how to deploy the AppInsight system using Docker and Docker Compose for a production-like environment.

## Prerequisites

*   **Docker & Docker Compose:** Installed on your deployment server.
*   **Git:** To clone the repository.
*   **SSH Access:** To your deployment server.
*   **Domain Name:** (Optional, but recommended for production) Pointed to your server's IP.
*   **HTTPS Setup:** (Recommended for production) Using Nginx or Caddy with Let's Encrypt. This guide focuses on HTTP within Docker Compose.

## 1. Clone the Repository

First, connect to your deployment server via SSH and clone the AppInsight repository:

```bash
git clone https://github.com/your-username/appinsight.git
cd appinsight
```

## 2. Configure Environment Variables

Create `.env` files for both the `backend` and `frontend` directories based on the provided `.env.example` files.

### `backend/.env`

```ini
DATABASE_URL="postgresql://user:password@db:5432/appinsight_db?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="YOUR_VERY_STRONG_AND_UNIQUE_JWT_SECRET" # !!! IMPORTANT: Change this for production !!!
PORT=5000
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY_HEADER="X-AppInsight-Api-Key"
LOG_LEVEL=info
```
**Explanation:**
*   `DATABASE_URL`: Connection string for PostgreSQL. `db` is the Docker service name.
*   `REDIS_URL`: Connection string for Redis. `redis` is the Docker service name.
*   `JWT_SECRET`: A long, random string. Generate a new one (e.g., `openssl rand -base64 32`).
*   `NODE_ENV`: Set to `production` to optimize builds and disable development-only features.
*   `RATE_LIMIT_*`: Configure your rate limiting thresholds.
*   `API_KEY_HEADER`: The HTTP header name your monitored apps will use for API keys.
*   `LOG_LEVEL`: Adjust as needed (`info`, `warn`, `error`).

### `frontend/.env`

```ini
VITE_API_BASE_URL="http://localhost:5000/api" # If running on the same host and exposed directly
# OR if accessed via a reverse proxy (e.g., Nginx on host):
# VITE_API_BASE_URL="https://yourdomain.com/api"
```
**Explanation:**
*   `VITE_API_BASE_URL`: This should point to the externally accessible URL of your backend API. If you're running everything on the same server and exposing the backend directly (e.g., via host port 5000), `http://localhost:5000/api` might work. If you're using a reverse proxy on the host (recommended), it should be your domain name.

## 3. Build and Deploy with Docker Compose

The `docker-compose.yml` file is configured for a multi-service setup.

```yaml
# docker-compose.yml (excerpt - full file in repo root)
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    # ...
  redis:
    image: redis:6-alpine
    # ...
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    # ...
    # IMPORTANT: In a true production setup, you would typically *not* mount
    # your local source code into the container (`volumes: - ./backend:/app`).
    # Instead, the Dockerfile builds the app into the image, and the image is run.
    # The `command` ensures migrations run before starting the app.
    command: sh -c "npx prisma migrate deploy && npm run start" 
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    # ...
```

### Build Docker Images

From the root of the `appinsight` directory, build the Docker images:

```bash
docker compose build
```
This will build the `backend` and `frontend` images based on their respective `Dockerfile`s and pull `postgres` and `redis` images.

### Start the Services

Once built, start all services:

```bash
docker compose up -d
```
*   `up`: Creates and starts containers.
*   `-d`: Runs containers in detached mode (in the background).

### Verify Services

Check the status of your running containers:

```bash
docker compose ps
```
You should see `db`, `redis`, `backend`, and `frontend` containers running.
You can view logs for a specific service (e.g., backend):

```bash
docker compose logs -f backend
```

### Accessing the Application

*   **Frontend:** By default, the `frontend` service is exposed on port `3000`. Open your browser to `http://your-server-ip:3000`.
*   **Backend API:** The `backend` service is exposed on port `5000`. Your API will be accessible at `http://your-server-ip:5000/api`.

**Important for `VITE_API_BASE_URL`:**
If your frontend is served from `http://your-domain.com` and your backend API from `http://your-domain.com/api`, you'll need a reverse proxy on your host server (e.g., Nginx) to route traffic appropriately.

## 4. Running Database Migrations

The `docker-compose.yml` is configured to run `npx prisma migrate deploy` as part of the backend's startup command. This ensures your database schema is up-to-date when the backend service starts.

If you need to manually run migrations or seeding:

```bash
# Connect to the backend container
docker compose exec backend bash

# Inside the container, you can run Prisma commands
npx prisma migrate status
npx prisma db seed # To run seed data (if not already run)
exit
```

## 5. Setting up a Reverse Proxy (Recommended for Production)

For a production environment, it's highly recommended to place an Nginx or Caddy reverse proxy in front of your Docker services. This allows you to:
*   Serve both frontend and backend from a single domain (e.g., `yourdomain.com` and `yourdomain.com/api`).
*   Handle SSL/TLS termination (HTTPS).
*   Add security headers, compression, caching.

**Example Nginx Configuration (`/etc/nginx/sites-available/appinsight.conf`):**

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your domain

    location / {
        proxy_pass http://localhost:3000; # Points to the frontend container exposed port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/; # Points to the backend container exposed port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Redirect HTTP to HTTPS (after setting up SSL)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # # ... other SSL settings
}
```
After configuring Nginx, enable it and restart:

```bash
sudo ln -s /etc/nginx/sites-available/appinsight.conf /etc/nginx/sites-enabled/
sudo nginx -t # Test Nginx configuration
sudo systemctl restart nginx
```
Remember to adjust `frontend/.env` to reflect your domain if using a reverse proxy (e.g., `VITE_API_BASE_URL="https://yourdomain.com/api"`).

## 6. Maintenance and Updates

### Stop Services

```bash
docker compose down
```
This stops and removes containers, networks, and volumes (unless `volumes` are explicitly external or named). If you want to keep the database data, ensure `appinsight_db_data` volume is correctly managed.

### Update Application Code

```bash
git pull origin main # Or your deployment branch
docker compose build --no-cache # Rebuild images to pick up new code
docker compose up -d # Restart services
```

### Backup Database

Regularly back up your PostgreSQL database.
You can use `pg_dump` from within the `db` container or from your host if `postgresql-client` is installed.

```bash
# From host:
docker compose exec db pg_dump -U user appinsight_db > appinsight_backup_$(date +%Y%m%d%H%M%S).sql
```

## 7. Security Considerations

*   **HTTPS:** Always use HTTPS in production. Set up SSL certificates (e.g., with Let's Encrypt and Nginx/Caddy).
*   **Secrets:** Never hardcode secrets. Use environment variables. In a more advanced setup, consider Docker Secrets or a secrets management service.
*   **Firewall:** Configure your server's firewall (e.g., `ufw`) to only allow necessary incoming traffic (e.g., 80, 443, 22 for SSH). Do not expose PostgreSQL or Redis ports directly to the internet.
*   **Least Privilege:** Run containers with the least necessary privileges.
*   **Image Scanning:** Regularly scan your Docker images for vulnerabilities.
*   **Updates:** Keep Docker, Node.js, and all dependencies up to date.

This guide provides a solid foundation for deploying AppInsight. Adjustments may be necessary based on your specific infrastructure and security requirements.
```