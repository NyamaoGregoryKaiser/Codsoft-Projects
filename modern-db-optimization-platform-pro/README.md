```markdown
# Database Performance Monitor & Optimizer

This is a comprehensive, production-ready full-stack application designed to help database administrators and developers monitor and optimize the performance of their PostgreSQL databases. It provides a user-friendly interface to manage database connections, view live performance metrics, analyze query plans, manage indexes, and browse database schemas.

## Features

**Authentication & Authorization:**
*   User registration and login.
*   JWT-based authentication for secure API access.
*   Role-based authorization (e.g., admin for listing all users).

**Database Connection Management:**
*   Securely store and manage credentials for multiple external PostgreSQL databases.
*   CRUD operations for database connection profiles.

**Real-time Monitoring & Analysis:**
*   **Active Queries:** View currently running queries, their states, and durations.
*   **Slow Queries:** Identify queries exceeding a configurable duration threshold.
*   **Query Analyzer:** Execute `EXPLAIN ANALYZE` on custom SQL queries and view the detailed execution plan (JSON format).
*   **Index Management:** List existing indexes, create new B-tree indexes (unique/non-unique), and drop indexes.
*   **Schema Browser:** Explore tables, columns, data types, and primary key information for connected databases.

**Robust Backend:**
*   Node.js with TypeScript.
*   Express.js for API endpoints.
*   TypeORM for database interaction (PostgreSQL for application's own DB).
*   Redis for caching database metadata and session management.
*   Winston for structured logging.
*   Centralized error handling middleware.
*   Rate limiting to protect against abuse.

**Modern Frontend:**
*   React with TypeScript.
*   Chakra UI for a clean, accessible, and responsive user interface.
*   React Router DOM for navigation.
*   Axios for API communication.

**Infrastructure & Quality:**
*   Docker and Docker Compose for easy setup and deployment.
*   Comprehensive Unit, Integration, and API tests (Jest, Supertest).
*   Performance testing example using k6.
*   Extensive documentation (README, API Docs, Architecture, Deployment).

## Technology Stack

*   **Backend:** Node.js, TypeScript, Express.js, TypeORM, PostgreSQL, Redis, `pg`, Winston, `express-rate-limit`, `bcrypt`, `jsonwebtoken`, `zod`.
*   **Frontend:** React, TypeScript, Chakra UI, React Router DOM, Axios.
*   **Database (for the application itself):** PostgreSQL.
*   **Caching:** Redis.
*   **Containerization:** Docker, Docker Compose.
*   **Testing:** Jest, Supertest, k6 (for performance).

## Getting Started

### Prerequisites

*   Docker and Docker Compose installed.
*   Node.js (v18+) and npm (or yarn) for local development outside Docker.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/db-optimizer.git
cd db-optimizer
```

### 2. Environment Configuration

Create `.env` files in both `backend/` and `frontend/` directories by copying from their respective `.env.example` files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env` configuration:**
```env
# Application Configuration
NODE_ENV=development
PORT=5000
JWT_SECRET=your_strong_jwt_secret_here # **CHANGE THIS IN PRODUCTION**

# Database Configuration (for the application's own database)
DB_HOST=postgres_app_db # Use service name if running in Docker Compose, 'localhost' otherwise
DB_PORT=5432
DB_USERNAME=dboptimizer_user
DB_PASSWORD=dboptimizer_password
DB_DATABASE=dboptimizer_app_db

# Redis Configuration (for caching)
REDIS_HOST=redis # Use service name if running in Docker Compose, 'localhost' otherwise
REDIS_PORT=6379
REDIS_PASSWORD= # Leave empty if no password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Admin User Seed (for initial setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword # **CHANGE THIS IN PRODUCTION**
```

**`frontend/.env` configuration:**
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```
*Note: `REACT_APP_API_BASE_URL` should point to your backend's exposed URL.*

### 3. Run with Docker Compose (Recommended)

This will build the Docker images, set up PostgreSQL and Redis containers, run database migrations, seed initial data, and start both backend and frontend services.

```bash
docker-compose up --build -d
```

*   `--build`: Rebuilds images (useful after code changes).
*   `-d`: Runs containers in detached mode.

Wait a few minutes for all services to start and initialize (especially database migrations and seeding).

**Access the application:**
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:5000/api`

### 4. Initial Login

Use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` defined in `backend/.env` (default: `admin`/`adminpassword`) to log in to the frontend.

## Development (without Docker Compose for individual services)

If you prefer to run services individually for faster development iterations:

### Backend Development

1.  Navigate to `backend/`
2.  Install dependencies: `npm install`
3.  Ensure your local PostgreSQL and Redis servers are running and configured according to `backend/.env` (you might need to change `DB_HOST` and `REDIS_HOST` to `localhost`).
4.  Run migrations: `npm run migrate:run`
5.  Seed initial data: `npm run seed:run`
6.  Start the backend in development mode: `npm run dev` (uses `nodemon` for hot-reloading)

### Frontend Development

1.  Navigate to `frontend/`
2.  Install dependencies: `npm install`
3.  Start the frontend development server: `npm start`

## Running Tests

### Backend Tests

1.  Ensure Docker Compose is **NOT** running to avoid port conflicts with the test database.
2.  Ensure you have a separate test database configured (e.g., `dboptimizer_test_db`) in your local PostgreSQL setup, or configure `backend/.env` with `DB_TEST_DATABASE=dboptimizer_test_db` and your local `DB_HOST`/`DB_PORT`.
3.  Navigate to `backend/`
4.  Run tests: `npm test`
    *   This command includes unit, integration, and API tests.
    *   Coverage reports will be generated.

### Frontend Tests

1.  Navigate to `frontend/`
2.  Run tests: `npm test`
    *   This will typically run Jest tests for React components.

### Performance Tests (Backend)

1.  Ensure your `backend/.env` is configured for a non-test environment and the database is accessible.
2.  Ensure you have `k6` installed locally.
3.  Navigate to `backend/tests/performance/`
4.  Run the k6 script:
    ```bash
    k6 run --env API_BASE_URL=http://localhost:5000/api --env K6_USERNAME=admin --env K6_PASSWORD=adminpassword login-and-get-connections.k6.js
    ```
    *   Adjust `API_BASE_URL` if your backend is on a different address.
    *   The `setup()` function in the script will attempt to log in as admin and seed some connections if they don't exist.

## Project Structure

Refer to the `ARCHITECTURE.md` file for a detailed overview of the project's architecture.

## API Documentation

Refer to the `API_DOCS.md` file for detailed information on all available API endpoints.

## Deployment Guide

Refer to the `DEPLOYMENT.md` file for instructions on deploying the application to a production environment.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---
```