# 🚀 Deployment Guide: Database Optimization System

This document outlines the steps to deploy the Database Optimization System to a production environment. The recommended approach is using Docker Compose for local/small-scale deployments and a cloud provider with container orchestration (like Kubernetes) or managed services (like Render, AWS ECS, Google Cloud Run) for larger, production-grade deployments.

## 1. Environment Setup

### 1.1 Production `.env` File

Create a production-ready `.env` file in the root of your project. **This file should NOT be committed to version control.**

*   **Database Credentials**: Use strong, unique passwords for your PostgreSQL database.
*   **JWT Secrets**: Generate long, complex, truly random strings for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`.
*   **Collector Schedule**: Adjust `COLLECTOR_SCHEDULE_CRON` based on how frequently you need to collect and analyze data. In production, this might be less frequent (e.g., every 30 mins or hourly) to reduce load.
*   **Log Level**: Set `LOG_LEVEL` to `info` or `warn` for production to avoid excessive debug logging.
*   **Frontend API URL**: Ensure `REACT_APP_API_URL` points to your deployed backend's URL.

```ini
# .env (production example)
POSTGRES_DB=optimizer_db
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=YOUR_PROD_DB_PASSWORD_HERE # VERY IMPORTANT: CHANGE THIS!

# Backend Specific
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://prod_user:YOUR_PROD_DB_PASSWORD_HERE@your-db-host.com:5432/optimizer_db?schema=public"
JWT_SECRET=VERY_LONG_RANDOM_SECRET_KEY_FOR_JWT # IMPORTANT: GENERATE A NEW ONE
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=ANOTHER_VERY_LONG_RANDOM_SECRET_KEY # IMPORTANT: GENERATE A NEW ONE
REFRESH_TOKEN_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000 # Adjust based on expected traffic
LOG_LEVEL=info
CACHE_TTL_SECONDS=3600
COLLECTOR_SCHEDULE_CRON="0 */1 * * *" # Every hour
SLOW_QUERY_THRESHOLD_MS=1000 # Threshold for what constitutes a "slow" query

# Frontend Specific
REACT_APP_API_URL=https://your-backend-api.com/api # Point to your deployed backend URL
```

### 1.2 Database Provisioning

For production, it's highly recommended to use a **managed PostgreSQL database service** (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL, DigitalOcean Managed PostgreSQL). This offloads database management, backups, scaling, and high-availability concerns.

*   Provision a PostgreSQL database instance.
*   Note down its connection string, host, port, username, and password. Update your `DATABASE_URL` in the `.env` file accordingly.

## 2. Docker-based Deployment (General Steps)

The `Dockerfile`s and `docker-compose.yml` are configured for development. For production, some adjustments are needed.

### 2.1 Backend Production Dockerfile (`backend/Dockerfile`)

The provided `backend/Dockerfile` is already suitable for production with `CMD ["npm", "start"]`. During the CI/CD build, `npm install` and `npx prisma generate` are executed.

### 2.2 Frontend Production Dockerfile (`frontend/Dockerfile`)

The provided `frontend/Dockerfile` uses a multi-stage build:
1.  **Build Stage**: Builds the React application into static assets.
2.  **Production Stage**: Serves the static assets using Nginx, which is highly efficient for static content.

Ensure `REACT_APP_API_URL` is correctly set during the build stage (either via `ARG` in Dockerfile or directly in `.env` if copying that).

### 2.3 Production `docker-compose.yml` (Example)

For a production `docker-compose.yml`, you would typically remove development-specific mounts (`./backend:/app`, `npm run dev`), map external volumes for persistent data (logs, uploads if any), and configure a managed database instead of a local `db` service.

```yaml
# docker-compose.prod.yml (example for a single server deployment)
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    env_file:
      - ./.env # Mount your production .env file
    ports:
      - "5000:5000"
    command: sh -c "npx prisma migrate deploy && npm start" # Apply migrations, then start
    # volumes:
    #   - /path/to/backend/logs:/app/logs # Mount for persistent logs if needed
    # healthcheck: # Add health checks for better orchestration
    #   test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
    #   interval: 30s
    #   timeout: 10s
    #   retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    env_file:
      - ./.env # Make REACT_APP_API_URL available
    ports:
      - "80:3000" # Map to port 80 for public access
    # volumes:
    #   - /path/to/frontend/nginx-logs:/var/log/nginx # Optional: for Nginx logs
    # healthcheck:
    #   test: ["CMD-SHELL", "curl -f http://localhost:80 || exit 1"]
    #   interval: 30s
    #   timeout: 10s
    #   retries: 3
```

**Deployment Steps for Docker Compose**:

1.  Place the `docker-compose.prod.yml` and `.env` files on your server.
2.  Build and run: `docker-compose -f docker-compose.prod.yml up --build -d`
3.  Ensure your server's firewall allows traffic on ports 80 (for frontend) and 5000 (for backend, if directly exposed).
4.  Configure a reverse proxy (e.g., Nginx, Caddy) if you need SSL termination, domain routing, or advanced load balancing.

## 3. Cloud Deployment (Examples)

### 3.1 Render (Managed Container Service)

Render is a good choice for deploying Dockerized applications with managed databases and zero-downtime deployments.

**Steps**:

1.  **PostgreSQL Database**: Create a Render Managed PostgreSQL service. Note its internal and external connection URLs.
2.  **Backend Service**:
    *   Create a new Render Web Service.
    *   Connect your GitHub repository.
    *   **Build Command**: `npm install && npx prisma migrate deploy && npm run build` (or similar, depending on how you structure your build for deployment; typically `npm install` and `prisma migrate deploy` are enough before `npm start`).
    *   **Start Command**: `npm start`
    *   **Environment Variables**: Add all variables from your production `.env` file, ensuring `DATABASE_URL` uses Render's internal PostgreSQL connection string.
    *   **Health Check Path**: `/api/health`
    *   **Deploy Hook**: Set up a deploy hook and add its URL to GitHub Secrets (e.g., `RENDER_BACKEND_DEPLOY_HOOK`) for the CI/CD pipeline.
3.  **Frontend Service**:
    *   Create a new Render Static Site.
    *   Connect your GitHub repository.
    *   **Build Command**: `npm install && npm run build` (working directory `frontend`).
    *   **Publish Directory**: `frontend/build`
    *   **Environment Variables**: Set `REACT_APP_API_URL` to your deployed Backend Service's URL.
    *   **Deploy Hook**: Set up a deploy hook and add its URL to GitHub Secrets (e.g., `RENDER_FRONTEND_DEPLOY_HOOK`).

### 3.2 AWS ECS / Fargate (Container Orchestration)

For more control and scalability on AWS:

1.  **VPC, Subnets, Security Groups**: Set up your network infrastructure.
2.  **AWS RDS**: Provision a PostgreSQL instance.
3.  **ECR (Elastic Container Registry)**: Build and push your Docker images (`backend` and `frontend`) to ECR. Your CI/CD pipeline can automate this.
4.  **ECS Cluster**: Create an ECS cluster.
5.  **Task Definitions**:
    *   Create separate task definitions for the backend and frontend.
    *   Specify container images from ECR.
    *   Pass environment variables (from AWS Secrets Manager or Parameter Store for sensitive data).
    *   Define health checks.
6.  **ECS Services**:
    *   Create an ECS service for each task definition.
    *   Configure desired count, networking mode (Fargate recommended).
    *   **Backend**: Place behind an Application Load Balancer (ALB).
    *   **Frontend**: Place behind an ALB, configure static file serving or integrate with AWS S3 + CloudFront if Nginx container is not used.
7.  **ALB (Application Load Balancer)**: Set up listeners (HTTP/HTTPS) and target groups to route traffic to your ECS services. Configure SSL certificates.
8.  **CI/CD Integration**: Update GitHub Actions to build Docker images, push to ECR, and then trigger ECS service updates (e.g., using `aws-actions/amazon-ecs-deploy-task-definition`).

### 3.3 Google Cloud Run (Serverless Containers)

Cloud Run is a fully managed platform for stateless containers that are invocable via web requests.

1.  **Cloud SQL for PostgreSQL**: Provision a PostgreSQL instance.
2.  **Container Registry / Artifact Registry**: Build and push your Docker images.
3.  **Cloud Run Services**:
    *   Create a new Cloud Run service for the backend. Point it to your backend Docker image.
    *   Configure environment variables.
    *   For the frontend, you can deploy it as a separate Cloud Run service (serving Nginx) or deploy the static build files to **Cloud Storage** and serve them via **Cloud CDN**.
4.  **Load Balancing**: Use Cloud Load Balancing for custom domains, SSL, and routing to your Cloud Run services.
5.  **CI/CD Integration**: Configure GitHub Actions to build and push to Container Registry, then deploy to Cloud Run (e.g., using `google-github-actions/deploy-cloudrun`).

## 4. Post-Deployment Steps

1.  **Run Migrations & Seed Data**:
    *   If using Docker Compose with the provided `command` in `docker-compose.yml`, migrations and seeding run automatically.
    *   For managed services, you might need a separate job or a pre-deploy hook to run `npx prisma migrate deploy` and `node seed.js` (for initial setup). **Be careful not to re-seed in production on every deploy if it's not idempotent