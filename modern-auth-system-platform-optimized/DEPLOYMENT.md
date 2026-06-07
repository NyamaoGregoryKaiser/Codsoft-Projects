```markdown
# Deployment Guide: Comprehensive Authentication System

This document provides detailed instructions for deploying the Comprehensive Authentication System to a production environment. The recommended approach leverages Docker and Docker Compose for containerization and simplifies environment management.

## 1. Prerequisites

Before starting the deployment, ensure your target server meets the following requirements:

*   **Operating System**: A Linux distribution (e.g., Ubuntu, CentOS) is recommended.
*   **Docker Engine**: Installed and running. Follow the official Docker documentation for installation.
*   **Docker Compose**: Installed.
*   **Git**: For cloning the repository.
*   **SSH Access**: You will need SSH access to your server.
*   **Firewall Configuration**: Ensure that ports `80` (for frontend Nginx) and `8080` (for backend Spring Boot, if directly exposed) are open and accessible to the public, or configured as per your network setup.
*   **Domain Name**: A registered domain name (e.g., `yourdomain.com`) and DNS records configured to point to your server's IP address (A record).
*   **SSL/TLS Certificate**: **Crucial for production.** Obtain an SSL/TLS certificate (e.g., from Let's Encrypt using Certbot) for your domain to enable HTTPS. This guide assumes you will configure Nginx to handle SSL termination.

## 2. Server Setup Steps

### 2.1. Initial Server Configuration

1.  **Connect to your server via SSH**:
    ```bash
    ssh your_username@your_server_ip
    ```
2.  **Update system packages**:
    ```bash
    sudo apt update && sudo apt upgrade -y # For Ubuntu/Debian
    # Or: sudo yum update -y # For CentOS/RHEL
    ```
3.  **Install Docker and Docker Compose**:
    Follow the official Docker documentation for your specific Linux distribution:
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)
    Ensure your user is added to the `docker` group to run Docker commands without `sudo`:
    ```bash
    sudo usermod -aG docker $USER
    newgrp docker # Apply group changes
    ```
    (You might need to log out and log back in for the changes to take effect.)

### 2.2. Create Deployment Directory

Choose a suitable directory on your server for the project files.
```bash
sudo mkdir -p /opt/auth-system
sudo chown -R $USER:$USER /opt/auth-system
cd /opt/auth-system
```

### 2.3. Clone Repository & Get Files

You can either clone the entire repository or just copy the necessary files. For simplicity and to use the `docker-compose.yml`, cloning is usually easier.

```bash
git clone https://github.com/your-username/authentication-system.git . # Clone into current directory
```
If you only want specific files from the repository's root and don't want the `.git` directory on your server, you can manually copy `docker-compose.yml` and the `frontend/nginx/nginx.conf` file, and ensure your `Dockerfile`s are correct.

**Important**: Make sure the `frontend/nginx/nginx.conf` file is present in a `nginx` subdirectory within your `frontend` directory in the deployment path, as referenced by the `frontend/Dockerfile`.

### 2.4. Configure Production Environment Variables (`.env`)

Create a `.env` file in your deployment directory (`/opt/auth-system/.env`). This file will hold sensitive configuration for your production environment.

```env
# Database Configuration
DB_NAME=your_prod_authdb
DB_USER=your_prod_user
DB_PASSWORD=your_super_strong_db_password

# JWT Secret Key - CRITICAL: GENERATE A NEW, STRONG, UNIQUE KEY FOR PRODUCTION!
# You can generate a 256-bit base64-encoded key using: openssl rand -base64 32
JWT_SECRET_KEY=YOUR_VERY_STRONG_AND_UNIQUE_256BIT_BASE64_ENCODED_JWT_SECRET_KEY

# Frontend API Base URL (accessible from frontend container)
# If backend is exposed directly via port 8080 on the host:
# REACT_APP_API_BASE_URL=http://your_domain.com:8080/api
# If backend is behind a reverse proxy (recommended for production):
REACT_APP_API_BASE_URL=https://api.your_domain.com/api # Use HTTPS
```
**Seriously, generate a fresh `JWT_SECRET_KEY` that is long and random.** Never use the default from the `application.yml` in production.

### 2.5. Configure Nginx Reverse Proxy and SSL (Recommended for Production)

For production, it's best practice to put your backend behind a reverse proxy (like Nginx) and handle SSL termination there. This `docker-compose.yml` serves the React app with Nginx. For the backend, you would typically add another Nginx configuration outside of Docker Compose, on the host, to proxy requests to `localhost:8080`.

**Example Nginx Host Configuration for HTTPS (for `your_domain.com`)**:

1.  **Install Nginx on the host**:
    ```bash
    sudo apt install nginx -y # For Ubuntu/Debian
    # Or: sudo yum install nginx -y # For CentOS/RHEL
    ```
2.  **Obtain SSL Certificate (e.g., with Certbot)**:
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d your_domain.com -d api.your_domain.com
    ```
    Follow the prompts. This will automatically configure Nginx for HTTPS.
3.  **Edit Nginx configuration file**:
    Create or edit `/etc/nginx/sites-enabled/auth-system.conf`:
    ```nginx
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        listen [::]:80;
        server_name your_domain.com api.your_domain.com;
        return 301 https://$host$request_uri;
    }

    # Frontend Server (HTTPS)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name your_domain.com;

        ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
        ssl_trusted_certificate /etc/letsencrypt/live/your_domain.com/chain.pem; # Optional, good for full chain

        # Include common SSL settings
        include /etc/nginx/snippets/ssl-params.conf; # You might need to create this for hardening

        location / {
            proxy_pass http://localhost:3000; # Forward to frontend Docker container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            # Potentially use proxy_buffering off; for streaming if needed
        }
    }

    # Backend API Server (HTTPS)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name api.your_domain.com;

        ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
        ssl_trusted_certificate /etc/letsencrypt/live/your_domain.com/chain.pem;

        include /etc/nginx/snippets/ssl-params.conf;

        location / {
            proxy_pass http://localhost:8080; # Forward to backend Docker container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            # Required for WebSocket/SSE if your backend uses them for some features
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    ```
    *   **Adjust `your_domain.com` and `api.your_domain.com`** to your actual domain.
    *   **Ensure `ssl-params.conf` exists or remove the `include` line.** A good default for `ssl-params.conf` can be found in Certbot's generated files or security hardening guides.
    *   **Disable/Remove default Nginx config**: `sudo rm /etc/nginx/sites-enabled/default`
    *   **Test Nginx config**: `sudo nginx -t`
    *   **Reload Nginx**: `sudo systemctl reload nginx`

## 3. Deployment with Docker Compose

1.  **Navigate to your deployment directory**:
    ```bash
    cd /opt/auth-system
    ```

2.  **Log in to Docker Hub (if using private images or pushing)**:
    ```bash
    docker login -u your_docker_username
    ```
    Enter your Docker Hub password when prompted. If your CI/CD pushes to a private registry, ensure your server can authenticate.

3.  **Build and Start Services**:
    ```bash
    docker-compose pull # Pull pre-built images from Docker Hub if your CI/CD pushed them
    docker-compose up -d --build --remove-orphans
    ```
    *   `pull`: Downloads the latest images from your configured Docker registry (e.g., Docker Hub).
    *   `up -d`: Starts the services in detached mode (background).
    *   `--build`: Rebuilds images even if they exist (useful for ensuring latest changes).
    *   `--remove-orphans`: Removes containers for services not defined in the Compose file.

    **Note**: The `frontend/Dockerfile` has an `ARG REACT_APP_API_BASE_URL`. If you are using the CI/CD to build the frontend image, ensure this argument is passed during the build stage in your workflow (as shown in the example CI/CD). If building locally on the server, the `.env` variable will be picked up.

4.  **Verify Services**:
    ```bash
    docker-compose ps
    docker-compose logs -f
    ```
    Check the logs for any errors. You should see `auth_db` (PostgreSQL), `auth_backend` (Spring Boot), and `auth_frontend` (Nginx for React) containers running.

## 4. Post-Deployment Checks

1.  **Access your application**:
    *   Frontend: `https://your_domain.com`
    *   Backend API: `https://api.your_domain.com/api` (if using Nginx reverse proxy)
    *   Swagger UI: `https://api.your_domain.com/swagger-ui/index.html`

2.  **Test functionality**:
    *   Register a new user.
    *   Log in with existing `admin@example.com`/`admin123` and `user@example.com`/`user123`.
    *   Access protected resources on the dashboard and admin pages.
    *   Verify roles are correctly enforced.

3.  **Monitor logs**:
    Keep an eye on the `docker-compose logs` and your Nginx error logs (`/var/log/nginx/error.log`) for any issues.

## 5. Updates and Maintenance

To deploy new versions:

1.  **Push changes to `main` branch** (if using GitHub Actions CI/CD to push Docker images).
2.  **SSH into your server**.
3.  **Navigate to deployment directory**: `cd /opt/auth-system`
4.  **Pull latest images and restart services**:
    ```bash
    docker-compose pull
    docker-compose up -d --build --remove-orphans
    ```
    This pulls any updated images and recreates/restarts containers with zero downtime if configured for rolling updates (though `docker-compose up` might have brief downtime).

## 6. Important Security Considerations

*   **Strong Passwords**: Ensure all users (including database users) use strong, unique passwords.
*   **JWT Secret Key**: **NEVER** expose your JWT secret key. Store it securely in environment variables on your server. Rotate it periodically.
*   **HTTPS**: Always use HTTPS in production. Configure Nginx with SSL/TLS certificates.
*   **Firewall**: Restrict access to ports (e.g., allow SSH only from trusted IPs, allow web traffic only on 80/443). Consider blocking direct access to 8080 if Nginx is proxying.
*   **Docker Security**: Regularly update Docker, apply security best practices for Dockerfiles (e.g., non-root users, minimal base images), and scan images for vulnerabilities.
*   **Database Security**: Never expose your database directly to the internet. Configure strong database user permissions.
*   **Regular Backups**: Implement a strategy for regular database backups.
*   **Monitoring & Alerting**: Set up robust monitoring for application health, performance, and security events.

By following this guide, you should be able to deploy your comprehensive authentication system to a production environment.
```