# Full-Scale Mobile App Backend System

This is a comprehensive, production-ready backend system for a mobile application, built with TypeScript, Node.js, Express.js, and Prisma (PostgreSQL). It includes a robust set of features crucial for enterprise-grade applications, along with a minimal React frontend client to demonstrate API consumption.

---

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Docker Setup](#docker-setup)
5.  [Backend Documentation](#backend-documentation)
    *   [API Endpoints](#api-endpoints)
    *   [Authentication & Authorization](#authentication--authorization)
    *   [Error Handling](#error-handling)
    *   [Logging](#logging)
    *   [Caching](#caching)
    *   [Rate Limiting](#rate-limiting)
6.  [Testing](#testing)
    *   [Unit Tests](#unit-tests)
    *   [Integration Tests](#integration-tests)
    *   [Performance Tests (K6)](#performance-tests-k6)
7.  [CI/CD](#cicd)
8.  [Frontend Client](#frontend-client)
9.  [Deployment Guide](#deployment-guide)
10. [Contributing](#contributing)
11. [License](#license)

---

## 1. Features

*   **User Management:** Register, Login, User Profile (CRUD - restricted by roles).
*   **Task Management:** CRUD operations for tasks, linked to users.
*   **Authentication:** JWT (JSON Web Tokens) for secure API access.
*   **Authorization:** Role-based access control (User, Admin).
*   **Database:** PostgreSQL with Prisma ORM for type-safe database interactions, migrations, and seeding.
*   **API:** RESTful API endpoints with comprehensive CRUD support.
*   **Error Handling:** Centralized error handling middleware with custom `ApiError` class.
*   **Logging:** Winston-based logging for requests and application events.
*   **Caching:** In-memory caching (`node-cache`) to optimize read operations (can be extended to Redis).
*   **Rate Limiting:** Protects API from abusive requests.
*   **Configuration:** Environment-based configuration using `dotenv`.
*   **Dockerization:** `Dockerfile` and `docker-compose.yml` for easy setup and deployment.
*   **Testing:** Unit, Integration, and API tests with Jest and Supertest, plus performance tests with K6.
*   **Documentation:** Comprehensive READMEs, OpenAPI (Swagger) API documentation.
*   **CI/CD:** Basic GitHub Actions workflow for automated testing and building.

## 2. Technology Stack

### Backend
*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **Authentication:** JSON Web Tokens (JWT)
*   **Validation:** Zod
*   **Logging:** Winston
*   **Caching:** Node-cache
*   **Rate Limiting:** Express-rate-limit
*   **API Docs:** Swagger-UI-Express, YAML.js
*   **Testing:** Jest, Supertest, K6

### Frontend (Demonstration Client)
*   **Framework:** React
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (or similar, for a complete UI/UX)
*   **HTTP Client:** Axios

### DevOps
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions

## 3. Project Structure

```
.
├── .github/                      # CI/CD workflows
│   └── workflows/
│       └── main.yml
├── backend/
│   ├── src/
│   │   ├── config/               # Environment, database, server configurations
│   │   ├── middleware/           # Auth, error handling, logging, rate limiting
│   │   ├── modules/              # Core application modules (Auth, Users, Tasks)
│   │   ├── utils/                # Helper functions (e.g., password hashing, JWT)
│   │   ├── types/                # Custom TypeScript types/interfaces
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── prisma/                   # Prisma schema, migrations, and seed data
│   ├── tests/                    # Unit, integration, API, and performance tests
│   ├── swagger.yaml              # OpenAPI (Swagger) API definition
│   ├── .env.example              # Example environment variables
│   ├── Dockerfile                # Dockerfile for backend service
│   ├── docker-compose.yml        # Docker Compose for services (backend, db)
│   ├── package.json              # Backend dependencies and scripts
│   ├── tsconfig.json
│   └── README.md                 # Backend specific documentation
├── frontend/                     # React frontend client
│   ├── public/
│   ├── src/
│   │   ├── api/                  # API client setup
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/             # React Context for authentication
│   │   ├── pages/                # Application pages (Login, Register, Dashboard)
│   │   ├── utils/                # Frontend utilities
│   │   └── ...
│   ├── Dockerfile                # Dockerfile for frontend service
│   ├── package.json              # Frontend dependencies and scripts
│   ├── tsconfig.json
│   └── README.md                 # Frontend specific documentation
└── README.md                     # Overall project documentation (this file)
```

## 4. Getting Started

### Prerequisites

*   Node.js (v18+) & npm (or yarn)
*   Docker & Docker Compose (for containerized setup)
*   PostgreSQL client (optional, for direct DB access)

### Local Development Setup

Follow these steps to run the backend and frontend locally:

#### 4.1. Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mobile-app-backend.git
    cd mobile-app-backend
    ```
2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Configure environment variables:**
    *   Create a `.env` file by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and set your `DATABASE_URL` (e.g., `postgresql://user:password@localhost:5432/mydb`) and `JWT_SECRET`.
        *   If running PostgreSQL locally without Docker, ensure it's accessible.
        *   For quick local PostgreSQL setup without Docker Compose, you can use `docker run --name my-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mydb -p 5432:5432 -d postgres:15-alpine`.
5.  **Run Prisma migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```
6.  **Seed the database with initial data:**
    ```bash
    npm run prisma:seed
    ```
    *   Default users:
        *   Admin: `admin@example.com` / `admin123`
        *   User: `user@example.com` / `user123`
7.  **Start the backend in development mode:**
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:3000`. API documentation will be available at `http://localhost:3000/api-docs`.

#### 4.2. Frontend Setup (for demonstration)

1.  **Open a new terminal and navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:**
    *   Create a `.env` file by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Ensure `REACT_APP_API_BASE_URL` points to your backend (e.g., `http://localhost:3000/api/v1`).
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend application will open in your browser, typically at `http://localhost:3001`.

### Docker Setup

The easiest way to get the backend and database running is using Docker Compose.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Build the Docker images:**
    ```bash
    docker-compose build
    ```
3.  **Start the services (backend and database):**
    ```bash
    docker-compose up -d
    ```
    *   The `docker-compose.yml` includes commands to run Prisma migrations and seed the database automatically on startup for convenience.
    *   The backend will be accessible at `http://localhost:3000`.
    *   The PostgreSQL database will be accessible at `localhost:5432`.
4.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
5.  **Stop services:**
    ```bash
    docker-compose down
    ```

## 5. Backend Documentation

### API Endpoints

The backend exposes a RESTful API for user and task management. Full API documentation is available via Swagger UI.

*   **Swagger UI:** `http://localhost:3000/api-docs` (when server is running)

**Key Endpoints:**

*   **Authentication:**
    *   `POST /api/v1/auth/register`: Register a new user.
    *   `POST /api/v1/auth/login`: Log in and get a JWT token.
*   **Users:**
    *   `GET /api/v1/users`: Get all users (Admin only).
    *   `GET /api/v1/users/:id`: Get user profile by ID (Admin or self).
    *   `PATCH /api/v1/users/:id`: Update user profile by ID (Admin or self).
    *   `DELETE /api/v1/users/:id`: Delete a user (Admin only).
*   **Tasks:**
    *   `POST /api/v1/tasks`: Create a new task.
    *   `GET /api/v1/tasks`: Get tasks (user's own tasks or all for Admin).
    *   `GET /api/v1/tasks/:id`: Get a specific task by ID (user's own task or any for Admin).
    *   `PATCH /api/v1/tasks/:id`: Update a specific task by ID (user's own task or any for Admin).
    *   `DELETE /api/v1/tasks/:id`: Delete a specific task by ID (user's own task or any for Admin).

### Authentication & Authorization

*   **Authentication:** Uses JWT (JSON Web Tokens). Upon successful login, the API returns a token. This token must be included in the `Authorization` header of subsequent requests as `Bearer <token>`.
*   **Authorization:** Role-based access control is implemented using middleware.
    *   `UserRole.USER`: Can manage their own tasks and view their own profile.
    *   `UserRole.ADMIN`: Can manage all users and tasks.

### Error Handling

A centralized error handling middleware (`src/middleware/errorHandler.ts`) catches all errors.
*   Custom `ApiError` class for controlled, expected errors (e.g., 400 Bad Request, 404 Not Found).
*   Unhandled errors default to 500 Internal Server Error, with detailed logs.
*   Stack traces are only returned in development environments.

### Logging

Winston logger (`src/utils/logger.ts`) is used for structured logging.
*   Logs request details, errors, and key application events.
*   Configurable `LOG_LEVEL` (`debug`, `info`, `warn`, `error`) via `.env`.

### Caching

An in-memory cache (`node-cache`) is implemented in `src/utils/cache.ts` and integrated into services like `userService` and `taskService`.
*   Reduces database load for frequently accessed read operations (e.g., `getAllUsers`, `getTasks`, `getUserById`, `getTaskById`).
*   Configurable TTL (`CACHE_TTL`) via `.env`.
*   Cache invalidation occurs automatically on data modification (create, update, delete).
*   For production at scale, consider a distributed cache like Redis.

### Rate Limiting

`express-rate-limit` middleware (`src/middleware/rateLimitMiddleware.ts`) is applied globally to prevent abuse and brute-force attacks.
*   Limits requests per IP address within a specified time window.
*   Configurable `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` via `.env`.

## 6. Testing

The project uses Jest for unit and integration testing, and K6 for performance testing.

### Unit Tests

Focus on individual functions, services, and utility logic in isolation.
*   **Run unit tests:**
    ```bash
    cd backend
    npm run test:unit
    ```
*   **Coverage:** Aim for 80%+ coverage for core logic.

### Integration Tests

Test the interaction between different components, especially API endpoints and the database. `Supertest` is used to make HTTP requests to the Express app.
*   **Run integration tests:**
    ```bash
    cd backend
    npm run test:integration
    ```
*   **Setup:** `tests/integration/setupIntegrationTests.ts` seeds a clean test database before running.

### Performance Tests (K6)

Simulate user load to evaluate API performance.
*   **Install K6:** `brew install k6` (macOS) or refer to [k6.io installation guide](https://k6.io/docs/getting-started/installation/).
*   **Ensure backend is running.**
*   **Run performance tests:**
    ```bash
    cd backend
    k6 run tests/perf/login_test.js
    ```
*   The `login_test.js` script simulates user logins and task retrieval under load.

## 7. CI/CD

A basic GitHub Actions workflow (`.github/workflows/main.yml`) is configured for the backend.
*   **Triggers:** Runs on `push` to `main` and `pull_request` events.
*   **Steps:**
    1.  Install Node.js dependencies.
    2.  Run Linter (`npm run lint`).
    3.  Run Tests (`npm test`).
    4.  Build the application (`npm run build`).

## 8. Frontend Client

The `frontend/` directory contains a minimal React application that serves as a demonstration client for the backend API. It includes:
*   User authentication (Login, Register).
*   A dashboard to display and manage tasks for the authenticated user.
*   Utilizes `Axios` for API calls.

Refer to `frontend/README.md` for specific instructions on the frontend client.

## 9. Deployment Guide

This section outlines a general deployment strategy for a production environment.

1.  **Containerization (Docker):**
    *   The `Dockerfile` for the backend builds an optimized image for production.
    *   The `docker-compose.yml` can be adapted for production use by externalizing environment variables and using a more robust database setup (e.g., AWS RDS, Google Cloud SQL).

2.  **Environment Variables:**
    *   In a production environment, never hardcode sensitive information. Use environment variables managed by your cloud provider (e.g., Kubernetes Secrets, AWS Secrets Manager, Vault).
    *   Ensure `JWT_SECRET` is a long, random, and securely stored string.
    *   `NODE_ENV=production` should be set to enable production optimizations and suppress development-only features (like detailed error stacks).

3.  **Database:**
    *   Use a managed database service (e.g., AWS RDS PostgreSQL, Azure Database for PostgreSQL, Google Cloud SQL for PostgreSQL) for high availability, backups, and scaling.
    *   Apply Prisma migrations in a controlled manner, typically as part of a deployment pipeline before the application service starts. For `docker-compose.yml`, the `command` entry shows a basic way (`npx prisma migrate deploy && npm start`), but for serious production, a dedicated migration job is often preferred.

4.  **Scaling:**
    *   The stateless nature of the Express.js backend makes it easy to scale horizontally. Deploy multiple instances of the backend container behind a load balancer.
    *   Consider using a container orchestration platform like Kubernetes, AWS ECS, or Google Cloud Run.

5.  **Monitoring & Logging:**
    *   Integrate with external logging services (e.g., ELK Stack, Datadog, Splunk) for centralized log management and analysis.
    *   Set up application performance monitoring (APM) tools (e.g., New Relic, Datadog, Prometheus/Grafana) to track metrics, identify bottlenecks, and set up alerts.

6.  **Security:**
    *   Regularly update dependencies to patch known vulnerabilities.
    *   Implement HTTPS for all communication.
    *   Configure firewalls and security groups to restrict access to your database and internal services.
    *   Perform security audits and penetration testing.

## 10. Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes and ensure tests pass.
4.  Commit your changes (`git commit -am 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Create a new Pull Request.

## 11. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.