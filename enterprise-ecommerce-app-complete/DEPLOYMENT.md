```markdown
# Deployment Guide

This document outlines the steps for deploying the E-commerce Solutions System to a production environment. We'll focus on a common scenario using **Docker Compose on a Virtual Private Server (VPS)** like AWS EC2, DigitalOcean Droplet, or a similar cloud instance. For more advanced deployments (e.g., Kubernetes, serverless), the Docker images serve as a foundation.

## 1. Prerequisites for Deployment

*   **A Cloud VPS:** (e.g., AWS EC2, DigitalOcean, Google Cloud Compute Engine, Azure Virtual Machines)
    *   Minimum 2 vCPUs, 4GB RAM recommended for a small production setup.
    *   Ubuntu 22.04 LTS or a similar Linux distribution.
*   **Domain Name:** A registered domain (e.g., `your-shop.com`).
*   **SSH Client:** To connect to your VPS.
*   **Docker & Docker Compose:** Installed on your VPS.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)
*   **Nginx (or Caddy):** A reverse proxy server to handle SSL/TLS, terminate HTTPS, and route traffic to your frontend/backend containers.
    *   [Install Nginx on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04)
*   **Certbot:** For obtaining and managing SSL certificates from Let's Encrypt (free HTTPS).
    *   [Install Certbot](https://certbot.eff.org/instructions?ws=nginx&os=ubuntu)
*   **Firewall Configuration:** Configure your VPS firewall (e.g., `ufw` on Ubuntu) to allow necessary ports (80, 443, 22).

## 2. Prepare Your VPS

1.  **Connect to your VPS via SSH:**
    ```bash
    ssh username@your_vps_ip
    ```

2.  **Update System & Install Essentials:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl git
    ```

3.  **Install Docker & Docker Compose:**
    Follow the official Docker documentation for your specific OS.
    After installation, add your user to the `docker` group to run Docker commands without `sudo`:
    ```bash
    sudo usermod -aG docker $USER
    # You'll need to log out and log back in for the changes to take effect.
    exit # Then reconnect via SSH
    ```

4.  **Install Nginx & Certbot:**
    ```bash
    sudo apt install -y nginx
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot # Symlink for easier access
    ```

5.  **Configure Firewall (UFW example):**
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full' # Allows both HTTP (80) and HTTPS (443)
    sudo ufw enable
    sudo ufw status # Verify rules
    ```

## 3. Deploying the Application

### 3.1. Clone Repository & Environment Variables

1.  **Clone the project repository to your VPS:**
    ```bash
    git clone https://github.com/your-username/ecommerce-app.git
    cd ecommerce-app
    ```

2.  **Create Production `.env` files:**
    Copy the example `.env` files and **fill them with production-ready values**.
    *   **`backend/.env`**:
        ```bash
        cp backend/.env.example backend/.env
        # Edit backend/.env
        # DATABASE_URL="postgresql://user:password@db:5432/ecommerce_db?schema=public" # 'db' is the service name in docker-compose
        # JWT_SECRET=YOUR_VERY_STRONG_LONG_RANDOM_SECRET_KEY
        # REDIS_URL=redis://redis:6379 # 'redis' is the service name in docker-compose
        # NODE_ENV=production
        # PORT=5000
        # API_PREFIX=/api/v1
        # ADMIN_EMAIL=prod_admin@example.com
        # ADMIN_PASSWORD=your_prod_admin_password
        ```
    *   **`frontend/.env.local`**:
        ```bash
        cp frontend/.env.local.example frontend/.env.local
        # Edit frontend/.env.local
        # NEXT_PUBLIC_API_BASE_URL=https://api.your-shop.com/api/v1 # Use your public API domain
        ```

### 3.2. Build & Run with Docker Compose

1.  **Pull latest images (if using pre-built from CI/CD) or build locally:**
    If you configured CI/CD to push Docker images to a registry (e.g., Docker Hub, AWS ECR), you would first `docker-compose pull`.
    Otherwise, build them locally on the server:
    ```bash
    docker-compose -f docker-compose.prod.yml build # Assuming a prod-specific compose file
    ```
    **Note:** It's highly recommended to have your CI/CD pipeline build and push images to a registry, then `docker-compose pull` on the server for faster deployments. For simplicity here, we assume building on the server or pre-pulling.

2.  **Run migrations and seed the database:**
    Wait for `db` and `redis` services to be healthy first.
    ```bash
    docker-compose up -d db redis # Start only db and redis first
    docker-compose logs -f db # Wait until db service is healthy

    # Once healthy, apply migrations and seed
    docker-compose run --rm backend yarn prisma migrate deploy
    docker-compose run --rm backend yarn prisma:seed
    ```
    `--rm` removes the temporary container after execution.

3.  **Start all services in detached mode:**
    ```bash
    docker-compose up -d
    ```

4.  **Verify container status:**
    ```bash
    docker-compose ps
    ```
    All services (`db`, `redis`, `backend`, `frontend`) should be `Up`.

### 3.3. Configure Nginx Reverse Proxy

Nginx will serve as the entry point for all incoming web traffic, directing it to your frontend and backend Docker containers.

1.  **Create an Nginx configuration file:**
    ```bash
    sudo nano /etc/nginx/sites-available/your-shop.com
    ```
    Add the following content (replace `your-shop.com` with your actual domain):

    ```nginx
    server {
        listen 80;
        server_name your-shop.com www.your-shop.com;

        location / {
            proxy_pass http://localhost:3000; # Points to the frontend container
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            # Add other necessary proxy headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/v1/ {
            proxy_pass http://localhost:5000/api/v1/; # Points to the backend container
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            # Add other necessary proxy headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Redirect http to https (will be updated by Certbot)
        # return 301 https://$host$request_uri;
    }
    ```

    **Important Note for `proxy_pass`:**
    If you're running Nginx *outside* of the Docker Compose network (standard setup), you need to point `proxy_pass` to `localhost:PORT` because Docker Compose maps container ports to the host machine's `localhost`.
    If Nginx itself was a container *within* the same Docker Compose network, you would use `http://frontend:3000` and `http://backend:5000` (service names).

2.  **Enable the Nginx configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-shop.com /etc/nginx/sites-enabled/
    sudo nginx -t # Test Nginx configuration for syntax errors
    sudo systemctl restart nginx
    ```

### 3.4. Secure with HTTPS (Let's Encrypt / Certbot)

1.  **Obtain SSL certificate:**
    ```bash
    sudo certbot --nginx -d your-shop.com -d www.your-shop.com
    ```
    Follow the prompts. Certbot will automatically configure Nginx to use HTTPS and set up automatic renewals.

2.  **Verify HTTPS:**
    Open your browser and navigate to `https://your-shop.com`. Your site should now be accessible securely.

## 4. Post-Deployment Steps

*   **Monitoring:** Set up monitoring for your VPS (CPU, RAM, Disk, Network) and your Docker containers. Consider tools like Prometheus/Grafana or your cloud provider's monitoring services.
*   **Logging:** Ensure your application logs (from Winston) are collected and stored securely. You might integrate with a log management service (e.g., ELK stack, Loggly, Datadog).
*   **Backups:** Implement regular database backups for PostgreSQL and snapshotting for your VPS.
*   **Security:**
    *   Regularly update your OS, Docker, and application dependencies.
    *   Review firewall rules.
    *   Consider a Web Application Firewall (WAF) for additional protection.
*   **Continuous Deployment:** Integrate the deployment steps into your CI/CD pipeline (`.github/workflows/ci.yml`) so that new changes pushed to `main` are automatically deployed after passing tests.

## 5. Updating the Application

When you have new code changes:

1.  **Commit and push** your changes to your Git repository.
2.  Your **CI/CD pipeline** (GitHub Actions) will run, build the new Docker images (and push to a registry).
3.  On your **VPS**, pull the latest repository changes (if your `docker-compose.yml` is updated) and then:
    ```bash
    cd /path/to/ecommerce-app
    git pull origin main # Or your deployment branch
    docker-compose pull # Pull new images from registry
    docker-compose up -d --force-recreate # Restart containers with new images
    ```
    If you built images directly on the server, you would use:
    ```bash
    docker-compose build
    docker-compose up -d --force-recreate
    ```
4.  Optionally, clear Redis cache if there are significant data model changes that could lead to stale data.
    ```bash
    docker-compose exec redis redis-cli FLUSHALL
    ```

This deployment strategy provides a balance of ease of use with Docker Compose and robustness for a production environment.
```