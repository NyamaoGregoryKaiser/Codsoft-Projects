# Enterprise-Grade Authentication System

This project is a comprehensive, production-ready full-stack authentication system built with Python (FastAPI) for the backend and React (TypeScript) for the frontend. It includes robust authentication/authorization features (JWT, refresh tokens, email verification, password reset), a PostgreSQL database with migrations, Dockerization, CI/CD configuration, extensive testing, and detailed documentation.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker Compose)](#local-development-setup-docker-compose)
    *   [Backend Specific Setup](#backend-specific-setup)
    *   [Frontend Specific Setup](#frontend-specific-setup)
4.  [API Documentation](#api-documentation)
5.  [Testing](#testing)
6.  [Deployment](#deployment)
7.  [CI/CD](#cicd)
8.  [Additional Features](#additional-features)
9.  [Project Structure](#project-structure)
10. [License](#license)

## 1. Features

**Backend (FastAPI)**
*   **User Management:** Registration, Login, Logout, User Profile Management.
*   **Authentication:** JWT (JSON Web Tokens) for stateless authentication.
*   **Authorization:** Role-Based Access Control (RBAC) - `User`, `VerifiedUser`, `Superuser`.
*   **Token Management:** Access tokens (short-lived), Refresh tokens (long-lived, HttpOnly cookie, Redis blacklisting).
*   **Security:** Password hashing (Bcrypt), Rate limiting (FastAPI-Limiter + Redis).
*   **Email Actions:** Email verification, Password reset (via email link).
*   **CRUD Operations:** Example "Items" resource with owner-based access.
*   **Database:** PostgreSQL with SQLAlchemy (async) and Alembic for migrations.
*   **Caching:** Redis for refresh token blacklisting and rate limiting.
*   **Error Handling:** Centralized API exception handling.
*   **Logging:** Structured logging.

**Frontend (React + TypeScript)**
*   **User Interface:** Intuitive UI for login, registration, dashboard, profile.
*   **Protected Routes:** Guards for unauthorized access.
*   **State Management:** React Context API for authentication state.
*   **API Integration:** Secure communication with the FastAPI backend.
*   **Responsive Design:** Tailwind CSS.

**DevOps & Quality**
*   **Docker:** Containerization for all services (backend, frontend, database, Redis).
*   **Docker Compose:** Orchestrates multi-container development environment.
*   **Unit & Integration Tests:** Comprehensive test suite for backend and frontend.
*   **CI/CD:** GitHub Actions workflow for linting, testing, and Docker image building.

## 2. Architecture

See [Architecture Documentation](docs/architecture.md) for a detailed overview.

## 3. Getting Started

### Prerequisites

*   Docker Desktop (or Docker Engine and Docker Compose)
*   Git

### Local Development Setup (Docker Compose)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/authsys.git
    cd authsys
    ```

2.  **Create `.env` file:**
    Copy the example environment variables file and fill in your secrets.
    ```bash
    cp .env.example .env
    # Open .env and customize if needed (especially SECRET_KEY)
    ```
    **Important:** For `SECRET_KEY`, use a strong, random string in production. You can generate one with `openssl rand -hex 32`.

3.  **Build and run the Docker containers:**
    This command will build the Docker images for backend and frontend, set up PostgreSQL and Redis, run database migrations, and start all services.
    ```bash
    docker-compose up --build -d
    ```

4.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
    You should see `db`, `redis`, `backend`, and `frontend` services in a healthy state.

5.  **Access the applications:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API (Swagger UI):** `http://localhost:8000/api/v1/docs`

    The backend will automatically create an initial superuser with credentials defined in `.env` (`FIRST_SUPERUSER_EMAIL`, `FIRST_SUPERUSER_PASSWORD`) if the database is empty.

### Backend Specific Setup

If you prefer to run the backend without Docker (e.g., for debugging in an IDE):

1.  **Install Poetry (recommended) or pip:**
    ```bash
    pip install poetry
    cd backend
    poetry install
    ```
    Or with pip:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  **Ensure PostgreSQL and Redis are running:**
    You can still use `docker-compose up -d db redis` to start just the database and Redis services.

3.  **Run database migrations:**
    ```bash
    cd backend
    alembic upgrade head
    ```

4.  **Start the FastAPI application:**
    ```bash
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

### Frontend Specific Setup

If you prefer to run the frontend without Docker:

1.  **Install Node.js (v18+) and npm:**

2.  **Install dependencies:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Start the React development server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000`. Ensure your backend is accessible at `http://localhost:8000` for the API calls to work.

## 4. API Documentation

The FastAPI backend automatically generates OpenAPI documentation (Swagger UI).
Access it at: `http://localhost:8000/api/v1/docs`

This interface allows you to:
*   View all available API endpoints.
*   Understand request/response schemas.
*   Test endpoints directly (e.g., register, login, access protected resources).

## 5. Testing

### Running Tests

**Backend Tests:**
To run unit and integration tests for the backend (inside the backend container):
```bash
docker-compose exec backend pytest
```
To run with coverage report:
```bash
docker-compose exec backend pytest --cov=app --cov-report=html
# Open backend/htmlcov/index.html in your browser for detailed report
```

**Frontend Tests:**
To run unit tests for the React frontend (inside the frontend container):
```bash
docker-compose exec frontend npm test
```
To run with coverage report:
```bash
docker-compose exec frontend npm run coverage
# Open frontend/coverage/index.html in your browser for detailed report
```

### Performance Tests (Conceptual)

For performance testing, tools like `k6` or `Locust` are recommended.

**Example `k6` setup:**
1.  **Install `k6`:** Follow instructions at `k6.io/docs/getting-started/installation/`.
2.  **Create a test script (e.g., `performance-test.js`):**
    ```javascript
    import http from 'k6/http';
    import { check, sleep } from 'k6';

    export default function () {
      const BASE_URL = 'http://localhost:8000/api/v1';

      // Simulate user registration
      let registerRes = http.post(`${BASE_URL}/auth/register`, {
        email: `user_${__VU}_${__ITER}@example.com`,
        password: 'Password123!',
        first_name: 'Test',
      }, { tags: { name: 'RegisterUser' } });
      check(registerRes, { 'registered successfully': (r) => r.status === 201 });
      
      // Simulate user login
      let loginRes = http.post(`${BASE_URL}/auth/login`, {
        username: `user_${__VU}_${__ITER}@example.com`,
        password: 'Password123!',
      }, { tags: { name: 'LoginUser' } });
      check(loginRes, { 'logged in successfully': (r) => r.status === 200 });

      const accessToken = loginRes.json('access_token');
      const params = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      // Simulate creating an item
      let createItemRes = http.post(`${BASE_URL}/items/`, {
        title: `Item ${__VU}-${__ITER}`,
        description: `Description for item ${__VU}-${__ITER}`,
      }, params);
      check(createItemRes, { 'item created successfully': (r) => r.status === 201 });

      sleep(1);
    }
    ```
3.  **Run the test:**
    ```bash
    k6 run --vus 10 --duration 30s performance-test.js
    ```
    This example runs 10 virtual users for 30 seconds. You can adjust `--vus` (Virtual Users) and `--duration` to simulate different load levels.

## 6. Deployment

This project is containerized using Docker, making it highly portable.

**Deployment Steps (General):**

1.  **Build Production Images:**
    ```bash
    docker-compose -f docker-compose.prod.yml build
    ```
    (You would create a `docker-compose.prod.yml` that optimizes for production, e.g., using Gunicorn for backend, Nginx for frontend, and specific environment variables).

2.  **Environment Variables:** Ensure your `.env` file contains production-ready values (strong `SECRET_KEY`, actual email service credentials, correct frontend URLs, secure CORS origins, etc.).

3.  **Orchestration:** Use a container orchestration platform for scaling, load balancing, and high availability:
    *   **Kubernetes:** For large-scale deployments, define Kubernetes manifests (Deployments, Services, Ingress, Persistent Volumes) for each service.
    *   **Docker Swarm:** A simpler orchestration tool for Docker.
    *   **Cloud Provider Services:**
        *   AWS ECS/EKS
        *   Google Cloud Run/GKE
        *   Azure Container Apps/AKS

4.  **Database Management:**
    *   Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL) for better reliability, backups, and scaling.
    *   Ensure migrations are run automatically or manually during deployment (e.g., `alembic upgrade head`).

5.  **Monitoring & Logging:**
    *   Integrate with cloud-native logging (e.g., CloudWatch, Stackdriver) or a centralized logging solution (ELK Stack, Grafana Loki).
    *   Set up monitoring (Prometheus, Grafana, Datadog) to track application performance, errors, and resource usage.

## 7. CI/CD

The project includes a basic GitHub Actions workflow (`.github/workflows/ci.yml`) to demonstrate continuous integration.

**`ci.yml` Workflow:**

*   **Triggers:** Runs on pushes to `main` and pull requests.
*   **Jobs:**
    *   **`backend-tests`:**
        *   Sets up Python environment.
        *   Installs dependencies.
        *   Starts test PostgreSQL and Redis services (using `docker-compose`).
        *   Runs backend unit and integration tests with `pytest`.
        *   Generates coverage reports.
    *   **`frontend-tests`:**
        *   Sets up Node.js environment.
        *   Installs dependencies.
        *   Runs frontend unit tests with `vitest`.
        *   Generates coverage reports.
    *   **`lint`:**
        *   Runs `ruff` for Python linting.
        *   Runs `eslint` for TypeScript linting.
        *   Runs `prettier` for code formatting checks.
    *   **`build-docker-images` (Conceptual/Placeholder):**
        *   Builds Docker images for backend and frontend.
        *   In a real production pipeline, this job would also push images to a container registry (e.g., Docker Hub, ECR, GCR) upon successful build, often after `main` branch merges.

**Further CI/CD Enhancements:**
*   **Deployment Stage:** Add a deployment job to automatically deploy to a staging or production environment after successful builds and tests.
*   **Security Scanning:** Integrate tools like Bandit (Python) or Snyk for vulnerability scanning.
*   **Container Scanning:** Scan Docker images for vulnerabilities.
*   **End-to-End Tests:** Add Cypress or Playwright tests for full application flows.

## 8. Additional Features

*   **Authentication/Authorization:** Implemented via JWT, refresh tokens, role-based access control (RBAC), and email verification.
*   **Logging and Monitoring:** Structured logging with Python's `logging` module. Integration with external monitoring tools (Prometheus/Grafana, ELK) is recommended for production.
*   **Error Handling Middleware:** Custom `APIException` and a global middleware catch and format errors consistently.
*   **Caching Layer:** Redis is used for refresh token blacklisting and rate limiting. It can be extended for data caching (e.g., user profiles, frequently accessed items).
*   **Rate Limiting:** Implemented using `fastapi-limiter` and Redis to protect against brute-force attacks and abuse on key endpoints (login, forgot-password).

## 9. Project Structure

```
.
├── .env.example
├── .github                 # GitHub Actions CI/CD workflows
│   └── workflows
│       └── ci.yml
├── .gitignore
├── README.md               # This documentation
├── docker-compose.yml      # Docker Compose for local development
├── backend
│   ├── alembic             # Database migration scripts (Alembic)
│   ├── app
│   │   ├── api             # API routes and endpoints
│   │   │   └── v1
│   │   │       ├── endpoints   # Specific API endpoint definitions (auth, users, items)
│   │   │       └── router.py   # Main API router for v1
│   │   ├── core            # Core configurations, security (JWT, hashing), exceptions, logging
│   │   ├── crud            # Create, Read, Update, Delete operations for models
│   │   ├── db              # Database setup, session, base models, initial data
│   │   ├── dependencies.py # FastAPI dependencies (DB session, auth, roles)
│   │   ├── middlewares     # Custom FastAPI middlewares (e.g., error handling)
│   │   ├── models          # SQLAlchemy ORM models (User, Item)
│   │   ├── schemas         # Pydantic models for request/response validation
│   │   ├── services        # External services integration (email, cache/redis)
│   │   └── main.py         # Main FastAPI application entry point
│   ├── Dockerfile          # Dockerfile for the backend service
│   ├── requirements.txt    # Python dependencies
│   ├── tests               # Backend unit and integration tests
│   │   ├── integration     # Integration tests (API interactions)
│   │   └── unit            # Unit tests (individual components)
│   └── alembic.ini         # Alembic configuration
├── frontend
│   ├── public              # Static assets
│   ├── src                 # React application source code
│   │   ├── api             # API service layer for frontend
│   │   ├── assets          # Frontend assets
│   │   ├── components      # Reusable React components
│   │   ├── context         # React Context API for global state (AuthContext)
│   │   ├── hooks           # Custom React hooks
│   │   ├── pages           # React page components (Login, Register, Dashboard etc.)
│   │   ├── router          # React Router setup
│   │   ├── types           # TypeScript type definitions
│   │   ├── utils           # Utility functions
│   │   ├── App.tsx         # Main React application component
│   │   ├── index.css       # Tailwind CSS base styles
│   │   └── main.tsx        # React application entry point
│   ├── Dockerfile          # Dockerfile for the frontend service
│   ├── package.json        # Node.js dependencies
│   ├── postcss.config.js   # PostCSS configuration for Tailwind
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── vite.config.ts      # Vite configuration for React
│   └── vitest.config.ts    # Vitest configuration for frontend testing
└── docs                    # Additional documentation
    └── architecture.md     # Architecture overview

```

## 10. License

This project is open-sourced under the MIT License.

---
```