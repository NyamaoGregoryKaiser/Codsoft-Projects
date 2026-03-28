# DataVizPro: Deployment Guide

This document provides instructions for deploying the DataVizPro application to various environments. The primary deployment strategy leverages Docker containers orchestrated by Docker Compose for local development/staging, and outlines principles for production deployment using Kubernetes or similar cloud-native platforms.

## 1. Local Deployment (Docker Compose)

The easiest way to get DataVizPro running locally for development or demonstration is using Docker Compose.

### Prerequisites:
- Docker Engine (Docker Desktop for Windows/macOS, Docker daemon for Linux)
- Docker Compose

### Steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/datavizpro.git
    cd datavizpro
    ```

2.  **Ensure Nginx config is present**:
    Verify that `nginx/nginx.conf` exists at the root of your `datavizpro` directory. (See `README.md` for its content).

3.  **Build and Start Services**:
    ```bash
    docker-compose up --build -d
    ```
    -   `--build`: This ensures that your Docker images are rebuilt from the latest source code. Remove it if you only want to start already built images.
    -   `-d`: Runs containers in detached mode (in the background).

4.  **Verify Services**:
    Check the status of your running containers:
    ```bash
    docker-compose ps
    ```
    All services (`db`, `backend`, `frontend`) should be in an "Up" state. The `db` service might take a moment to become "healthy".

5.  **Access the Application**:
    -   **Frontend**: `http://localhost:3000`
    -   **Backend API Documentation (Swagger UI)**: `http://localhost:8080/swagger-ui.html`

6.  **Stop Services**:
    ```bash
    docker-compose down
    ```
    This will stop and remove the containers, networks, and volumes associated with the `docker-compose.yml` file.

7.  **Clean up (optional)**:
    To remove all dangling Docker images, volumes, and networks:
    ```bash
    docker system prune -a --volumes
    ```
    *Use with caution, as this removes *all* unused Docker resources.*

## 2. Production Deployment (Kubernetes / Cloud-Native Principles)

For production environments, deploying DataVizPro on a Kubernetes cluster (e.g., GKE, EKS, AKS) or a similar cloud-native platform is recommended for scalability, high availability, and easier management.

### Key Considerations:

1.  **Container Images**:
    -   Build optimized Docker images for both backend and frontend. The provided `Dockerfile.backend` and `Dockerfile.frontend` are good starting points.
    -   Tag images with version numbers (e.g., `v1.0.0`, `build-123`) and push them to a private Docker Registry (e.g., Docker Hub, AWS ECR, GCP Container Registry).

2.  **Database**:
    -   **Managed Service**: Use a managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) for production. This offloads database management, backups, and scaling.
    -   **Connection String**: Update `application.yml` or provide environment variables for the backend to connect to the production database.
    -   **Flyway**: Ensure Flyway is configured to run on application startup to apply migrations to the production database. Set `spring.jpa.hibernate.ddl-auto: validate` in production.

3.  **Environment Variables & Secrets Management**:
    -   **Sensitive Data**: **DO NOT** hardcode secrets (database passwords, JWT secret keys, API keys) in code or Dockerfiles.
    -   **Kubernetes**: Use Kubernetes Secrets (preferably with external secret management solutions like HashiCorp Vault or cloud-specific secret managers) to inject secrets securely into pods.
    -   **Cloud Platforms**: Utilize environment variables and platform-specific secret management (e.g., AWS Secrets Manager, Azure Key Vault, Google Secret Manager).

4.  **Networking & Load Balancing**:
    -   **Frontend**: Serve the React frontend (static files) via a robust web server like Nginx or directly from a CDN (e.g., AWS S3 + CloudFront).
    -   **API Gateway/Load Balancer**: Place a load balancer (e.g., AWS ALB, Nginx Ingress, Kubernetes Ingress Controller) in front of the backend service to distribute traffic, handle SSL termination, and provide a single entry point.
    -   **CORS**: Ensure your backend CORS configuration (`spring.web.cors.allowed-origins` in `application.yml` or a `CorsConfigurationSource` bean) correctly allows requests from your frontend's production domain.

5.  **Scalability & High Availability**:
    -   **Kubernetes Deployments**: Define Kubernetes `Deployments` for both backend and frontend, with multiple replicas to ensure high availability and enable horizontal scaling.
    -   **Horizontal Pod Autoscaler (HPA)**: Configure HPAs to automatically scale pods based on CPU utilization or custom metrics.
    -   **Resource Limits**: Define CPU and memory requests/limits for your containers to prevent resource exhaustion.

6.  **Monitoring & Logging**:
    -   **Centralized Logging**: Integrate backend (Logback) and frontend (browser console logs, client-side error tracking) logs with a centralized logging solution (e.g., ELK Stack, Splunk, Datadog).
    -   **Metrics**: Expose Spring Boot Actuator metrics (e.g., `/actuator/prometheus`) and scrape them with Prometheus. Visualize dashboards using Grafana.
    -   **Alerting**: Set up alerts based on key metrics (e.g., high error rates, low disk space, high CPU usage) to proactively respond to issues.

7.  **CI/CD Pipeline Integration**:
    -   Automate the entire deployment process using a CI/CD tool (e.g., Jenkins, GitHub Actions, GitLab CI, Azure DevOps).
    -   The `Jenkinsfile` provides an example pipeline structure for building, testing, pushing Docker images, and deploying to a target environment.
    -   Implement blue/green deployments or canary releases for zero-downtime updates.

### Example Kubernetes Deployment Structure (Conceptual)

```
datavizpro/k8s/
├── backend-deployment.yaml
├── backend-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── ingress.yaml                 # For exposing services via a Load Balancer
├── postgres-secret.yaml         # Kubernetes Secret for DB credentials (use sealed secrets or similar for prod)
└── jwt-secret.yaml              # Kubernetes Secret for JWT secret key
```

**`backend-deployment.yaml` (Example Snippet)**
```yaml
# In k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: datavizpro-backend
  labels:
    app: datavizpro-backend
spec:
  replicas: 3 # Run multiple instances for high availability
  selector:
    matchLabels:
      app: datavizpro-backend
  template:
    metadata:
      labels:
        app: datavizpro-backend
    spec:
      containers:
        - name: datavizpro-backend
          image: myregistry/datavizpro-backend:latest # Use a versioned tag in prod
          ports:
            - containerPort: 8080
          env:
            - name: DB_HOST
              value: "your-managed-db-endpoint" # e.g., my-rds-instance.xyz.us-east-1.rds.amazonaws.com
            - name: DB_NAME
              value: "datavizpro_prod"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: JWT_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: jwt-secret
                  key: secretKey
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1024Mi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 20
            periodSeconds: 5
```

This guide provides a foundational understanding of how to deploy DataVizPro. Specific implementations will vary based on your chosen cloud provider and infrastructure setup.
```