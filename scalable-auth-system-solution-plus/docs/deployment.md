# Deployment Guide

This document provides a guide for deploying the Authentication and Task Management System to a production environment. It covers common considerations and outlines a few potential deployment strategies.

## 1. Production Environment Considerations

Before deploying, consider the following:

*   **Security:**
    *   **HTTPS:** All communication (frontend to backend, client to frontend) must use HTTPS. Use a reverse proxy (Nginx, Caddy, Apache) and SSL certificates (Let's Encrypt, commercial CAs).
    *   **Environment Variables:** Never hardcode sensitive information (database credentials, JWT secret keys). Use environment variables or a dedicated secrets management service (e.g., AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).
    *   **Firewall Rules:** Restrict database access to only the backend application.
    *   **Logging:** Configure comprehensive logging and ship logs to a centralized log management system.
*   **Scalability & High Availability:**
    *   **Load Balancing:** Distribute incoming traffic across multiple instances of your frontend and backend.
    *   **Database:** Use a managed database service (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) for easier scaling, backups, and high availability.
    *   **Caching:** For distributed caching across multiple backend instances, replace in-memory Caffeine with a distributed cache like Redis.
*   **Monitoring:** Implement robust monitoring for application health, performance, and resource utilization.
*   **Backups:** Ensure regular backups of your database.
*   **CI/CD:** Automate builds, tests, and deployments to ensure consistent and reliable releases.

## 2. Docker Images

The `Dockerfile` for the backend and `Dockerfile.frontend` for the frontend are designed for production builds.

*   **Backend Image:**
    *   `Dockerfile`: Located at the root of the project. Creates a slim JAR and packages it into an `openjdk:17-jre-slim` image.
    *   Build command: `docker build -t auth-system-backend:latest -f Dockerfile .`
*   **Frontend Image:**
    *   `Dockerfile.frontend`: Located at the root of the project. Builds the React app and serves it using Nginx in an `nginx:alpine` image.
    *   Build command: `docker build -t auth-system-frontend:latest -f Dockerfile.frontend .`

After building, push these images to a Docker Registry (e.g., Docker Hub, AWS ECR, Google Container Registry) from where your production environment can pull them.

```bash
docker login # Log in to your registry
docker tag auth-system-backend:latest your-registry/auth-system-backend:latest
docker push your-registry/auth-system-backend:latest

docker tag auth-system-frontend:latest your-registry/auth-system-frontend:latest
docker push your-registry/auth-system-frontend:latest
```

## 3. Environment Variables for Production

Ensure all necessary environment variables are set in your production environment.

**Backend (`auth-system-backend`):**

*   `SPRING_PROFILES_ACTIVE=prod`: Activates the production Spring profile.
*   `DB_HOST=<your_db_host>`: Hostname or IP of your PostgreSQL database.
*   `DB_PORT=5432`: Port of your PostgreSQL database.
*   `DB_NAME=auth_db`: Database name.
*   `DB_USER=<your_db_user>`: Database username.
*   `DB_PASSWORD=<your_db_password>`: Database password.
*   `JWT_SECRET_KEY=<your_jwt_secret_key>`: **CRITICAL!** A strong, 256-bit base64-encoded secret key for JWT signing. This *must* be different from your development key.
*   `APPLICATION_SECURITY_JWT_EXPIRATION=<ms>`: Access token expiration in milliseconds (e.g., 3600000 for 1 hour).
*   `APPLICATION_SECURITY_JWT_REFRESH_TOKEN_EXPIRATION=<ms>`: Refresh token expiration in milliseconds (e.g., 604800000 for 7 days).

**Frontend (`auth-system-frontend`):**

*   `REACT_APP_API_BASE_URL=https://api.yourdomain.com/api/v1`: The **absolute URL** of your deployed backend API. This variable is consumed during the `yarn build` process in the Dockerfile.frontend.

## 4. Deployment Strategies

Here are a few common strategies for deploying a full-stack application.

### 4.1. Single Server with Docker Compose (Simplest, for small-scale deployments)

This is suitable for smaller applications or proof-of-concepts but lacks high availability and advanced scaling.

1.  **Prepare Server:** Provision a Linux server (e.g., AWS EC2, DigitalOcean Droplet) with Docker and Docker Compose installed.
2.  **Clone Repository:**
    ```bash
    git clone https://github.com/your-username/auth-system.git
    cd auth-system
    ```
3.  **Configure `.env`:** Create the `.env` file with production environment variables.
4.  **Pull and Run:**
    ```bash
    docker-compose pull # Pull latest images from your registry (or build locally)
    docker-compose up -d --build --remove-orphans
    ```
5.  **Reverse Proxy & SSL:** Configure an external Nginx or Caddy server on the host machine to act as a reverse proxy for HTTPS termination and routing traffic to the frontend (port 80 inside container, exposed via `3000:80`) and backend (port 8080).
    *   **Example Nginx config for reverse proxy:**
        ```nginx
        server {
            listen 80;
            listen [::]:80;
            server_name yourdomain.com api.yourdomain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl http2;
            listen [::]:443 ssl http2;
            server_name yourdomain.com api.yourdomain.com;

            # SSL certificates (e.g., from Let's Encrypt)
            ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

            # Frontend
            location / {
                proxy_pass http://localhost:3000; # Points to the frontend container
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # Backend API (via /api prefix)
            location /api/v1/ {
                proxy_pass http://localhost:8080/api/v1/; # Points to the backend container
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # Swagger UI
            location /swagger-ui.html {
                proxy_pass http://localhost:8080/swagger-ui.html;
                proxy_set_header Host $host;
            }
            location /v3/api-docs {
                proxy_pass http://localhost:8080/v3/api-docs;
                proxy_set_header Host $host;
            }
            location /v3/api-docs/swagger-config {
                proxy_pass http://localhost:8080/v3/api-docs/swagger-config;
                proxy_set_header Host $host;
            }
        }
        ```

### 4.2. Cloud-Native Deployment (Recommended for Production)

For production, leveraging cloud provider services offers better scalability, reliability, and managed operations.

#### Example: AWS Deployment (ECS/EKS with RDS)

1.  **Database:** Provision an AWS RDS for PostgreSQL instance. Configure security groups to allow traffic from your application servers/containers.
2.  **Container Registry:** Push your Docker images to AWS ECR.
3.  **Application Deployment:**
    *   **AWS ECS (Elastic Container Service):** Define Task Definitions for your backend and frontend. Create an ECS Service to run these tasks.
    *   **AWS EKS (Elastic Kubernetes Service):** If using Kubernetes, define Kubernetes Deployments for your backend and frontend, Services to expose them, and Ingress to manage external traffic and HTTPS.
4.  **Load Balancing:** Place an AWS Application Load Balancer (ALB) in front of your ECS services or EKS ingress for traffic distribution, health checks, and HTTPS termination.
5.  **Environment Variables:** Inject environment variables into your ECS Task Definitions or Kubernetes Deployments. Use AWS Secrets Manager for sensitive credentials like `JWT_SECRET_KEY` and database passwords.
6.  **CI/CD:** Integrate GitHub Actions with AWS CodeBuild/CodeDeploy or directly use `aws-cli` actions to push images to ECR and update ECS services/EKS deployments.

#### General Cloud Deployment Steps:

1.  **Provision Managed Database:** Start with a managed PostgreSQL instance (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL).
2.  **Container Registry:** Use the cloud provider's container registry (ECR, ACR, GCR).
3.  **Compute Service:**
    *   **Container Orchestrator:** Kubernetes (EKS, GKE, AKS) for full orchestration capabilities.
    *   **Managed Container Service:** AWS ECS, Azure App Service for Containers, Google Cloud Run/App Engine for simpler container deployments.
    *   **Virtual Machines:** Deploy Docker containers directly on VMs (EC2, Azure VMs, Compute Engine) for more control, but requiring more manual management.
4.  **Load Balancer:** Set up a cloud load balancer (ALB, Azure Application Gateway, Google Cloud Load Balancing) for traffic distribution, SSL termination, and possibly WAF integration.
5.  **DNS & Domain:** Configure your domain's DNS records to point to your load balancer.
6.  **Secrets Management:** Integrate with the cloud provider's secrets management service.
7.  **Monitoring & Logging:** Utilize cloud-native monitoring (CloudWatch, Azure Monitor, Google Cloud Monitoring) and centralized logging.

## 5. Post-Deployment

*   **Verify Health:** Check application logs and monitoring dashboards to ensure all services are running correctly.
*   **Test Endpoints:** Perform sanity checks on key API endpoints and frontend functionality.
*   **Monitor Performance:** Keep an eye on response times, error rates, and resource utilization.
*   **Set Up Alerts:** Configure alerts for critical errors or performance degradation.
*   **Regular Backups:** Confirm your database backup strategy is in place and working.

By following these guidelines, you can ensure a robust and scalable deployment of your Authentication and Task Management System.