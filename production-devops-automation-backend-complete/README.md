```markdown
# Project Management System (PMS)

This is a comprehensive, production-ready Project Management System featuring a full-stack JavaScript application with a Node.js/Express backend, React frontend, PostgreSQL database, Dockerization, CI/CD pipeline, extensive testing, and advanced features.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Local Development Setup](#local-development-setup)
    *   [Prerequisites](#prerequisites)
    *   [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
4.  [Database Management](#database-management)
    *   [Migrations](#migrations)
    *   [Seeding](#seeding)
5.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Testing (k6)](#performance-testing-k6)
6.  [API Documentation](#api-documentation)
7.  [Architecture](#architecture)
8.  [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

**Core Application:**

*   **User Management:** Register, Login, User Profiles.
*   **Project Management:** Create, Read, Update, Delete (CRUD) projects.
*   **Task Management:** Create, Read, Update, Delete (CRUD) tasks within projects.
*   **Role-Based Access Control:** `user` and `admin` roles for authorization.

**Additional Features:**

*   **Authentication & Authorization:** JWT-based secure access for API endpoints.
*   **Logging & Monitoring:** Structured logging with Winston for backend requests and errors.
*   **Error Handling:** Centralized Express error handling middleware for consistent responses.
*   **Caching Layer:** Redis integration for API response caching (e.g., project lists).
*   **Rate Limiting:** Protects API endpoints against abuse with `express-rate-limit`.
*   **Data Validation:** Joi for robust request payload validation.

---

## 2. Technology Stack

*   **Backend:** Node.js, Express.js
*   **Frontend:** React.js
*   **Database:** PostgreSQL
*   **ORM:** Sequelize (with `sequelize-cli` for migrations/seeders)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Caching:** Redis
*   **Logging:** Winston.js
*   **Validation:** Joi
*   **Testing:** Jest, Supertest (`backend`), React Testing Library (`frontend`)
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Performance Testing:** k6

---

## 3. Local Development Setup

### Prerequisites

Make sure you have the following installed:

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (v18 or later, includes npm)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose)

### Using Docker Compose (Recommended)

This method sets up the entire stack (PostgreSQL, Redis, Backend, Frontend) with a single command.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/project-management-system.git
    cd project-management-system
    ```

2.  **Create `.env` file for backend:**
    Copy the example environment file:
    ```bash
    cp backend/.env.example backend/.env
    ```
    You can customize the values in `backend/.env` if needed, but the defaults in `docker-compose.yml` should work out-of-the-box.

3.  **Build and run all services:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build Docker images for the backend and frontend.
    *   Start PostgreSQL, Redis, Backend, and Frontend containers.
    *   Automatically run database migrations and seed initial data (`adminuser`/`password123`, `testuser`/`password123`) in the backend container on startup.

4.  **Access the application:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:5000`

    You can log in with:
    *   **Admin:** `admin@example.com` / `password123`
    *   **User:** `test@example.com` / `password123`

5.  **Stop services:**
    ```bash
    docker-compose down
    ```

### Manual Setup (Backend)

If you prefer to run the backend without Docker (e.g., directly on your host machine with a local PostgreSQL instance):

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to point to your local PostgreSQL and Redis instances. Make sure the database `pmsdb` exists and `pmsuser` has access.

4.  **Run migrations and seeders:**
    ```bash
    npx sequelize-cli db:migrate
    npx sequelize-cli db:seed:all
    ```

5.  **Start the backend server:**
    ```bash
    npm run dev # for development with hot-reloading
    # or
    npm start # for production-like run
    ```
    The backend will be available at `http://localhost:5000`.

### Manual Setup (Frontend)

To run the frontend without Docker:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the React development server:**
    ```bash
    npm start
    ```
    The frontend will be available at `http://localhost:3000`. It will proxy API requests to `http://localhost:5000` (the backend).

---

## 4. Database Management

The backend uses `sequelize-cli` for managing database schema and seed data.

### Migrations

*   **Generate a new migration:**
    ```bash
    cd backend
    npx sequelize-cli migration:generate --name <migration-name>
    ```
*   **Run migrations:**
    ```bash
    cd backend
    npx sequelize-cli db:migrate
    ```
*   **Undo last migration:**
    ```bash
    cd backend
    npx sequelize-cli db:migrate:undo
    ```

### Seeding

*   **Generate a new seeder:**
    ```bash
    cd backend
    npx sequelize-cli seed:generate --name <seeder-name>
    ```
*   **Run all seeders:**
    ```bash
    cd backend
    npx sequelize-cli db:seed:all
    ```
*   **Undo all seeders:**
    ```bash
    cd backend
    npx sequelize-cli db:seed:undo:all
    ```

---

## 5. Testing

### Backend Tests

Backend tests are written using Jest and Supertest.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Run all tests (unit, integration, API):**
    ```bash
    npm test
    ```
3.  **Run specific test types:**
    ```bash
    npm run test:unit
    npm run test:integration
    npm run test:api
    ```
    Tests are configured to use a separate database for isolation (if you configure a `.env.test` and run manually, otherwise Docker Compose environment variables are used).

### Frontend Tests

Frontend tests use React Testing Library with Jest.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Run tests:**
    ```bash
    npm test
    ```

### Performance Testing (k6)

Performance tests are implemented using k6.

1.  **Install k6:**
    Follow the instructions at [k6.io](https://k6.io/docs/getting-started/installation/).

2.  **Ensure backend is running (e.g., via Docker Compose `docker-compose up`)**

3.  **Run the performance test:**
    ```bash
    cd project-management-system # (root directory)
    k6 run k6-performance-test.js
    ```
    The `k6-performance-test.js` script simulates user logins and project/task interactions. It uses `tests/users.json` for test user credentials.

---

## 6. API Documentation

The backend API follows RESTful principles. Below is a summary of the main endpoints.
For a production setup, a tool like **Swagger/OpenAPI** would generate interactive documentation.

**Base URL:** `/api/v1`

### Authentication

*   **`POST /auth/register`**
    *   **Description:** Register a new user.
    *   **Request Body:** `{ username, email, password, [role] }`
    *   **Response:** `{ message, user: { id, username, email, role }, token }`
    *   **Errors:** `400` (Validation, Duplicate Email)

*   **`POST /auth/login`**
    *   **Description:** Authenticate a user and get a JWT token.
    *   **Request Body:** `{ email, password }`
    *   **Response:** `{ message, user: { id, username, email, role }, token }`
    *   **Errors:** `401` (Invalid Credentials)

*   **`GET /auth/me` (Protected)**
    *   **Description:** Get details of the currently authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ user: { id, username, email, role } }`
    *   **Errors:** `401` (Unauthorized, Invalid/Expired Token)

### Projects (Protected)

*   **`POST /projects`**
    *   **Description:** Create a new project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:** `{ name, [description] }`
    *   **Response:** `{ message, project }`
    *   **Errors:** `400` (Validation, Duplicate Name), `401`

*   **`GET /projects`**
    *   **Description:** Get all projects (admin sees all, user sees owned projects).
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `[ { project_object, owner: { id, username, email }, tasks: [] } ]`
    *   **Errors:** `401`

*   **`GET /projects/:id`**
    *   **Description:** Get a single project by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ project_object, owner: { id, username, email }, tasks: [ { task_object, assignee: { id, username } } ] }`
    *   **Errors:** `401`, `403` (Not Authorized), `404`

*   **`PUT /projects/:id`**
    *   **Description:** Update a project by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:** `{ [name], [description], [status] }`
    *   **Response:** `{ message, project }`
    *   **Errors:** `401`, `403`, `404`, `400` (Validation)

*   **`DELETE /projects/:id`**
    *   **Description:** Delete a project by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ message: 'Project deleted successfully' }`
    *   **Errors:** `401`, `403`, `404`

### Tasks (Protected - Nested under projects)

*   **`POST /projects/:projectId/tasks`**
    *   **Description:** Create a new task within a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:** `{ title, [description], [status], [priority], [dueDate], [assigneeId] }`
    *   **Response:** `{ message, task }`
    *   **Errors:** `400` (Validation), `401`, `403` (Not project owner/admin), `404` (Project not found)

*   **`GET /projects/:projectId/tasks/:taskId`**
    *   **Description:** Get a single task by ID within a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ task_object, project, assignee }`
    *   **Errors:** `401`, `403`, `404`

*   **`PUT /projects/:projectId/tasks/:taskId`**
    *   **Description:** Update a task by ID within a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Request Body:** `{ [title], [description], [status], [priority], [dueDate], [assigneeId] }`
    *   **Response:** `{ message, task }`
    *   **Errors:** `400` (Validation), `401`, `403`, `404`

*   **`DELETE /projects/:projectId/tasks/:taskId`**
    *   **Description:** Delete a task by ID within a project.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ message: 'Task deleted successfully' }`
    *   **Errors:** `401`, `403`, `404`

---

## 7. Architecture

The Project Management System follows a **Monorepo** structure for ease of development and deployment, containing separate `backend` and `frontend` applications.

```
project-management-system/
├── backend/                  # Node.js Express API
│   ├── src/                  # Application source code
│   │   ├── config/           # Environment, DB, Logger settings
│   │   ├── controllers/      # Handle HTTP requests, call services
│   │   ├── middleware/       # Auth, error handling, rate limiting, logging
│   │   ├── models/           # Sequelize ORM definitions, DB connection
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic, interact with models
│   │   ├── utils/            # Helpers (JWT, Cache, Error classes)
│   │   └── validators/       # Joi schema validations
│   ├── migrations/           # Sequelize database migrations
│   ├── seeders/              # Sequelize database seed data
│   ├── tests/                # Unit, Integration, API tests (Jest, Supertest)
│   └── Dockerfile            # Docker build instructions for backend
├── frontend/                 # React Single Page Application (SPA)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context API for global state (e.g., Auth)
│   │   ├── pages/            # Page-level components
│   │   ├── services/         # API client (Axios)
│   │   └── styles/           # Global CSS
│   ├── tests/                # Component tests (React Testing Library)
│   ├── Dockerfile            # Docker build instructions for frontend (Nginx serves static files)
│   └── nginx/default.conf    # Nginx configuration for serving React app and proxying API
├── .github/                  # GitHub Actions CI/CD workflows
├── docker-compose.yml        # Orchestrates all services for local development (Backend, Frontend, DB, Cache)
├── k6-performance-test.js    # Performance test script
└── README.md                 # Project documentation (this file)
```

**Key Architectural Decisions:**

*   **Separation of Concerns:** Clear delineation between frontend UI, backend API logic, and database layer.
*   **Modular Backend:** Organized into `controllers`, `services`, `models`, `middleware` for maintainability and testability.
*   **Layered Security:** JWT authentication, role-based authorization, rate limiting, and Helmet for HTTP security headers.
*   **Scalable Data Handling:** PostgreSQL with Sequelize as ORM, Redis for caching to reduce database load.
*   **Containerization:** Docker for consistent development and deployment environments.
*   **Automated Testing:** Comprehensive suite of tests across all layers to ensure quality.
*   **Observability:** Structured logging with Winston for better debugging and monitoring.

---

## 8. CI/CD Pipeline (GitHub Actions)

The `.github/workflows/main.yml` file defines the CI/CD pipeline using GitHub Actions.

**Workflow Steps:**

1.  **Trigger:**
    *   On `push` to `main` branch.
    *   On `pull_request` targeting `main` branch.
    *   Manual trigger (`workflow_dispatch`).

2.  **Checkout Code:**
    Clones the repository.

3.  **Setup Node.js:**
    Installs Node.js for both backend and frontend builds/tests.

4.  **Backend CI:**
    *   **Install Dependencies:** `npm install` in `backend/`.
    *   **Run Linter:** `npm run lint` (`eslint`).
    *   **Run Backend Tests:** `npm test` with coverage.
    *   **Build Backend Docker Image:** Builds the `pms-backend` image.

5.  **Frontend CI:**
    *   **Install Dependencies:** `npm install` in `frontend/`.
    *   **Run Linter:** `npm run lint` (`eslint`).
    *   **Run Frontend Tests:** `npm test` with coverage.
    *   **Build Frontend Docker Image:** Builds the `pms-frontend` image.

6.  **CD (Deployment - placeholder/example):**
    *   **Login to Docker Hub:** Authenticates with Docker Hub using secrets.
    *   **Push Backend Image:** Pushes `pms-backend` image to Docker Hub.
    *   **Push Frontend Image:** Pushes `pms-frontend` image to Docker Hub.
    *   **Deployment Step (Conceptual):** This step is a placeholder. In a real-world scenario, it would involve:
        *   SSH into a server and pulling new images.
        *   Updating a Kubernetes deployment.
        *   Triggering a deployment on a cloud platform (e.g., AWS ECS, Google Cloud Run, Azure Container Apps).
        *   Running database migrations (often a separate pre-deployment step).

**Secrets Required for CI/CD:**

*   `DOCKER_USERNAME`: Your Docker Hub username.
*   `DOCKER_PASSWORD`: Your Docker Hub access token or password.
*   `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `REDIS_PASSWORD` etc. should be configured as environment variables or secrets in the deployment target environment.

---

## 9. Deployment Guide

This system is designed for deployment using Docker containers, making it portable across various environments.

### General Strategy

1.  **Container Registry:** Push your built Docker images (backend and frontend) to a reliable container registry (e.g., Docker Hub, AWS ECR, Google Container Registry). The CI/CD pipeline demonstrates pushing to Docker Hub.
2.  **Database:** Provision a managed PostgreSQL database instance (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL). This is highly recommended over running PostgreSQL in a container on the same host as your application in production.
3.  **Caching:** Provision a managed Redis instance (e.g., AWS ElastiCache, Azure Cache for Redis, Google Cloud Memorystore).
4.  **Compute:** Choose a container orchestration service or a VM:
    *   **Container Orchestration (Recommended for Scale):** Kubernetes (EKS, GKE, AKS), Docker Swarm, AWS ECS, Google Cloud Run, Azure Container Apps.
    *   **Virtual Machine:** A simple cloud VM (e.g., EC2, Compute Engine, Azure VM) running Docker can be used for smaller deployments.

### Example Deployment (Conceptual - using a VM with Docker)

This assumes you have a cloud VM provisioned and Docker installed.

1.  **SSH into your VM:**
    ```bash
    ssh user@your-server-ip
    ```

2.  **Install Docker & Docker Compose (if not already installed):**
    Follow official Docker documentation.

3.  **Create `.env` files for production:**
    On your server, create `backend/.env` with production-ready values (e.g., stronger `JWT_SECRET`, external DB/Redis connection strings, `NODE_ENV=production`).

    Example `backend/.env` on server:
    ```
    PORT=5000
    NODE_ENV=production

    DB_DIALECT=postgres
    DB_HOST=your-managed-postgres-host
    DB_PORT=5432
    DB_USER=your-postgres-user
    DB_PASSWORD=your-postgres-password
    DB_NAME=pmsdb

    JWT_SECRET=a_very_long_and_secure_jwt_secret_for_production
    JWT_EXPIRES_IN=1h

    REDIS_HOST=your-managed-redis-host
    REDIS_PORT=6379
    REDIS_PASSWORD=your-redis-password

    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX_REQUESTS=1000
    ```
    Ensure your `frontend/nginx/default.conf` `proxy_pass` points to the correct backend service name if using local Docker Compose or the full URL if backend is external.

4.  **Pull the latest images:**
    ```bash
    docker pull your-docker-hub-username/pms-backend:latest
    docker pull your-docker-hub-username/pms-frontend:latest
    ```
    (Replace `your-docker-hub-username` with your actual Docker Hub username)

5.  **Run Database Migrations (Crucial):**
    **Do NOT run `sequelize-cli db:migrate` directly from the application's `CMD` in production.** It's better to run migrations as a separate, controlled step.

    One way to do this on a VM:
    ```bash
    docker run --rm \
      -v "$(pwd)/backend/.env:/app/.env:ro" \
      --network=host \
      your-docker-hub-username/pms-backend:latest npx sequelize-cli db:migrate
    ```
    This command runs a temporary container to execute migrations, connecting to your PostgreSQL instance (ensure `--network=host` or configure explicit network access to your DB).

6.  **Start Services (using a simplified `docker-compose.prod.yml`):**
    For production, you might create a `docker-compose.prod.yml` that only includes your backend and frontend services, connecting to external PostgreSQL and Redis.

    Example `docker-compose.prod.yml`:
    ```yaml
    version: '3.8'
    services:
      pms-backend:
        image: your-docker-hub-username/pms-backend:latest
        restart: always
        ports:
          - "5000:5000"
        env_file:
          - ./backend/.env # Load production environment variables
        # Note: No 'depends_on' for external services in production usually,
        # app should handle DB/Redis unavailability.
        # Command should just start the app, migrations were run separately.
        command: ["node", "server.js"]

      pms-frontend:
        image: your-docker-hub-username/pms-frontend:latest
        restart: always
        ports:
          - "80:80" # Serve frontend on default HTTP port
        # In frontend/nginx/default.conf, ensure proxy_pass points to pms-backend:5000
        # or the external URL of your backend.
    ```
    Then run:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```

### Container Orchestration (Kubernetes/ECS/etc.)

For Kubernetes, you would create `Deployment` and `Service` manifests for your backend and frontend. The configuration would reference your Docker images from the registry and inject environment variables (DB credentials, JWT secret) as Kubernetes Secrets. Ingress would handle external traffic and routing to the frontend/backend services.

---

## 10. Future Enhancements

*   **Real-time Updates:** Implement WebSockets (Socket.IO) for real-time task updates, comments, and notifications.
*   **File Uploads:** Integrate cloud storage (e.g., AWS S3, Google Cloud Storage) for task attachments.
*   **More Advanced Authorization:** Implement ACL (Access Control List) or RBAC (Role-Based Access Control) with more granular permissions (e.g., project members, viewers).
*   **User Avatars/Profiles:** Allow users to upload profile pictures.
*   **Search Functionality:** Add full-text search for projects and tasks.
*   **Notifications:** Email or in-app notifications for task assignments, due dates.
*   **Calendar View:** Integrate a calendar for visualizing task due dates.
*   **Internationalization (i18n):** Support multiple languages.
*   **Accessibility (a11y):** Ensure the frontend is accessible to users with disabilities.
*   **Advanced Monitoring:** Integrate Prometheus/Grafana for metric collection and visualization, and ELK Stack/Loki for centralized log management.
*   **Terraform/CloudFormation:** Infrastructure as Code for provisioning cloud resources.
*   **Frontend State Management:** Redux or Zustand for more complex global state.
*   **Pre-commit Hooks:** Husky for running lint/tests before committing.

---

## 11. License

This project is licensed under the MIT License. See the LICENSE file (if exists) for details.
```