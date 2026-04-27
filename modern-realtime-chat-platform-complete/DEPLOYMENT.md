# Real-time Chat Application - Deployment Guide

This document outlines the steps and considerations for deploying the Real-time Chat Application to a production environment.

## 1. Local Development Deployment (Docker Compose)

For local development and testing, the `docker-compose.yml` file provides a convenient way to run all services.

To deploy locally:
1.  Ensure Docker and Docker Compose are installed.
2.  Navigate to the project root.
3.  Create `.env` files for backend and frontend based on `backend/.env.example` and `frontend/.env.local.example`.
4.  Run: `docker-compose up --build -d`
5.  Access frontend at `http://localhost:3001` and backend at `http://localhost:3000`.

**Note**: The `command` in `docker-compose.yml` for the backend currently includes `npm run migration:run && npm run seed`. This is suitable for development but should be adjusted for production.

## 2. Production Deployment Considerations

A production deployment requires more robustness, security, and scalability than a local Docker Compose setup.

### 2.1. Environment Variables

*   **Security**: All sensitive information (database credentials, JWT secrets, session secrets, API keys) must be injected securely as environment variables, not hardcoded.
*   **Strong Secrets**: Use long, complex, randomly generated strings for `JWT_SECRET` and `SESSION_SECRET`.
*   **Production URLs**: Ensure `FRONTEND_URL` (backend) and `NEXT_PUBLIC_API_BASE_URL` (frontend) point to your production domains.
*   **Logging**: Set `LOG_LEVEL` to `info` or `warn` in production to reduce verbosity, while ensuring critical errors are logged.

### 2.2. Database (PostgreSQL)

*   **Managed Service**: Use a managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) for high availability, backups, and easier maintenance.
*   **Connection Pooling**: Ensure your database connection pool is correctly configured for the expected load.
*   **Migrations**:
    *   **NEVER** use `synchronize: true` in production.
    *   Run TypeORM migrations (`npm run migration:run`) as a separate step during your deployment process (e.g., in a CI/CD job or a dedicated deploy script) *before* the application starts.
    *   Rollback strategies for migrations should be in place.
*   **Backups**: Implement regular database backups.
*   **Monitoring**: Set up robust monitoring for database performance (CPU, memory, disk I/O, query performance).

### 2.3. Caching (Redis)

*   **Managed Service**: Use a managed Redis service (e.g., AWS ElastiCache, Azure Cache for Redis, Google Cloud Memorystore) for high availability and scalability.
*   **Persistence**: Configure Redis persistence if you need session data to survive restarts (e.g., RDB snapshots or AOF).
*   **Security**: Secure Redis (password protection, network isolation).

### 2.4. Backend (NestJS)

*   **Clustering/Scaling**:
    *   Run multiple instances of the NestJS backend behind a load balancer.
    *   Since Socket.IO uses WebSockets, **sticky sessions** are required on the load balancer if you're not using a Redis adapter for Socket.IO. For this setup, we'd need to add `socket.io-redis` adapter for horizontal scaling.
    *   **Recommendation**: Implement `socket.io-redis` adapter for true horizontal scaling of WebSockets.
        ```typescript
        // In backend/src/chat/chat.gateway.ts (add to constructor)
        // const redisAdapter = createAdapter(redisClient, redisPubClient);
        // this.server.adapter(redisAdapter);
        ```
*   **Process Manager**: Use a process manager like PM2 (for single-server deployments) or run within container orchestration (Kubernetes, ECS) for keeping the application alive.
*   **Logging**: Configure Winston to output logs to a centralized logging system (e.g., ELK Stack, Datadog, Splunk) rather than just local files, especially for containerized deployments.
*   **Security**:
    *   Ensure all dependencies are up-to-date to mitigate known vulnerabilities.
    *   Implement HTTPS for all HTTP communication.
    *   Review CORS settings (`app.enableCors`) for production to allow only trusted origins.
    *   Consider WAF (Web Application Firewall) for additional protection.

### 2.5. Frontend (Next.js)

*   **Static Assets**: Next.js applications can be deployed to various platforms (Vercel, Netlify, AWS S3 + CloudFront, Nginx).
*   **SSR/ISR**: If you use Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR), ensure your Node.js server (from `frontend/Dockerfile.frontend`) is appropriately scaled and managed.
*   **HTTPS**: Always serve your frontend over HTTPS.
*   **CDN**: Use a CDN for static assets for faster global delivery.
*   **Environment Variables**: Ensure `NEXT_PUBLIC_API_BASE_URL` is correctly configured to point to your production backend.

### 2.6. CI/CD Pipeline (GitHub Actions Example)

The `.github/workflows/main.yml` provides a basic template for a CI/CD pipeline.
Key steps for a production pipeline:

1.  **Build**:
    *   Build Docker images for both backend and frontend.
    *   Tag images with commit SHA or version.
2.  **Test**:
    *   Run unit, integration, and e2e tests for both backend and frontend.
    *   Publish test reports and coverage reports.
3.  **Security Scan**:
    *   Run static code analysis (SAST) tools.
    *   Scan Docker images for vulnerabilities.
4.  **Deploy to Staging**:
    *   Push Docker images to a container registry (e.g., Docker Hub, AWS ECR, GCR).
    *   Deploy the application to a staging environment (e.g., Kubernetes cluster, AWS ECS).
    *   Run smoke tests/basic health checks on staging.
5.  **Manual Approval (Optional)**:
    *   Require manual approval before deploying to production.
6.  **Deploy to Production**:
    *   Deploy to production environment.
    *   Perform rolling updates to minimize downtime.
7.  **Post-Deployment Checks**:
    *   Verify health of services.
    *   Monitor logs and metrics for anomalies.

```yaml
# === .github/workflows/main.yml ===
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install backend dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run backend tests
        run: npm run test:cov
        working-directory: ./backend
        env: # Use dummy values for tests if they don't hit a real DB/Redis
          DATABASE_URL: postgres://user:password@localhost:5432/test_db
          JWT_SECRET: testsecret
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          SESSION_SECRET: test_session_secret
          FRONTEND_URL: http://localhost:3001
      
      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: backend-coverage-report
          path: ./backend/coverage

  build-and-test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install frontend dependencies
        run: npm ci
        working-directory: ./frontend

      - name: Run frontend tests
        run: npm test
        working-directory: ./frontend

  build-docker-images:
    needs: [build-and-test-backend, build-and-test-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Log in to Docker Hub (or other registry)
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: yourdockerrepo/chat-backend:${{ github.sha }}, yourdockerrepo/chat-backend:latest

      - name: Build and push frontend Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.frontend
          push: true
          tags: yourdockerrepo/chat-frontend:${{ github.sha }}, yourdockerrepo/chat-frontend:latest
          build-args: |
            NEXT_PUBLIC_API_BASE_URL=https://your-production-backend.com # Specify production API URL at build time

  deploy:
    needs: [build-docker-images]
    if: github.ref == 'refs/heads/main' # Only deploy main branch
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials (example for AWS EKS/ECS)
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Update Kubernetes deployment (example)
        run: |
          # Replace with your actual deployment commands (e.g., kubectl, helm, aws cli)
          echo "Deploying chat-backend:${{ github.sha }} and chat-frontend:${{ github.sha }} to Kubernetes..."
          # kubectl set image deployment/chat-backend chat-backend=yourdockerrepo/chat-backend:${{ github.sha }}
          # kubectl set image deployment/chat-frontend chat-frontend=yourdockerrepo/chat-frontend:${{ github.sha }}
          echo "Deployment successful!"
          # Add health checks or smoke tests here
```

### 2.7. Monitoring

*   **APM (Application Performance Monitoring)**: Integrate tools like New Relic, Datadog, or Sentry for detailed insights into application performance, error rates, and user experience.
*   **Infrastructure Monitoring**: Monitor CPU, memory, network I/O of your servers/containers, database, and Redis.
*   **Alerting**: Set up alerts for critical errors, performance degradation, or service outages.

By following these guidelines, you can ensure a robust, secure, and scalable deployment of your real-time chat application.