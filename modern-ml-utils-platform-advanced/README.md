```markdown
# MLFlow Pro - Machine Learning Model & Experiment Management System

## Table of Contents
1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Technologies Used](#4-technologies-used)
5. [Getting Started](#5-getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Development Setup (without Docker)](#local-development-setup-without-docker)
    - [Docker Setup (Recommended)](#docker-setup-recommended)
6. [API Documentation](#6-api-documentation)
7. [Frontend Usage](#7-frontend-usage)
8. [Testing](#8-testing)
9. [Deployment](#9-deployment)
10. [Configuration](#10-configuration)
11. [Additional Features](#11-additional-features)
12. [Contributing](#12-contributing)
13. [License](#13-license)

---

## 1. Introduction
MLFlow Pro is an enterprise-grade, full-stack Machine Learning Utilities System designed to streamline the lifecycle management of ML models and experiments. It provides a robust platform for data scientists and MLOps engineers to register models, track experiment runs, manage datasets, and catalog features, ensuring reproducibility and collaboration.

## 2. Features
- **User Management & Authentication:** Secure user registration, login, and role-based access control (Admin/User) using JWT.
- **ML Model Management:**
    - Register new ML models with metadata (name, description, owner).
    - Version control for models, tracking different iterations and their artifacts.
    - Log training data information and performance metrics for each model version.
    - Track model deployment status (staging, production, archived).
- **Experiment Tracking:**
    - Create experiments to group related ML runs.
    - Log individual runs with parameters, metrics, and artifact URIs.
    - Compare runs to evaluate model performance and hyperparameter tuning effectiveness.
- **Dataset Cataloging:**
    - Register datasets with metadata (name, description, path, version, owner).
    - Basic data versioning metadata tracking.
- **Feature Store (Metadata):**
    - Catalog features with their definitions (name, description, data type, source dataset).
    - Useful for discovering and reusing features across projects.
- **RESTful API:** Comprehensive CRUD operations for all core entities.
- **Intuitive UI:** A responsive and user-friendly web interface built with React and Chakra UI.
- **Scalable Architecture:** Built with NestJS (Node.js/TypeScript) for the backend, PostgreSQL for data persistence, and Redis for caching.
- **Containerization:** Docker and Docker Compose for easy setup and deployment.
- **CI/CD:** GitHub Actions for automated testing and build processes.

## 3. Architecture
The system follows a typical three-tier architecture:

1.  **Frontend (Client Layer):** A React single-page application (SPA) providing the user interface. It communicates with the backend via RESTful API calls.
2.  **Backend (Application Layer):** A NestJS application that handles business logic, data processing, API routing, authentication, and interacts with the database.
3.  **Database Layer (Data Layer):**
    *   **PostgreSQL:** The primary relational database for storing structured application data (users, models, experiments, metadata).
    *   **Redis:** Used for caching frequently accessed data and for rate limiting to protect the API.

**Interactions:**
```mermaid
graph TD
    User --> Frontend
    Frontend --> BackendAPI[Backend (NestJS API)]
    BackendAPI --> PostgreSQL
    BackendAPI --> Redis[Redis (Cache, Rate Limiter)]
    BackendAPI -- Logs --> LoggingSystem[Winston/Console]
```

## 4. Technologies Used

**Backend:**
- **NestJS:** Framework for building scalable Node.js server-side applications.
- **TypeScript:** Primary language for strong typing.
- **TypeORM:** ORM for PostgreSQL database interactions.
- **PostgreSQL:** Relational database.
- **Redis:** Caching and session management.
- **JWT (JSON Web Tokens):** For authentication and authorization.
- **Bcrypt:** For password hashing.
- **Winston:** For structured logging.
- **Swagger:** API documentation.
- **Express Rate Limit:** For API rate limiting.

**Frontend:**
- **React:** JavaScript library for building user interfaces.
- **TypeScript:** For strong typing.
- **Chakra UI:** Component library for building accessible and stylish UIs.
- **React Router DOM:** For declarative routing.
- **Axios:** Promise-based HTTP client for API requests.
- **JWT-Decode:** For decoding JWT tokens on the client-side.

**DevOps & Tools:**
- **Docker & Docker Compose:** Containerization for easy setup and deployment.
- **Git & GitHub:** Version control and repository hosting.
- **GitHub Actions:** CI/CD pipeline.
- **Jest:** Testing framework (unit, integration, E2E).
- **Supertest:** For HTTP assertions in E2E tests.
- **ESLint & Prettier:** Code quality and formatting.

## 5. Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- Yarn (v1 or v2+)
- Docker & Docker Compose (if using Docker setup)
- Git

### Local Development Setup (without Docker)

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/mlflow-pro.git
cd mlflow-pro
```

**2. Setup PostgreSQL:**
- Install PostgreSQL locally or run it via Docker:
  `docker run --name mlflowpro-db -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mlflowpro -p 5432:5432 -d postgres:14-alpine`
- Ensure it's running and accessible on `localhost:5432`.

**3. Setup Redis:**
- Install Redis locally or run it via Docker:
  `docker run --name mlflowpro-redis -p 6379:6379 -d redis:6-alpine`
- Ensure it's running and accessible on `localhost:6379`.

**4. Backend Setup:**
```bash
cd backend
yarn install
cp .env.example .env # Create .env file from example
# Edit .env if your DB/Redis credentials or hosts are different
# DATABASE_URL="postgresql://user:password@localhost:5432/mlflowpro"
# REDIS_HOST="localhost"
yarn migration:run # Run database migrations
yarn seed          # Seed initial data (optional)
yarn start:dev     # Start the backend in development mode
```
The backend will typically run on `http://localhost:3000`.

**5. Frontend Setup:**
```bash
cd ../frontend
yarn install
cp .env.local.example .env.local # Create .env.local file from example
# Ensure VITE_API_BASE_URL points to your backend:
# VITE_API_BASE_URL=http://localhost:3000/api
yarn dev # Start the frontend in development mode
```
The frontend will typically run on `http://localhost:5173` (or another port if 5173 is taken).

### Docker Setup (Recommended)

This method simplifies setup by running everything in Docker containers.

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/mlflow-pro.git
cd mlflow-pro
```

**2. Create .env files:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```
Ensure `backend/.env` points `DATABASE_URL` to `postgresql://user:password@db:5432/mlflowpro` and `REDIS_HOST` to `redis`.
Ensure `frontend/.env.local` points `VITE_API_BASE_URL` to `http://localhost:3000/api` (this will be handled by Docker Compose service routing internally, and exposed to host via port mapping).

**3. Build and run with Docker Compose:**
```bash
docker-compose up --build
```
This command will:
- Build Docker images for both backend and frontend.
- Start PostgreSQL, Redis, Backend, and Frontend containers.
- Run migrations automatically (the backend entrypoint might run it, or you can exec into the backend container to run `yarn migration:run`).
- Seed data (you might need to `docker exec -it <backend_container_id> yarn seed` after the backend is up).

**Access:**
- Backend API: `http://localhost:3000/api` (Swagger UI at `http://localhost:3000/api-docs`)
- Frontend UI: `http://localhost:80`

## 6. API Documentation

The backend exposes an OpenAPI (Swagger) documentation.
Once the backend is running (either locally or via Docker), navigate to:
`http://localhost:3000/api-docs`

This interface allows you to view all available API endpoints, their expected request bodies, and example responses.

## 7. Frontend Usage

-   **Register/Login:** Access the login page (`/login`) to create a new account or log in with existing credentials. Default seed accounts are `admin`/`password123` and `john.doe`/`password123`.
-   **Dashboard:** View an overview of your models, experiments, and recent activities.
-   **Models:** List, view details, create, update, and delete ML models and their versions.
-   **Experiments:** Track and manage your ML experiments, including individual runs with parameters and metrics.
-   **Datasets/Features:** Catalog and manage metadata for your datasets and features.

## 8. Testing

**Backend Tests:**
```bash
cd backend
yarn test         # Run all tests
yarn test:unit    # Run unit tests only
yarn test:e2e     # Run end-to-end (API) tests
yarn test:cov     # Run tests and generate coverage report (aim for 80%+)
```

**Frontend Tests:**
```bash
cd frontend
yarn test         # Run all tests
yarn test:watch   # Run tests in watch mode
```

**Performance Tests (Conceptual):**
For performance testing, consider tools like `k6` or `Apache JMeter`.
Example `k6` script for basic load testing:
```javascript
// Example: k6/scripts/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate ramp-up of 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000/api'; // Or your deployed API URL

  // 1. Authenticate (once per user scenario)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });
  check(loginRes, {
    'login status is 201': (r) => r.status === 201,
    'login token exists': (r) => r.json() && r.json().accessToken,
  });
  const authToken = loginRes.json('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // 2. List Models
  const modelsRes = http.get(`${BASE_URL}/models`, { headers, tags: { name: 'List Models' } });
  check(modelsRes, {
    'list models status is 200': (r) => r.status === 200,
    'list models response has data': (r) => r.json() && Array.isArray(r.json()),
  });

  // 3. Get Specific Model (assuming you have one, e.g., 'sentiment-analysis-model-id')
  // For a real test, you'd fetch IDs dynamically or use random ones
  const modelId = 'replace-with-known-model-id-from-db-or-dynamic-fetch';
  if (modelId !== 'replace-with-known-model-id-from-db-or-dynamic-fetch') {
    const modelDetailRes = http.get(`${BASE_URL}/models/${modelId}`, { headers, tags: { name: 'Get Model Detail' } });
    check(modelDetailRes, {
      'get model detail status is 200': (r) => r.status === 200,
    });
  }


  sleep(1); // Simulate user think time
}
```
To run this, save it as `api-load-test.js` in a `k6` directory and then `k6 run k6/scripts/api-load-test.js`.

## 9. Deployment

The `docker-compose.yml` provides a basic deployment setup for a single host.

**Steps for Production Deployment (conceptual):**

1.  **Build Production Images:**
    ```bash
    docker-compose build
    ```
2.  **Push to Container Registry:**
    Tag and push your images to a container registry (e.g., Docker Hub, AWS ECR, Google Container Registry).
    ```bash
    docker tag mlflow-pro-backend:latest your-registry/mlflow-pro-backend:latest
    docker push your-registry/mlflow-pro-backend:latest
    # Repeat for frontend
    ```
3.  **Choose a Cloud Provider/Hosting:**
    -   **PaaS (e.g., Heroku, Render, AWS Elastic Beanstalk):** Simpler, less control.
    -   **Container Orchestration (e.g., Kubernetes on AWS EKS, GCP GKE, Azure AKS):** For high scalability, reliability, and complex deployments.
    -   **Virtual Private Server (VPS) / VM:** More manual setup (e.g., using `docker-compose` directly on a server).
4.  **Configure Environment Variables:** Ensure all sensitive data (database credentials, JWT secrets, etc.) are passed as environment variables securely to your deployed containers.
5.  **Database & Redis Provisioning:** Set up managed PostgreSQL and Redis instances (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL, AWS ElastiCache) for production stability and backups.
6.  **Load Balancing & SSL:** Deploy with a load balancer (e.g., Nginx, AWS ALB) and configure SSL certificates for HTTPS.
7.  **Monitoring & Logging:** Integrate with external logging (e.g., ELK stack, Datadog, CloudWatch) and monitoring tools for production visibility.

## 10. Configuration

**Backend (`backend/.env`):**
- `PORT`: API server port.
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for signing JWT tokens. **CRITICAL for security, must be strong.**
- `JWT_EXPIRES_IN`: JWT expiration time (e.g., `1d`, `7h`).
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details for caching and rate limiting.
- `REDIS_TTL`: Default time-to-live for cached items in Redis (in seconds).
- `RATE_LIMIT_TTL`: Duration for rate limiting window (in milliseconds).
- `RATE_LIMIT_MAX`: Max requests allowed within `RATE_LIMIT_TTL`.

**Frontend (`frontend/.env.local`):**
- `VITE_API_BASE_URL`: Base URL of your backend API.

## 11. Additional Features

-   **Authentication/Authorization:** Implemented using JWT tokens for stateless authentication. Role-based access control (`@Roles()` decorator, `RolesGuard`) restricts access to specific endpoints or resources based on user roles (`admin`, `user`).
-   **Logging and Monitoring:** `Winston` is integrated into the backend for structured logging. Logs are output to console by default, but can be configured for file, daily rotate, or external services.
-   **Error Handling Middleware:** NestJS's exception filters (`HttpExceptionFilter`) provide a centralized way to handle exceptions and return consistent API error responses.
-   **Caching Layer:** Redis is integrated with NestJS `CacheModule` and `CacheInterceptor` to cache responses for frequently accessed endpoints (e.g., GET /models, GET /experiments). This significantly reduces database load and improves response times.
-   **Rate Limiting:** `express-rate-limit` middleware is applied globally (via `app.use(rateLimit(...))`) to prevent abuse and protect the API from brute-force attacks. The configuration uses Redis as a store.

## 12. Contributing
Feel free to fork the repository, open issues, and submit pull requests.

## 13. License
This project is licensed under the UNLICENSED.
```