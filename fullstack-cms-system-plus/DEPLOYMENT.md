```markdown
# CMS Pro: Deployment Guide

This guide outlines the steps to deploy the CMS Pro application to a production environment using Docker and Docker Compose. While this guide focuses on a single-server Docker Compose deployment, for true high-availability and large-scale production, you would typically use orchestration platforms like Kubernetes, AWS ECS, Azure AKS, or Google GKE.

## 1. Prerequisites

*   A Linux server (e.g., Ubuntu, CentOS) with `ssh` access.
*   **Docker** installed on the server (Docker Engine and Docker Compose).
*   **Git** installed on the server.
*   **Domain name** pointed to your server's IP address (optional but recommended for production).
*   **SSL/TLS certificate** (e.g., Let's Encrypt with Certbot) for HTTPS (highly recommended for production).
*   **GitHub/GitLab/Docker Hub account** (for CI/CD and image registry if not building directly on server).

## 2. Server Setup

1.  **Update System:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Install Docker and Docker Compose:**
    Follow the official Docker documentation for your specific Linux distribution:
    *   [Install Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)

3.  **Configure Firewall (UFW example):**
    Allow SSH, HTTP, and HTTPS traffic.
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx HTTP'
    sudo ufw allow 'Nginx HTTPS' # If you plan to use Nginx to terminate SSL
    sudo ufw enable
    ```
    Or if Docker exposes ports directly, allow the specific ports:
    ```bash
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp # If using HTTPS
    sudo ufw allow 8080/tcp # If you expose backend directly (not recommended for production)
    sudo ufw enable
    ```

## 3. Environment Variables

Create a `.env` file in the root directory of your project on the server. This file will store sensitive information and configuration specific to your production environment.

**Example `.env` file:**

```dotenv
# Database Configuration
DB_NAME=cms_pro_db
DB_USERNAME=cms_pro_user
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
# DB_HOST and DB_PORT will be 'db' and '5432' respectively, as defined in docker-compose.yml

# JWT Secret Key (MUST be a strong, randomly generated 256-bit key, base64 encoded)
# Generate a new key: `head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 32 | base64` (Linux)
JWT_SECRET_KEY=YOUR_SECURE_GENERATED_JWT_SECRET_KEY_BASE64_ENCODED

# Other configurations (e.g., for S3 if implemented)
# AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
# AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
```
**IMPORTANT:** Never commit this `.env` file to your Git repository!

## 4. Deployment Steps

### Option A: Build on Server (Simpler for initial deployment, can be slow)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/cms-pro.git
    cd cms-pro
    ```

2.  **Place `.env` file:**
    Ensure your `.env` file is in the `cms-pro` root directory as described above.

3.  **Build and Run Docker Compose:**
    ```bash
    docker-compose -f docker-compose.yml --env-file .env up --build -d
    ```
    *   `--env-file .env`: Tells Docker Compose to load environment variables from your `.env` file.
    *   `--build`: This will build the Docker images for backend and frontend on your server. This can take some time.

### Option B: Pull from Docker Registry (Recommended for CI/CD)

1.  **Build and Push Images from CI/CD:**
    Ensure your CI/CD pipeline (e.g., GitHub Actions as outlined in `main.yml`) is configured to build the `Dockerfile.backend` and `Dockerfile.frontend` images and push them to a Docker registry (e.g., Docker Hub, AWS ECR).
    Tag your images appropriately (e.g., `your-dockerhub-username/cms-backend:latest`, `your-dockerhub-username/cms-frontend:latest`).

2.  **Update `docker-compose.yml` (if using custom image names):**
    Modify `docker-compose.yml` to use your pre-built image names instead of the `build` directive.

    ```yaml
    # ... (rest of the file)
    services:
      # ...
      backend:
        image: your-dockerhub-username/cms-backend:latest # Use your image name
        # build: # Remove or comment out the build section
        #   context: .
        #   dockerfile: Dockerfile.backend
        # ...
      frontend:
        image: your-dockerhub-username/cms-frontend:latest # Use your image name
        # build: # Remove or comment out the build section
        #   context: .
        #   dockerfile: Dockerfile.frontend
        # ...
    ```

3.  **Clone the Repository (or fetch latest):**
    ```bash
    git clone https://github.com/your-username/cms-pro.git
    cd cms-pro
    # Or if already cloned: git pull origin main
    ```

4.  **Place `.env` file:**
    Ensure your `.env` file is in the `cms-pro` root directory.

5.  **Pull Images and Run Docker Compose:**
    ```bash
    docker-compose -f docker-compose.yml --env-file .env pull
    docker-compose -f docker-compose.yml --env-file .env up -d
    ```
    *   `pull`: Downloads the latest images from the configured registry.
    *   `up -d`: Starts the containers using the pulled images.

## 5. Verify Deployment

1.  **Check container status:**
    ```bash
    docker-compose ps
    ```
    All services (`db`, `backend`, `frontend`) should be in the `Up` state.

2.  **View container logs (optional):**
    ```bash
    docker-compose logs -f backend
    docker-compose logs -f frontend
    ```
    Look for any error messages during startup.

3.  **Access the Application:**
    Open your web browser and navigate to your server's IP address or domain name. You should see the React frontend.
    *   `http://YOUR_SERVER_IP_OR_DOMAIN`

## 6. Securing Your Deployment (Critical for Production)

### 6.1. HTTPS with Nginx

It is **highly recommended** to serve your application over HTTPS. You can achieve this by configuring Nginx (the frontend server) to handle SSL termination.

1.  **Install Certbot:**
    ```bash
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
    ```

2.  **Stop Docker Compose (temporarily):**
    Certbot needs to bind to port 80/443.
    ```bash
    docker-compose down
    ```

3.  **Configure Nginx for Certbot:**
    Modify the `nginx/default.conf` file on your server. Replace `localhost` with your actual domain name. Add a server block for HTTP that redirects to HTTPS and includes the `.well-known` location for Certbot challenges.

    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name YOUR_DOMAIN.COM www.YOUR_DOMAIN.COM;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # This server block will be configured by Certbot for HTTPS
    # server {
    #     listen 443 ssl http2;
    #     listen [::]:443 ssl http2;
    #     server_name YOUR_DOMAIN.COM www.YOUR_DOMAIN.COM;
    #     # ... Certbot will add SSL directives here ...
    # }
    ```
    **Note:** For the `Dockerfile.frontend` to use this, you would need to mount `nginx/default.conf` as a volume or build a custom image with it. For dynamic Certbot integration, it's often easier to have a separate Nginx container (or host Nginx) outside of the application's `docker-compose.yml` that acts as a reverse proxy for the entire `cms-pro` stack. For simplicity in this guide, we'll assume Certbot modifies the Nginx config within the container. A more robust solution might use a separate Nginx container + certbot or Caddy.

4.  **Run Certbot to obtain SSL certificate:**
    ```bash
    sudo certbot --nginx -d YOUR_DOMAIN.COM -d www.YOUR_DOMAIN.COM
    ```
    Follow the prompts. Certbot will automatically modify your Nginx configuration.

5.  **Restart Docker Compose with Nginx configured for SSL:**
    Ensure your `nginx/default.conf` within the `frontend` container is updated by `certbot` or copy the generated certs.
    A simpler approach for Docker Compose is to let Nginx serve HTTP, and have an external Nginx/Load Balancer handle SSL termination. If you're using the Nginx `frontend` service directly for SSL, you'd have to ensure the `/etc/nginx/sites-enabled/default` (or similar) inside the container is updated with certs.

    **Simplified approach using Nginx outside Docker Compose (recommended for production without K8s):**
    Have a separate Nginx server on the host machine. Configure it to proxy requests to `localhost:80` (where `cms_frontend` runs). Then use Certbot to secure this host Nginx. This way, your `docker-compose.yml` doesn't need to change much for SSL.

### 6.2. Database Backups

Regular database backups are crucial.
*   Use `pg_dump` from within the `db` container or from a separate client:
    ```bash
    docker exec cms_db pg_dump -U cms_pro_user -d cms_pro_db > /path/to/backup/cms_pro_db_backup_$(date +%Y%m%d%H%M%S).sql
    ```
*   Automate this with a cron job.
*   Store backups off-site (S3, etc.).

### 6.3. Monitoring & Logging

*   **Centralized Logging:** Configure `backend` and `frontend` (if Nginx logs are needed) to send logs to a centralized logging system (e.g., ELK Stack, Grafana Loki, cloud-provider logging services).
*   **Monitoring:** Use tools like Prometheus and Grafana, or cloud-provider monitoring solutions, to track application health, resource utilization (CPU, memory), API response times, and error rates.

## 7. Updates and Rollbacks

*   **Updates:** When you push new code, your CI/CD pipeline should build new Docker images and push them to your registry. Then, on the server:
    ```bash
    cd cms-pro
    git pull origin main # If building on server
    docker-compose -f docker-compose.yml --env-file .env pull # If pulling from registry
    docker-compose -f docker-compose.yml --env-file .env up -d --remove-orphans
    ```
*   **Rollbacks:** If an update causes issues, you can revert to a previous working image tag in your `docker-compose.yml` and run `docker-compose up -d`. For database rollbacks, this is much more complex and requires a strong migration strategy with reversible migrations and backups.

---
```