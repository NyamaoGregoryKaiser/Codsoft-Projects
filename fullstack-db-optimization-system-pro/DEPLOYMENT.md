```markdown
# Deployment Guide

This document provides instructions for deploying the Database Optimizer Dashboard application to a production environment.

## 1. Prerequisites

-   A cloud provider account (e.g., AWS, GCP, Azure, DigitalOcean).
-   A Docker Registry (e.g., Docker Hub, AWS ECR, GCP GCR) to store your Docker images.
-   A CI/CD system (e.g., GitHub Actions, Jenkins, GitLab CI) configured to push images and trigger deployments.
-   Domain name configured with appropriate DNS records.
-   HTTPS certificate (e.g., Let's Encrypt).

## 2. Production Environment Services

For a production deployment, we recommend the following services:

-   **Compute**:
    -   **Backend**: AWS EC2/ECS/EKS, GCP Compute Engine/GKE, Azure App Service/AKS.
    -   **Frontend**: AWS S3 + CloudFront, GCP Cloud Storage + CDN, Nginx + Compute Engine/EC2.
-   **Databases**:
    -   **Optimizer Dashboard's DB**: Managed PostgreSQL service (AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL).
    -   **Target DB (for monitoring)**: Your existing application's database (could be self-hosted or managed).
-   **Caching**: Managed Redis service (AWS ElastiCache, GCP Memorystore, Azure Cache for Redis).
-   **Logging**: Centralized logging solution (e.g., AWS CloudWatch, GCP Cloud Logging, ELK Stack).
-   **Monitoring**: Prometheus + Grafana for metrics collection and visualization.

## 3. Deployment Steps

### Step 3.1: Configure Environment Variables

Create production `.env` files for both `backend` and `frontend`. These variables will be injected into your deployed containers/services.

**`backend/.env` (Production)**
```dotenv
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com

# PostgreSQL for the Optimizer Dashboard itself
DB_DIALECT=postgres
DB_HOST=your-managed-db-endpoint # e.g., optimizer-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=optimizer_db
DB_USER=optimizer_user
DB_PASSWORD=YOUR_PROD_DB_PASSWORD # Use strong, unique password!

# JWT
JWT_SECRET=YOUR_VERY_STRONG_JWT_SECRET # Generate a long, random string
JWT_EXPIRES_IN=1h

# Redis
REDIS_URL=redis://your-managed-redis-endpoint:6379 # e.g., your-redis.xxxx.use1.cache.amazonaws.com:6379
```

**`frontend/.env` (Production)**
```dotenv
REACT_APP_API_BASE_URL=https://your-backend-api-domain.com/api
```

### Step 3.2: Database Setup

1.  **Create Managed PostgreSQL Instance**: Provision a managed PostgreSQL instance for the `optimizer_db`.
2.  **Configure Access**: Ensure your backend service has network access to this database.
3.  **Run Migrations**: On first deployment or schema changes, run the database migrations. This can be done via your CI/CD pipeline as part of deployment or manually:
    ```bash
    # From your backend directory (after installing dependencies)
    export DB_DIALECT=postgres
    export DB_HOST=your-managed-db-endpoint
    # ... set other DB_ env vars ...
    npx sequelize-cli db:migrate
    npx sequelize-cli db:seed:all # (Optional) Seed initial data like admin user
    ```

### Step 3.3: Build and Push Docker Images

Modify your CI/CD pipeline (`.github/workflows/main.yml`) to:

1.  **Log in to Docker Registry**:
    ```yaml
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    ```
    (Or login to AWS ECR, GCP GCR etc., using respective actions).

2.  **Build and Push Backend Image**:
    ```yaml
    - name: Build and Push Backend Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile
        push: true
        tags: your-docker-registry/database-optimizer-backend:latest
        build-args: |
          NODE_ENV=production
    ```

3.  **Build and Push Frontend Image**:
    ```yaml
    - name: Build and Push Frontend Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        file: ./frontend/Dockerfile
        push: true
        tags: your-docker-registry/database-optimizer-frontend:latest
        build-args: |
          REACT_APP_API_BASE_URL=${{ env.REACT_APP_API_BASE_URL }}
    ```
    Ensure `REACT_APP_API_BASE_URL` is correctly set in your CI/CD environment or directly passed via `build-args`.

### Step 3.4: Deploy Services

This step is highly dependent on your chosen cloud provider and compute service.

**Example: Deploying to AWS ECS (Fargate)**

1.  **Create ECS Cluster**: Set up an ECS cluster.
2.  **Define Task Definitions**: Create task definitions for your backend and frontend services.
    -   Specify the Docker images from your registry.
    -   Map container ports (e.g., 5000 for backend, 3000 for frontend).
    -   Pass environment variables.
    -   Configure CPU and memory.
3.  **Create ECS Services**:
    -   For **Backend**: Create an ECS service running the backend task definition. Associate it with an Application Load Balancer (ALB).
    -   For **Frontend**: You could:
        -   Create an ECS service running the frontend image (e.g., `nginx` or `serve` image serving static files) and associate it with the ALB.
        -   *Alternatively (recommended for static sites)*: Build the frontend, upload the `build` directory to an S3 bucket, and serve via AWS CloudFront CDN. This is often more cost-effective and performs better.
4.  **Networking**: Configure VPC, subnets, security groups to allow traffic between ALB and ECS services, and from ECS services to RDS/ElastiCache.
5.  **DNS & HTTPS**: Configure Route 53 to point your domains to the ALB. Install SSL certificates (e.g., via AWS Certificate Manager) on the ALB for HTTPS.

**General Deployment Considerations:**

-   **Reverse Proxy/Load Balancer**: Use a service like Nginx, AWS ALB, or GCP Load Balancer to handle traffic distribution, SSL termination, and possibly static file serving for the frontend.
-   **Logging**: Integrate with your cloud provider's logging service (e.g., CloudWatch Logs) from your Docker containers.
-   **Monitoring**: Set up Prometheus/Grafana or cloud-native monitoring tools to track application health, resource usage, and API performance.
-   **Secrets Management**: Do NOT hardcode sensitive information like `JWT_SECRET` or database passwords. Use a secrets manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault). Your CI/CD should pull these secrets.
-   **Backup & Restore**: Implement regular backups for your managed PostgreSQL database.
-   **Rollback Strategy**: Ensure your deployment process supports quick rollbacks to previous stable versions.

---
```