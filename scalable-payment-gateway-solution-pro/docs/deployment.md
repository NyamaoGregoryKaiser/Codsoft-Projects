# Deployment Guide for Payment Processing System

This guide outlines the steps to deploy the Payment Processing System to a production environment using Docker and a reverse proxy.

## 1. Prerequisites

*   A Linux server (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine) with:
    *   Docker installed (`sudo apt update && sudo apt install docker.io -y`)
    *   Docker Compose installed (`sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose`)
    *   Git installed
    *   SSH access
*   A domain name pointed to your server's IP address (e.g., `api.yourdomain.com` for backend, `app.yourdomain.com` for frontend).
*   A container registry (e.g., Docker Hub, AWS ECR) for storing your Docker images (optional but recommended for CI/CD).

## 2. Prepare the Server

1.  **SSH into your server:**
    ```bash
    ssh your_user@your_server_ip
    ```

2.  **Install Docker and Docker Compose** (if not already installed, see prerequisites).

3.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/payment-processing-system.git
    cd payment-processing-system
    ```

4.  **Create `.env` file for production:**
    Copy the `.env.example` to `.env` in the project root.
    ```bash
    cp .env.example .env
    ```
    **Edit `.env` for production settings:**
    *   `NODE_ENV=production`
    *   `PORT=5000` (Backend internal port)
    *   **DB Configuration:** Ensure `DB_HOST` is `db` (the service name in `docker-compose.yml`), and use strong, unique credentials.
    *   **JWT Secret:** Generate a *very long, complex, and random* string for `JWT_SECRET`. Store this securely.
    *   **Frontend URL:** If your backend needs to allow CORS from a specific frontend URL (e.g., `https://app.yourdomain.com`), set `FRONTEND_URL`.
    *   **React App Backend URL:** Set `REACT_APP_BACKEND_URL` to your production backend API endpoint (e.g., `https://api.yourdomain.com/api/v1`).

    **Example `.env` (production):**
    ```
    NODE_ENV=production
    PORT=5000

    DB_HOST=db
    DB_PORT=5432
    DB_USER=produser
    DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
    DB_NAME=prod_payment_db

    JWT_SECRET=YOUR_SUPER_LONG_AND_RANDOM_JWT_SECRET_STRING_IN_PRODUCTION_NEVER_SHARE_THIS
    JWT_ACCESS_EXPIRATION_MINUTES=30
    JWT_REFRESH_EXPIRATION_DAYS=7

    FRONTEND_URL=https://app.yourdomain.com
    REACT_APP_BACKEND_URL=https://api.yourdomain.com/api/v1
    ```

## 3. Configure Reverse Proxy (Caddy recommended for simplicity with SSL)

For production, you need a reverse proxy (like Caddy or Nginx) to handle SSL termination, routing, and potentially serving the frontend static files. Caddy is simpler as it automates SSL certificate management.

### **`Caddyfile`** (in project root)
```nginx