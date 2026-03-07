```markdown
# Payment Processor System - Deployment Guide

This document outlines the steps and considerations for deploying the Payment Processor System to a production environment. The system is designed for containerized deployment, primarily using Docker and Docker Compose for orchestration. For cloud environments, Kubernetes is the recommended platform.

## 1. Deployment Strategy

The recommended deployment strategy involves:

1.  **Containerization:** Using Docker to package the FastAPI application, PostgreSQL, and Redis.
2.  **Orchestration:** Docker Compose for local development and potentially small-scale deployments. Kubernetes for production-grade, scalable, and resilient deployments in cloud environments.
3.  **CI/CD Pipeline:** Automating builds, tests, and deployments using GitHub Actions (as provided in `.github/workflows/ci-cd.yml`).
4.  **Cloud Provider:** AWS, Google Cloud, Azure, or any other cloud provider supporting container orchestration.

## 2. Prerequisites for Production Deployment

*   **Cloud Account:** Access to a cloud provider (e.g., AWS, GCP, Azure).
*   **Container Registry:** A private Docker registry (e.g., Docker Hub, AWS ECR, GCP Container Registry) to store your application's Docker images.
*   **Kubernetes Cluster:** (Recommended for scale) A running Kubernetes cluster (EKS, GKE, AKS, or self-managed).
*   **Terraform/CloudFormation/Pulumi:** (Recommended) Infrastructure as Code tool for managing cloud resources.
*   **Monitoring Tools:** Prometheus/Grafana, Datadog, New Relic, etc.
*   **Logging Aggregation:** ELK Stack, Splunk, CloudWatch Logs, Stackdriver Logging.
*   **Secrets Management:** AWS Secrets Manager, GCP Secret Manager, Vault, Kubernetes Secrets (with encryption-at-rest).

## 3. Production Environment Configuration

Create a production `.env` file (or manage environment variables via your cloud provider's secrets management):

*   **`APP_ENV=production`**: Crucial for enabling production-specific logging, error reporting, etc.
*   **`DATABASE_URL`**: Full connection string to your managed PostgreSQL instance (e.g., AWS RDS, GCP Cloud SQL).
*   **`SECRET_KEY`**: A very strong, long, and securely stored secret for JWT. **DO NOT commit this to Git.**
*   **`REDIS_HOST`**: Hostname of your managed Redis instance (e.g., AWS ElastiCache, GCP Memorystore).
*   **`ADMIN_EMAIL`, `ADMIN_PASSWORD`**: Remove or manage these for initial setup through secure means, do not hardcode in production environment variables for regular operation.
*   **Other sensitive keys**: Any API keys for external payment gateways, monitoring services, etc.

## 4. Deployment Steps (General Outline)

### 4.1. Build and Push Docker Image

1.  **Ensure `Dockerfile` is optimized for production:**
    *   Multi-stage builds (if needed, though current Dockerfile is quite lean).
    *   No development dependencies.
    *   Non-root user (important for security).
    *   Correct `CMD` (e.g., using `gunicorn` with `uvicorn.workers.UvicornWorker` for multi-process handling).
2.  **Authenticate to your container registry:**
    ```bash
    docker login your-registry.com
    ```
3.  **Build the Docker image:**
    ```bash
    docker build -t your-registry.com/payment-processor:latest .
    docker build -t your-registry.com/payment-processor:${GITHUB_SHA} . # Tag with commit hash for traceability
    ```
4.  **Push the image to the registry:**
    ```bash
    docker push your-registry.com/payment-processor:latest
    docker push your-registry.com/payment-processor:${GITHUB_SHA}
    ```
    *This step is typically handled by your CI/CD pipeline.*

### 4.2. Database Setup

1.  **Provision a Managed PostgreSQL Instance:** Use a cloud provider's managed database service (AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL). This handles backups, scaling, and high availability.
2.  **Configure Networking:** Ensure your application instances can securely connect to the database (e.g., via VPC private subnets, security groups).
3.  **Apply Migrations:** Run `alembic upgrade head` against the production database. This should be done carefully during deployment, ideally as a step in your CI/CD or using a dedicated migration container/job.
    ```bash
    # Example using docker exec or a temporary container
    docker run --rm \
      -e DATABASE_URL="<production_db_url>" \
      your-registry.com/payment-processor:${GITHUB_SHA} \
      alembic upgrade head
    ```

### 4.3. Redis Setup

1.  **Provision a Managed Redis Instance:** Use a cloud provider's managed Redis service (AWS ElastiCache, GCP Memorystore).
2.  **Configure Networking:** Similar to the database, ensure secure connectivity.

### 4.4. Deploying the Application

#### Option A: Kubernetes (Recommended for Scale)

1.  **Kubernetes Manifests:** Create `Deployment`, `Service`, `Ingress`, `ConfigMap`, and `Secret` manifests for your application.
    *   **Deployment:** Defines how many replicas of your FastAPI app to run.
    *   **Service:** Exposes your application internally within the cluster.
    *   **Ingress:** Manages external access to the service, including SSL termination and load balancing.
    *   **ConfigMap:** Stores non-sensitive configuration (e.g., `APP_ENV`).
    *   **Secret:** Stores sensitive information (`SECRET_KEY`, `DATABASE_URL`, API keys) securely.
2.  **Apply Manifests:** Use `kubectl apply -f <your-manifests-dir>/` to deploy.
    ```bash
    kubectl apply -f k8s/
    ```
3.  **Monitor Deployment:**
    ```bash
    kubectl get pods -l app=payment-processor
    kubectl logs -f <pod-name>
    ```

#### Option B: Docker Compose (For smaller deployments, single server)

While `docker-compose.yml` is primarily for development, a modified version can be used for small-scale production on a single server:

1.  **SSH into your server.**
2.  **Install Docker and Docker Compose.**
3.  **Copy `docker-compose.yml` and `.env` (production version) to the server.**
4.  **Pull the latest images:**
    ```bash
    docker-compose pull
    ```
5.  **Run migrations (as a separate step or container):**
    ```bash
    docker-compose run --rm app alembic upgrade head
    ```
6.  **Start services:**
    ```bash
    docker-compose up -d
    ```
7.  **Configure a reverse proxy (Nginx/Caddy):** To handle SSL, expose on port 80/443, and proxy requests to the FastAPI container's port 8000.

#### Option C: PaaS (Platform as a Service)

Consider platforms like Render, Heroku, Google App Engine, AWS Elastic Beanstalk for simplified deployment. These platforms often handle container orchestration, scaling, and database provisioning automatically. You would typically provide your `Dockerfile` and `requirements.txt`, and configure environment variables through their UI.

## 5. Security Best Practices

*   **Secrets Management:** Never hardcode secrets. Use environment variables and a dedicated secrets management service (AWS Secrets Manager, Kubernetes Secrets, HashiCorp Vault).
*   **Network Security:** Implement strict firewall rules (security groups, network policies) to limit access to databases, Redis, and internal services. Use VPCs and private subnets.
*   **SSL/TLS:** Enforce HTTPS for all API communication. Use an Ingress controller or load balancer to manage SSL certificates.
*   **Least Privilege:** Configure IAM roles/service accounts with the minimum necessary permissions for your application to interact with cloud resources.
*   **Vulnerability Scanning:** Regularly scan Docker images for known vulnerabilities.
*   **Dependency Updates:** Keep Python packages and Docker base images up-to-date to patch security vulnerabilities.
*   **Web Application Firewall (WAF):** Consider a WAF (e.g., AWS WAF, Cloudflare) to protect against common web exploits.
*   **Audit Logging:** Ensure all critical actions are logged with sufficient detail for auditing and forensics.

## 6. Monitoring and Logging

*   **Centralized Logging:** Aggregate application logs (from FastAPI, Uvicorn/Gunicorn) into a centralized logging system (e.g., ELK Stack, CloudWatch Logs, Datadog).
*   **Metrics & Dashboards:** Collect application metrics (request rates, error rates, latency, transaction processing times) using Prometheus/Grafana, Datadog, New Relic. Instrument FastAPI with a metrics library (e.g., `fastapi-metrics`).
*   **Alerting:** Set up alerts for critical errors, performance degradation, and security events.
*   **Tracing:** Implement distributed tracing (e.g., OpenTelemetry) to track requests across services (FastAPI, Payment Gateway, Redis, PostgreSQL).

## 7. Scaling

*   **Horizontal Scaling:** Scale FastAPI replicas horizontally based on CPU utilization or request queue length.
*   **Database Scaling:** Use read replicas for PostgreSQL to offload read traffic. Consider connection pooling.
*   **Redis Scaling:** Redis can be scaled for higher throughput and availability.
*   **Asynchronous Tasks:** For long-running or background tasks (e.g., complex analytics, scheduled reports), integrate a task queue like Celery with Redis or RabbitMQ. Webhook dispatching is already an async operation in this design.

## 8. Backup and Recovery

*   **Database Backups:** Configure automated daily backups for your PostgreSQL instance. Test restoration procedures regularly.
*   **Disaster Recovery:** Plan for regional outages by deploying to multiple availability zones or regions, and having a recovery strategy.

This guide provides a robust framework for deploying the Payment Processor System. Always adapt these recommendations to your specific cloud provider, organizational policies, and security requirements.
```