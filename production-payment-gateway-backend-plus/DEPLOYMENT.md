```markdown
# Deployment Guide: Payment Processing System

This guide outlines the steps and considerations for deploying the Payment Processing System to a production environment. It assumes a cloud-native approach using Docker and potentially Kubernetes.

## Table of Contents

1.  [Deployment Strategy](#1-deployment-strategy)
2.  [Prerequisites](#2-prerequisites)
3.  [Environment Variables and Secrets Management](#3-environment-variables-and-secrets-management)
4.  [Database Setup (PostgreSQL)](#4-database-setup-postgresql)
5.  [Caching and Queueing (Redis)](#5-caching-and-queuing-redis)
6.  [Backend Application Deployment](#6-backend-application-deployment)
    *   [Docker Compose (Small Scale)](#docker-compose-small-scale)
    *   [Kubernetes (Scalable)](#kubernetes-scalable)
7.  [Frontend Application Deployment](#7-frontend-application-deployment)
8.  [CI/CD Pipeline](#8-cicd-pipeline)
9.  [Monitoring and Logging](#9-monitoring-and-logging)
10. [Security Best Practices](#10-security-best-practices)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Deployment Strategy

The recommended deployment strategy is container-based, leveraging Docker for packaging and Docker Compose or Kubernetes for orchestration.

*   **Containerization:** All services (backend, database, Redis) are containerized.
*   **Orchestration:**
    *   **Docker Compose:** Suitable for single-server deployments or small-scale applications.
    *   **Kubernetes (K8s):** Recommended for production, offering high availability, scalability, self-healing, and declarative management.
*   **Zero-Downtime Deployments:** Implement blue-green deployments or rolling updates in K8s to ensure continuous service availability.

## 2. Prerequisites

*   **Cloud Provider Account:** AWS, GCP, Azure, DigitalOcean, etc.
*   **Domain Name:** Configured with DNS records pointing to your server/load balancer.
*   **SSL/TLS Certificate:** Essential for HTTPS.
*   **Docker & Docker Compose:** Installed on your deployment server(s).
*   **Kubernetes Cluster (Optional but Recommended):** Configured and ready if using K8s.
*   **`kubectl`:** If deploying to Kubernetes.
*   **Git:** For cloning the repository.
*   **SSH Access:** To your deployment server(s).

## 3. Environment Variables and Secrets Management

Never commit sensitive information (database credentials, API keys, JWT secrets) directly to your repository.

*   **`.env` file:** Only used for local development.
*   **Production Environment Variables:**
    *   **Docker Compose:** Pass variables directly to `docker-compose.yml` via `.env` file or shell environment variables.
    *   **Kubernetes:** Use Kubernetes Secrets for sensitive data and ConfigMaps for non-sensitive configurations. Inject these into your Pods.
*   **Cloud-specific Secrets Managers:** Utilize services like AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault to store and retrieve secrets securely at runtime.

**Key Environment Variables to Configure:**

*   `NODE_ENV=production`
*   `PORT=3000` (or desired port)
*   `CORS_ORIGIN=https://your-frontend-domain.com` (restrict access)
*   `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` (from your managed PostgreSQL)
*   `JWT_SECRET` (a strong, long, random secret)
*   `REDIS_HOST`, `REDIS_PORT` (from your managed Redis service)
*   `MOCK_PAYMENT_GATEWAY_API_URL`, `MOCK_PAYMENT_GATEWAY_API_KEY` (if applicable)
*   `WEBHOOK_MAX_RETRIES`, `WEBHOOK_RETRY_DELAY_MS`

## 4. Database Setup (PostgreSQL)

**Recommendation:** Use a managed PostgreSQL service from your cloud provider (e.g., AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL). This handles backups, replication, patching, and scaling.

**Steps:**

1.  **Provision a Managed PostgreSQL Instance:** Choose an appropriate instance size and configuration.
2.  **Configure Networking:** Ensure your backend servers/containers can connect to the database (e.g., by configuring security groups/firewalls).
3.  **Create Database and User:** Create the `payment_db` database and a dedicated user with appropriate permissions.
4.  **Run Migrations:**
    *   Connect to your backend container/server.
    *   Ensure the `dist` folder exists (from `npm run build`).
    *   Run `npm run db:migrate`.
    *   **Important:** Migrations should be run as part of your deployment process, *before* the application starts serving traffic. In Kubernetes, this can be a pre-install hook or a separate `Job`.
5.  **Seed Data (Optional):** If needed for production, run `npm run db:seed`. This is often omitted or done manually in production.

## 5. Caching and Queueing (Redis)

**Recommendation:** Use a managed Redis service (e.g., AWS ElastiCache for Redis, GCP Memorystore for Redis).

**Steps:**

1.  **Provision a Managed Redis Instance:** Choose an appropriate instance type.
2.  **Configure Networking:** Ensure your backend can connect to Redis.
3.  **Update Environment Variables:** Configure `REDIS_HOST` and `REDIS_PORT` in your production environment.

## 6. Backend Application Deployment

### Docker Compose (Small Scale)

For smaller deployments, you can use Docker Compose on a single VM.

1.  **SSH into your server.**
2.  **Clone the repository:** `git clone ... && cd payment-processing-system`
3.  **Create `.env`:** Copy `.env.example` to `.env` and configure production variables, especially `DB_HOST` and `REDIS_HOST` to point to your managed services.
4.  **Create `init-db.sh`:** (Only needed if running a local Postgres container in Docker compose, not for managed services)
5.  **Modify `docker-compose.yml`:**
    *   Remove or comment out `db` and `redis` services if using managed services.
    *   Update `backend` service `depends_on` accordingly.
    *   Ensure the `command` for `backend` does NOT run migrations/seeds on every start in production. Migrations should be a separate step.
    *   Example: `command: ["node", "dist/server.js"]`
6.  **Build and Deploy:**
    ```bash
    docker-compose build
    docker-compose up -d # Or use a more robust deployment script for zero-downtime
    ```
7.  **Setup Reverse Proxy (Nginx/Caddy):** Configure Nginx or Caddy to proxy requests from your domain to the backend container's port (e.g., `localhost:3000`) and handle SSL termination.

### Kubernetes (Scalable)

For highly available and scalable deployments, Kubernetes is the preferred choice.

1.  **Create Docker Image:** Your CI/CD pipeline should build a Docker image and push it to a container registry (e.g., Docker Hub, AWS ECR, GCP GCR).
2.  **Kubernetes Manifests:** Create `Deployment`, `Service`, `Ingress`, `Secret`, and `ConfigMap` YAML files.
    *   **`Deployment`:** Defines how to run your backend application (number of replicas, image, resource limits, probes).
    *   **`Service`:** Exposes your backend deployment within the cluster.
    *   **`Ingress`:** Manages external access to the services in a cluster, providing HTTP/HTTPS routing, load balancing, and SSL termination.
    *   **`Secret` & `ConfigMap`:** For managing environment variables and sensitive data.
    *   **`Job` (for migrations):** A separate K8s Job can be used to run database migrations as a one-off task before your application pods start.
3.  **Deploy:**
    ```bash
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/backend-service.yaml
    kubectl apply -f k8s/backend-ingress.yaml
    kubectl apply -f k8s/db-migration-job.yaml # Run migration job first
    # ... and other manifests
    ```
4.  **Zero-Downtime Deployments:** Kubernetes supports rolling updates by default. Adjust `strategy` in your deployment manifest for more control (e.g., `Recreate`, `RollingUpdate`).

## 7. Frontend Application Deployment

The conceptual React frontend would be deployed as a static site.

1.  **Build:**
    ```bash
    cd frontend
    npm run build
    ```
    This generates optimized static files in the `frontend/build` directory.
2.  **Host:**
    *   **Static Hosting Service:** Deploy to services like Netlify, Vercel, AWS S3 + CloudFront, Google Cloud Storage + CDN.
    *   **Nginx/Caddy:** Serve the `build` directory using a web server.
    *   **Docker:** Build a lightweight Docker image for the frontend (e.g., using Nginx) and deploy it.

Ensure the frontend's `REACT_APP_API_BASE_URL` environment variable points to your deployed backend API (e.g., `https://api.your-domain.com/api/v1`).

## 8. CI/CD Pipeline

The `github-actions.yml` file provides a basic CI/CD pipeline.

**Customize for Production:**

*   **Secure Credential Handling:** Use GitHub Secrets for all sensitive environment variables and API keys.
*   **Staging Environment:** Deploy to a staging environment first for testing before production.
*   **Production Deployment:** Implement manual approval steps for production deployments.
*   **Blue/Green or Canary Deployments:** For advanced zero-downtime strategies in production.
*   **Rollback Strategy:** Define procedures for quickly reverting to a previous stable version in case of issues.

## 9. Monitoring and Logging

Essential for production:

*   **Logging:**
    *   Use a centralized logging solution (e.g., ELK Stack - Elasticsearch, Logstash, Kibana; Grafana Loki; Datadog; Splunk).
    *   Ensure your backend container logs are sent to the central logging system.
*   **Monitoring:**
    *   **Application Metrics:** Track request latency, error rates, throughput for your backend APIs.
    *   **Infrastructure Metrics:** Monitor CPU, memory, disk I/O for your servers, database, and Redis instances.
    *   **Tools:** Prometheus + Grafana, Datadog, New Relic, etc.
*   **Alerting:** Set up alerts for critical errors, performance degradation, resource exhaustion, or security incidents.

## 10. Security Best Practices

*   **HTTPS Everywhere:** Enforce SSL/TLS for all communication (client-server, server-database, server-Redis, server-gateway).
*   **Firewall Rules:** Restrict network access to only necessary ports and IP addresses.
*   **Least Privilege:** Grant only the minimum required permissions to users, services, and database roles.
*   **Regular Security Audits:** Perform code audits, vulnerability scans, and penetration testing.
*   **Dependency Management:** Regularly update dependencies to patch known vulnerabilities.
*   **Web Application Firewall (WAF):** Consider a WAF to protect against common web attacks.
*   **Backup and Recovery:** Implement robust database backup and disaster recovery plans.

## 11. Troubleshooting

*   **Check Logs:** Always start by checking application logs (Winston logs) and server logs.
*   **Container Status:** Use `docker ps`, `docker logs <container_name>`, `kubectl get pods`, `kubectl describe pod <pod_name>` to check container health.
*   **Network Connectivity:** Verify that services can reach each other (e.g., backend to database, backend to Redis).
*   **Environment Variables:** Ensure all required environment variables are correctly set in the production environment.
*   **Resource Limits:** Check if containers are hitting CPU/memory limits in K8s.
*   **Database Connection:** Confirm database credentials and network access are correct.

By following this guide, you can establish a solid foundation for deploying and maintaining a robust payment processing system in a production environment.
```