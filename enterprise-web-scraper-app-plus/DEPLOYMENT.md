# Web Scraping Tools System - Deployment Guide

This guide provides instructions for deploying the Web Scraping Tools System using Docker and Docker Compose. This setup is suitable for local development, staging, and can be adapted for production environments.

## Prerequisites

*   **Git:** For cloning the repository.
*   **Docker:** Docker Engine and Docker Compose installed.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)

## 1. Local Deployment with Docker Compose

This is the recommended way to run the entire system locally or for quick staging.

### 1.1. Clone the Repository

```bash
git clone <your-repo-url>
cd web-scraper-system
```
*Note: In a real project, this would be your actual Git repository URL.*

### 1.2. Configure Environment Variables

Create `.env` files for both the backend and frontend services.

**For the Backend:**

Create `backend/.env` file:
```
# Application Configuration
PORT=5000
NODE_ENV=development # or production

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://user:password@db:5432/webscraperdb?schema=public" # 'db' is the service name in docker-compose

# JWT Configuration
JWT_SECRET="your_jwt_secret_key_very_strong_and_long_random_string"
JWT_EXPIRATION_TIME="1h"

# Admin User Seed Data (for initial setup)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminpassword" # CHANGE THIS IN PRODUCTION
```

**For the Frontend:**

Create `frontend/.env` file:
```
# React App Configuration
# Ensure this matches your backend service URL (and port if not default)
REACT_APP_API_BASE_URL=http://localhost:5000/api 
```
*Note: When deployed behind a reverse proxy (like Nginx, not included in this simple Docker Compose), `REACT_APP_API_BASE_URL` might point to the proxy's URL, e.g., `http://yourdomain.com/api`.*

### 1.3. Build and Run Services

From the project root directory (`web-scraper-system/`):

```bash
docker-compose up --build
```

*   `docker-compose up`: Starts all services defined in `docker-compose.yml`.
*   `--build`: Builds images if they don't exist or if `Dockerfile` has changed.

This command will:
1.  Build the `db` (PostgreSQL) image if not available.
2.  Build the `backend` Node.js image based on `backend/Dockerfile`.
3.  Build the `frontend` React image based on `frontend/Dockerfile`.
4.  Start all three services.

### 1.4. Verify Deployment

*   **Backend API:** `http://localhost:5000/api` (You should see a "Web Scraper API is running!" message, or a 404 for the root `/api` endpoint).
*   **Frontend UI:** `http://localhost:3000` (You should see the React application).
*   **Database:** You can connect to the PostgreSQL database from your local machine using a tool like DBeaver or `psql` if you expose the port (e.g., `5432:5432` in `docker-compose.yml`). The credentials are in `backend/.env`.

### 1.5. Stop Services

To stop all running services:

```bash
docker-compose down
```

To stop and remove containers, networks, and volumes (useful for a clean slate):

```bash
docker-compose down -v
```

### 1.6. Database Migrations and Seeding

When running with Docker Compose, Prisma migrations are applied automatically during the backend container startup via a `pre-start.sh` script. The seed data is also applied after migrations.

If you make schema changes, you'll need to generate new migrations:
1.  Ensure your `backend/.env` is correctly configured to point to your *running* Dockerized database (e.g., `DATABASE_URL="postgresql://user:password@localhost:5432/webscraperdb?schema=public"` for local client access, or temporarily modify `docker-compose.yml` to expose DB port).
2.  From the `backend` directory:
    ```bash
    npx prisma migrate dev --name <migration-name>
    ```
3.  Then rebuild your backend image:
    ```bash
    docker-compose build backend
    docker-compose up -d backend
    ```

## 2. Production Deployment Considerations (Beyond Docker Compose)

For a robust production environment, consider the following:

### 2.1. Dedicated Database Service
*   Do not run the database directly within Docker Compose on a single server for production. Use a managed database service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) or a highly available, replicated PostgreSQL cluster.

### 2.2. Reverse Proxy & SSL
*   Place a reverse proxy (like Nginx or Caddy) in front of your backend and frontend services.
*   Configure the proxy to handle SSL/TLS termination (HTTPS) for secure communication.
*   Route traffic to the appropriate backend/frontend containers.

### 2.3. Scalability
*   **Backend:** Deploy multiple instances of the backend service (e.g., using Kubernetes, AWS ECS, Docker Swarm) behind a load balancer to handle increased API traffic.
*   **Scraping Workers:** If scraping load becomes high, consider separating the scraping logic into a dedicated worker service. Use a message queue (e.g., RabbitMQ, Redis Streams/BullMQ) to send scraping jobs to multiple worker instances, decoupling them from the main API.
*   **Frontend:** Serve static frontend assets via a CDN (Content Delivery Network) for faster global access.

### 2.4. Observability
*   **Logging:** Centralize logs from all services (backend, frontend, database, proxy) using a log management system (e.g., ELK Stack, Grafana Loki, DataDog).
*   **Monitoring:** Set up monitoring for resource usage (CPU, memory, disk), API response times, error rates, and database performance. Tools like Prometheus + Grafana are popular.
*   **Alerting:** Configure alerts for critical issues (e.g., high error rates, service downtime).

### 2.5. Security Best Practices
*   **Least Privilege:** Configure user permissions in the database and server environments with the principle of least privilege.
*   **Network Security:** Implement firewalls, security groups, and private networks to restrict access to services.
*   **Secret Management:** Use a dedicated secret management service (e.g., AWS Secrets Manager, HashiCorp Vault) for environment variables and sensitive credentials instead of `.env` files in production.
*   **Regular Updates:** Keep Docker images, Node.js, React, and all dependencies updated to patch security vulnerabilities.

### 2.6. CI/CD Pipeline
*   Your CI/CD pipeline (e.g., GitHub Actions, GitLab CI, Jenkins) should automate building Docker images, running tests, pushing images to a container registry (e.g., Docker Hub, AWS ECR), and deploying to your production environment. (See `CI/CD` section in `README.md` for GitHub Actions example).

## Example Production Setup (Conceptual)

```mermaid
graph TD
    A[User] --> B(Domain Name)
    B --> C(Cloud Load Balancer / Nginx Proxy)
    C --> D1(Backend API Instance 1)
    C --> D2(Backend API Instance 2)
    C --> D3(Frontend Static Files)
    D1 -- Reads/Writes --> E[Managed PostgreSQL Database]
    D2 -- Reads/Writes --> E
    D1 -- Triggers --> F(Message Queue - e.g., RabbitMQ)
    D2 -- Triggers --> F
    F --> G1(Scraping Worker Instance 1)
    F --> G2(Scraping Worker Instance 2)
    G1 -- Scrapes --> H[Target Websites]
    G2 -- Scrapes --> H
    G1 -- Stores Results --> E
    G2 -- Stores Results --> E
    subgraph Observability
        I[Log Aggregator]
        J[Monitoring System]
    end
    D1 --> I
    D2 --> I
    G1 --> I
    G2 --> I
    E --> I
    C --> J
    D1 --> J
    D2 --> J
    E --> J
```