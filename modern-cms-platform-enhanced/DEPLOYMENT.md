```markdown
# NimbusCMS Deployment Guide

This guide outlines the steps to deploy the NimbusCMS application to a production environment using Docker and a basic CI/CD pipeline (GitHub Actions).

## 1. Prerequisites for Production Server

Before deploying, ensure your production server has:

*   **Docker Engine & Docker Compose:** Installed and configured.
*   **Git:** For cloning the repository.
*   **Firewall Rules:** Configured to allow traffic on ports 80 (HTTP) or 443 (HTTPS) for the frontend, and optionally 5000 (or your chosen backend port) if you need direct access to the backend API from outside the Docker network.
*   **Reverse Proxy (Optional but Recommended):** Nginx or Caddy outside Docker for SSL termination, load balancing, and static file serving (though frontend Docker serves static files internally).
*   **Domain Name:** Pointing to your server's IP address.
*   **SSL Certificate:** (e.g., Let's Encrypt) for HTTPS.

## 2. Environment Variables

In production, it's crucial to manage environment variables securely. Do **not** commit your `.env` files to source control.

1.  **Create `.env` files:** On your production server, create the `nimbus-cms/.env` file with the following structure. These variables will be picked up by `docker-compose.yml`.

    ```bash
    # nimbus-cms/.env
    # ---