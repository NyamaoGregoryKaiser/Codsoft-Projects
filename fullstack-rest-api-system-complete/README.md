# Horizon PMS (Project Management System)

Horizon PMS is a full-stack project management application designed to showcase a comprehensive, production-ready API development system. It allows users to manage projects, tasks, and comments, featuring robust authentication, authorization, caching, logging, and extensive testing.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Prerequisites](#prerequisites)
4.  [Local Development Setup](#local-development-setup)
    *   [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
5.  [Database Management](#database-management)
6.  [Testing](#testing)
7.  [API Documentation](#api-documentation)
8.  [Architecture](#architecture)
9.  [CI/CD](#ci/cd)
10. [Deployment](#deployment)
11. [Contributing](#contributing)
12. [License](#license)

## Features

*   **User Management:** Register, login, update profile, view users (admin only).
*   **Project Management:** CRUD operations for projects, assign owner.
*   **Task Management:** CRUD operations for tasks within projects, assignees, status, priority.
*   **Comment System:** Add/update/delete comments on tasks.
*   **Authentication & Authorization:** JWT-based authentication, role-based access control (User, Admin).
*   **Data Validation:** Request payload validation using `class-validator`.
*   **Error Handling:** Centralized, user-friendly error handling.
*   **Logging:** Structured logging with Winston for server events and errors.
*   **Caching:** Redis integration for frequently accessed API endpoints to improve performance.
*   **Rate Limiting:** Protects API endpoints from abuse and brute-force attacks.
*   **Database:** PostgreSQL with TypeORM for robust ORM, migrations, and seeding.
*   **Testing:** Comprehensive suite of Unit, Integration, and API (E2E) tests with Jest and Supertest.
*   **Containerization:** Docker and Docker Compose for easy setup and consistent environments.
*   **CI/CD:** Basic GitHub Actions workflow for automated testing and image building.
*   **Documentation:** Clear README, API reference, Architecture, and Deployment guides.

## Technology Stack

**Backend:**
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **ORM:** TypeORM
*   **Database:** PostgreSQL
*   **Caching:** Redis (via `ioredis`)
*   **Authentication:** JSON Web Tokens (JWT), Bcrypt for password hashing
*   **Validation:** `class-validator`, `class-transformer`
*   **Logging:** Winston
*   **Security:** Helmet, Express-rate-limit, CORS
*   **Testing:** Jest, Supertest

**Frontend:**
*   **Framework:** React
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (configured minimally)
*   **HTTP Client:** Axios
*   **Routing:** React Router DOM

**DevOps:**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/en/) (v18 or higher) & [npm](https://www.npmjs.com/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose) - **Highly Recommended**

## Local Development Setup

### Using Docker Compose (Recommended)

This is the easiest way to get the entire application running, including the database and Redis.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/horizon-pms.git
    cd horizon-pms
    ```

2.  **Create environment files:**
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    You can customize the variables in these `.env` files if needed, but the defaults should work for local development.

3.  **Start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build Docker images for the backend and frontend.
    *   Start PostgreSQL (db), Redis (redis), backend (backend), and frontend (frontend) services in detached mode.
    *   The `backend` service will automatically run database migrations and seed initial data.
    *   The `frontend` service will be accessible on `http://localhost:80` (or `http://localhost`).
    *   The `backend` API will be running on `http://localhost:3000/api`.

4.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
    You should see all services listed with `Up` status.

5.  **Access the application:**
    *   Frontend: Navigate to `http://localhost` in your browser.
    *   Backend API: `http://localhost:3000/api`

    **Initial Login Credentials (from seed data):**
    *   **Regular User:**
        *   Email: `john.doe@example.com`
        *   Password: `password123`
    *   **Admin User:**
        *   Email: `admin@example.com`
        *   Password: `admin123`

6.  **Stop the services:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (database data, redis data):
    ```bash
    docker-compose down -v
    ```

### Manual Setup (Backend)

If you prefer not to use Docker for the backend, you'll need a local PostgreSQL and Redis instance.

1.  **Clone the repository and navigate to the backend directory:**
    ```bash
    git clone https://github.com/your-username/horizon-pms.git
    cd horizon-pms/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to match your local PostgreSQL and Redis configurations. Ensure `DB_HOST` points to `localhost` or your local IP, and `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are correct.

4.  **Start PostgreSQL and Redis:**
    Ensure your local PostgreSQL and Redis servers are running and accessible. Create the database specified in `DB_NAME` if it doesn't exist. Also, ensure the `uuid-ossp` extension is enabled in your PostgreSQL database:
    ```sql
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ```
    (You might need to connect to the `postgres` database first and then `CREATE DATABASE horizon_pms_db; \c horizon_pms_db; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

5.  **Run migrations and seed data:**
    ```bash
    npm run db:migrate
    npm run db:seed
    ```

6.  **Start the backend API in development mode:**
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:3000`.

### Manual Setup (Frontend)

1.  **Navigate to the frontend directory:**
    ```bash
    cd horizon-pms/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    ```
    Ensure `REACT_APP_API_BASE_URL` points to your backend API (e.g., `http://localhost:3000/api`).

4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The React application will open in your browser, usually at `http://localhost:3000` (or another available port).

## Database Management

The backend uses TypeORM for database interactions and migrations.

*   **Run all pending migrations:**
    ```bash
    npm run db:migrate
    ```
*   **Revert the last migration:**
    ```bash
    npm run db:migrate:revert
    ```
*   **Create a new migration file:**
    ```bash
    npm run typeorm migration:create src/database/migrations/YourMigrationName
    ```
    (Then fill in `up` and `down` methods in the generated file).
*   **Seed initial data:**
    ```bash
    npm run db:seed
    ```
*   **Refresh database (revert all, migrate, then seed - DANGER! Deletes all data):**
    ```bash
    npm run db:refresh
    ```

## Testing

The backend includes Unit, Integration, and API (E2E) tests using Jest and Supertest.

1.  **Run all tests (with coverage report):**
    ```bash
    cd backend
    npm test
    ```
2.  **Run tests in watch mode:**
    ```bash
    cd backend
    npm run test:watch
    ```

Test coverage is configured to aim for 80%+. The CI pipeline will enforce this.

## API Documentation

The API endpoints are documented in an OpenAPI/Swagger-like format.

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for detailed information on endpoints, request/response formats, and authentication.

## Architecture

An overview of the project's architecture, including its layers and components, is available.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for more details.

## CI/CD

A basic CI/CD pipeline is configured using GitHub Actions.

*   **Location:** `.github/workflows/ci-cd.yml`
*   **Triggers:** Pushes and Pull Requests to the `main` branch.
*   **Jobs:**
    *   **Backend CI:** Lints, sets up a test PostgreSQL database, runs migrations, and executes unit/integration/API tests.
    *   **Frontend CI:** Lints and runs frontend tests.
    *   **Deploy (Optional):** If pushing to `main`, builds and pushes Docker images to Docker Hub (placeholders for deployment to cloud provider).

**Setup for CI/CD:**
*   You'll need to configure GitHub Secrets for `DOCKER_USERNAME` and `DOCKER_PASSWORD` in your repository settings if you wish to push images to Docker Hub.
*   The test database credentials are hardcoded within the workflow for simplicity (`ci_user`, `ci_password`, `horizon_pms_ci_db`).

## Deployment

A guide for deploying the application to a production environment is available.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for more details.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test`).
6.  Ensure code style is consistent (`npm run lint`).
7.  Commit your changes (`git commit -m 'feat: Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature-name`).
9.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
(Note: A separate LICENSE file is not provided in this output but would typically be present in a real project.)