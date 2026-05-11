# Enterprise-Grade Content Management System (CMS)

This project provides a comprehensive, production-ready Content Management System (CMS) built with a full-stack JavaScript (Node.js/Express backend, React frontend) architecture. It emphasizes modularity, scalability, security, and a robust development workflow, including Docker, CI/CD, and extensive testing.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Prerequisites](#prerequisites)
5.  [Local Development Setup](#local-development-setup)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Docker Compose Setup](#docker-compose-setup)
6.  [Database Management](#database-management)
7.  [Testing](#testing)
8.  [API Documentation](#api-documentation)
9.  [CI/CD](#ci-cd)
10. [Deployment](#deployment)
11. [Contributing](#contributing)
12. [License](#license)

---

## 1. Features

### Core CMS Functionality
*   **User Management**: Register, Login, View, Create, Update, Delete users. (Admin-only for CRUD)
*   **Content (Posts) Management**: Create, Read, Update, Delete posts.
*   **Categories**: Assign posts to categories.
*   **Dynamic Slugs**: Automatic slug generation for posts and categories.

### Enterprise-Grade Aspects
*   **Authentication & Authorization**: JWT-based authentication, Role-Based Access Control (RBAC) (Admin, Editor, Viewer roles).
*   **Data Validation**: Robust input validation on both API and database layers.
*   **Error Handling**: Centralized error handling middleware with detailed logging.
*   **Logging & Monitoring**: Structured logging using Winston for different log levels (info, error, debug, http).
*   **Caching Layer**: In-memory caching (Node-Cache) for improved read performance on posts. Extendable to Redis for distributed caching.
*   **Rate Limiting**: Protects API endpoints from abuse and brute-force attacks.
*   **Security Headers**: Helmet.js for setting various HTTP headers to secure the app.
*   **CORS Configuration**: Properly configured Cross-Origin Resource Sharing.
*   **Database Migrations & Seeding**: Managed with Sequelize CLI.
*   **Comprehensive Testing**: Unit, Integration, API, and Performance tests.

## 2. Architecture

The project follows a **Monorepo** structure, separating the backend and frontend into distinct applications within the same repository.

*   **Backend (`backend/`)**: A RESTful API built with Node.js and Express.js, interacting with a PostgreSQL database via Sequelize ORM. It's designed with a layered architecture (routes -> controllers -> services -> models) for clear separation of concerns.
*   **Frontend (`frontend/`)**: A Single Page Application (SPA) built with React.js, consuming the backend API. It focuses on a clean, component-based structure.

### High-Level Diagram

```mermaid
graph TD
    User[Client Browser] --HTTP/S--> Nginx[Nginx / Frontend (React)]
    Nginx --API Requests--> Backend[Backend (Node.js/Express)]
    Backend --ORM (Sequelize)--> PostgreSQL[PostgreSQL Database]

    subgraph Infrastructure
        Nginx --Serves Static Files--> Frontend
        Backend --Logs--> LogFiles[Log Files]
        Backend --Caches Data--> Cache[Node-Cache / Redis]
        Backend --Auth/Auth, Rate Limiting--> Middleware
    end

    User --Admin/Editor/Viewer Roles--> Backend
    CI_CD[CI/CD Pipeline] --Deploys--> Docker[Docker Containers]
    Docker --Orchestrates--> {Nginx, Backend, PostgreSQL}
```

For more detailed architecture, refer to `docs/architecture.md`.

## 3. Technology Stack

### Backend
*   **Runtime**: Node.js v20+
*   **Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM**: Sequelize
*   **Authentication**: JSON Web Tokens (JWT), Bcrypt.js
*   **Logging**: Winston
*   **Caching**: Node-Cache (in-memory, extendable to Redis)
*   **Rate Limiting**: `express-rate-limit`
*   **Security**: Helmet.js, CORS
*   **Testing**: Jest, Supertest

### Frontend
*   **Library**: React.js v18+
*   **Routing**: React Router DOM
*   **State Management**: React's built-in hooks (useState, useContext)
*   **HTTP Client**: Axios
*   **Styling**: Plain CSS (or can be extended with Tailwind CSS / Styled Components)
*   **Testing**: React Testing Library, Jest

### Infrastructure & DevOps
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions
*   **API Documentation**: OpenAPI (Swagger)

---

## 4. Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: v20.x or higher
*   **npm**: v10.x or higher (comes with Node.js)
*   **Docker Desktop**: For running services in containers (highly recommended)
*   **Git**: For version control

---

## 5. Local Development Setup

You can run the application either directly on your machine or using Docker Compose. Docker Compose is the recommended method for consistency and ease of setup.

### A. Docker Compose Setup (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cms-project.git
    cd cms-project
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the project root:
    ```bash
    cp .env.example .env
    ```
    You can customize the variables in `.env` if needed, but defaults should work for local development.

3.  **Build and start services:**
    This command will build the Docker images for backend and frontend, create the PostgreSQL database container, and start all services.
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Builds images if they don't exist or if Dockerfile has changed.
    *   `-d`: Runs containers in detached mode (in the background).

4.  **Wait for services to initialize:**
    It might take a minute for the database to be ready and the backend to connect. You can check logs:
    ```bash
    docker-compose logs -f
    ```

5.  **Run Backend Database Migrations and Seeders:**
    Once the `db` and `backend` containers are up and healthy:
    ```bash
    docker exec -it cms_backend npm run db:reset
    # This script will drop, create, migrate, and seed the database.
    # It requires the `db:create`, `db:migrate`, `db:seed:all` scripts in backend/package.json
    ```
    **Note**: The `db:reset` command is for development. In production, you'd typically run `db:migrate` as part of your deployment process.

6.  **Access the application:**
    *   **Frontend**: `http://localhost:3000`
    *   **Backend API**: `http://localhost:5000/api`
    *   **Adminer (Optional DB GUI)**: If you add an Adminer service to `docker-compose.yml`, typically `http://localhost:8080`

### B. Manual Setup (Without Docker Compose)

#### 1. Backend Setup (`backend/`)

1.  **Navigate to the backend directory:**
    ```bash
    cd cms-project/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file for backend:**
    Copy `.env.example` from `backend/` to `backend/.env`:
    ```bash
    cp .env.example .env
    ```
    Ensure `DB_HOST` is set to `localhost` or your local PostgreSQL host.

4.  **Set up PostgreSQL Database:**
    *   Make sure you have PostgreSQL installed and running locally.
    *   Create a new user and database as specified in `backend/.env` (e.g., `cms_user`, `cms_password`, `cms_dev_db`).
    *   Example SQL for PostgreSQL:
        ```sql
        CREATE USER cms_user WITH PASSWORD 'cms_password';
        CREATE DATABASE cms_dev_db OWNER cms_user;
        GRANT ALL PRIVILEGES ON DATABASE cms_dev_db TO cms_user;
        ```

5.  **Run database migrations and seeders:**
    ```bash
    npm run db:create    # Creates the database if it doesn't exist
    npm run db:migrate   # Applies schema migrations
    npm run db:seed      # Populates with initial data
    ```
    Alternatively, for a fresh start in development:
    ```bash
    npm run db:reset
    ```

6.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend API will be available at `http://localhost:5000/api`.

#### 2. Frontend Setup (`frontend/`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd cms-project/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file for frontend:**
    Create a file named `.env.development` in `frontend/` (React uses `REACT_APP_` prefix for env vars):
    ```
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
    This tells the React app where to find the backend API.

4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend application will be available at `http://localhost:3000`.

---

## 6. Database Management

The backend uses [Sequelize CLI](https://sequelize.org/docs/v6/other-topics/migrations/) for database operations.

From the `backend/` directory:

*   **Create a new migration:**
    ```bash
    npx sequelize-cli migration:generate --name your-migration-name
    ```
*   **Apply all pending migrations:**
    ```bash
    npm run db:migrate
    ```
*   **Revert the last migration:**
    ```bash
    npm run db:migrate:undo
    ```
*   **Create a new seeder:**
    ```bash
    npx sequelize-cli seed:generate --name your-seed-name
    ```
*   **Run all seeders:**
    ```bash
    npm run db:seed
    ```
*   **Reset database (drop, create, migrate, seed - for development only!):**
    ```bash
    npm run db:reset
    ```

---

## 7. Testing

The project includes comprehensive tests to ensure quality and reliability.

### Backend Tests

From the `backend/` directory:

*   **Run all tests (Unit, Integration, API):**
    ```bash
    npm test
    ```
*   **Run tests with coverage report:**
    ```bash
    npm run test:coverage
    ```
    Aim for 80%+ coverage for branches, functions, lines, and statements.

*   **Performance Tests (using k6):**
    1.  Ensure k6 is installed (e.g., `brew install k6` on macOS, or see [k6 installation guide](https://k6.io/docs/getting-started/installation/)).
    2.  Make sure your backend is running.
    3.  From the project root (or `backend/` if paths are adjusted), run:
        ```bash
        k6 run --env BASE_URL=http://localhost:5000 --env ADMIN_EMAIL=admin@example.com --env ADMIN_PASSWORD=admin123 backend/tests/performance/post-read-performance.js
        ```
        This script tests the performance of post retrieval endpoints. Adjust VUs and duration in the k6 script (`backend/tests/performance/post-read-performance.js`) as needed.

### Frontend Tests

From the `frontend/` directory:

*   **Run all tests:**
    ```bash
    npm test
    ```
*   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```
*   **Run tests with coverage report:**
    ```bash
    # React scripts test automatically includes coverage in CI if CI=true env var is set
    # For local, you might need:
    CI=true npm test -- --coverage
    ```

---

## 8. API Documentation

The backend API endpoints are documented using OpenAPI (Swagger).

*   **OpenAPI Specification**: The `docs/api.yaml` file contains the OpenAPI 3.0 specification for the API.
*   **Swagger UI**: You can use online tools (like Swagger Editor or Swagger UI) or integrate Swagger UI into the Express app to visualize and interact with the API documentation.
    *   To view it locally, copy the contents of `docs/api.yaml` into an online Swagger editor (e.g., `editor.swagger.io`) or integrate a Swagger UI package into the backend.

**Key API Routes:**

*   **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
*   **Users**: `/api/users`, `/api/users/:id` (Admin only)
*   **Posts**: `/api/posts`, `/api/posts/:id` (CRUD operations for Admins/Editors, read for Viewers)

Refer to `docs/api.yaml` for full endpoint details, request/response schemas, and security requirements.

---

## 9. CI/CD

The project is configured with GitHub Actions for Continuous Integration and Continuous Deployment.

*   **Configuration**: See `.github/workflows/ci-cd.yml`.
*   **Workflow**:
    1.  **Build & Test Backend**:
        *   Installs Node.js dependencies.
        *   Sets up a temporary PostgreSQL database for testing.
        *   Runs database migrations and seeders.
        *   Executes Unit, Integration, and API tests (with coverage).
        *   Lints backend code.
        *   Uploads coverage report as an artifact.
    2.  **Build & Test Frontend**:
        *   Installs Node.js dependencies.
        *   Executes Frontend tests (with coverage).
        *   Lints frontend code.
        *   Uploads coverage report as an artifact.
    3.  **Deploy (on `main` branch push)**:
        *   Requires successful completion of both backend and frontend tests.
        *   Logs into Docker Hub.
        *   Builds and pushes production Docker images for backend and frontend.
        *   Deploys to a remote server (placeholder for SSH deployment using `docker-compose.prod.yml`).

**Secrets Required for CI/CD**:
*   `DOCKER_USERNAME`: Docker Hub username
*   `DOCKER_PASSWORD`: Docker Hub access token
*   `SSH_HOST`: IP address or hostname of your deployment server
*   `SSH_USERNAME`: SSH username for the deployment server
*   `SSH_KEY`: Private SSH key for authentication (store as a GitHub Secret)

---

## 10. Deployment

Refer to `docs/deployment.md` for a detailed guide on deploying this CMS to a production environment using Docker and a remote server. This includes considerations for environment variables, database setup, and running services securely.

---

## 11. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test` in both `backend/` and `frontend/`).
6.  Ensure code lints correctly (`npm run lint` in both `backend/` and `frontend/`).
7.  Commit your changes (`git commit -am 'feat: Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature-name`).
9.  Open a Pull Request.

---

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```