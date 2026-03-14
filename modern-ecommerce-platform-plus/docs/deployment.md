```markdown
# Deployment Guide

This document provides a step-by-step guide for deploying the E-commerce system to a production environment using Docker and Docker Compose. This guide assumes you have a cloud server (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine) running Ubuntu (or a similar Linux distribution) with Docker and Docker Compose installed.

## 1. Prerequisites

Before you begin, ensure you have:

*   A cloud server instance (e.g., Ubuntu 20.04 LTS).
*   **SSH access** to your server.
*   **Domain Name:** A registered domain name pointing to your server's IP address (for Nginx and HTTPS).
*   **Docker** installed on your server.
*   **Docker Compose** installed on your server.
*   **Git** installed on your server.
*   **Managed PostgreSQL Database:** For production, it's highly recommended to use a managed database service (e.g., AWS RDS, DigitalOcean PostgreSQL) rather than running PostgreSQL in a Docker container on the same server, for better scalability, backups, and reliability.
*   **Managed Redis Instance:** (Optional, but recommended for caching/sessions) A managed Redis service.

## 2. Server Setup

### 2.1. SSH into your server

```bash
ssh user@your_server_ip
```

### 2.2. Install Docker and Docker Compose (if not already installed)

Follow the official Docker documentation for installation.
For Ubuntu:
```bash
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER # Add your user to the docker group
newgrp docker # Apply group changes, or log out/in

# Install Docker Compose
sudo apt install docker-compose-plugin # For Docker Compose V2
# Or for Docker Compose V1:
# sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# sudo chmod +x /usr/local/bin/docker-compose
```
Verify installations: `docker run hello-world` and `docker compose version` (or `docker-compose version`).

### 2.3. Clone the Repository

```bash
git clone https://github.com/your-username/ecommerce-system.git
cd ecommerce-system
```

## 3. Configuration

### 3.1. Environment Variables (`.env`)

Create a `server/.env` file with production-ready values. **DO NOT** use default secret keys.

```ini
# server/.env
NODE_ENV=production
PORT=5000

# PostgreSQL Database (replace with your managed DB credentials and endpoint)
DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:5432/ecommerce_db?schema=public"

# JWT Secret (VERY IMPORTANT: Use a strong, random, long string)
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET_KEY_HERE_LONG_RANDOM_STRING
JWT_EXPIRES_IN=7d # Token expiration time

# Redis Cache (replace with your managed Redis credentials and endpoint)
REDIS_HOST=your_redis_host
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password # If your Redis requires password

# Stripe Secret Key
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_LIVE_SECRET_KEY

# Admin Email (for system notifications/contact)
ADMIN_EMAIL=your_admin_email@yourdomain.com

# Other configurations like email service API keys, etc.
# EMAIL_SERVICE_API_KEY=your_sendgrid_key
```

### 3.2. Nginx Configuration (`nginx.conf`)

Adjust `nginx.conf` for your domain and SSL.

1.  **Update `server_name`:** Replace `localhost` with your actual domain name.
2.  **HTTPS (Recommended):** For production, you must use HTTPS. You'll need SSL certificates (e.g., from Let's Encrypt using Certbot).
    *   **Install Certbot:**
        ```bash
        sudo snap install core
        sudo snap refresh core
        sudo snap install --classic certbot
        sudo ln -s /snap/bin/certbot /usr/bin/certbot
        ```
    *   **Obtain Certs (stop Nginx first if running):**
        ```bash
        sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
        ```
    *   **Update `nginx.conf`** to include SSL configuration:
        ```nginx
        server {
            listen 80;
            server_name yourdomain.com www.yourdomain.com;
            return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
        }

        server {
            listen 443 ssl http2;
            server_name yourdomain.com www.yourdomain.com;

            ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # Path to your cert
            ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # Path to your key
            ssl_session_cache shared:SSL:10m;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_prefer_server_ciphers on;
            ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";

            # ... rest of your existing Nginx config for frontend and API proxy ...
        }
        ```
3.  **Frontend Build Path:** Ensure `location / { root /usr/share/nginx/html; }` points to where the frontend `build` artifacts will be mounted. In our `docker-compose.yml`, this is done via `volumes: - ./client/build:/usr/share/nginx/html`.

## 4. Build Frontend for Production

The frontend `client/build` directory should contain the optimized static assets. This is typically done on your local machine or during CI.

1.  **Navigate to the `client` directory on your local machine:**
    ```bash
    cd client
    ```
2.  **Build the React application:**
    ```bash
    npm install
    npm run build
    ```
    This will create a `build` folder inside `client/` with the optimized production assets.
3.  **Transfer the `build` folder to your server:**
    Use `scp` to copy the `build` directory from your local machine to the `ecommerce-system/client/` directory on your server.
    ```bash
    # From your local machine
    scp -r client/build user@your_server_ip:/path/to/ecommerce-system/client/
    ```

## 5. Deploy with Docker Compose

1.  **Navigate to the root of your project on the server:**
    ```bash
    cd /path/to/ecommerce-system
    ```
2.  **Adjust `docker-compose.yml` for Production:**
    *   **Database:** Modify `db` service to **remove `ports` mapping** (since it's an internal service) and **remove `volumes` for data persistence** (as you'll use a managed DB). Update `backend`'s `DATABASE_URL` to point to your *managed* PostgreSQL endpoint.
    *   **Redis:** Similar adjustments for `redis` if using a managed service.
    *   **Frontend `build`:** Ensure the `nginx` service in `docker-compose.yml` is configured to mount your `client/build` directory correctly.
    *   **Backend `volumes`:** Remove the volume mount for `./server:/app` from the `backend` service to avoid overwriting the production build from inside the container, and ensure it uses the built image.
    *   **`command` in `backend`:** Ensure it correctly runs migrations and starts the app (e.g., `npx prisma migrate deploy && node src/server.js`). The provided `Dockerfile` already handles this.

    **Example `docker-compose.yml` adjustments for production:**
    (This is a *conceptual* example; adjust based on your actual managed services and Nginx configuration)

    ```yaml
    # docker-compose.yml (Production Ready)
    version: '3.8'

    services:
      # We assume a Managed PostgreSQL service is used.
      # The `db` service definition is REMOVED or commented out if using a managed DB.
      # Backend will connect directly to the external managed DB.

      # We assume a Managed Redis service is used.
      # The `redis` service definition is REMOVED or commented out if using a managed Redis.
      # Backend will connect directly to the external managed Redis.

      # Backend Application
      backend:
        build:
          context: ./server
          dockerfile: Dockerfile
        image: your-dockerhub-user/ecommerce-backend:latest # Or use a specific tag like commit SHA
        container_name: ecommerce-backend
        environment:
          # Production environment variables loaded from server/.env
          # Ensure these match your server/.env file, or pass them directly
          # REACT_APP_API_BASE_URL: /api # Nginx handles routing
        env_file:
          - ./server/.env # Load production environment variables
        # No port mapping needed if Nginx proxies requests
        # volumes: # Remove dev volumes in production
        #  - ./server:/app
        #  - /app/node_modules
        networks:
          - app-network
        depends_on:
          # Remove internal db/redis depends_on if using managed services
          # Add external dependencies if you need health checks for them here, e.g. a script
          # Or handle external service availability robustly in app code
          # Example: - db_service # If you had a health-check only service for external DB
          # Example: - redis_service # If you had a health-check only service for external Redis

      # Frontend Application (no need for a separate container, Nginx serves static build)

      # Nginx Reverse Proxy
      nginx:
        image: nginx:stable-alpine
        container_name: ecommerce-nginx
        ports:
          - "80:80"
          - "443:443" # For HTTPS
        volumes:
          - ./nginx.conf:/etc/nginx/nginx.conf:ro
          - ./client/build:/usr/share/nginx/html # Serve frontend build artifacts
          - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/certs/live/yourdomain.com:ro # Mount Let's Encrypt certs
          - /etc/letsencrypt/archive/yourdomain.com:/etc/nginx/certs/archive/yourdomain.com:ro
        depends_on:
          - backend # Nginx depends on backend to be up for proxying
        networks:
          - app-network

    networks:
      app-network:
        driver: bridge
    ```

3.  **Pull Images and Start Services:**
    ```bash
    docker compose pull # Pull backend image from registry if using image name
    docker compose up --build -d
    ```
    *   `--build`: Ensures your latest Dockerfile changes are built. For production, you might primarily `pull` pre-built images.
    *   `-d`: Runs containers in detached mode.

4.  **Verify Deployment:**
    *   Check container status: `docker ps`
    *   View logs: `docker compose logs -f`
    *   Access your application in a web browser using your domain name.

## 6. Post-Deployment Maintenance

*   **Continuous Integration/Deployment (CI/CD):** Set up GitHub Actions (or your preferred CI/CD tool) to automate these steps.
*   **Monitoring & Logging:** Integrate with cloud-based monitoring (e.g., AWS CloudWatch, GCP Stackdriver) and centralize logs (e.g., ELK stack).
*   **Backups:** Ensure your managed database has regular backups configured.
*   **Security Updates:** Regularly update Docker images, Node.js, and npm packages.
*   **Scale:** As traffic grows, consider:
    *   Running multiple backend instances behind a load balancer.
    *   Optimizing database queries and adding indexes.
    *   Expanding caching aggressively.
    *   Migrating to a container orchestration platform like Kubernetes.
*   **Certbot Renewal:** Certbot usually sets up a cron job for automatic certificate renewal. Verify it's working: `sudo certbot renew --dry-run`.

---
```