# Deployment Guide - Data Visualization System

This guide provides instructions for deploying the Data Visualization System. We'll focus on a Docker-based deployment strategy, which is suitable for various environments, including cloud platforms (AWS EC2, Google Cloud Run, Azure Container Instances) or on-premise servers.

## 1. Prerequisites

*   A server or virtual machine with Docker and Docker Compose installed.
*   Access to a PostgreSQL database (either running in a container on the same host, or a managed service like AWS RDS, Azure Database for PostgreSQL, etc.).
*   A domain name and SSL certificate (recommended for production).
*   DNS configured to point your domain to your server's IP address.
*   (Optional but recommended) A reverse proxy like Nginx or Caddy for SSL termination, load balancing, and serving static files.

## 2. Environment Variables

Ensure your `.env` files for both `server` and `client` are properly configured for the production environment.

### `server/.env` (Production)

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://<prod_user>:<prod_password>@<db_host>:<db_port>/<prod_db_name>
JWT_SECRET=your_production_jwt_secret_key # MUST be a strong, random, unique key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_production_refresh_secret_key # MUST be a strong, random, unique key
REFRESH_TOKEN_EXPIRES_IN=7d
ENABLE_CACHE=true # Consider external caching (Redis) for larger scale
CACHE_TTL=3600
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=https://your-frontend-domain.com # Used for CORS
```
**Important:**
*   Replace `<prod_user>`, `<prod_password>`, `<db_host>`, `<db_port>`, `<prod_db_name>` with your actual production database credentials.
*   Generate new, strong, and unique `JWT_SECRET` and `REFRESH_TOKEN_SECRET` values. Do NOT use the development ones.
*   `FRONTEND_URL` should be the actual URL where your frontend will be accessible.

### `client/.env.production`

```dotenv
REACT_APP_API_BASE_URL=https://api.your-backend-domain.com/api # Or directly to backend if no API subdomain
```
**Important:**
*   `REACT_APP_API_BASE_URL` should point to your *production* backend API URL.

## 3. Database Setup

1.  **Create Production Database:** Create a dedicated PostgreSQL database and a user with appropriate permissions.
2.  **Run Migrations:** Apply database migrations to the production database.

    *   **Option A (Via `docker-compose exec`):**
        ```bash
        # From the project root where docker-compose.yml is
        docker-compose run --rm server npm run typeorm migration:run
        ```
    *   **Option B (Manually if server is built separately):**
        ```bash
        # Make sure your server/.env is pointing to the production DB
        cd server
        npm install
        npm run typeorm migration:run
        ```

## 4. Building Docker Images

The `Dockerfile` in the project root is configured for a multi-stage build, which optimizes image size for production.

```bash
docker build -t data-viz-server:latest . -f Dockerfile.server # Assuming you split Dockerfile for server
docker build -t data-viz-client:latest . -f Dockerfile.client # Assuming you split Dockerfile for client
```
**Note:** If you are using the provided `Dockerfile` as a single multi-stage for the *server*, and building the client separately, adjust commands. The `docker-compose.yml` usually handles the build step (`build: .`).

For the provided `docker-compose.yml`, building is handled by `docker-compose up --build -d`. You might want to remove the `client` service from `docker-compose.yml` if you intend to serve the static frontend files via Nginx.

## 5. Deployment with Docker Compose (Simplified)

For simpler deployments (e.g., a single server), you can use `docker-compose` to run your backend and optionally your database. You would typically serve your static frontend assets separately (e.g., from Nginx).

1.  **Transfer Files:** Copy your `docker-compose.yml`, `Dockerfile` (for server), and the `.env` files to your production server.
2.  **Start Services:**
    ```bash
    # From the directory containing docker-compose.yml and .env files
    docker-compose -f docker-compose.prod.yml up --build -d
    ```
    *   **Consider a separate `docker-compose.prod.yml`:**
        Remove the `client` service.
        Point the `server` service to your production `.env` and `DATABASE_URL`.
        Map port 80 or 443 to your reverse proxy if you have one, or 5000 directly.

### Example `docker-compose.prod.yml` (Without Client, Assuming Nginx)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    env_file:
      - ./server/.env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432" # Only expose if needed for external tools/access

  server:
    build:
      context: .
      dockerfile: Dockerfile # Use the multi-stage Dockerfile for server
    container_name: data-viz-server
    restart: always
    env_file:
      - ./server/.env
    depends_on:
      - db
    # Expose port 5000 to the host, so Nginx can proxy to it
    # If running directly, map to 80 or 443 (not recommended without Nginx)
    ports:
      - "5000:5000"

volumes:
  db_data:
```

## 6. Frontend Deployment (Static Files + Nginx/Caddy)

For production, it's best practice to build the React application into static files and serve them using a performant web server like Nginx or Caddy.

1.  **Build Frontend:**
    ```bash
    cd client
    npm run build
    ```
    This will create a `build` directory containing all static assets.

2.  **Transfer `build` directory:** Copy the contents of the `client/build` directory to your production server (e.g., `/var/www/data-viz-frontend`).

3.  **Configure Nginx/Caddy (Reverse Proxy)**
    Set up Nginx or Caddy to:
    *   Serve the static files from the frontend `build` directory.
    *   Proxy API requests (e.g., `/api/*`) to your backend server (e.g., `http://localhost:5000`).
    *   Handle SSL termination (HTTPS).
    *   Set appropriate cache headers for static assets.

### Example Nginx Configuration (`/etc/nginx/sites-available/your-domain.conf`)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-frontend-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-frontend-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-frontend-domain.com/fullchain.pem; # Your SSL cert
    ssl_certificate_key /etc/letsencrypt/live/your-frontend-domain.com/privkey.pem; # Your SSL key
    ssl_trusted_certificate /etc/letsencrypt/live/your-frontend-domain.com/chain.pem;

    root /var/www/data-viz-frontend; # Path to your client/build directory
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the backend server
    location /api/ {
        proxy_pass http://localhost:5000/api/; # Or http://data-viz-server:5000/api/ if on same docker network
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # Optional: set max upload size
        client_max_body_size 20M;
    }

    error_log /var/log/nginx/data-viz-error.log warn;
    access_log /var/log/nginx/data-viz-access.log;
}
```
*   Remember to symlink your config: `sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/`
*   Test Nginx config: `sudo nginx -t`
*   Reload Nginx: `sudo systemctl reload nginx`

## 7. CI/CD Integration (GitHub Actions)

The `.github/workflows/ci.yml` provides a basic CI/CD pipeline. For production deployment, you would extend this to:
*   Build Docker images for `server` and `client` on push to `main` branch.
*   Push these images to a container registry (e.g., Docker Hub, AWS ECR, GCR).
*   Trigger a deployment on your server (e.g., by SSHing and running `docker-compose pull && docker-compose up -d`).

### Example production steps in CI/CD:

```yaml
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push server image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: Dockerfile # Points to the multi-stage Dockerfile
        push: true
        tags: yourusername/data-viz-server:latest

    - name: Deploy to Production Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/your/app
          docker-compose -f docker-compose.prod.yml pull server # Pull latest server image
          docker-compose -f docker-compose.prod.yml up -d --remove-orphans server # Recreate server container
          # If serving frontend from Nginx, you'd have separate deployment for client build
```

## 8. Monitoring and Logging

*   **Backend Logs:** Ensure your server's Winston logs are configured to output to files that can be collected by a log management system (e.g., ELK stack, Grafana Loki, cloud logging services).
*   **Container Logs:** `docker logs <container_name>` can be used to inspect logs from individual containers.
*   **Error Tracking:** Integrate a tool like Sentry or Bugsnag for real-time error reporting.
*   **Performance Monitoring:** Use APM tools (e.g., New Relic, Datadog) or open-source solutions like Prometheus/Grafana to monitor server health, request latency, and resource utilization.

By following these steps, you can successfully deploy your Data Visualization System in a production environment.

---