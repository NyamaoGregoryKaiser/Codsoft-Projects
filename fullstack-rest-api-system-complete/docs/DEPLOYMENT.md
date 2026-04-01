# Horizon PMS: Deployment Guide

This document provides a general guide for deploying the Horizon PMS application to a production environment. The specific steps may vary depending on your chosen cloud provider (AWS, GCP, Azure, DigitalOcean, etc.) and orchestration tools (Kubernetes, Docker Swarm, ECS, etc.).

## 1. Prerequisites

*   **Cloud Provider Account:** e.g., AWS, Google Cloud, Azure, DigitalOcean.
*   **Domain Name:** Configured with DNS records pointing to your server/load balancer.
*   **Docker Registry:** (e.g., Docker Hub, AWS ECR, GCP Container Registry) to store your built Docker images.
*   **CI/CD Configuration:** Ensure your `.github/workflows/ci-cd.yml` (or equivalent) is set up to build and push production-ready Docker images to your chosen registry.
*   **SSL/TLS Certificate:** Essential for HTTPS in production.

## 2. Production Environment Setup

Regardless of your cloud provider, a typical production setup will involve the following components:

*   **Virtual Machines / Containers:** To run the backend and frontend services.
*   **Managed Database Service:** For PostgreSQL (e.g., AWS RDS, GCP Cloud SQL). This is highly recommended over running PostgreSQL in a Docker container on your application server for reliability, backups, and scalability.
*   **Managed Cache Service:** For Redis (e.g., AWS ElastiCache, GCP Memorystore). Similar to the database, a managed service is preferred.
*   **Load Balancer:** To distribute traffic across multiple instances of your frontend and backend, handle SSL termination, and provide a single entry point.
*   **File Storage:** (Optional, if your application handles user-uploaded files) e.g., AWS S3, GCP Cloud Storage. (Not explicitly used in this project but good to consider).
*   **Monitoring & Logging:** Centralized logging (e.g., ELK Stack, CloudWatch Logs, Stackdriver Logging) and monitoring (e.g., Prometheus/Grafana, Datadog).

## 3. Deployment Steps (General)

### 3.1. Configure Production Environment Variables

Create a production `.env` file (or use your cloud provider's secrets manager) with secure values. **Never commit sensitive production `.env` files to Git.**

**Example `backend/.env` for production:**

```dotenv
NODE_ENV=production
PORT=3000
SECRET_KEY=YOUR_VERY_LONG_AND_COMPLEX_PRODUCTION_JWT_SECRET_KEY
REFRESH_SECRET_KEY=YOUR_VERY_LONG_AND_COMPLEX_PRODUCTION_JWT_REFRESH_SECRET_KEY
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Database Configuration (from your managed DB service)
DB_HOST=your-production-db-endpoint.com
DB_PORT=5432
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=horizon_pms_db

# Redis Configuration (from your managed Redis service)
REDIS_HOST=your-production-redis-endpoint.com
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Example `frontend/.env` for production:**

```dotenv
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
```

### 3.2. Set Up Managed Services