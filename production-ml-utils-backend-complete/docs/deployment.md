```markdown
# Deployment Guide: ML Utilities System

This document outlines the steps for deploying the ML Utilities System to a production environment. The recommended deployment strategy leverages Docker for containerization and Docker Compose for local orchestration, with considerations for cloud environments.

## 1. Local Deployment with Docker Compose (Development/Testing)

As described in the `README.md`, this is the easiest way to get the entire stack running locally.

1.  **Configure `.env` files:** Ensure `backend/.env` and `frontend/.env` are correctly configured. For `backend/.env`, ensure `DB_HOST` is `db` and `NODE_ENV` can be `development` or `production` for testing the build.
    *   `backend/.env`: `DATABASE_URL=postgresql://user:password@db:5432/ml_utilities_db`, `NODE_ENV=production`
    *   `frontend/.env`: `VITE_API_BASE_URL=http://backend:5000/api/v1` (Frontend connects directly to backend service within Docker network)
2.  **Build and Run:**
    ```bash
    docker-compose build
    docker-compose up -d
    ```
3.  **Run Migrations and Seed Data (one-time setup):**
    ```bash
    docker-compose exec backend npm run migration:run
    docker-compose exec backend npm run seed
    ```
4.  **Access:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api/v1`

## 2. Production Deployment Considerations (Cloud)

For a production environment, simply running `docker-compose up` might not be sufficient due to requirements like scalability, high availability, security, and advanced monitoring. Here are general considerations for deploying to cloud providers (e.g., AWS, GCP, Azure).

### 2.1. Database (PostgreSQL)

*   **Managed Service:** Use a managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL, GCP Cloud SQL). This handles backups, patching, scaling, and high availability.
*   **Connection:** Update `DATABASE_URL` in `backend/.env` to point to your managed database instance. Ensure network security groups/firewalls allow connections from your backend service.
*   **Migrations:** Automate database migrations as part of your CI/CD pipeline. The `npm run migration:run` command can be executed in a build step or within a deployment hook.

### 2.2. Backend (Node.js/Express)

*   **Container Orchestration:** Deploy the backend Docker image to a container orchestration service:
    *   **AWS:** ECS (Elastic Container Service) or EKS (Elastic Kubernetes Service).
    *   **GCP:** Cloud Run (serverless containers) or GKE (Google Kubernetes Engine).
    *   **Azure:** Azure Container Instances or Azure Kubernetes Service (AKS).
*   **Environment Variables:** Securely manage environment variables (e.g., database credentials, JWT secret) using secrets management services (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) or directly via the orchestration platform's secrets functionality.
*   **Scalability:** Configure auto-scaling based on CPU utilization or request load.
*   **Logging:** Configure `winston` to output logs to a centralized logging service (e.g., CloudWatch Logs, Stackdriver Logging, Azure Monitor) for better monitoring and analysis.
*   **Monitoring:** Set up application performance monitoring (APM) tools (e.g., Datadog, New Relic) to track backend health, latency, and error rates.
*   **File Storage:** **Crucially**, replace local `multer` storage with a cloud object storage service (AWS S3, GCP Cloud Storage, Azure Blob Storage). This decouples storage from compute instances and ensures file durability and accessibility across scaled instances.
    *   You'll need to update `backend/src/utils/fileUpload.ts` and `backend/src/modules/*/service.ts` to use SDKs for your chosen cloud storage.

### 2.3. Frontend (React/Vite)

*   **Static Hosting:** The frontend is a static SPA. Deploy the built static files (`frontend/dist` after `yarn build`) to a static site hosting service:
    *   **AWS:** S3 + CloudFront (CDN)
    *   **GCP:** Cloud Storage + Cloud CDN
    *   **Azure:** Azure Blob Storage + Azure CDN
    *   **Other:** Vercel, Netlify, Cloudflare Pages.
*   **Domain & SSL:** Configure a custom domain and enable SSL/TLS certificates (e.g., using AWS Certificate Manager, Let's Encrypt).
*   **API Endpoint:** Ensure `VITE_API_BASE_URL` in `frontend/.env` points to the public URL of your deployed backend API (e.g., `https://api.your-domain.com/api/v1`).
*   **CDN:** Using a Content Delivery Network (CDN) like CloudFront or Cloudflare will improve frontend performance by caching assets closer to users.

### 2.4. CI/CD Pipeline (GitHub Actions)

The `.github/workflows` directory contains example CI/CD configurations for GitHub Actions.

#### `ci.yml` (Continuous Integration)
This workflow runs on every push to `main` or pull request:
1.  **Checkout Code:** Clones the repository.
2.  **Setup Node.js:** Sets up Node.js environment.
3.  **Install Dependencies:** Installs backend and frontend dependencies.
4.  **Linting:** Runs ESLint for code style and quality checks.
5.  **Build:** Compiles TypeScript for backend, builds static assets for frontend.
6.  **Tests:** Runs unit, integration, and API tests for both backend and frontend.
7.  **Coverage:** Reports test coverage.

#### `cd.yml` (Continuous Deployment)
This workflow typically runs on merges to `main` (or specific branches):
1.  **Checkout Code.**
2.  **Login to Docker Registry:** Authenticates with Docker Hub or a cloud registry (e.g., AWS ECR, GCP Container Registry).
3.  **Build Docker Images:** Builds the `backend` and `frontend` Docker images.
4.  **Tag and Push Images:** Tags images with commit SHA/version and pushes them to the registry.
5.  **Deploy to Cloud Provider:** This step is highly specific to your chosen cloud provider and orchestration service. Examples:
    *   **ECS/EKS:** Update service definitions, trigger new deployment.
    *   **Cloud Run:** Deploy new revision of service.
    *   **S3/CloudFront:** Sync built frontend assets to S3 bucket and invalidate CDN cache.

**Example `cd.yml` snippet (conceptual for AWS ECS):**

```yaml
# ... (setup, build, push steps)

    - name: Deploy to AWS ECS
      uses: aws-actions/amazon-ecs-deploy@v1
      with:
        task-definition: your-ecs-task-definition.json # Path to your ECS task definition
        service: your-ecs-service-name
        cluster: your-ecs-cluster-name
        wait-for-service-stability: true
        image: your-dockerhub-username/ml-utilities-backend:${{ github.sha }} # Use latest pushed image
        # You'll likely need a separate step for frontend static file deployment
```

### 2.5. Performance Testing

*   **Tools:** Use tools like Apache JMeter, k6, or Locust to simulate user load and test API response times, throughput, and error rates under stress.
*   **Scenarios:** Design tests for critical paths (login, creating a project, uploading a model, running inference).
*   **Monitoring:** Correlate performance test results with backend and database metrics to identify bottlenecks.

### 2.6. Security Scans

*   **Vulnerability Scanning:** Integrate security scanning tools (e.g., Snyk, Trivy) into your CI/CD pipeline to identify known vulnerabilities in dependencies and Docker images.
*   **SAST/DAST:** Consider Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) for more comprehensive security analysis.

By following these guidelines, you can ensure a robust, scalable, and secure deployment of the ML Utilities System.
```