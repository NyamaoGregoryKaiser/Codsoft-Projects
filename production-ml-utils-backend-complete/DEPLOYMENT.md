# ML Utilities System - Deployment Guide

This document provides instructions for deploying the ML Utilities System to a production environment. The provided `docker-compose.yml` is suitable for local development and can serve as a starting point for single-host deployments. For highly available and scalable deployments, cloud-native orchestration tools like Kubernetes are recommended.

## 1. Local Deployment with Docker Compose (for testing/demo)

This is covered in the `README.md` under "Setup and Installation".

**Steps:**
1.  **Prerequisites**: Docker and Docker Compose installed.
2.  **Clone**: `git clone --recurse-submodules <repo-url>`
3.  **Configure**: Create `backend/.env` and `frontend/.env` based on examples. Ensure `JWT_SECRET` is strong.
4.  **Build & Run**: `docker-compose build` then `docker-compose up -d` (for detached mode).
5.  **Access**: Frontend at `http://localhost:3000`, Backend API at `http://localhost:8080`.

**Persistent Data**: The `backend/data` directory is mounted as a volume, so your SQLite database (`db.sqlite3`) will persist across container restarts.

## 2. Production Deployment Considerations

For a production environment, several aspects need careful consideration:

### 2.1. Environment Variables

*   **Secure Management**: Use a secret management service (e.g., AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, Kubernetes Secrets) to store sensitive environment variables (like `JWT_SECRET`, actual database credentials).
*   **Specific Values**: Set production-specific values for `APP_ENV=production`, `LOG_LEVEL=info` (or `warn`/`error`), appropriate `CACHE_TTL_SECONDS`, and `RATE_LIMIT` values.

### 2.2. Database

*   **SQLite Limitation**: SQLite is generally not recommended for high-concurrency, multi-instance production web applications due to potential locking issues and lack of network access.
*   **Recommended Alternatives**:
    *   **PostgreSQL / MySQL**: Deploy a managed database service (e.g., AWS RDS, Azure Database for PostgreSQL/MySQL, Google Cloud SQL) or a self-hosted clustered database.
    *   **Migration**: You would need to update `DatabaseManager.cpp` to use a `libpq` (PostgreSQL) or `mysql-connector-cpp` client library and adapt the SQL queries if necessary.
*   **Migrations in Production**: Automate migration application during deployment, but ensure robust rollback strategies.

### 2.3. Container Registry

*   **Push Images**: After building your Docker images, push them to a private container registry (e.g., Docker Hub, AWS ECR, Azure Container Registry, Google Container Registry). This is typically handled by your CI/CD pipeline.
    ```bash
    docker build -t your-registry/ml-utilities-backend:latest -f backend/Dockerfile backend
    docker push your-registry/ml-utilities-backend:latest
    # Repeat for frontend
    ```

### 2.4. Orchestration

For high availability, scalability, and robust management, a container orchestration platform is essential.

*   **Kubernetes (K8s)**:
    *   **Deployment Objects**: Create `Deployment` manifests for both backend and frontend services.
    *   **Service Objects**: Define `Service` objects to expose your applications internally and externally.
    *   **Ingress**: Use an `Ingress` controller (e.g., Nginx Ingress, Traefik) for external HTTP/HTTPS access, SSL termination, and routing `/api/` requests to the backend service.
    *   **Persistent Volumes**: For file-based storage (if you keep SQLite or need to store model files), use `PersistentVolume` and `PersistentVolumeClaim`. For relational databases, external managed services are preferred.
    *   **Horizontal Pod Autoscaler (HPA)**: Automatically scale backend pods based on CPU/memory usage or custom metrics.
    *   **Secrets**: Use Kubernetes `Secret` objects for sensitive environment variables.
    *   **ConfigMaps**: For non-sensitive configuration data.
*   **AWS ECS / Fargate**:
    *   Define `Task Definitions` for backend and frontend.
    *   Create `ECS Services` to manage running tasks, integrate with `Application Load Balancer (ALB)` for traffic distribution, and auto-scaling.
    *   Use `Secrets Manager` for environment variables.
*   **Azure Container Apps / App Service**:
    *   Easier to set up for smaller microservices. Integrates with VNETs and other Azure services.
    *   Use `Key Vault` for secrets.

### 2.5. HTTPS/SSL

*   **Encrypt Traffic**: Always use HTTPS in production.
*   **Termination**: Terminate SSL at the load balancer (ALB, Nginx Ingress, Azure Application Gateway) or directly on your frontend Nginx server using a certificate from Let's Encrypt or a commercial CA.

### 2.6. Logging and Monitoring

*   **Centralized Logging**: Ship application logs (from both backend and frontend Nginx) to a centralized logging solution (e.g., ELK Stack, Splunk, Datadog, AWS CloudWatch Logs, Azure Log Analytics).
*   **Metrics**: Collect system and application metrics (CPU, memory, request rates, error rates) using tools like Prometheus, Datadog, or cloud-specific monitoring services.
*   **Alerting**: Set up alerts for critical errors, high latency, or resource exhaustion.

### 2.7. CI/CD Pipeline

*   **Automate Deployment**: Extend the GitHub Actions workflow (`.github/workflows/ci.yml`) to include deployment steps:
    1.  **Build**: Build Docker images for backend and frontend.
    2.  **Test**: Run all unit and integration tests.
    3.  **Push**: Push Docker images to your chosen container registry.
    4.  **Deploy**: Update your orchestration platform (e.g., apply new Kubernetes manifests, update ECS task definitions, trigger Azure Container Apps revision).
*   **Rollbacks**: Implement automated rollback strategies in case of deployment failures.

### 2.8. Backup and Disaster Recovery

*   **Database Backups**: Regularly back up your production database. For managed services, this is often built-in.
*   **Disaster Recovery Plan**: Have a plan to restore your application and data in case of a major outage.

---
```