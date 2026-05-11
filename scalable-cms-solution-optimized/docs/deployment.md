# CMS Production Deployment Guide

This guide outlines the steps to deploy the Enterprise CMS to a production environment using Docker, Docker Compose, and a cloud server (e.g., AWS EC2, DigitalOcean Droplet, Google Cloud VM).

## 1. Prerequisites

*   A Linux-based cloud server (e.g., Ubuntu 20.04+)
*   SSH access to the server with `sudo` privileges.
*   **Docker** and **Docker Compose** installed on the server.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)
*   **Git** installed on the server.
*   A domain name pointed to your server's IP address (optional, but highly recommended for HTTPS).
*   **Cloudflare** or similar CDN/DNS provider for easy SSL certificate management (e.g., using their proxy mode).
*   **GitHub Actions Secrets** configured for Docker Hub login and SSH access (as described in `README.md` and `.github/workflows/ci-cd.yml`).

## 2. Server Setup

### 2.1. Initial Server Configuration

1.  **SSH into your server:**
    ```bash
    ssh your_username@your_server_ip
    ```

2.  **Update and upgrade packages:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

3.  **Install Git:**
    ```bash
    sudo apt install git -y
    ```

4.  **Install Docker and Docker Compose (if not already):**
    Follow the official Docker documentation links provided in the prerequisites. After installation, add your user to the `docker` group to run Docker commands without `sudo`:
    ```bash
    sudo usermod -aG docker your_username
    newgrp docker # Apply group changes immediately
    ```
    You might need to log out and log back in for the changes to take effect.

### 2.2. Firewall Configuration (UFW)

Configure your firewall to allow necessary traffic.

```bash
sudo ufw allow OpenSSH         # To maintain SSH access
sudo ufw allow 80/tcp          # For HTTP (Nginx)
sudo ufw allow 443/tcp         # For HTTPS (Nginx) - if you configure SSL directly on Nginx
sudo ufw enable                # Enable the firewall
sudo ufw status                # Verify rules
```

## 3. Clone Repository & Environment Setup

1.  **Choose a deployment directory:**
    ```bash
    cd /opt # Or /var/www, or ~/cms-project
    sudo mkdir cms-project && sudo chown your_username:your_username cms-project
    cd cms-project
    ```

2.  **Clone your project repository:**
    ```bash
    git clone https://github.com/your-username/cms-project.git . # Clone into current directory
    ```

3.  **Create Production `.env` File:**
    Copy the `.env.example` to `.env` in the root of your cloned project:
    ```bash
    cp .env.example .env
    ```
    **Edit the `.env` file** with your production-specific, *strong*, and *secret* values:

    ```ini
    # .env for production
    # Database Configuration (PostgreSQL)
    # Important: Use strong, unique passwords for production!
    DB_USERNAME=your_prod_db_user
    DB_PASSWORD=YOUR_VERY_STRONG_DB_PASSWORD
    DB_DATABASE=cms_prod_db
    DB_HOST=db # This will be the name of the database service in docker-compose
    DB_PORT=5432

    # JWT Secret (VERY IMPORTANT: Use a long, random, and truly secret string)
    JWT_SECRET=YOUR_VERY_LONG_AND_RANDOM_JWT_SECRET_STRING_AT_LEAST_32_CHARS
    JWT_EXPIRES_IN=24h # Adjust as needed
    BCRYPT_SALT_ROUNDS=12 # Higher is more secure but slower for login

    # Caching (consider using Redis for multi-instance deployments)
    CACHE_TTL=600 # 10 minutes (in seconds)

    # Frontend URL (Important for CORS)
    FRONTEND_URL=https://your-domain.com # Match your production domain

    # Enable database migrations on backend startup for production
    # This automatically runs `sequelize.sync({ alter: true })`
    APPLY_MIGRATIONS=true
    ```
    **Never commit this `.env` file to your repository.**

## 4. Docker Compose Production Deployment

The `docker-compose.prod.yml` (provided as an example in `docker-compose.yml` section above) will be used for production.

1.  **Pull latest Docker images:**
    If you are using CI/CD to build and push images to Docker Hub (or a private registry), your server will pull them.
    ```bash
    docker-compose -f docker-compose.prod.yml pull
    ```
    If you're building locally on the server (less ideal for CI/CD), you'd use `docker-compose -f docker-compose.prod.yml build`.

2.  **Start the services in detached mode:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    ```
    *   `-f docker-compose.prod.yml`: Specifies the production Docker Compose file.
    *   `up`: Creates and starts containers.
    *   `-d`: Runs containers in detached mode.
    *   `--remove-orphans`: Removes containers for services not defined in the compose file.

3.  **Verify container status:**
    ```bash
    docker-compose -f docker-compose.prod.yml ps
    ```
    All services (`db`, `backend`, `frontend`) should be `Up`.

4.  **Check logs for errors:**
    ```bash
    docker-compose -f docker-compose.prod.yml logs -f
    ```
    Look for any `ERROR` messages during startup. Ensure the backend connects to the database, migrations run, and the frontend (Nginx) starts successfully.

## 5. Database Initialization (First-time Deployment)

On first-time deployment, the database needs to be created and seeded.
The `APPLY_MIGRATIONS=true` in `backend/.env` handles migrations. For seeding, you'd typically have a separate step.

1.  **Create the database (if it doesn't exist yet):**
    ```bash
    docker exec -it cms_backend npm run db:create
    ```
    This should create the `cms_prod_db` database if it doesn't already exist. The `APPLY_MIGRATIONS=true` will then handle the `db:migrate` on backend startup.

2.  **Run Seeders (first time only):**
    ```bash
    docker exec -it cms_backend npm run db:seed
    ```
    This will populate your database with initial users (admin, editor, viewer) and some sample posts. **Only run this ONCE for a fresh DB.**

## 6. HTTPS Configuration (Crucial for Production)

It is CRITICAL to serve your application over HTTPS in production.

### Option 1: Cloudflare Proxy (Recommended for simplicity)

1.  Point your domain's DNS to Cloudflare.
2.  In Cloudflare, create an `A` record for your domain (e.g., `your-domain.com`) and/or `www.your-domain.com` pointing to your server's IP address.
3.  Ensure the proxy status (cloud icon) is **enabled** for these records.
4.  Cloudflare will handle the SSL certificate and HTTPS termination. Your Nginx container will still serve over HTTP internally, but traffic from users will be encrypted.

### Option 2: Let's Encrypt with Certbot (Directly on Nginx)

If you prefer to manage SSL directly on your server:

1.  Ensure your domain is pointed directly to your server's IP (no Cloudflare proxy).
2.  Install Certbot: `sudo apt install certbot python3-certbot-nginx -y`
3.  Modify your `frontend/nginx/nginx.conf` to include a server block for HTTPS and redirect HTTP to HTTPS. Then mount this config into your Nginx container.
4.  Run Certbot: `sudo certbot --nginx -d your-domain.com -d www.your-domain.com`
5.  Certbot will automatically configure Nginx and renew certificates. This is more complex with Dockerized Nginx; you might need to use a separate `certbot` container or map the `/etc/nginx/conf.d` volume.

## 7. Continuous Deployment with GitHub Actions

As configured in `.github/workflows/ci-cd.yml`, a push to the `main` branch (after passing all tests) will:

1.  Build and push updated Docker images to Docker Hub.
2.  SSH into your production server.
3.  Pull the latest Docker images.
4.  Restart the `docker-compose` services with the new images.

To enable this:

1.  Ensure you have correctly configured the GitHub Actions Secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SSH_HOST`, `SSH_USERNAME`, `SSH_KEY`).
2.  Ensure your SSH key on the server (`~/.ssh/authorized_keys`) contains the public key corresponding to the `SSH_KEY` secret.
3.  Push changes to your `main` branch to trigger a deployment.

## 8. Post-Deployment Checks

*   Access `https://your-domain.com` (or `http://your-server-ip:80` temporarily) in your browser.
*   Verify frontend loads.
*   Check browser developer tools for any network errors.
*   Try logging in with `admin@example.com` / `admin123` (or the credentials from your seed data).
*   Test creating/editing a post.
*   Monitor server resource usage (CPU, Memory) over time.
*   Review backend logs for errors (`docker-compose -f docker-compose.prod.yml logs backend`).

## 9. Rollback Strategy

In case of a failed deployment:

*   **Docker Compose**: You can revert to a previous working image tag by editing `docker-compose.prod.yml` and running `docker-compose -f docker-compose.prod.yml up -d`.
*   **Database**: If a migration caused issues, `docker exec -it cms_backend npm run db:migrate:undo` might rollback the last migration, but ensure you have backups. **Always back up your database before major deployments!**

This guide provides a solid foundation for deploying your CMS. Depending on your traffic and specific needs, further enhancements like load balancing, advanced monitoring, and managed database services might be considered.
```