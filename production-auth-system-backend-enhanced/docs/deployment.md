# Deployment Guide

This document provides a high-level guide for deploying the Enterprise-Grade Authentication System to a production environment. The steps assume familiarity with cloud platforms (e.g., AWS, Azure, GCP) or a VPS provider, and container orchestration (e.g., Docker, Kubernetes).

## 1. Prerequisites

*   **Cloud Provider Account:** AWS, Azure, GCP, DigitalOcean, etc.
*   **Domain Name:** Configured with DNS records pointing to your services.
*   **CI/CD System:** (Optional but recommended) GitHub Actions, GitLab CI, Jenkins.
*   **Docker & Docker Compose:** For building and running containers.
*   **Basic Linux/Server Administration Knowledge.**
*   **Security Best Practices:** Knowledge of network security, firewalls, and secrets management.

## 2. Environment Configuration

### 2.1. Environment Variables

*   Ensure all sensitive information (database credentials, JWT secrets, API keys) are stored as environment variables in your production environment, not hardcoded.
*   **Backend (`backend/.env`):**
    *   `NODE_ENV=production`
    *   `PORT=5000` (or desired port)
    *   `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (These should point to your *production* PostgreSQL instance.)
    *   `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`
    *   `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`
    *   `CORS_ORIGIN=https://your-frontend-domain.com`
    *   `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
    *   `LOG_LEVEL=info` (or `error` for less verbose logs)
*   **Frontend (`frontend/.env.local` - for build process, potentially bundled by CI/CD):**
    *   `REACT_APP_API_BASE_URL=https://your-backend-api-domain.com/api/v1` (or `https://your-frontend-domain.com/api/v1` if proxied by frontend Nginx).

### 2.2. Secrets Management

*   Do NOT commit `.env` files to version control.
*   Use your cloud provider's secret management service (e.g., AWS Secrets Manager, Azure Key Vault, GCP Secret Manager) or a tool like HashiCorp Vault.
*   For CI/CD, use encrypted secrets (e.g., GitHub Actions Secrets).

## 3. Production Database Setup

1.  **Provision a Managed PostgreSQL Database:** Use a managed service (AWS RDS, Azure Database for PostgreSQL, GCP Cloud SQL) for high availability, backups, and ease of management.
2.  **Configure Networking:** Ensure your backend service can securely connect to the database (e.g., via VPC/private link or strict firewall rules).
3.  **Run Migrations:** After deploying your backend code and confirming connectivity to the production database, run the database migrations.
    ```bash
    # Example if SSHing into a backend server/container:
    cd /app/backend # Or wherever your backend code is
    npm install # Ensure dev dependencies are installed for TypeORM CLI
    npm run migrate
    ```
    *   **Automate:** Ideally, this step is part of your CI/CD pipeline after a successful deploy.

## 4. Building Production Images

The provided `docker/backend.Dockerfile` and `docker/frontend.Dockerfile` are suitable for production builds.

1.  **Backend Image:**
    ```bash
    docker build -t auth-backend:latest -f docker/backend.Dockerfile .
    ```
2.  **Frontend Image:**
    ```bash
    docker build -t auth-frontend:latest -f docker/frontend.Dockerfile .
    ```
3.  **Push to Container Registry:** Push these images to a container registry (Docker Hub, AWS ECR, GCP Container Registry, Azure Container Registry).
    ```bash
    docker tag auth-backend:latest your-registry/auth-backend:latest
    docker push your-registry/auth-backend:latest
    # Repeat for frontend
    ```

## 5. Deployment Options

### Option A: Single VM / EC2 Instance (Simpler, less scalable)

1.  **Provision a VM:** Create a Linux VM (e.g., Ubuntu, CentOS) on your cloud provider.
2.  **Install Docker & Docker Compose:**
3.  **Copy `docker-compose.yml` (production version):**
    *   Modify `docker-compose.yml` to use your production image tags from the registry.
    *   Remove `volumes` for source code hot-reloading.
    *   Ensure Nginx config is correct (e.g., `proxy_pass` uses service names).
    *   Adjust port mappings if necessary.
4.  **Load Environment Variables:** Use `.env` file or environment variables on the host.
5.  **Start Services:**
    ```bash
    docker-compose -f docker/docker-compose.yml up -d
    ```
6.  **Configure Nginx/Load Balancer:** For HTTPS, you'll need to configure Nginx to use SSL certificates (e.g., Let's Encrypt with Certbot).

### Option B: Kubernetes (More scalable, complex)

1.  **Provision a Kubernetes Cluster:** AWS EKS, Azure AKS, GCP GKE, or self-managed.
2.  **Create Kubernetes Manifests:** Convert your Docker Compose setup into Kubernetes deployments, services, ingresses, config maps, and secrets.
    *   **Deployments:** For backend, frontend, database (or external managed DB).
    *   **Services:** To expose backend and frontend deployments.
    *   **Ingress:** To expose HTTP/S routes to the internet, handle SSL termination, and route traffic to frontend/backend services.
    *   **ConfigMaps/Secrets:** For environment variables and sensitive data.
    *   **Persistent Volumes:** For database data if self-hosting PostgreSQL in Kubernetes.
3.  **Apply Manifests:**
    ```bash
    kubectl apply -f your-kubernetes-manifests/
    ```
4.  **Monitor:** Set up Kubernetes monitoring tools.

### Option C: Serverless/PaaS (Platform-as-a-Service)

*   **Backend:** AWS Fargate, Azure App Service, Google Cloud Run, Heroku.
    *   These platforms can often deploy Docker images directly or support Node.js applications.
    *   You'll need to configure environment variables and database connections.
*   **Frontend:** AWS S3 + CloudFront, Netlify, Vercel, Azure Static Web Apps, Google Firebase Hosting.
    *   These services are ideal for serving static React applications. Configure redirects for client-side routing.

## 6. Continuous Integration/Continuous Deployment (CI/CD)

The `.github/workflows/ci.yml` file provides a basic CI/CD setup for GitHub Actions.

### Production CI/CD Enhancements:

1.  **Automated Builds & Pushing to Registry:** After successful tests, the pipeline should build production Docker images and push them to your chosen container registry.
2.  **Automated Deployment:** On merges to `main` (or a `release` branch), trigger an automated deployment to your staging/production environment. This might involve:
    *   Updating Kubernetes manifests with new image tags.
    *   Triggering a rolling update on Kubernetes.
    *   Notifying a PaaS service to redeploy.
    *   Running `docker-compose pull` and `docker-compose up -d` on a VM.
3.  **Environment-Specific Variables:** Configure CI/CD secrets for different environments (staging, production).
4.  **Health Checks & Rollbacks:** Implement robust health checks in your deployments. Have a rollback strategy in case of deployment failures.
5.  **Monitoring & Alerts:** Integrate with monitoring systems (Prometheus, Grafana, CloudWatch, DataDog) to alert on errors, performance issues, or security incidents.

## 7. Post-Deployment Checklist

*   **HTTPS:** Ensure all traffic is served over HTTPS.
*   **Firewall Rules:** Restrict incoming traffic to only necessary ports (e.g., 443 for web, specific ports for SSH/management). Database ports should only be accessible from backend services.
*   **Logging:** Verify that logs are being collected and stored appropriately (e.g., into a centralized logging system).
*   **Monitoring:** Set up application performance monitoring (APM) and infrastructure monitoring.
*   **Backups:** Ensure regular database backups are configured and tested.
*   **Security Audits:** Regularly scan for vulnerabilities, both at the code level and infrastructure level.
*   **Secrets Rotation:** Plan for regular rotation of API keys, database passwords, and JWT secrets.
*   **Rate Limiting:** Confirm rate limiting is active and configured correctly for production traffic.

By following these guidelines, you can achieve a robust and secure deployment of your authentication system.