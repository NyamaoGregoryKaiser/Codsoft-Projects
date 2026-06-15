```markdown
# Deployment Guide: Enterprise Product Catalog System

This document provides a comprehensive guide for deploying the Enterprise Product Catalog System to various environments. The system is designed for containerized deployment, making it portable and scalable.

---

## Table of Contents

1.  [Deployment Strategy Overview](#1-deployment-strategy-overview)
2.  [Prerequisites for Deployment](#2-prerequisites-for-deployment)
3.  [Building and Pushing Docker Images](#3-building-and-pushing-docker-images)
4.  [Environment Configuration](#4-environment-configuration)
5.  [Database Deployment](#5-database-deployment)
6.  [Deployment to a Single Host (Docker Compose)](#6-deployment-to-a-single-host-docker-compose)
7.  [Deployment to Kubernetes (Conceptual)](#7-deployment-to-kubernetes-conceptual)
    *   [Kubernetes Manifests (Conceptual)](#kubernetes-manifests-conceptual)
    *   [Secrets Management](#secrets-management)
    *   [Deployment Steps](#deployment-steps)
8.  [CI/CD for Deployment](#8-cicd-for-deployment)
9.  [Post-Deployment Checks](#9-post-deployment-checks)
10. [Rollback Strategy](#10-rollback-strategy)
11. [Monitoring and Logging](#11-monitoring-and-logging)

---

## 1. Deployment Strategy Overview

The primary deployment strategy for the Product Catalog System is container-based, utilizing Docker images.

*   **Containerization:** The application is packaged into a Docker image, ensuring consistent environments across development, testing, and production.
*   **Orchestration:** Docker Compose is used for local development and can be adapted for single-host deployments. Kubernetes is the recommended solution for production-grade deployments due to its capabilities for scaling, self-healing, and service discovery.
*   **CI/CD:** GitHub Actions automates the build, test, and deployment process, ensuring rapid and reliable releases.
*   **Immutable Infrastructure:** Deploying new Docker images for updates rather than modifying existing containers.

## 2. Prerequisites for Deployment

### General
*   **Git:** To clone the repository.
*   **Docker Engine:** Installed on all target deployment hosts.
*   **Docker Compose:** For single-host deployments.
*   **Container Registry Account:** (e.g., Docker Hub, AWS ECR, GCR) to store and pull Docker images.
*   **Cloud Provider Account (Optional):** AWS, GCP, Azure, etc., if deploying to cloud.

### For Kubernetes Deployments
*   **Kubernetes Cluster:** A running Kubernetes cluster (e.g., EKS, GKE, AKS, or self-managed).
*   **`kubectl`:** Configured to interact with your cluster.
*   **Helm (Optional):** For managing Kubernetes deployments via charts.

## 3. Building and Pushing Docker Images

The CI/CD pipeline (GitHub Actions) handles this automatically on `push` to `main` or `develop` branches.

**Manual Build & Push:**

1.  **Build the Docker image:**
    ```bash
    docker build -t your-docker-registry/product-catalog-service:latest .
    # For a specific version/SHA:
    # docker build -t your-docker-registry/product-catalog-service:v1.0.0 .
    # docker build -t your-docker-registry/product-catalog-service:$(git rev-parse --short HEAD) .
    ```
    Replace `your-docker-registry` with your actual registry path (e.g., `myusername/` for Docker Hub, `123456789012.dkr.ecr.us-east-1.amazonaws.com/` for ECR).

2.  **Log in to your Docker registry:**
    ```bash
    docker login your-docker-registry
    # Example for Docker Hub: docker login
    ```

3.  **Push the image:**
    ```bash
    docker push your-docker-registry/product-catalog-service:latest
    # docker push your-docker-registry/product-catalog-service:v1.0.0
    ```

## 4. Environment Configuration

Configuration is managed via `config/app_config.json` and environment variables. For different environments (development, staging, production), use environment variables to override sensitive or environment-specific settings.

**Key Environment Variables (from `.env.example`):**

*   `DB_HOST`: Database host (e.g., `localhost` for Docker Compose, or `db-service.mynamespace.svc.cluster.local` for Kubernetes).
*   `DB_PORT`: Database port.
*   `DB_USER`: Database username.
*   `DB_PASSWORD`: Database password.
*   `DB_NAME`: Database name.
*   `APP_PORT`: Application listening port.
*   `APP_LOG_LEVEL`: Logging level (e.g., `INFO`, `WARN`, `ERROR`).
*   `JWT_SECRET`: Secret key for JWT signing. **CRITICAL: Use strong, unique secrets for each environment.**
*   `CACHE_PRODUCT_TTL`: TTL for product cache.
*   `RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`: Rate limiting settings.

**Best Practices for Production Secrets:**

*   **Never hardcode secrets.**
*   **Use environment variables in containers.**
*   **For Kubernetes:** Use `Secrets` objects.
*   **For Cloud:** Use dedicated secrets management services (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault).

## 5. Database Deployment

The PostgreSQL database should be deployed and managed separately from the application service.

1.  **Provision a PostgreSQL Instance:**
    *   **Cloud Managed Service:** (Recommended for production) AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL.
    *   **Self-Managed on VM/Container:** Install PostgreSQL on a dedicated server or container (ensure persistent storage).

2.  **Database Initialization:**
    The `db/migrations/V1__initial_schema.sql` and `db/seed.sql` files are used for database initialization and migrations.

    *   **Docker Compose:** The `docker-compose.yml` mounts these files to `/docker-entrypoint-initdb.d/` in the PostgreSQL container, which automatically executes them on first startup.
    *   **Managed Service/External DB:** You will need to manually execute these SQL scripts using `psql` or a database management tool after provisioning the database.
        ```bash
        psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -f db/migrations/V1__initial_schema.sql
        psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -f db/seed.sql
        ```
    *   **Schema Migrations:** For managing schema changes over time, integrate a dedicated database migration tool like [Flyway](https://flywaydb.org/) or [Liquibase](https://www.liquibase.org/). The provided SQL files are structured in a Flyway-like manner.

## 6. Deployment to a Single Host (Docker Compose)

This is suitable for staging environments, small-scale deployments, or proof-of-concept setups.

1.  **SSH into your deployment server.**
2.  **Install Docker and Docker Compose.**
3.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/product-catalog-system.git
    cd product-catalog-system
    ```
4.  **Create a `.env` file:**
    ```bash
    cp .env.example .env
    # Edit .env with production-specific values (e.g., strong DB_PASSWORD, JWT_SECRET)
    ```
    *If you use a managed database service, update `DB_HOST` and `DB_PORT` in `.env` to point to your external database instead of the `db` service.*
5.  **Start the services:**
    ```bash
    docker-compose -f docker-compose.yml up -d --build
    ```
    *   Ensure the `APP_PORT` in `.env` (default 8080) is open in your server's firewall.
    *   If using an external database, remove the `db` service section from `docker-compose.yml` or comment it out.

6.  **Verify deployment:**
    ```bash
    docker-compose ps
    curl http://localhost:8080/health # If a health endpoint were implemented
    ```

## 7. Deployment to Kubernetes (Conceptual)

Kubernetes is the preferred choice for production deployments due to its robust features for scaling, self-healing, service discovery, and declarative management.

### Kubernetes Manifests (Conceptual)

You would create Kubernetes YAML manifest files for:
*   **Deployment:** For the Product Catalog Service (e.g., `product-catalog-service-deployment.yaml`).
*   **Service:** To expose the deployment within the cluster (e.g., `product-catalog-service-svc.yaml`).
*   **Ingress:** To expose the service externally via a Load Balancer (e.g., `product-catalog-service-ingress.yaml`).
*   **Secret:** For sensitive environment variables (e.g., `db-credentials-secret.yaml`, `jwt-secret.yaml`).
*   **ConfigMap:** For non-sensitive application configurations.
*   **Persistent Volume Claim (PVC):** If you are running PostgreSQL inside Kubernetes (less common for production, managed DBs are preferred).

**Example `product-catalog-service-deployment.yaml` (simplified):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-catalog-service
  labels:
    app: product-catalog
spec:
  replicas: 3 # Run multiple instances for high availability
  selector:
    matchLabels:
      app: product-catalog
  template:
    metadata:
      labels:
        app: product-catalog
    spec:
      containers:
      - name: product-catalog-service
        image: your-docker-registry/product-catalog-service:latest # Use a specific tag like SHA or version
        ports:
        - containerPort: 8080
        env: # Non-sensitive config can go here or in a ConfigMap
        - name: APP_PORT
          value: "8080"
        - name: APP_LOG_LEVEL
          value: "INFO"
        - name: DB_HOST # Point to your external/managed DB service
          value: "your-managed-db.c1m0g9h3k.us-east-1.rds.amazonaws.com"
        - name: DB_PORT
          value: "5432"
        envFrom: # Load secrets from Kubernetes Secret objects
        - secretRef:
            name: product-catalog-db-secrets
        - secretRef:
            name: product-catalog-app-secrets
        livenessProbe: # Health check to restart unhealthy containers
          httpGet:
            path: /health # Implement a /health endpoint in your app
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe: # Health check to determine if container is ready to serve traffic
          httpGet:
            path: /health # Implement a /health endpoint in your app
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
      imagePullSecrets: # If your registry requires authentication
      - name: regcred # A secret containing Docker registry credentials
```

### Secrets Management

Create Kubernetes Secret objects for sensitive environment variables (DB credentials, JWT secret).

**Example `product-catalog-db-secrets.yaml` (apply this *before* deployment):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: product-catalog-db-secrets
type: Opaque
stringData: # Use stringData for clear text if applying manually, kubectl will base64 encode
  DB_USER: "product_user"
  DB_PASSWORD: "YOUR_VERY_STRONG_DB_PASSWORD"
  DB_NAME: "product_catalog_prod"
```

**Example `product-catalog-app-secrets.yaml`:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: product-catalog-app-secrets
type: Opaque
stringData:
  JWT_SECRET: "YOUR_VERY_STRONG_JWT_SECRET_FOR_PROD"
```

### Deployment Steps

1.  **Apply Secrets:**
    ```bash
    kubectl apply -f product-catalog-db-secrets.yaml
    kubectl apply -f product-catalog-app-secrets.yaml
    ```
2.  **Apply Deployment and Service:**
    ```bash
    kubectl apply -f product-catalog-service-deployment.yaml
    kubectl apply -f product-catalog-service-svc.yaml
    ```
3.  **Apply Ingress (if external access needed):**
    ```bash
    kubectl apply -f product-catalog-service-ingress.yaml
    ```
4.  **Monitor Deployment:**
    ```bash
    kubectl get deployments
    kubectl get pods -l app=product-catalog
    kubectl logs -f <pod-name> -c product-catalog-service
    ```
5.  **Rollout Status:**
    ```bash
    kubectl rollout status deployment/product-catalog-service
    ```

## 8. CI/CD for Deployment

The `.github/workflows/ci-cd.yml` file contains a commented-out `deploy` job. To enable it:

1.  **Uncomment the `deploy` job.**
2.  **Configure GitHub Secrets:**
    *   `DOCKER_USERNAME`, `DOCKER_PASSWORD`: For pushing to your container registry.
    *   `PROD_SERVER_HOST`, `PROD_SERVER_USER`, `PROD_SERVER_SSH_KEY`: If deploying to a VM via SSH.
    *   Or, configure cloud provider specific secrets (e.g., AWS IAM credentials for EKS deployment).
3.  **Customize the deployment script:** Adjust the `script` in the `appleboy/ssh-action` (or use a Kubernetes action) to match your target environment (e.g., `kubectl apply`, `helm upgrade`, `docker-compose up`).

## 9. Post-Deployment Checks

After any deployment, perform these checks:

*   **Application Logs:** Check that the application starts without errors and logs are being generated correctly.
*   **Health Endpoints:** Verify that your application's health endpoint (if implemented, e.g., `/health`) returns a `200 OK`.
*   **API Connectivity:** Use `curl` or Postman to test core API endpoints (e.g., login, get products).
*   **Resource Utilization:** Monitor CPU, memory, and network usage of the deployed containers.
*   **Database Connectivity:** Confirm that the application can connect to the database and perform operations.

## 10. Rollback Strategy

In case of a faulty deployment:

*   **Docker Compose:**
    ```bash
    # If the previous image tag is known:
    docker-compose -f docker-compose.yml stop app
    docker tag your-docker-registry/product-catalog-service:<previous-good-tag> your-docker-registry/product-catalog-service:latest
    docker-compose -f docker-compose.yml up -d --no-deps app
    ```
*   **Kubernetes:**
    ```bash
    kubectl rollout undo deployment/product-catalog-service
    # Or to a specific revision:
    # kubectl rollout undo deployment/product-catalog-service --to-revision=<revision-number>
    ```
    Always keep a history of deployed Docker image tags.

## 11. Monitoring and Logging

Crucial for production environments.

*   **Logging:**
    *   Ensure all application logs are aggregated into a centralized logging system (e.g., ELK Stack, Splunk, DataDog, Loki).
    *   Configure log rotation and retention policies.
*   **Monitoring:**
    *   **Application Metrics:** Collect metrics like request latency, error rates, active connections, and business-specific metrics. (Prometheus/Grafana, DataDog).
    *   **Infrastructure Metrics:** Monitor CPU, memory, disk I/O, network usage of hosts and containers.
    *   **Alerting:** Set up alerts for critical errors, performance degradation, or service outages.
*   **Tracing:** Implement distributed tracing (e.g., OpenTelemetry, Jaeger, Zipkin) for visibility into complex microservice interactions.

---
```