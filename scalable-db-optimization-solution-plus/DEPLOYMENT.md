```markdown
# OptiDB - Deployment Guide

This document outlines the steps for deploying the OptiDB Database Optimization System, focusing on a production environment using Docker and a managed PostgreSQL service.

## Table of Contents

-   [1. Production Environment Considerations](#1-production-environment-considerations)
    -   [1.1. Key Management System (KMS)](#11-key-management-system-kms)
    -   [1.2. Managed Database Service](#12-managed-database-service)
    -   [1.3. Container Orchestration](#13-container-orchestration)
    -   [1.4. Network Security & TLS/SSL](#14-network-security--tlsssl)
    -   [1.5. Monitoring & Logging](#15-monitoring--logging)
    -   [1.6. CI/CD](#16-cicd)
-   [2. Pre-Deployment Steps](#2-pre-deployment-steps)
    -   [2.1. Prepare Encryption Keys](#21-prepare-encryption-keys)
    -   [2.2. Provision PostgreSQL Database](#22-provision-postgresql-database)
    -   [2.3. Configure Environment Variables](#23-configure-environment-variables)
    -   [2.4. Build Docker Image (if not using CI/CD)](#24-build-docker-image-if-not-using-cicd)
-   [3. Deployment Steps (Example: Kubernetes on AWS EKS)](#3-deployment-steps-example-kubernetes-on-aws-eks)
    -   [3.1. Apply Database Migrations](#31-apply-database-migrations)
    -   [3.2. Deploy OptiDB Application](#32-deploy-optidb-application)
-   [4. Post-Deployment Checks](#4-post-deployment-checks)
-   [5. Scaling and Maintenance](#5-scaling-and-maintenance)
-   [6. Target Database Configuration](#6-target-database-configuration)

---

## 1. Production Environment Considerations

A production-ready deployment requires more than just running Docker containers.

### 1.1. Key Management System (KMS)
The OptiDB backend encrypts sensitive target database credentials. The provided `target_db_service.cpp` uses hardcoded keys for demonstration. **For production, these keys MUST be securely managed using a KMS (e.g., AWS KMS, Azure Key Vault, Google Cloud KMS, HashiCorp Vault).** The application should retrieve these keys at runtime.

### 1.2. Managed Database Service
Host OptiDB's internal PostgreSQL database on a managed service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL). This handles backups, patching, scaling, and high availability.

### 1.3. Container Orchestration
Use a container orchestrator (e.g., Kubernetes, AWS ECS, Azure Container Apps, Docker Swarm) to deploy and manage OptiDB application instances for high availability, auto-scaling, and self-healing.

### 1.4. Network Security & TLS/SSL
-   **VPC/Network Isolation:** Deploy all components within a private network (VPC).
-   **Security Groups/Firewalls:** Restrict network access to only necessary ports and IPs.
-   **TLS/SSL:** Terminate TLS at a load balancer (e.g., Nginx, AWS ALB) in front of the OptiDB application. Ensure all external communication uses HTTPS.
-   **Database TLS:** Configure OptiDB to connect to its PostgreSQL database and target databases using TLS/SSL.

### 1.5. Monitoring & Logging
-   **Structured Logging:** Integrate `spdlog` with a centralized logging system (e.g., ELK Stack, AWS CloudWatch Logs, Grafana Loki).
-   **Application Metrics:** Export application metrics (e.g., request latency, error rates) to a monitoring system (e.g., Prometheus/Grafana, Datadog).
-   **Database Monitoring:** Monitor OptiDB's internal PostgreSQL database and all target databases using native tools or dedicated monitoring solutions.

### 1.6. CI/CD
Automate the build, test, and deployment process using a CI/CD pipeline (e.g., GitHub Actions, GitLab CI/CD, Jenkins). The provided `.github/workflows/main.yml` is a good starting point.

---

## 2. Pre-Deployment Steps

### 2.1. Prepare Encryption Keys
**Action:** Replace hardcoded encryption keys in `src/services/target_db_service.cpp` with a mechanism to retrieve them from your chosen KMS at runtime. This will likely involve:
1.  Modifying `OptiDBConfig` to include KMS configuration (e.g., key ID).
2.  Updating `TargetDbService` to use a KMS client library to fetch the actual encryption key.
3.  Ensuring your Docker container has appropriate IAM roles/permissions to access the KMS.

### 2.2. Provision PostgreSQL Database
**Action:** Provision a managed PostgreSQL instance for OptiDB's system database.

1.  **Create Database:** Create a new PostgreSQL instance.
2.  **Create User:** Create a dedicated database user (e.g., `optidb_user`) with a strong, unique password. Grant necessary permissions (e.g., `CREATEDB` if migrations need to create the DB, though usually just `CONNECT` and `CREATE` on schema).
3.  **Network Access:** Configure network access (VPC, security groups) to allow the OptiDB application to connect to this database.
4.  **TLS/SSL:** Ensure the PostgreSQL instance is configured for TLS/SSL connections and obtain any necessary client certificates if mutual TLS is required.

### 2.3. Configure Environment Variables
**Action:** Collect and secure all necessary environment variables for your production environment. These will be passed to your Docker containers.

-   **Database Connection:**
    -   `DB_HOST`: Hostname of your managed PostgreSQL.
    -   `DB_PORT`: Port (e.g., `5432`).
    -   `DB_NAME`: Database name (e.g., `optidb`).
    -   `DB_USER`: Database username.
    -   `DB_PASSWORD`: Database password (store securely as a secret).
-   **JWT:**
    -   `JWT_SECRET`: A **very strong, unique, and securely stored** secret for JWT signing.
    -   `JWT_EXPIRY_SECONDS`: Token expiry (e.g., `3600`).
-   **Application:**
    -   `SERVER_PORT`: Port the C++ app listens on (e.g., `18080`).
    -   `LOG_LEVEL`: `INFO`, `WARN`, `ERROR`, `CRITICAL` for production.
-   **Target DB Connection Pool:**
    -   `TARGET_DB_CONN_TIMEOUT_MS`: Connection timeout for target DBs (e.g., `5000`).
    -   `TARGET_DB_MAX_CONN`: Max concurrent connections OptiDB will attempt to target DBs (e.g., `5`).

### 2.4. Build Docker Image (if not using CI/CD)
**Action:** If your CI/CD pipeline is not set up to build and push images, manually build the Docker image.

```bash
docker build -t your_docker_registry/optidb:latest -f docker/Dockerfile .
# Push to your private registry
docker push your_docker_registry/optidb:latest
```

---

## 3. Deployment Steps (Example: Kubernetes on AWS EKS)

This section provides a conceptual guide for deploying to Kubernetes. Actual YAML files are beyond the scope of this document but demonstrate the required components.

### 3.1. Apply Database Migrations
**Action:** Run the database migration script against your provisioned PostgreSQL database. This should be a one-time operation (or part of an upgrade process).

You can run this using a temporary Kubernetes Job, or from a local machine with `psql` access.

```bash
# Example: Run migrations from a temporary container
kubectl run optidb-migrator --rm -it --restart=Never \
    --image=your_docker_registry/optidb:latest \
    --env "DB_HOST=YOUR_DB_HOST" \
    --env "DB_PORT=YOUR_DB_PORT" \
    --env "DB_NAME=YOUR_DB_NAME" \
    --env "DB_USER=YOUR_DB_USER" \
    --env "DB_PASSWORD=$(cat /path/to/db_password_secret)" \
    -- /app/db_migrations/apply_migrations.sh
```

**Note:** Ensure the `DB_PASSWORD` is passed securely, e.g., via Kubernetes Secrets.

### 3.2. Deploy OptiDB Application
**Action:** Deploy the OptiDB Docker image to your Kubernetes cluster.

1.  **Create Kubernetes Secrets:**
    Store sensitive environment variables (`DB_PASSWORD`, `JWT_SECRET`, encryption keys) as Kubernetes Secrets.

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: optidb-secrets
    type: Opaque
    stringData:
      DB_PASSWORD: "your_db_password"
      JWT_SECRET: "your_jwt_secret"
      # Add KMS keys if not dynamically fetched
      # KMS_KEY_ID: "..."
    ```

2.  **Create Deployment:**
    Define a Kubernetes Deployment to manage multiple replicas of your OptiDB application.

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: optidb-app
      labels:
        app: optidb
    spec:
      replicas: 3 # Start with 3 replicas for high availability
      selector:
        matchLabels:
          app: optidb
      template:
        metadata:
          labels:
            app: optidb
        spec:
          containers:
          - name: optidb
            image: your_docker_registry/optidb:latest
            ports:
            - containerPort: 18080
            env:
            - name: DB_HOST
              value: "YOUR_DB_HOST" # e.g., RDS endpoint
            - name: DB_PORT
              value: "5432"
            - name: DB_NAME
              value: "optidb"
            - name: DB_USER
              value: "optidb_user"
            - name: SERVER_PORT
              value: "18080"
            - name: LOG_LEVEL
              value: "INFO"
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: optidb-secrets
                  key: JWT_SECRET
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: optidb-secrets
                  key: DB_PASSWORD
            # Add other env vars from .env.example
            # Health checks for Kubernetes
            livenessProbe:
              httpGet:
                path: /health # Implement a basic health check endpoint
                port: 18080
              initialDelaySeconds: 10
              periodSeconds: 5
            readinessProbe:
              httpGet:
                path: /health
                port: 18080
              initialDelaySeconds: 15
              periodSeconds: 10
            resources:
              requests:
                memory: "256Mi"
                cpu: "250m"
              limits:
                memory: "512Mi"
                cpu: "500m"
    ```

3.  **Create Service:**
    Define a Kubernetes Service to expose your OptiDB application within the cluster.

    ```yaml
    apiVersion: v1
    kind: Service
    metadata:
      name: optidb-service
    spec:
      selector:
        app: optidb
      ports:
        - protocol: TCP
          port: 80 # External port for the service
          targetPort: 18080 # Internal container port
      type: ClusterIP # Or LoadBalancer for external access
    ```

4.  **Create Ingress (for external access with TLS):**
    If using `type: ClusterIP` for the Service, use an Ingress controller (e.g., Nginx Ingress, AWS ALB Ingress Controller) to expose the application to the internet with TLS.

    ```yaml
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: optidb-ingress
      annotations:
        kubernetes.io/ingress.class: "nginx" # or "alb"
        nginx.ingress.kubernetes.io/backend-protocol: "HTTPS" # If your service is TLS-enabled
        cert-manager.io/cluster-issuer: "letsencrypt-prod" # If using cert-manager
    spec:
      tls:
      - hosts:
        - optidb.example.com
        secretName: optidb-tls # Kubernetes Secret containing TLS cert
      rules:
      - host: optidb.example.com
        http:
          paths:
          - pathType: Prefix
            path: "/"
            backend:
              service:
                name: optidb-service
                port:
                  number: 80
    ```

---

## 4. Post-Deployment Checks

-   **Verify Pods:** Check that all OptiDB application pods are running and healthy: `kubectl get pods -l app=optidb`
-   **Access API:** Try accessing the `/auth/register` endpoint via `curl` to ensure the API is reachable.
-   **Register User:** Register an admin user and log in to obtain a JWT token.
-   **Register Target DB:** Attempt to register a test target PostgreSQL database (ensure it's accessible from your OptiDB cluster and `pg_stat_statements` is enabled).
-   **Check Logs:** Monitor application logs for any errors or warnings.

---

## 5. Scaling and Maintenance

-   **Horizontal Scaling:** Increase the `replicas` count in your Kubernetes Deployment to handle more load.
-   **Rolling Updates:** Kubernetes deployments support rolling updates for zero-downtime deployments of new versions.
-   **Database Scaling:** Scale your managed PostgreSQL instance (CPU, RAM, storage) as needed.
-   **Monitoring & Alerts:** Set up alerts for high CPU/memory usage, low disk space, high error rates, or database connection issues.

---

## 6. Target Database Configuration

For OptiDB to effectively analyze target PostgreSQL databases, ensure they are properly configured:

1.  **`shared_preload_libraries`:** In the target PostgreSQL's `postgresql.conf`, add `pg_stat_statements` to `shared_preload_libraries` and restart the PostgreSQL service.
    ```
    # postgresql.conf
    shared_preload_libraries = 'pg_stat_statements'
    ```
2.  **Create Extension:** Connect to each target database (as a superuser) and execute:
    ```sql
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    ```
3.  **Permissions:** Ensure the `db_user` you provide to OptiDB for the target database has sufficient permissions to:
    -   Connect to the database.
    -   Read from `pg_stat_statements`.
    -   Execute `EXPLAIN ANALYZE` on queries.
    -   (Optional, but recommended) Read schema information (e.g., `pg_catalog.pg_class`, `pg_indexes`).
```