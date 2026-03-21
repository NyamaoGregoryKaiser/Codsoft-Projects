# E-commerce System Deployment Guide

This document outlines the general steps and considerations for deploying the E-commerce system to a production environment. The recommended approach leverages Docker containers for portability and ease of management.

## 1. Deployment Strategy

The suggested deployment strategy involves:

*   **Containerization**: Both frontend and backend applications are containerized using Docker.
*   **Orchestration**: Docker Compose is used for local development, but for production, container orchestrators like **Docker Swarm** or **Kubernetes** are recommended for managing multiple instances, load balancing, and self-healing capabilities.
*   **Cloud Platform**: A cloud provider (e.g., AWS, GCP, Azure) is typically used to host the infrastructure.
*   **Database**: Managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL, GCP Cloud SQL) for high availability, backups, and scalability.
*   **Caching**: Managed Redis service (e.g., AWS ElastiCache, Azure Cache for Redis, GCP Memorystore for Redis).
*   **Static Assets/CDN**: Frontend built assets can be served efficiently via a CDN (e.g., AWS S3 + CloudFront).

## 2. Prerequisites for Production Deployment

*   **Cloud Account**: Access to a cloud provider account.
*   **Domain Name**: A registered domain name pointing to your application's load balancer/CDN.
*   **SSL/TLS Certificate**: Essential for HTTPS (e.g., AWS Certificate Manager, Let's Encrypt).
*   **Docker Registry**: A private Docker registry (e.g., Docker Hub, AWS ECR, GCP Container Registry) to store your built Docker images.
*   **CI/CD Pipeline**: Configured to automate builds, tests, and deployments (e.g., GitHub Actions, GitLab CI/CD, Jenkins).
*   **Monitoring & Logging**: Setup for aggregate logging (e.g., ELK Stack, CloudWatch Logs) and application performance monitoring (APM - e.g., Prometheus/Grafana, Datadog).

## 3. Deployment Steps

### Step 3.1: Configure Environment Variables

Create production-specific `.env` files (or use a secrets management service in your cloud provider) for both backend and frontend.

*   **`backend/.env` (Production)**:
    *   `NODE_ENV=production`
    *   `PORT=5000` (or internal port if behind a proxy)
    *   `DATABASE_URL="<your_production_postgres_connection_string>"` (from managed DB service)
    *   `REDIS_URL="<your_production_redis_connection_string>"` (from managed Redis service)
    *   `JWT_SECRET=super_strong_production_jwt_secret` (generate a long, random, secure string)
    *   `BCRYPT_SALT_ROUNDS=12` (or higher)
    *   `CORS_ORIGIN=https://your-frontend-domain.com` (your actual frontend domain)
    *   `ADMIN_EMAIL=admin@your-domain.com`
    *   `ADMIN_PASSWORD=super_strong_admin_password` (use a password manager or vault)
    *   `RUN_SEEDS=false` (do NOT run seeds automatically in production)

*   **`frontend/.env` (Production)**:
    *   `REACT_APP_API_BASE_URL=https://api.your-backend-domain.com/api/v1` (your actual backend API domain)

### Step 3.2: Database Setup

1.  **Provision Managed PostgreSQL**: Set up a managed PostgreSQL instance (e.g., AWS RDS).
2.  **Database Migrations**: Run the database migrations against the production database.
    *   From your CI/CD pipeline or a secure jump host:
        ```bash
        # Ensure your backend/.env is correctly configured for the production DB
        cd backend
        npm install --production # Install dependencies
        npx knex migrate:latest --knexfile src/database/knexfile.js
        ```
3.  **Initial Seed Data (Optional)**: If you need initial data (e.g., categories, an admin user), run seeds *once* and carefully.
    ```bash
    npx knex seed:run --knexfile src/database/knexfile.js
    ```
    Remember `RUN_SEEDS=false` in `backend/.env` to prevent accidental re-seeding on application startup.

### Step 3.3: Build and Push Docker Images

1.  **Backend Image**:
    ```bash
    cd backend
    docker build -t your-registry/ecommerce-backend:latest .
    docker push your-registry/ecommerce-backend:latest
    ```
2.  **Frontend Image**:
    ```bash
    cd frontend
    docker build -t your-registry/ecommerce-frontend:latest .
    docker push your-registry/ecommerce-frontend:latest
    ```
    Replace `your-registry` with your actual Docker registry URL. Consider using Git commit SHAs as tags for versioning (e.g., `ecommerce-backend:git-sha-12345`).

### Step 3.4: Provision Managed Redis

Set up a managed Redis instance (e.g., AWS ElastiCache).

### Step 3.5: Deploy Backend Application

Choose your orchestration method (Kubernetes, Docker Swarm, ECS, etc.) and deploy the backend Docker image.

**Example (Conceptual for Kubernetes)**:

1.  Create Kubernetes Deployment for the backend, referencing your Docker image and setting environment variables as secrets or config maps.
2.  Create Kubernetes Service to expose the backend pods internally.
3.  Set up an Ingress controller (e.g., Nginx Ingress, AWS ALB Ingress) to expose the backend service to the internet via HTTPS, mapping `api.your-backend-domain.com` to your backend service.
4.  Configure health checks, scaling policies (Horizontal Pod Autoscaler), and resource limits.

### Step 3.6: Deploy Frontend Application

The frontend is a static React application that can be served efficiently via a CDN.

**Example (AWS S3 + CloudFront)**:

1.  Build the React application (this is part of your CI workflow):
    ```bash
    cd frontend
    npm run build
    ```
2.  Upload the contents of the `build` directory to an S3 bucket configured for static website hosting.
3.  Configure AWS CloudFront (CDN) to serve content from this S3 bucket.
4.  Point your frontend domain (`your-frontend-domain.com`) to the CloudFront distribution.
5.  Ensure HTTPS is enforced using an SSL certificate (e.g., from AWS Certificate Manager).

### Step 3.7: Logging and Monitoring

*   **Backend**: Configure your Node.js application (Winston) to send logs to a centralized logging system (e.g., CloudWatch Logs, Splunk, ELK stack).
*   **Infrastructure**: Monitor your database, Redis, and container orchestrator for performance and errors.
*   **APM**: Consider integrating Application Performance Monitoring tools (e.g., Datadog, New Relic) for deeper insights into application behavior.

## 4. Post-Deployment Checks

*   **Health Checks**: Verify all services are running and healthy (e.g., `GET /` endpoint on backend).
*   **Application Functionality**: Test user registration, login, product browsing, and other key features.
*   **Authentication**: Ensure JWTs are correctly issued, used, and refreshed.
*   **Authorization**: Test admin and user-specific endpoints to confirm RBAC is enforced.
*   **Database Connectivity**: Verify API can read/write to the production database.
*   **Caching**: Confirm Redis caching is working as expected.
*   **HTTPS**: Ensure all traffic is served over HTTPS.
*   **Logs**: Check centralized logs for errors or warnings.
*   **Performance**: Run basic load tests if possible or monitor initial traffic.

## 5. Rollback Strategy

Always have a rollback strategy. With containerized deployments, this often involves:

*   **Immutable Infrastructure**: Deploying new versions rather than updating existing containers.
*   **Versioned Images**: Tagging Docker images with commit SHAs or semantic versions.
*   **Orchestrator Rollback**: Using features of your orchestrator (e.g., `kubectl rollout undo` for Kubernetes) to revert to a previous working deployment.
*   **Database Backups**: Regular database backups and a plan for point-in-time recovery.

This guide provides a high-level overview. Specific commands and configurations will vary based on your chosen cloud provider and orchestration tools.