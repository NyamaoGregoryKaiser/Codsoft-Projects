```markdown
# MLOps Core Service Deployment Guide

This document outlines the steps to deploy the MLOps Core Service to a production environment using Docker and `docker-compose`. It also covers basic CI/CD considerations.

## 1. Deployment Strategy

The recommended deployment strategy for this service involves containerization with Docker, orchestrated using `docker-compose` for simplicity in smaller deployments or as a base for Kubernetes/Cloud deployments.

**Key Principles**:
*   **Containerization**: Isolate the application and its dependencies.
*   **Immutability**: Containers are built once and run everywhere, ensuring consistency.
*   **Configuration as Code**: Use environment variables or mounted configuration files.
*   **Persistent Storage**: Separate data (database, model files, logs) from the application container.
*   **CI/CD Integration**: Automate build, test, and deployment processes.

## 2. Production Environment Prerequisites

Before deploying, ensure your production server(s) meet the following requirements:

*   **Operating System**: Linux (e.g., Ubuntu, CentOS, Debian).
*   **Docker**: Docker Engine and Docker Compose installed.
*   **Network Access**: Appropriate firewall rules to allow traffic on the service port (default: `18080`).
*   **Security**: SSH access configured for secure remote management.
*   **Storage**: Sufficient disk space for the Docker images, persistent data volumes (`./data`, `./logs`, `./models`), and temporary files.

## 3. Configuration for Production

The `config/default.json` file contains default settings. For production, you **must** override sensitive values and ensure appropriate paths.

**Important Production Configuration**:

*   **`jwt.secret`**:
    *   **CRITICAL**: Change this to a strong, random, and secret key. **Never commit your production secret to version control.**
    *   **Recommendation**: Use a strong, randomly generated string (e.g., 32-64 characters).
    *   **How to manage**: Pass it as an environment variable to the Docker container (see `docker-compose.yml` example under `environment`).
*   **`database.path`**:
    *   Ensure this path points to a persistent volume (e.g., `/app/data/mlops_core.db`).
    *   The `docker-compose.yml` already sets up a volume mount `./data:/app/data`.
*   **`model_storage.path`**:
    *   Ensure this path also points to a persistent volume (e.g., `/app/models`).
    *   The `docker-compose.yml` already sets up a volume mount `./models:/app/models`.
*   **`logging.file`**:
    *   Ensure this path points to a persistent volume (e.g., `/app/logs/mlops_core.log`).
    *   The `docker-compose.yml` already sets up a volume mount `./logs:/app/logs`.
*   **`server.port`**:
    *   Ensure this port (default `18080`) is open and accessible from your client applications or API Gateway.

**Example `docker-compose.yml` snippet for environment variables**:
```yaml
services:
  mlops-backend:
    # ... other configurations ...
    environment:
      MLOPS_JWT_SECRET: "${PRODUCTION_JWT_SECRET}" # Read from host's environment or .env file
    # ...
```
You would then define `PRODUCTION_JWT_SECRET` in your shell environment (`export PRODUCTION_JWT_SECRET="your_actual_secret"`) or in a `.env` file where `docker-compose` is run.

## 4. Deployment Steps

### Step 4.1: Build the Docker Image

It's recommended to build the Docker image as part of your CI/CD pipeline and push it to a private container registry.

**Manual Build (for testing or non-CI environments)**:
```bash
docker build -t mlops-core-service:latest -t mlops-core-service:$(git rev-parse --short HEAD) .
```
Replace `$(git rev-parse --short HEAD)` with a meaningful version tag (e.g., `1.0.0`).

### Step 4.2: Prepare the Deployment Directory

On your production server, create a directory for your application.
```bash
mkdir -p /opt/mlops-core-service
cd /opt/mlops-core-service
```
Copy `docker-compose.yml`, `config/default.json` (or a production-specific config), and any necessary `.env` files.

### Step 4.3: Database Migrations and Seeding

Even though the C++ app uses `sqlite_orm` to sync the schema, it's good practice to manage migrations explicitly, especially for complex changes or different database systems.

1.  **Create initial persistent directories**:
    ```bash
    mkdir -p data logs models
    ```
2.  **Run migrations and seed data**:
    ```bash
    # You can either run this directly on the host if python is installed:
    # python /path/to/mlops-core-service/scripts/db/full
    # Or, preferably, run it in a temporary Docker container:
    docker run --rm \
      -v /opt/mlops-core-service/data:/app/data \
      -v /opt/mlops-core-service/scripts:/app/scripts \
      -v /opt/mlops-core-service/requirements.txt:/app/requirements.txt \
      python:3.10-slim-buster /bin/bash -c "pip install -r /app/requirements.txt && python /app/scripts/db/full"
    ```
    This ensures `data/mlops_core.db` is initialized and seeded before the service starts.

### Step 4.4: Deploy with Docker Compose

1.  **Navigate to your deployment directory**:
    ```bash
    cd /opt/mlops-core-service
    ```
2.  **Set environment variables** (e.g., `PRODUCTION_JWT_SECRET`) or ensure they are in a `.env` file.
3.  **Pull the latest image (if using a registry)**:
    ```bash
    # docker pull your_registry/mlops-core-service:latest
    ```
    *If you built locally and aren't using a registry, ensure the image is present on the host.*

4.  **Start the service**:
    ```bash
    docker-compose -f docker-compose.yml up -d
    ```
    *   `-f docker-compose.yml`: Specifies the compose file.
    *   `up`: Creates and starts containers, networks, and volumes.
    *   `-d`: Runs containers in detached mode (background).

5.  **Verify the deployment**:
    ```bash
    docker-compose ps
    docker-compose logs mlops-backend
    curl http://localhost:18080/health_check # Or your server's public IP
    ```

### Step 4.5: Updating the Service

To deploy a new version of the service:

1.  **Build and push the new Docker image** to your registry (via CI/CD).
2.  **On the production server, pull the new image**:
    ```bash
    docker-compose pull mlops-backend # Assumes your compose file refers to a registry image
    ```
    (If building locally, you'd rebuild and re-tag with `mlops-core-service:latest` then `docker load` or similar).
3.  **Restart the service**:
    ```bash
    docker-compose up -d --force-recreate mlops-backend
    ```
    This command will stop the old container, remove it, and start a new one with the updated image while preserving the volumes.

## 5. CI/CD Pipeline (GitLab CI Example)

The `.gitlab-ci.yml` file provides a working example of a CI/CD pipeline:

*   **`build` stage**: Builds the Docker image of the C++ application using Kaniko (for rootless builds) and pushes it to GitLab Container Registry.
*   **`test` stage**:
    *   `unit_tests_cpp`: Runs C++ unit tests using Google Test.
    *   `integration_tests_api`: Builds a temporary test environment with the newly built Docker image and runs Python integration tests against it. It also runs `scripts/db/full` to prepare the database for each test run.
    *   `performance_tests`: Runs a basic Locust load test against the service (can be configured to target a dedicated perf environment).
*   **`deploy` stage**:
    *   `deploy_staging`: Automatically deploys the image to a staging environment upon merge to `main` branch.
    *   `deploy_production`: Requires manual approval to deploy to production, also from the `main` branch.

**To enable GitLab CI**:
1.  Push your code to a GitLab repository.
2.  Ensure your GitLab project has access to a Docker runner (e.g., shared runners).
3.  Configure CI/CD Variables: `CI_REGISTRY_USER` and `CI_REGISTRY_PASSWORD` are automatically available in GitLab for authenticating with its container registry.

## 6. Monitoring and Logging

*   **Logs**: The service logs to `logs/mlops_core.log` inside the container, which is mapped to a persistent volume on the host. Implement a log aggregation system (e.g., ELK Stack, Splunk, Loki) to collect, store, and analyze these logs centrally.
*   **Metrics**: For robust monitoring, integrate with Prometheus and Grafana.
    *   The C++ application would need to expose a `/metrics` endpoint in Prometheus text format (e.g., using a C++ metrics library).
    *   A Prometheus server would scrape this endpoint.
    *   Grafana dashboards would visualize these metrics (e.g., request latency, error rates, model load times, cache hit ratios, active users).
    *   `docker-compose.yml` provides conceptual Prometheus/Grafana services.

## 7. Security Considerations

*   **JWT Secret**: As mentioned, keep this highly secret and use environment variables.
*   **Access Control**: Ensure your JWT roles (`admin`, `predictor`, `viewer`) are correctly mapped to user permissions.
*   **Network Security**: Use firewalls to restrict access to the API port. Deploy behind an API Gateway or Load Balancer for SSL termination, additional authentication, WAF (Web Application Firewall), and DDoS protection.
*   **Volume Permissions**: Ensure Docker volumes (`data`, `logs`, `models`) have appropriate filesystem permissions on the host to prevent unauthorized access.
*   **Container Security**: Regularly update base images in Dockerfile. Scan Docker images for vulnerabilities. Run containers as non-root users (beyond scope for this example).
*   **SQL Injection**: `sqlite_orm` handles parameter binding, which prevents SQL injection in the C++ code. Ensure any raw SQL in migration scripts is carefully reviewed.

## 8. Rollback Strategy

In case of a faulty deployment, you should be able to quickly rollback to a previous stable version.

1.  Identify the last known good Docker image tag (e.g., `mlops-core-service:previous_commit_sha`).
2.  Update your `docker-compose.yml` to explicitly use this old tag, or manually perform the update:
    ```bash
    # Assuming mlops-backend service in docker-compose.yml uses the "latest" tag
    # or you override the tag.
    docker pull your_registry/mlops-core-service:previous_commit_sha
    docker tag your_registry/mlops-core-service:previous_commit_sha your_registry/mlops-core-service:latest # Retag if necessary
    docker-compose up -d --force-recreate mlops-backend
    ```
    Or, if you manage images more directly:
    ```bash
    docker stop mlops-backend
    docker rm mlops-backend
    docker run -d --name mlops-backend -p 18080:18080 your_registry/mlops-core-service:previous_commit_sha
    ```
3.  Monitor logs and health checks to confirm the rollback was successful.

This guide provides a solid foundation for deploying the MLOps Core Service. Adapt it to your specific organizational policies, cloud provider, and existing infrastructure.
```