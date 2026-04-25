```markdown
# Deployment Guide

This document outlines the steps required to deploy the Project Management application to a production environment. This guide assumes a cloud-native deployment strategy leveraging Docker and potentially Kubernetes or a similar container orchestration service.

## Table of Contents

1.  [Deployment Strategy](#1-deployment-strategy)
2.  [Prerequisites](#2-prerequisites)
3.  [Cloud Provider Setup](#3-cloud-provider-setup)
    *   [Database (PostgreSQL)](#database-postgresql)
    *   [Cache (Redis)](#cache-redis)
    *   [Container Registry](#container-registry)
4.  [Environment Variables](#4-environment-variables)
5.  [Container Orchestration](#5-container-orchestration)
    *   [Option 1: Docker Compose on a Single VM (Simpler)](#option-1-docker-compose-on-a-single-vm-simpler)
    *   [Option 2: Kubernetes (Recommended for Production Scale)](#option-2-kubernetes-recommended-for-production-scale)
6.  [Post-Deployment Steps](#6-post-deployment-steps)
    *   [Run Migrations](#run-migrations)
    *   [Monitoring and Logging](#monitoring-and-logging)
    *   [Backup Strategy](#backup-strategy)
7.  [CI/CD Integration](#7-cicd-integration)
8.  [Troubleshooting](#8-troubleshooting)

---

## 1. Deployment Strategy

The recommended deployment strategy involves:

*   **Containerization:** Using Docker to package the backend and frontend applications.
*   **Container Registry:** Storing Docker images in a secure registry (e.g., Docker Hub, AWS ECR, GCP Container Registry).
*   **Cloud-Managed Services:** Utilizing managed PostgreSQL and Redis instances provided by your cloud provider for reliability, scalability, and ease of management.
*   **Container Orchestration:** Using Docker Compose (for simpler deployments on a single VM) or Kubernetes (for robust, scalable, and high-availability deployments).
*   **Nginx:** Serving as a reverse proxy and static file server for the frontend.

## 2. Prerequisites

*   A cloud provider account (AWS, GCP, Azure, DigitalOcean, etc.)
*   Docker & Docker Compose installed on your deployment server (if using Option 1)
*   `kubectl` configured for your Kubernetes cluster (if using Option 2)
*   A domain name and DNS configuration (optional but recommended for production)
*   SSL certificates (e.g., Let's Encrypt with Certbot or cloud-managed certificates)

## 3. Cloud Provider Setup

Before deploying the application, set up the necessary infrastructure components on your chosen cloud provider.

### Database (PostgreSQL)

Provision a managed PostgreSQL database instance.
*   **Example (AWS RDS):**
    *   Choose PostgreSQL engine.
    *   Select appropriate instance size (e.g., `db.t3.micro` for dev/small prod, `db.r5.large` for larger prod).
    *   Configure master username and password.
    *   Ensure it's accessible from your application's network (e.g., Security Group/VPC configuration).
    *   Note down the **endpoint**, **port**, **username**, **password**, and **database name**.

### Cache (Redis)

Provision a managed Redis instance.
*   **Example (AWS ElastiCache for Redis):**
    *   Choose Redis engine.
    *   Select instance type.
    *   Configure security (e.g., VPC, security groups).
    *   Note down the **endpoint** and **port**.

### Container Registry

Ensure your Docker images are pushed to a container registry accessible from your deployment environment.
*   **Docker Hub:** Public/private repositories (used in CI/CD example).
*   **AWS ECR, GCP Container Registry, Azure Container Registry:** Cloud-specific private registries.
*   **GitHub Actions CI/CD** (`.github/workflows/main.yml`) already handles building and pushing images to Docker Hub. If using a different registry, update the CI/CD workflow accordingly.

## 4. Environment Variables

The application relies on environment variables for sensitive configuration. These **MUST NOT** be hardcoded into your Docker images. Use your cloud provider's secret management solutions.

**Backend (`backend/.env` equivalent):**

*   `NODE_ENV=production`
*   `PORT=5000`
*   `DATABASE_URL=postgresql://<user>:<password>@<db-host>:<db-port>/<db-name>`
*   `JWT_SECRET=<a_strong_long_secret_key>` (Generate a new one for production!)
*   `JWT_EXPIRES_IN=1h`
*   `REDIS_HOST=<redis-host>`
*   `REDIS_PORT=<redis-port>`

**Frontend (`frontend/.env` equivalent):**

*   `VITE_API_URL=https://yourdomain.com/api` (This should point to your Nginx public endpoint)

## 5. Container Orchestration

### Option 1: Docker Compose on a Single VM (Simpler)

Suitable for smaller deployments, MVPs, or when you don't need the full power of Kubernetes.

1.  **Provision a VM:** Create a virtual machine (e.g., AWS EC2, DigitalOcean Droplet) with Docker and Docker Compose installed.
    *   Ensure inbound rules allow HTTP (port 80) and HTTPS (port 443) traffic.
2.  **SSH into the VM.**
3.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
4.  **Create `.env` files for production:**
    *   Create a `backend/.env` file with production database, Redis, and JWT secrets.
    *   Create a `frontend/.env` file with `VITE_API_URL` pointing to your public domain.
5.  **Configure Nginx (Optional: SSL/Domain):**
    *   Update `nginx/default.conf` to reflect your domain and SSL configuration. If you're not using Nginx for SSL, ensure your load balancer/CDN handles it.
    *   The provided `nginx/default.conf` assumes `backend:5000` and `frontend:3000` (internal Docker network ports) for proxying.
6.  **Pull Docker Images:** If your CI/CD pushes to Docker Hub, you can configure `docker-compose.yml` to use specific image tags (e.g., `your-docker-username/pm-backend:latest`).
    *   **Or, if building directly on VM (not recommended for production CI/CD):**
        ```bash
        docker-compose up --build -d
        ```
7.  **Run with Docker Compose:**
    ```bash
    # Pull pre-built images from registry
    docker-compose pull

    # Run services with production environment variables
    # Ensure your .env files are correctly sourced by docker-compose
    # (docker-compose will automatically look for .env files in the same directory as docker-compose.yml,
    # or you can explicitly provide them with --env-file)
    docker-compose -f docker-compose.yml --env-file backend/.env --env-file frontend/.env up -d
    ```
    *   *Note:* The example `docker-compose.yml` uses local `.env` files. For production, consider using a secret manager to inject these.
8.  **Configure DNS:** Point your domain (e.g., `yourdomain.com`) to the public IP of your VM.
9.  **Set up SSL:** Use Certbot with Nginx or a cloud-managed load balancer for HTTPS.

### Option 2: Kubernetes (Recommended for Production Scale)

For high availability, scalability, and advanced management, deploy to a Kubernetes cluster.

1.  **Kubernetes Cluster:** Have a running Kubernetes cluster (e.g., AWS EKS, GKE, Azure AKS).
2.  **Image Pull Secret:** Create a Kubernetes `Secret` for your container registry credentials if pulling from a private registry.
    ```bash
    kubectl create secret docker-registry regcred \
      --docker-server=<your-registry-server> \
      --docker-username=<your-username> \
      --docker-password=<your-password> \
      --docker-email=<your-email>
    ```
3.  **Kubernetes Manifests:** You'll need to create Kubernetes YAML manifests for each service:
    *   `Deployment` for backend (e.g., `backend-deployment.yaml`)
    *   `Deployment` for frontend (e.g., `frontend-deployment.yaml`)
    *   `Service` for backend (e.g., `backend-service.yaml`)
    *   `Service` for frontend (e.g., `frontend-service.yaml`)
    *   `Ingress` for Nginx-like routing, SSL termination, and external access (e.g., `ingress.yaml`)
    *   `Secret` for environment variables (e.g., `secrets.yaml`)
    *   `ConfigMap` for non-sensitive configuration (e.g., `nginx-configmap.yaml` for Nginx configuration).

    **Example `backend-deployment.yaml` snippet:**
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: pm-backend
      labels:
        app: pm-backend
    spec:
      replicas: 3 # Example: 3 instances for high availability
      selector:
        matchLabels:
          app: pm-backend
      template:
        metadata:
          labels:
            app: pm-backend
        spec:
          containers:
          - name: pm-backend
            image: your-docker-username/pm-backend:latest # Replace with your image
            ports:
            - containerPort: 5000
            env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "5000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: backend-secrets
                  key: DATABASE_URL
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: backend-secrets
                  key: JWT_SECRET
            - name: REDIS_HOST
              value: "redis-service" # Assuming a redis service is created in K8s
            - name: REDIS_PORT
              value: "6379"
          imagePullSecrets:
          - name: regcred # If using private registry
    ```
    *   **Note:** Creating full Kubernetes manifests is outside the scope of this single output, but the structure and key components are highlighted.

4.  **Apply Manifests:**
    ```bash
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/backend-service.yaml
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/frontend-service.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/ingress.yaml # Requires Ingress Controller (e.g., Nginx Ingress)
    ```

## 6. Post-Deployment Steps

### Run Migrations

After your backend service is deployed and connected to the database, run TypeORM migrations. This ensures your production database schema is up-to-date.

*   **Docker Compose:**
    ```bash
    docker-compose exec backend npm run typeorm migration:run
    ```
*   **Kubernetes:** This can be done via a Kubernetes Job or by temporarily exec-ing into a backend pod.
    ```bash
    # Create a temporary job
    kubectl run pm-migration-job --image=your-docker-username/pm-backend:latest --restart=Never --command -- npm run typeorm migration:run

    # Or, if you need to exec into a running pod:
    kubectl exec -it <backend-pod-name> -- npm run typeorm migration:run
    ```
    **Important:** Ensure only one instance runs migrations at a time in production to avoid race conditions.

### Monitoring and Logging

*   **Logging:** Configure your cloud provider's logging service (e.g., AWS CloudWatch, GCP Logging, Azure Monitor) to collect logs from your containers. The backend uses `winston` for structured JSON logs, which are easily parsable by these services.
*   **Monitoring:** Set up application performance monitoring (APM) and infrastructure monitoring. Tools like Prometheus/Grafana, Datadog, New Relic can be integrated to track application health, resource usage, and API response times.

### Backup Strategy

*   **Database:** Configure automated backups for your managed PostgreSQL instance.
*   **Application Data:** If your application generates user-uploaded files (not in this project but common), ensure a robust backup strategy for object storage (e.g., AWS S3).

## 7. CI/CD Integration

The provided `.github/workflows/main.yml` already builds, tests, and pushes Docker images to Docker Hub upon `push` to `main`.

For full automated deployment, extend the "Deployment" step in `main.yml`:

*   **Docker Compose:** Use `ssh` to connect to your VM and execute `docker-compose pull` and `docker-compose up -d`.
*   **Kubernetes:** Use `kubectl` commands from the CI/CD pipeline to update deployments (`kubectl set image`, `kubectl rollout restart`) after new images are pushed to the registry. Tools like Argo CD or Flux CD can also be used for GitOps deployments.

## 8. Troubleshooting

*   **Check Docker Logs:** `docker-compose logs <service-name>`
*   **Check Kubernetes Pod Logs:** `kubectl logs <pod-name>`
*   **Verify Environment Variables:** Double-check that all required environment variables are correctly set and injected into your containers.
*   **Network Issues:** Ensure security groups, firewalls, and VPC configurations allow traffic between services (e.g., backend to database, Nginx to backend/frontend).
*   **Database Connection:** Verify the `DATABASE_URL` is correct and the database is accessible.
*   **Redis Connection:** Verify `REDIS_HOST` and `REDIS_PORT` are correct and Redis is accessible.
*   **Frontend API Calls:** Inspect browser network requests to ensure the frontend is correctly calling the backend API (e.g., `VITE_API_URL` is correct).
*   **Nginx Configuration:** Review `nginx/default.conf` if experiencing routing or serving issues.
```