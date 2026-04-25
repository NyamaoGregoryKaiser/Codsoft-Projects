```markdown
# Enterprise DevOps Automation System: Project Management Application

This project provides a comprehensive, production-ready DevOps automation system built around a full-stack Project Management application. It showcases best practices in full-stack web development, UI/UX, business solutions, and an end-to-end DevOps pipeline.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Tech Stack](#2-tech-stack)
3.  [Features](#3-features)
4.  [Local Development Setup](#4-local-development-setup)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Database Setup](#database-setup)
    *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
5.  [API Documentation](#5-api-documentation)
6.  [Testing](#6-testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (Artillery)](#performance-tests-artillery)
7.  [Architecture Documentation](#7-architecture-documentation)
8.  [CI/CD with GitHub Actions](#8-cicd-with-github-actions)
9.  [Deployment Guide](#9-deployment-guide)
10. [Future Enhancements](#10-future-enhancements)
11. [License](#11-license)

---

## 1. Project Overview

This Project Management system allows users to manage projects and tasks. Key functionalities include user registration, authentication, creating projects, assigning tasks to projects, and updating task statuses. The system is designed with scalability, maintainability, and security in mind, incorporating various enterprise-grade features.

## 2. Tech Stack

*   **Backend:** Node.js (TypeScript), Express.js, TypeORM, PostgreSQL, Redis
*   **Frontend:** React (TypeScript), Vite, Tailwind CSS, Axios, React Router DOM
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** Jest (Unit, Integration), Supertest (API), Artillery (Performance)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Logging:** Winston
*   **Monitoring:** (Mentioned, but basic setup in code: structured logging)
*   **Caching:** Redis
*   **Rate Limiting:** `express-rate-limit`
*   **API Documentation:** (Described in this README, curl examples)

## 3. Features

*   **User Management:** Register, Login, User Profiles.
*   **Project Management:** Create, Read, Update, Delete Projects.
*   **Task Management:** Create, Read, Update, Delete Tasks, assign tasks to projects.
*   **Authentication & Authorization:** Secure JWT-based access control for protected routes.
*   **Robust Error Handling:** Centralized middleware for consistent error responses.
*   **Structured Logging:** Winston integration for better observability.
*   **API Rate Limiting:** Protects API endpoints from abuse.
*   **Caching Layer:** Redis integration for improved performance on frequently accessed data.
*   **Database Migrations:** TypeORM for schema evolution.
*   **Comprehensive Testing:** Unit, Integration, API, and Performance tests.
*   **Containerized Environment:** Full Docker and Docker Compose setup.
*   **Automated CI/CD:** GitHub Actions for continuous integration and delivery.
*   **Responsive UI:** Built with React and Tailwind CSS.

## 4. Local Development Setup

### Prerequisites

*   Node.js (v18+)
*   npm or Yarn
*   Docker & Docker Compose (Recommended for full stack setup)
*   Git

### Backend Setup (Without Docker - for individual component development)

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Create `.env` file:** Copy `.env.example` to `.env` and fill in your PostgreSQL and JWT details.
    ```bash
    cp .env.example .env
    # Example .env content:
    # PORT=5000
    # NODE_ENV=development
    # DATABASE_URL=postgresql://user:password@localhost:5432/project_management_db
    # JWT_SECRET=your_super_secret_jwt_key
    # JWT_EXPIRES_IN=1h
    # REDIS_HOST=localhost
    # REDIS_PORT=6379
    ```
4.  **Start PostgreSQL and Redis:** Ensure your PostgreSQL and Redis instances are running locally.
5.  **Run database migrations:**
    ```bash
    npm run typeorm migration:run
    ```
6.  **Seed data (optional):**
    ```bash
    npm run typeorm seed:run # (Implement a seed script if needed, currently not provided)
    ```
7.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend should be running on `http://localhost:5000` (or your specified `PORT`).

### Frontend Setup (Without Docker - for individual component development)

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Create `.env` file:** Copy `.env.example` to `.env` and configure the backend API URL.
    ```bash
    cp .env.example .env
    # Example .env content:
    # VITE_API_URL=http://localhost:5000/api
    ```
4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend should be running on `http://localhost:5001` (or a port chosen by Vite).

### Running with Docker Compose (Recommended)

This is the easiest way to get the entire application stack (backend, frontend, PostgreSQL, Redis, Nginx) up and running.

1.  **Ensure Docker and Docker Compose are installed.**
2.  **Create `.env` files:**
    *   `backend/.env`: Copy from `backend/.env.example`.
        ```bash
        cd backend
        cp .env.example .env
        # Ensure DATABASE_URL, REDIS_HOST, REDIS_PORT are correctly set for Docker Compose:
        # DATABASE_URL=postgresql://user:password@db:5432/project_management_db
        # REDIS_HOST=redis
        # REDIS_PORT=6379
        ```
    *   `frontend/.env`: Copy from `frontend/.env.example`.
        ```bash
        cd ../frontend
        cp .env.example .env
        # Ensure VITE_API_URL is correctly set for Nginx proxy:
        # VITE_API_URL=http://localhost/api
        ```
    *   `cd ..` back to the project root.
3.  **Build and start all services:**
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images (useful after code changes).
    *   `-d`: Runs services in detached mode.

4.  **Run database migrations (after services are up):**
    ```bash
    docker-compose exec backend npm run typeorm migration:run
    ```
5.  **Access the application:**
    *   Frontend: `http://localhost` (served by Nginx, proxying API requests to backend).
    *   Backend API (if you want to hit it directly): `http://localhost:5000/api`

6.  **Stop services:**
    ```bash
    docker-compose down
    ```
    *   `docker-compose down -v`: Also removes volumes (useful for a clean database restart).

## 5. API Documentation

The backend API is designed as a RESTful service. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api` (or `http://localhost/api` when using Nginx/Docker Compose)

### Authentication

*   **`POST /api/auth/register`**
    *   **Description:** Registers a new user.
    *   **Request Body:**
        ```json
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Response:**
        ```json
        {
            "message": "User registered successfully",
            "user": {
                "id": "uuid",
                "username": "testuser",
                "email": "test@example.com"
            }
        }
        ```
*   **`POST /api/auth/login`**
    *   **Description:** Logs in a user and returns a JWT token.
    *   **Request Body:**
        ```json
        {
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Response:**
        ```json
        {
            "token": "eyJhbGciOiJIUzI1Ni...",
            "user": {
                "id": "uuid",
                "username": "testuser",
                "email": "test@example.com"
            }
        }
        ```

### Users (Requires Authentication)

*   **`GET /api/users/profile`**
    *   **Description:** Retrieves the profile of the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:**
        ```json
        {
            "id": "uuid",
            "username": "testuser",
            "email": "test@example.com",
            "projects": [...]
        }
        ```

### Projects (Requires Authentication)

*   **`GET /api/projects`**
    *   **Description:** Get all projects for the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `Array<Project>`
*   **`GET /api/projects/:id`**
    *   **Description:** Get a single project by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `Project`
*   **`POST /api/projects`**
    *   **Description:** Create a new project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:**
        ```json
        {
            "name": "New Project",
            "description": "Description of the new project."
        }
        ```
    *   **Response:** `Project`
*   **`PUT /api/projects/:id`**
    *   **Description:** Update an existing project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:**
        ```json
        {
            "name": "Updated Project Name",
            "description": "Updated description."
        }
        ```
    *   **Response:** `Project`
*   **`DELETE /api/projects/:id`**
    *   **Description:** Delete a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ message: "Project deleted successfully" }`

### Tasks (Requires Authentication)

*   **`GET /api/projects/:projectId/tasks`**
    *   **Description:** Get all tasks for a specific project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `Array<Task>`
*   **`GET /api/tasks/:id`**
    *   **Description:** Get a single task by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `Task`
*   **`POST /api/projects/:projectId/tasks`**
    *   **Description:** Create a new task within a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:**
        ```json
        {
            "title": "New Task",
            "description": "Description of the task.",
            "status": "pending",
            "dueDate": "2024-12-31T23:59:59Z",
            "assignedToId": "uuid_of_user"
        }
        ```
    *   **Response:** `Task`
*   **`PUT /api/tasks/:id`**
    *   **Description:** Update an existing task.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:**
        ```json
        {
            "title": "Updated Task Title",
            "status": "in_progress"
        }
        ```
    *   **Response:** `Task`
*   **`DELETE /api/tasks/:id`**
    *   **Description:** Delete a task.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ message: "Task deleted successfully" }`

## 6. Testing

Comprehensive testing is implemented for both backend and frontend.

### Backend Tests

Run all backend tests:
```bash
cd backend
npm test
```
This command will execute unit, integration, and API tests.
Expected coverage target: 80%+.

### Frontend Tests

Run all frontend tests:
```bash
cd frontend
npm test
```
This will execute unit tests for React components and utility functions.

### Performance Tests (Artillery)

Performance tests are configured using Artillery.

1.  **Install Artillery (if not already installed):**
    ```bash
    npm install -g artillery
    ```
2.  **Ensure your application (backend) is running.**
3.  **Run the performance test:**
    ```bash
    artillery run artillery.yml
    ```
    This will simulate concurrent users hitting the API endpoints defined in `artillery.yml`.

## 7. Architecture Documentation

### High-Level Architecture

The system follows a typical microservices-oriented architecture, though implemented as a single monolithic backend service for simplicity in this comprehensive example. It consists of:

1.  **Client (Frontend):** A React application providing the user interface.
2.  **API Gateway / Reverse Proxy (Nginx):** Handles incoming requests, serves static frontend assets, and forwards API requests to the backend service.
3.  **Backend Service:** A Node.js (Express.js) application written in TypeScript. It contains the business logic, interacts with the database, and exposes RESTful API endpoints.
4.  **Database (PostgreSQL):** A relational database used for persistent storage of user, project, and task data.
5.  **Cache (Redis):** An in-memory data store used for caching frequently accessed data to improve response times and reduce database load.

```mermaid
graph TD
    A[User Browser] --> B(Nginx - Reverse Proxy);
    B -- Serve Static Files --> C(Frontend - React App);
    B -- Proxy API Requests --> D(Backend - Node.js/Express);
    D -- ORM (TypeORM) --> E(PostgreSQL Database);
    D -- Caching --> F(Redis Cache);
    D -- Logging --> G(Logging System - e.g., ELK Stack);
    D -- Monitoring --> H(Monitoring System - e.g., Prometheus/Grafana);
```

### Backend Architecture

The backend follows a layered architecture:

*   **`server.ts`**: Entry point, initializes the Express `app` and starts the server.
*   **`app.ts`**: Configures the Express application, sets up middleware (logging, error handling, rate limiting, authentication), and mounts routes.
*   **`data-source.ts`**: TypeORM connection configuration.
*   **`routes/`**: Defines API endpoints and maps them to controller methods.
*   **`middlewares/`**: Contains Express middleware functions for cross-cutting concerns:
    *   `authMiddleware.ts`: Verifies JWT tokens and attaches user info to requests.
    *   `errorHandler.ts`: Centralized error handling.
    *   `loggerMiddleware.ts`: Request logging.
    *   `rateLimitMiddleware.ts`: API request rate limiting.
*   **`controllers/`**: Handles HTTP requests, parses input, calls appropriate service methods, and sends HTTP responses.
*   **`services/`**: Encapsulates business logic, interacts with entities/repositories, and performs data manipulation. This layer is decoupled from HTTP concerns.
*   **`entities/`**: TypeORM entities defining the database schema (User, Project, Task). Includes relationships and validation.
*   **`utils/`**: Helper functions for JWT generation/verification, password hashing, and structured logging (Winston).

### Frontend Architecture

The frontend is a React application structured to promote maintainability and scalability:

*   **`main.tsx`**: Entry point, initializes React app and wraps it with necessary providers (e.g., `BrowserRouter`, `AuthContext`).
*   **`App.tsx`**: Defines application-level routing using React Router DOM.
*   **`pages/`**: Top-level components representing distinct views or routes (e.g., `LoginPage`, `ProjectsPage`, `ProjectDetailPage`).
*   **`components/`**: Reusable UI components (e.g., `Header`, `Forms`, `Cards`, `Buttons`). These are generally dumb/presentational components.
*   **`contexts/`**: Manages global state (e.g., `AuthContext` for user authentication status and token).
*   **`api/`**: Contains functions for interacting with the backend API using `axios`, centralizing API calls.
*   **`utils/`**: Frontend-specific utility functions.

## 8. CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/main.yml`) to automate the CI/CD process.

**Workflow Triggers:**
*   `push` to `main` branch
*   `pull_request` to `main` branch

**Pipeline Stages:**

1.  **Checkout Code:** Clones the repository.
2.  **Setup Node.js:** Installs Node.js for both backend and frontend.
3.  **Backend - Install Dependencies & Lint:**
    *   Installs backend `node_modules`.
    *   Runs ESLint for code quality checks.
4.  **Backend - Build:**
    *   Compiles TypeScript code.
5.  **Backend - Test:**
    *   Runs all backend unit, integration, and API tests.
    *   Generates coverage reports.
6.  **Frontend - Install Dependencies & Lint:**
    *   Installs frontend `node_modules`.
    *   Runs ESLint for code quality checks.
7.  **Frontend - Build:**
    *   Builds the React application for production.
8.  **Frontend - Test:**
    *   Runs all frontend unit tests.
9.  **Build and Push Docker Images (on `main` branch push):**
    *   Logs into Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` GitHub Secrets).
    *   Builds Docker images for backend and frontend.
    *   Tags images with Git SHA and `latest`.
    *   Pushes images to Docker Hub.
10. **Deployment (Placeholder for `main` branch push):**
    *   This step is a placeholder. In a real scenario, this would trigger a deployment to a cloud provider (e.g., Kubernetes, AWS ECS, Azure App Service, Google Cloud Run). Example: update Kubernetes deployment or trigger a blue/green deployment.

## 9. Deployment Guide

Refer to the separate [DEPLOYMENT.md](DEPLOYMENT.md) file for detailed production deployment instructions.

## 10. Future Enhancements

*   **Real-time Updates:** Implement WebSockets for real-time task/project updates.
*   **Email Notifications:** Add email notifications for task assignments or deadlines.
*   **File Uploads:** Allow attaching files to projects or tasks.
*   **Advanced Search & Filtering:** More sophisticated search capabilities.
*   **Role-Based Access Control (RBAC):** Implement more granular permissions.
*   **Monitoring & Alerting:** Full integration with Prometheus/Grafana, Sentry for error tracking.
*   **Distributed Caching:** More advanced Redis usage patterns.
*   **GraphQL API:** Consider migrating to GraphQL for more flexible data fetching.
*   **Container Orchestration:** Deploy to Kubernetes for better scalability and management.
*   **Infrastructure as Code (IaC):** Use Terraform or Pulumi to manage cloud resources.

## 11. License

This project is open-sourced under the MIT License. See the `LICENSE` file for more details.
```