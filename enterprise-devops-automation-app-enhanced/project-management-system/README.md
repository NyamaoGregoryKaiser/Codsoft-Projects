```markdown
# Project Management System (PMS)

This is a comprehensive, production-ready full-stack Project Management System built with JavaScript (Node.js/Express for backend, React for frontend), PostgreSQL, and Redis. It demonstrates robust DevOps practices, including containerization with Docker, CI/CD with GitHub Actions, and extensive testing.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
        *   [Clone the Repository](#clone-the-repository)
        *   [Environment Variables](#environment-variables)
        *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
        *   [Running Backend Separately](#running-backend-separately)
        *   [Running Frontend Separately](#running-frontend-separately)
5.  [Database Management](#database-management)
6.  [Testing](#testing)
7.  [CI/CD](#ci-cd)
8.  [API Documentation](#api-documentation)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

### Core Application
*   **User Management:** Register, Login, Logout, User roles (user, admin).
*   **Project Management:**
    *   Create, Read, Update, Delete projects.
    *   Assign project owners.
    *   Add/remove members to projects (multi-user collaboration).
*   **Task Management:**
    *   Create, Read, Update, Delete tasks within projects.
    *   Assign tasks to project members.
    *   Task statuses (todo, in-progress, done, blocked) and priorities (low, medium, high).
    *   Due dates for tasks.
*   **Comment System:**
    *   Add comments to tasks.
    *   View comments on tasks.
    *   Edit/delete own comments, or comments within owned/managed projects.

### Additional Features
*   **Authentication & Authorization:** JWT-based authentication, role-based access control.
*   **Logging:** Centralized Winston-based logging for backend with Morgan HTTP request logging.
*   **Error Handling:** Custom API error handling middleware.
*   **Caching Layer:** Redis integration for frequently accessed data (e.g., project lists).
*   **Rate Limiting:** `express-rate-limit` to protect API endpoints from abuse.
*   **Security:** `helmet`, `xss-clean`, `hpp` middleware to enhance security.
*   **Data Validation:** Joi for robust environment variable validation.
*   **Database Migrations & Seeders:** Managed with Sequelize CLI.
*   **Responsive UI/UX:** Basic React UI for seamless interaction.

---

## 2. Architecture

The system follows a typical 3-tier architecture:

*   **Frontend (Presentation Layer):** A Single Page Application (SPA) built with React.js. It interacts with the backend API to fetch and display data.
*   **Backend (Application Layer):** A Node.js (Express) RESTful API that handles business logic, data processing, authentication, and communication with the database and caching layers.
*   **Database (Data Layer):** PostgreSQL is used for persistent storage, and Redis serves as an in-memory data store for caching.

**Component Diagram:**

```
+----------------+       +-------------------+       +--------------------+
|                |       |                   |       |      PostgreSQL    |
|    Frontend    |<----->|      Nginx        |<----->|      (Data)        |
|    (React)     |       | (Reverse Proxy)   |<----->|                    |
+-------+--------+       +---------+---------+       +--------------------+
        |                          |
        |<-------------------------+--------------------+
        |                          |                   |
        |      HTTP/HTTPS API Calls                    |
        |                          |                   |
        +--------------------------+-------------------+
                                   |
                                   | REST API Endpoints
                                   V
                          +-------------------+
                          |     Backend       |
                          | (Node.js/Express) |
                          +-------+-----------+
                                  |
                                  |<--------------------+
                                  |                     |
                                  |      Read/Write     |
                                  |      (Cache)        |
                                  |                     |
                                  +---------------------+
                                         +----------+
                                         |  Redis   |
                                         +----------+
```

## 3. Technologies Used

**Backend:**
*   Node.js
*   Express.js
*   PostgreSQL (with Sequelize ORM)
*   Redis
*   bcrypt.js (for password hashing)
*   jsonwebtoken (for JWT authentication)
*   Winston & Morgan (for logging)
*   helmet, xss-clean, hpp, compression, cors, express-rate-limit (for security & performance)
*   Joi (for validation)

**Frontend:**
*   React.js
*   React Router DOM
*   Axios (for API calls)
*   Moment.js (for date formatting)

**DevOps & Infrastructure:**
*   Docker
*   Docker Compose
*   GitHub Actions (for CI/CD)
*   Nginx (as a reverse proxy for frontend in production)

**Testing:**
*   Jest (for backend and frontend unit/integration tests)
*   Supertest (for backend API tests)
*   React Testing Library (for frontend component tests)

---

## 4. Getting Started

### Prerequisites

*   **Node.js**: v18 or higher
*   **npm**: v8 or higher
*   **Docker & Docker Compose**: Latest stable versions
*   **Git**

### Local Development Setup

#### Clone the Repository

```bash
git clone https://github.com/your-username/project-management-system.git
cd project-management-system
```

#### Environment Variables

Create `.env` files based on the provided `.env.example` files.

*   `project-management-system/backend/.env`
*   `project-management-system/frontend/.env`

**`backend/.env` example:**

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_URL=postgres://pms_user:pms_password@localhost:5432/pms_db
JWT_SECRET=your_super_strong_jwt_secret_key_here
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # leave empty if no password
```

**`frontend/.env` example:**

```dotenv
REACT_APP_API_URL=http://localhost:3001/api
```

#### Running with Docker Compose (Recommended)

This sets up PostgreSQL, Redis, backend, and frontend with Nginx as a reverse proxy, all containerized.

1.  **Build and Run Services:**
    ```bash
    docker compose up --build -d
    ```
    This command builds the Docker images (frontend, backend) and starts all services (Nginx, backend, db, redis) in detached mode.

2.  **Initialize Database (Migrations & Seeders):**
    After services are up, run migrations and seed initial data. You'll need to execute these commands inside the `backend` container.
    ```bash
    docker compose exec backend npm run migrate
    docker compose exec backend npm run seed
    ```

3.  **Access the Application:**
    *   Frontend: `http://localhost`
    *   Backend API (directly, if exposed, otherwise via frontend): `http://localhost:3001/api` (or via Nginx: `http://localhost/api`)

4.  **Stop Services:**
    ```bash
    docker compose down
    ```

#### Running Backend Separately

1.  **Install dependencies:**
    ```bash
    cd backend
    npm install
    ```
2.  **Start Database & Redis (if not using Docker Compose for them):**
    Ensure a PostgreSQL instance and Redis instance are running and accessible via the `DATABASE_URL` and `REDIS_HOST`/`REDIS_PORT` specified in `backend/.env`. You can use Docker Compose just for `db` and `redis`:
    ```bash
    docker compose up db redis -d
    ```
3.  **Run Migrations & Seeders:**
    ```bash
    npm run migrate
    npm run seed
    ```
4.  **Start Backend:**
    ```bash
    npm run dev # for development with hot-reloading
    # or
    npm start # for production-like start
    ```
    The backend will be available at `http://localhost:3001`.

#### Running Frontend Separately

1.  **Install dependencies:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Start Frontend:**
    ```bash
    npm start
    ```
    The frontend will be available at `http://localhost:3000` (by default). Ensure your `REACT_APP_API_URL` in `frontend/.env` points to your running backend (e.g., `http://localhost:3001/api`).

---

## 5. Database Management

This project uses `sequelize-cli` for database migrations and seeding.

*   **Create a new migration:**
    ```bash
    # From backend directory
    npx sequelize-cli migration:generate --name add-new-feature
    ```
*   **Run migrations:**
    ```bash
    # From backend directory or via docker compose exec
    npm run migrate
    ```
*   **Undo last migration:**
    ```bash
    npm run migrate:undo
    ```
*   **Seed the database:**
    ```bash
    npm run seed
    ```
*   **Undo all seeders:**
    ```bash
    npm run seed:undo
    ```
*   **Reset the database (drop, create, migrate, seed):**
    ```bash
    npm run db:reset
    ```
    **WARNING:** This will irrevocably delete all data in your database. Use with caution.

---

## 6. Testing

The project includes unit, integration, and API tests for the backend, and unit tests for the frontend.

### Backend Tests

*   **Run all backend tests with coverage:**
    ```bash
    # From backend directory
    npm test
    ```
    This command uses Jest and requires a PostgreSQL instance for testing (configured in `jest.config.js` to use `pms_test_db`). The CI pipeline automatically sets this up.

### Frontend Tests

*   **Run all frontend tests with coverage:**
    ```bash
    # From frontend directory
    npm test -- --watchAll=false --coverage
    ```
    This uses Jest and React Testing Library.

---

## 7. CI/CD

The project uses GitHub Actions for Continuous Integration and Continuous Deployment.

*   **Configuration:** See `.github/workflows/ci-cd.yml`
*   **CI (Continuous Integration):**
    *   Triggers on `push` and `pull_request` to `main` and `develop` branches.
    *   Separately builds and runs tests for backend and frontend.
    *   Ensures code quality and functionality before merging.
    *   Uploads test coverage reports as artifacts.
*   **CD (Continuous Deployment):**
    *   Triggers on `push` to the `main` branch.
    *   Builds and pushes Docker images for both backend and frontend to Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` GitHub Secrets).
    *   Includes a placeholder step for deployment to a production server (e.g., via SSH to pull new images and restart containers). This step would need to be customized for your specific deployment environment.

**GitHub Secrets required for CD:**
*   `DOCKER_USERNAME`
*   `DOCKER_PASSWORD`
*   (Optional, for direct server deployment) `HOST_SERVER_ADDRESS`, `HOST_USERNAME`, `SSH_PRIVATE_KEY`

---

## 8. API Documentation

The backend exposes a RESTful API. Below are the primary endpoints. For detailed schema and examples, refer to `docs/API.md`.

**Base URL:** `/api`

### Authentication
*   `POST /api/auth/register` - Register a new user
*   `POST /api/auth/login` - Log in a user and get JWT tokens
*   `POST /api/auth/logout` - Log out a user (invalidates token - conceptually for this demo)
*   `POST /api/auth/refresh-tokens` - Get new access/refresh tokens (placeholder, not fully implemented for this demo)

### Users (Admin-only access for most operations)
*   `POST /api/users` - Create a user
*   `GET /api/users` - Get all users
*   `GET /api/users/:userId` - Get a single user
*   `PATCH /api/users/:userId` - Update a user
*   `DELETE /api/users/:userId` - Delete a user

### Projects
*   `POST /api/projects` - Create a new project (Authenticated users)
*   `GET /api/projects` - Get all projects current user is involved in
*   `GET /api/projects/:projectId` - Get a single project
*   `PATCH /api/projects/:projectId` - Update a project (Owner/Admin)
*   `DELETE /api/projects/:projectId` - Delete a project (Owner/Admin)
*   `POST /api/projects/:projectId/members` - Add a member to a project (Owner/Admin)
*   `DELETE /api/projects/:projectId/members` - Remove a member from a project (Owner/Admin)

### Tasks
*   `POST /api/tasks` - Create a new task (Project Owner/Member/Admin)
*   `GET /api/tasks` - Get all tasks (can filter by `projectId`, `assignedTo`, `status`, `priority`)
*   `GET /api/tasks/:taskId` - Get a single task
*   `PATCH /api/tasks/:taskId` - Update a task (Project Owner/Member/Admin)
*   `DELETE /api/tasks/:taskId` - Delete a task (Project Owner/Admin)

### Comments
*   `POST /api/comments` - Add a new comment to a task (Project Owner/Member/Admin)
*   `GET /api/comments/:taskId/task` - Get all comments for a specific task
*   `PATCH /api/comments/:commentId` - Update a comment (Comment Author/Project Owner/Admin)
*   `DELETE /api/comments/:commentId` - Delete a comment (Comment Author/Project Owner/Admin)

---

## 9. Deployment Guide

Detailed deployment steps can be found in `docs/DEPLOYMENT.md`. This typically involves setting up a cloud environment (AWS, GCP, Azure, DigitalOcean, Render, etc.), configuring environment variables, running containers, and setting up domain/SSL.

---

## 10. Future Enhancements

*   **Real-time Updates:** Implement WebSockets (Socket.IO) for real-time task and comment updates.
*   **File Uploads:** Add functionality to attach files to tasks or projects.
*   **Notifications:** Implement email or in-app notifications for task assignments, due dates, etc.
*   **Advanced Search & Filtering:** More sophisticated search capabilities for projects and tasks.
*   **Admin Dashboard:** A dedicated dashboard for administrators to manage users and system-wide settings.
*   **More comprehensive API documentation:** Integrate Swagger/OpenAPI for interactive API docs.
*   **Frontend State Management:** Redux or Zustand for more complex state management.
*   **Performance Monitoring:** Integrate with Prometheus and Grafana for detailed metrics.
*   **Security Scans:** SAST/DAST tools in CI/CD.

---

## 11. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```