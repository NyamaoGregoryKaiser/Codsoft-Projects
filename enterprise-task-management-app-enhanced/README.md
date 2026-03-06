# Enterprise Task Management System

This is a comprehensive, production-ready full-stack Task Management System designed for enterprise use. It features a robust backend built with NestJS (TypeScript) and a dynamic frontend powered by React (TypeScript) and Tailwind CSS. The system emphasizes best practices in architecture, security, scalability, and maintainability.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
    *   [Backend Stack](#backend-stack)
    *   [Frontend Stack](#frontend-stack)
    *   [Database & Caching](#database--caching)
    *   [DevOps & Monitoring](#devops--monitoring)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker)](#local-development-setup-docker)
    *   [Manual Setup (Without Docker)](#manual-setup-without-docker)
4.  [Running the Application](#running-the-application)
5.  [API Documentation](#api-documentation)
6.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Testing (Conceptual)](#performance-testing-conceptual)
7.  [CI/CD & Deployment Guide](#cicd--deployment-guide)
    *   [GitHub Actions](#github-actions)
    *   [Production Deployment](#production-deployment)
8.  [Additional Features](#additional-features)
9.  [Future Enhancements](#future-enhancements)
10. [Contributing](#contributing)
11. [License](#license)

## 1. Features

The system offers a wide range of features for efficient task management:

*   **User Management:**
    *   User Registration & Login (JWT-based authentication)
    *   Role-Based Access Control (RBAC): `Admin` and `User` roles.
    *   User Profiles.
*   **Project Management:**
    *   Create, Read, Update, Delete (CRUD) projects.
    *   Assign project owners.
    *   Project status tracking (active, archived, completed).
*   **Task Management:**
    *   CRUD tasks within projects.
    *   Set task titles, descriptions, status (TODO, IN_PROGRESS, DONE), priority (LOW, MEDIUM, HIGH), and due dates.
    *   Assign tasks to users (assignees) and track reporters.
    *   Filter and search tasks.
*   **Comments:**
    *   Add comments to tasks.
*   **Notifications (Conceptual/Future):**
    *   Real-time or event-driven notifications for task assignments, status changes, comments (basic entity for this is included).
*   **Robust API:**
    *   RESTful API with clear endpoints.
    *   Data Transfer Objects (DTOs) for request validation.
*   **User-Friendly UI:**
    *   Responsive and intuitive interface using React and Tailwind CSS.
    *   Dashboard for an overview of tasks and projects.

## 2. Architecture

The system follows a typical microservice-oriented (or modular monolithic) approach with a clear separation of concerns between frontend and backend.

```
+-------------------+             +-------------------+
|      Frontend     |             |      Backend      |
|   (React, Vite,   |             |  (NestJS, TypeORM)|
|    TailwindCSS)   |             |                   |
+-------------------+             +-------------------+
        | HTTP/S                              | HTTP/S (REST API)
        |                                     |
        |                                     |
+-------v-------------------------------------v-------+
|                 Reverse Proxy / Load Balancer       |
|                       (Nginx, Caddy, etc.)          |
+-----------------------------------------------------+
        |
        |
+-------v-------+      +-------v-------+      +-------v-------+
|  PostgreSQL   |----->|     Redis     |----->|   Winston     |
|   (Database)  |      |   (Caching,   |      |   (Logging)   |
|               |      |  Rate Limiting)|      |               |
+---------------+      +---------------+      +---------------+
```

### Backend Stack

*   **Framework:** NestJS (Node.js framework for building efficient, reliable and scalable server-side applications).
*   **Language:** TypeScript.
*   **Database ORM:** TypeORM (supports various databases, used here for PostgreSQL).
*   **Authentication:** JWT (JSON Web Tokens) with Passport.js strategies.
*   **Validation:** `class-validator` and `class-transformer`.
*   **Logging:** Winston for structured and daily rotated logs.
*   **Caching:** Redis with NestJS `CacheModule`.
*   **Rate Limiting:** NestJS `ThrottlerModule`.
*   **API Documentation:** Swagger/OpenAPI.

### Frontend Stack

*   **Framework:** React.js.
*   **Build Tool:** Vite.
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS for utility-first styling.
*   **State Management:** React Context API (or optionally a library like Zustand/Redux for larger scale).
*   **API Client:** Axios.
*   **Routing:** React Router DOM.
*   **UI Components:** Headless UI (for accessible, unstyled components like modals, dropdowns).

### Database & Caching

*   **Primary Database:** PostgreSQL (relational, robust, highly scalable).
    *   Schema definitions are managed via TypeORM entities.
    *   Database changes handled through migration scripts.
    *   Seed data provided for initial setup and development.
    *   Query optimization is achieved through proper indexing (configured in migrations), `select` clauses in TypeORM queries, and `relations` for eager/lazy loading.
*   **Caching Layer:** Redis (in-memory data store).
    *   Used for API response caching to reduce database load and improve response times.
    *   Also serves as a store for rate-limiting data.

### DevOps & Monitoring

*   **Containerization:** Docker for both backend and frontend, orchestrated with Docker Compose for local development.
*   **CI/CD:** GitHub Actions for automated testing, building, and deployment to a self-hosted runner.
*   **Logging:** Winston for backend application logs (console, daily rotating files).
*   **Error Handling:** Global HTTP exception filter to catch and format errors consistently.
*   **Monitoring (Conceptual):** While not fully implemented with external tools, the logging infrastructure lays the groundwork for integration with tools like Prometheus/Grafana or ELK stack.

## 3. Getting Started

### Prerequisites

Ensure you have the following installed:

*   Node.js (v20 or higher)
*   npm (v9 or higher)
*   Docker & Docker Compose (for the easiest setup)
*   Git

### Local Development Setup (Docker)

The recommended way to run this project locally is using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/task-management-system.git
    cd task-management-system
    ```

2.  **Create `.env` files:**
    *   Copy `backend/.env.example` to `backend/.env.development` and `backend/.env.test`.
    *   Fill in the `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET` variables.
        *   For `backend/.env.development`, set `SYNCHRONIZE_DB=true` initially, then `false` after first run.
        *   For `backend/.env.test`, set `SYNCHRONIZE_DB=true`.
    *   Example `backend/.env.development`:
        ```dotenv
        NODE_ENV=development
        PORT=3000
        API_PREFIX=api/v1
        DB_HOST=db
        DB_PORT=5432
        DB_USERNAME=user
        DB_PASSWORD=password
        DB_DATABASE=taskmanager_db
        SYNCHRONIZE_DB=true # Set to false after initial schema creation
        LOGGING_DB=true
        JWT_SECRET=superSecretKeyForDev
        JWT_EXPIRATION_TIME=3600s
        REDIS_HOST=redis
        REDIS_PORT=6379
        REDIS_TTL=300
        THROTTLE_TTL=60
        THROTTLE_LIMIT=100
        ```

3.  **Build and run containers:**
    ```bash
    docker compose up --build -d
    ```
    This will:
    *   Build Docker images for backend and frontend.
    *   Start PostgreSQL and Redis services.
    *   Start the backend (NestJS) and frontend (React/Nginx) services.

4.  **Run Database Migrations (if `SYNCHRONIZE_DB` was false):**
    If `SYNCHRONIZE_DB` is `false` (recommended for production-like environments), you need to run migrations manually after the `db` service is up.
    ```bash
    docker exec -it <backend-container-id-or-name> npm run typeorm:migration:run
    ```
    (You can find container ID/name with `docker ps`)

5.  **Seed the database:**
    Populate the database with initial data (users, projects, tasks).
    ```bash
    docker exec -it <backend-container-id-or-name> npm run typeorm:seed
    ```

### Manual Setup (Without Docker)

This setup assumes you have Node.js, npm, PostgreSQL, and Redis installed and running on your local machine.

#### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env.development`:**
    Copy `backend/.env.example` to `backend/.env.development`.
    Adjust `DB_HOST` to `localhost` and ensure `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` match your local PostgreSQL setup.
    Set `REDIS_HOST` to `localhost`.
4.  **Run Migrations:**
    Ensure your PostgreSQL database is running.
    ```bash
    npm run typeorm:migration:run
    ```
5.  **Seed Database (Optional):**
    ```bash
    npm run typeorm:seed
    ```
6.  **Start the backend server:**
    ```bash
    npm run start:dev
    ```
    The backend will run on `http://localhost:3000` (or your configured `PORT`).

#### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API URL:**
    The `VITE_API_BASE_URL` is configured in `docker-compose.yml` for Docker setup. If running manually, ensure your `backend` is accessible. For local development, it will likely be `http://localhost:3000/api/v1`. You might need to set this directly as an environment variable or in `vite.config.ts` for local testing without Docker if it's not picking up the `http://localhost:3000` URL correctly. Vite automatically loads `.env` files, so you can create a `.env` file in the `frontend` directory:
    ```dotenv
    VITE_API_BASE_URL=http://localhost:3000/api/v1
    ```
4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:5173` (or another port if 5173 is in use).

## 4. Running the Application

After following the Docker or Manual setup:

*   **Backend API:** `http://localhost:3000/api/v1` (or your configured port/prefix)
*   **Swagger API Docs:** `http://localhost:3000/api-docs`
*   **Frontend UI:** `http://localhost:80` (Docker) or `http://localhost:5173` (Manual)

You can log in with the seeded `admin` user:
*   **Username:** `admin`
*   **Password:** `password123`

## 5. API Documentation

The backend API is documented using Swagger (OpenAPI). Once the backend is running, access the documentation at:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

This interactive documentation allows you to explore endpoints, their request/response schemas, and even try out API calls directly. Remember to authorize with a JWT bearer token (obtained from login) to access protected routes.

## 6. Testing

The project includes various types of tests to ensure quality and reliability.

### Backend Tests

*   **Unit Tests:** Focus on individual components (services, controllers, guards) in isolation using Jest.
*   **Integration Tests:** Verify interactions between multiple components (e.g., controller interacting with service and database layer) using NestJS testing utilities and Jest.
*   **E2E (End-to-End) / API Tests:** Simulate real user interactions with the API using Supertest. These tests hit actual endpoints and interact with a dedicated test database (configured in `backend/.env.test`).

To run backend tests:

1.  Ensure your test database (`testdb`) is set up and accessible (Docker Compose `db` service can be used, or a separate local PostgreSQL instance).
2.  Navigate to the `backend` directory.
3.  **Unit & Integration Tests:**
    ```bash
    npm test
    # For coverage report:
    npm run test:cov
    ```
    Aim for 80%+ code coverage for critical parts of the application.
4.  **E2E Tests:**
    ```bash
    npm run test:e2e
    ```
    The `test:e2e` script will leverage the `jest-e2e.setup.ts` to ensure a clean database for each run.

### Frontend Tests

*   **Component Tests:** Verify individual React components' rendering, behavior, and user interactions using Jest and React Testing Library.
*   **Hook Tests:** Test custom React hooks in isolation.

To run frontend tests:

1.  Navigate to the `frontend` directory.
2.  ```bash
    npm test
    ```

### Performance Testing (Conceptual)

While actual performance test scripts are not provided in this response due to complexity and requiring specific tools, the setup for performance testing would involve:

*   **Tools:** Artillery.io or k6.
*   **Scenarios:**
    *   Simulating concurrent users for common API endpoints (e.g., GET /tasks, POST /tasks, GET /projects/:id).
    *   Load testing authentication endpoints.
    *   Stress testing to find breakpoints.
*   **Monitoring:** Observing backend resource utilization (CPU, memory), database query times, and Redis hit/miss rates during tests.

The implemented caching and rate limiting features are directly aimed at improving performance and protecting the API under load.

## 7. CI/CD & Deployment Guide

The project utilizes GitHub Actions for its Continuous Integration and Continuous Deployment (CI/CD) pipeline.

### GitHub Actions (`.github/workflows/ci-cd.yml`)

The CI/CD pipeline is triggered on `push` to `main` or `develop` branches and `pull_request` to these branches. It consists of the following jobs:

1.  **`backend-test`:**
    *   Sets up a PostgreSQL and Redis service within the GitHub Actions runner.
    *   Installs backend dependencies.
    *   Runs all backend unit, integration, and E2E tests.
    *   Generates and uploads code coverage report to Codecov.
    *   Ensures tests pass before proceeding to build/deployment.
2.  **`frontend-test`:**
    *   Installs frontend dependencies.
    *   Runs all frontend component tests.
    *   Ensures tests pass before proceeding.
3.  **`build-and-push-docker`:**
    *   **Condition:** Only runs on `push` to the `main` branch, and *after* `backend-test` and `frontend-test` jobs pass.
    *   Logs into Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` GitHub secrets).
    *   Builds production-ready Docker images for both backend and frontend.
    *   Pushes these images to Docker Hub (`your-dockerhub-username/task-management-backend:latest`, `your-dockerhub-username/task-management-frontend:latest`).
4.  **`deploy`:**
    *   **Condition:** Only runs on `push` to the `main` branch, and *after* `build-and-push-docker` job succeeds.
    *   **Runs on `self-hosted` runner:** This job requires a dedicated server with Docker installed, configured as a GitHub Actions self-hosted runner. This runner should be configured with necessary environment variables (e.g., `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `VITE_API_BASE_URL` as GitHub environment secrets for `production`).
    *   Pulls the latest Docker images from Docker Hub.
    *   Restarts the application using `docker compose up -d --remove-orphans` with a `docker-compose.prod.yml` file on the production server (not explicitly provided in this response, but would mirror `docker-compose.yml` using `image` tags instead of `build` and potentially with Nginx SSL configuration, proper volumes, etc.).

### Production Deployment

For a production deployment, you would:

1.  **Set up a Production Server:** A Linux server (e.g., Ubuntu, CentOS) with Docker and Docker Compose installed.
2.  **Configure GitHub Actions Self-Hosted Runner:** Install and configure a GitHub Actions runner on this server. This runner will execute the `deploy` job.
3.  **Define Environment Variables (GitHub Secrets):** In your GitHub repository settings, create secrets for:
    *   `DOCKER_USERNAME`
    *   `DOCKER_PASSWORD`
    *   `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (for production DB)
    *   `JWT_SECRET`, `JWT_EXPIRATION_TIME` (for production JWT)
    *   `VITE_API_BASE_URL` (the public URL of your backend, e.g., `https://api.yourdomain.com/api/v1`)
4.  **Create `docker-compose.prod.yml` on the Server:** This file will be similar to `docker-compose.yml` but will:
    *   Use specific image tags (e.g., `your-dockerhub-username/task-management-backend:latest`) instead of `build` directives.
    *   Include proper production environment variables (referencing GitHub secrets).
    *   Mount persistent volumes for database data, Redis data, and application logs.
    *   Possibly include an Nginx service configured for SSL (using Let's Encrypt or similar) and reverse proxying to the frontend/backend.
    *   Use a production-grade logging driver.
5.  **Initial DB Setup on Production:** Connect to the production PostgreSQL instance and run migrations (`docker exec backend-prod-container npm run typeorm:migration:run`).
6.  **Push to `main`:** Once everything is configured, a push to the `main` branch will trigger the full CI/CD pipeline, building, pushing, and deploying the application.

## 8. Additional Features

*   **Authentication/Authorization:** Implemented with JWT tokens, Passport.js, and NestJS Guards (`JwtAuthGuard`, `RolesGuard`). Roles (`Admin`, `User`) are defined and enforced using custom decorators.
*   **Logging and Monitoring:** Integrated Winston for structured logging (console, daily files). This provides essential visibility into application health and behavior.
*   **Error Handling Middleware:** A global `HttpExceptionFilter` ensures consistent error responses and robust error logging.
*   **Caching Layer:** Redis is used with NestJS `CacheModule` and `HttpCacheInterceptor` to cache GET requests, improving API response times and reducing database load.
*   **Rate Limiting:** NestJS `ThrottlerModule` is configured to protect API endpoints from abuse by limiting the number of requests a user can make within a specified timeframe.

## 9. Future Enhancements

*   **Real-time Notifications:** Implement WebSockets (e.g., Socket.IO with NestJS `Gateway`) for real-time notifications about task updates, comments, etc.
*   **File Uploads:** Allow attaching files to tasks or projects.
*   **Search and Filtering:** Enhance search capabilities with more advanced query options and full-text search.
*   **Task Dependencies:** Feature to link tasks as dependencies.
*   **Analytics Dashboard:** Implement more comprehensive data visualization for project and task progress.
*   **User Avatars/Profiles:** More detailed user profiles with avatars.
*   **Internationalization (i18n):** Support for multiple languages.
*   **Advanced UI/UX:** Drag-and-drop task management (e.g., Kanban board).
*   **Tenant Separation:** For true multi-tenancy, implement database or schema separation per organization.
*   **Monitoring Tools Integration:** Integrate with Prometheus/Grafana for metric collection and visualization, and Sentry for error tracking.

## 10. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Ensure tests pass (`npm test` in both `backend` and `frontend`).
5.  Commit your changes (`git commit -m 'feat: Add new feature'`).
6.  Push to the branch (`git push origin feature/your-feature-name`).
7.  Create a Pull Request.

## 11. License

This project is licensed under the UNLICENSED.