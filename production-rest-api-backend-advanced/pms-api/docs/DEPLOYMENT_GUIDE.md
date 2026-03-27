# Deployment Guide

This guide provides instructions for deploying the PMS API to a production environment. We will focus on a Docker-based deployment, which is highly recommended due to the project's containerized nature.

## 1. Prerequisites for Production Environment

Before deploying, ensure your target server/environment has the following:

*   **Docker & Docker Compose:** Installed and running.
*   **Git:** To clone the repository.
*   **SSH Access:** To connect to your server.
*   **Domain Name & DNS Configuration:** Pointing to your server's IP address.
*   **Nginx (or another reverse proxy):** Recommended for handling SSL/TLS termination, serving static files, and routing requests to Docker containers. (Frontend Dockerfile uses Nginx, so this applies primarily to an external proxy for SSL).
*   **SSL Certificate:** (e.g., from Let's Encrypt via Certbot) for HTTPS.
*   **Environment Variable Management:** A secure way to manage your `.env` variables on the server (e.g., directly in the `.env` file, Kubernetes secrets, AWS Secrets Manager, etc.).

## 2. Environment Variables

Create a production `.env` file in the `pms-api/backend` directory and `pms-api/frontend` directory on your server.
**Do not commit these files to Git!**

### `backend/.env` (Production Example)

```env
NODE_ENV=production
PORT=3000

# Database (Replace with your actual production DB details)
DB_TYPE=postgres
DB_HOST=db # If DB is another Docker service or localhost if on host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=pms_production_db

# JWT - IMPORTANT: Use a strong, long, randomly generated secret
JWT_SECRET=YOUR_VERY_STRONG_AND_LONG_JWT_SECRET_HERE
JWT_EXPIRES_IN=24h # Adjust as needed

# Admin User (for initial setup, can be removed after first seed)
ADMIN_USERNAME=prodadmin
ADMIN_EMAIL=prodadmin@yourdomain.com
ADMIN_PASSWORD=YourSuperSecureAdminPassword123!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Cache (if using Redis, replace node-cache)
CACHE_TTL=300

# CORS - IMPORTANT: Restrict to your actual frontend domain(s)
CORS_ORIGIN=https://your-frontend-domain.com
# Or for multiple origins: CORS_ORIGIN=https://your-frontend-domain.com,https://another-domain.com
```

### `frontend/.env` (Production Example)

```env
# Point to your production backend API URL
VITE_API_BASE_URL=https://api.your-backend-domain.com/api/v1
```

## 3. Deployment Steps (Using Docker Compose on a Single Server)

This assumes you have a remote server (e.g., AWS EC2, DigitalOcean Droplet, a VPS) with Docker and Docker Compose installed.

1.  **SSH into your server:**
    ```bash
    ssh your_user@your_server_ip
    ```

2.  **Clone the repository:**
    Choose a directory on your server for the application.
    ```bash
    git clone https://github.com/your-username/pms-api.git
    cd pms-api
    ```

3.  **Place Production `.env` files:**
    Create or transfer your production `.env` files into the `backend/` and `frontend/` directories.
    ```bash
    # Example (DO NOT run this directly, transfer securely):
    # scp backend/.env your_user@your_server_ip:/path/to/pms-api/backend/.env
    # scp frontend/.env your_user@your_server_ip:/path/to/pms-api/frontend/.env
    ```

4.  **Build and Deploy with Docker Compose:**
    From the `pms-api` root directory:
    ```bash
    docker-compose pull # Pull any existing images to ensure latest base images
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds the images from their Dockerfiles. Essential for deploying new code.
    *   `-d`: Runs containers in detached mode (in the background).

5.  **Run Database Migrations and Seed Data:**
    The `backend/command` in `docker-compose.yml` is configured to run `npm run migration:run && npm run seed` on container startup. This ensures the database schema is up-to-date and the admin user is created/present. If you need to manually run migrations or seed data after initial deployment, you can exec into the backend container:
    ```bash
    docker-compose exec backend npm run migration:run
    docker-compose exec backend npm run seed
    ```

6.  **Verify Deployment:**
    *   Check container status: `docker-compose ps`
    *   View backend logs: `docker-compose logs backend`
    *   Access your frontend in a browser at your configured domain (`https://your-frontend-domain.com`).
    *   Access Swagger UI at `https://api.your-backend-domain.com/api-docs` (if you've configured a subdomain or path for the API).

7.  **Updating the Application:**
    When you have new code changes:
    *   Pull the latest changes from your Git repository: `git pull origin main`
    *   Rebuild and restart services: `docker-compose up --build -d`
    *   Clean up old Docker images to save disk space: `docker system prune -f`

## 4. Setting up a Reverse Proxy (Nginx for SSL/TLS)

For a production environment, it's crucial to use HTTPS. An external Nginx reverse proxy is ideal for this.

1.  **Install Nginx and Certbot (if not already installed):**
    ```bash
    sudo apt update
    sudo apt install nginx
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
    ```

2.  **Configure Nginx (e.g., `/etc/nginx/sites-available/pms-api.conf`):**
    Replace `your-frontend-domain.com` and `api.your-backend-domain.com` with your actual domains.
    The frontend Dockerfile already serves the React app with Nginx *inside the container*. This external Nginx will act as the public facing server, proxying to the internal Nginx (frontend service) and the backend service.

    ```nginx
    server {
        listen 80;
        server_name your-frontend-domain.com api.your-backend-domain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-frontend-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-frontend-domain.com/fullchain.pem; # Managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/your-frontend-domain.com/privkey.pem; # Managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            # Proxy to the frontend container's internal Nginx
            # 'frontend' is the service name in docker-compose.yml
            proxy_pass http://localhost:80; # Or http://frontend:80 if Nginx is outside docker-compose
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.your-backend-domain.com; # API subdomain

        ssl_certificate /etc/letsencrypt/live/api.your-backend-domain.com/fullchain.pem; # Managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/api.your-backend-domain.com/privkey.pem; # Managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            # Proxy to the backend container
            # 'backend' is the service name in docker-compose.yml
            proxy_pass http://localhost:3000; # Or http://backend:3000 if Nginx is outside docker-compose
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    *Note: If your Nginx is running *outside* of the Docker Compose network, `localhost` should be used to access ports published by `docker-compose.yml`. If Nginx is part of the Docker Compose stack, you'd use service names like `http://frontend:80` and `http://backend:3000`.* The current `docker-compose.yml` publishes ports `80:80` for frontend and `3000:3000` for backend, so `localhost` is appropriate for an external Nginx.

3.  **Enable the Nginx configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/pms-api.conf /etc/nginx/sites-enabled/
    sudo nginx -t # Test Nginx configuration for syntax errors
    sudo systemctl restart nginx
    ```

4.  **Obtain SSL certificates with Certbot:**
    ```bash
    sudo certbot --nginx -d your-frontend-domain.com -d api.your-backend-domain.com
    # Follow the prompts. Certbot will automatically configure Nginx for SSL.
    ```
    Certbot also sets up automatic renewal for your certificates.

## 5. CI/CD Pipeline (GitHub Actions)

The `.github/workflows/main.yml` file defines a basic CI/CD pipeline for the project:

*   **`backend-test` job:**
    *   Sets up Node.js environment.
    *   Installs backend dependencies.
    *   Starts a dedicated PostgreSQL container (`pms-db-test`) using `docker-compose.test.yml`.
    *   Runs database migrations and seeds.
    *   Executes unit and integration tests with coverage.
    *   Uploads coverage reports as artifacts.
*   **`frontend-build-and-lint` job:**
    *   Sets up Node.js environment.
    *   Installs frontend dependencies.
    *   Runs frontend lint checks.
    *   Builds the React application for production.
    *   Uploads the build artifacts.
*   **`deploy` job:** (Runs only on `main` branch push, after tests/builds pass)
    *   Logs in to Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_TOKEN` secrets).
    *   Builds and pushes Docker images for backend and frontend to Docker Hub.
    *   **Example Deployment:** Connects to a remote server via SSH (requires `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` secrets). It then pulls the latest Docker images and restarts the services using `docker-compose up -d`. This is a simplified example; a real-world deployment might use more sophisticated tools like Kubernetes, AWS ECS, or Ansible.

**To enable the `deploy` job:**
1.  **Create Docker Hub repository:** Create public repositories (e.g., `yourdockerusername/pms-backend`, `yourdockerusername/pms-frontend`).
2.  **Add GitHub Secrets:** In your GitHub repository settings, go to `Settings > Secrets and variables > Actions > New repository secret`:
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_TOKEN`: A Docker Hub Access Token with push/pull permissions.
    *   `SSH_PRIVATE_KEY`: The private SSH key for your deployment user on the server.
    *   `DEPLOY_HOST`: The IP address or hostname of your deployment server.
    *   `DEPLOY_USER`: The username for SSH access on your deployment server.
3.  **Adjust `deploy` job:** Modify the `tags` for Docker images to reflect your Docker Hub username. Adjust the `Deploy to Production` step to match your actual server environment and `docker-compose.yml` location.

---

This guide covers a robust deployment strategy using Docker and Nginx. Always remember to prioritize security in a production environment, especially for sensitive data and access credentials.