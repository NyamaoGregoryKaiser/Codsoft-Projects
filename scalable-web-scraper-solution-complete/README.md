# Web Scraper System: Enterprise-Grade Data Extraction Platform

This project provides a comprehensive, production-ready web scraping system designed for full-stack web development, offering a robust backend for managing scraping tasks, processing data, and a user-friendly frontend for interaction.

## Features

**1. Core Application (FastAPI Backend)**
*   **API Endpoints**: Full CRUD operations for Users, Scraping Tasks, and Scraping Results.
*   **Asynchronous Processing**: Leverages `asyncio` for high-performance I/O operations.
*   **Modular Design**: Clear separation of concerns (API, CRUD, services, models, schemas).
*   **Web Scraping Logic**: Utilizes `httpx` for HTTP requests and `BeautifulSoup4` for HTML parsing, supporting CSS selectors.
*   **Background Task Management**: Integrates with `Celery` and `Redis` for offloading scraping jobs, enabling scalable and scheduled execution.
*   **Scheduling**: Tasks can be configured to run at specified frequencies, with automatic re-scheduling.

**2. Database Layer (PostgreSQL with SQLAlchemy)**
*   **ORM**: SQLAlchemy 2.0 with `asyncpg` for asynchronous database interactions.
*   **Schema Definitions**: `User`, `ScrapingTask`, `ScrapingResult` models.
*   **Migrations**: `Alembic` for database schema version control.
*   **Seed Data**: Automatic creation of an admin user on first application startup.
*   **Query Optimization**: Indexes on frequently queried columns, eager loading examples.

**3. Configuration & Setup**
*   **Dependencies**: `requirements.txt` for Python, `package.json` for Node.js (frontend).
*   **Environment Configuration**: `.env.example` for easy setup of environment variables.
*   **Docker Setup**: `Dockerfile` for backend and frontend, `docker-compose.yml` for orchestrating FastAPI, PostgreSQL, Redis, and Celery services.

**4. Testing & Quality**
*   **Unit Tests**: `pytest` for individual components (CRUD, services).
*   **Integration Tests**: `pytest` with `TestClient` for API endpoints, using a dedicated test database and in-memory Redis.
*   **API Tests**: Covered by integration tests.
*   **Performance Tests**: Example `locustfile.py` for load testing (requires manual execution).
*   **Code Coverage**: Aim for 80%+ coverage with `pytest-cov`.

**5. Documentation**
*   **Comprehensive README**: This document, covering setup, architecture, and deployment.
*   **API Documentation**: Automatic OpenAPI (Swagger UI/ReDoc) provided by FastAPI.
*   **Architecture Documentation**: High-level overview in this README, detailed through code structure.
*   **Deployment Guide**: Covered by Docker/Docker Compose instructions.

**6. Additional Features**
*   **Authentication/Authorization**: JWT-based authentication for API access, role-based authorization (User/Admin).
*   **Logging and Monitoring**: Structured logging with `loguru`.
*   **Error Handling Middleware**: Custom exception handlers for a consistent API error experience.
*   **Caching Layer**: `fastapi-cache2` with Redis for API response caching.
*   **Rate Limiting**: `fastapi-limiter` with Redis to protect API endpoints from abuse.
*   **Frontend (React)**: A basic React application demonstrating user login, task creation, and result viewing.

---

## Architecture Overview

The system follows a microservices-like architecture, orchestrated with Docker Compose:

```
+----------------+       +----------------+       +----------------+
|    Frontend    |<----->|    Backend     |<----->|   PostgreSQL   |
|  (React/Nginx) |       |   (FastAPI)    |       |    (Database)  |
+----------------+       +----------------+       +----------------+
                              ^   ^
                              |   | (Pub/Sub for tasks)
                              v   v
                          +----------+
                          |   Redis  |
                          | (Cache,  |
                          |  Broker, |
                          | Rate Lim)|
                          +----------+
                              ^
                              | (Task Queue)
                              v
                          +----------+
                          |  Celery  |
                          | (Worker) |
                          +----------+
                               |
                               v
                       +----------------+
                       | Scraping Logic |
                       | (httpx, BS4)   |
                       +----------------+
```

*   **Frontend**: A React application serving as the UI, communicating with the FastAPI backend via REST APIs. In production, it's served by Nginx.
*   **Backend (FastAPI)**: The core API server, handling authentication, user management, task CRUD, and triggering scraping jobs via Celery. It interacts with PostgreSQL and Redis.
*   **PostgreSQL**: The primary database for storing users, scraping task definitions, and scraping results.
*   **Redis**: Used as:
    *   A message broker for Celery, allowing the FastAPI app to send tasks to workers.
    *   A backend for Celery results.
    *   A caching layer for FastAPI to improve API response times.
    *   A storage for rate-limiting data.
*   **Celery Worker**: A separate process that picks up scraping tasks from the Redis broker, executes them using the `ScraperService`, and stores results back in PostgreSQL.

---

## Setup and Local Development

### Prerequisites

*   Docker and Docker Compose
*   Python 3.11+
*   Node.js 20+ and Yarn (for frontend development)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/web-scraper-system.git
cd web-scraper-system
```

### 2. Configure Environment Variables

Create `.env` files based on the `.env.example` templates in the `backend/` and `frontend/` directories.

**`backend/.env`**:
```dotenv
# Copy content from backend/.env.example and customize
DATABASE_URL="postgresql+asyncpg://user:password@db:5432/scraper_db"
TEST_DATABASE_URL="postgresql+asyncpg://test_user:test_password@db_test:5432/test_scraper_db"
SECRET_KEY="YOUR_SUPER_SECRET_KEY_CHANGE_ME"
REDIS_URL="redis://redis:6379/0"
CELERY_BROKER_URL="redis://redis:6379/0"
CELERY_RESULT_BACKEND="redis://redis:6379/1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin_password"
# ... other settings
```

**`frontend/.env.development`**:
```dotenv
# This will be used by the frontend development server
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Build and Run with Docker Compose

This will build the Docker images and start all services (PostgreSQL, Redis, FastAPI, Celery worker, Nginx for frontend).

```bash
docker-compose up --build -d
```

*   `--build`: Builds images if they don't exist or need to be updated.
*   `-d`: Runs in detached mode (background).

Wait for all services to become healthy. You can check their status with `docker-compose ps`.

**Access points:**
*   **Backend API (FastAPI)**: `http://localhost:8000`
    *   Swagger UI: `http://localhost:8000/docs`
    *   ReDoc: `http://localhost:8000/redoc`
*   **Frontend App**: `http://localhost:3000` (served by Nginx in Docker)
*   **PostgreSQL**: `localhost:5432`
*   **Redis**: `localhost:6379`

### 4. Database Migrations (handled by `docker-compose`)

The `backend` service in `docker-compose.yml` automatically runs `alembic upgrade head` before starting the FastAPI application. This ensures your database schema is up-to-date.

If you need to generate new migrations after model changes:
1.  Connect to the backend container: `docker-compose exec backend bash`
2.  Run alembic: `alembic revision --autogenerate -m "Your migration message"`
3.  Exit container and restart backend service: `docker-compose restart backend`

### 5. Frontend Development (Optional, if you want live reload)

While the frontend is served by Nginx in Docker, for development with live reload:
1.  Stop the `frontend` service in `docker-compose.yml` by commenting it out or running `docker-compose stop frontend`.
2.  Navigate to the `frontend/` directory.
3.  Install dependencies: `yarn install`
4.  Start the development server: `yarn start` (usually on `http://localhost:3000`)

---

## API Documentation

FastAPI automatically generates interactive API documentation.
*   **Swagger UI**: `http://localhost:8000/docs`
*   **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to explore all available endpoints, their request/response schemas, and even try out requests directly in the browser.

### Key Endpoints:

*   **`POST /api/v1/auth/register`**: Register a new user.
*   **`POST /api/v1/auth/token`**: Authenticate and get a JWT access token.
*   **`GET /api/v1/users/me`**: Get current user's profile (requires authentication).
*   **`POST /api/v1/tasks/`**: Create a new scraping task (requires authentication).
*   **`GET /api/v1/tasks/`**: Get user's tasks (requires authentication).
*   **`GET /api/v1/tasks/{task_id}`**: Get a specific task with its results (requires authentication).
*   **`POST /api/v1/tasks/{task_id}/run`**: Manually trigger a task run (requires authentication).
*   **`GET /api/v1/results/task/{task_id}`**: Get results for a specific task (requires authentication).

---

## Testing

To run backend tests:

1.  Ensure you have a test database ready (Docker compose sets up `db_test` for you, but `pytest` is configured to use `localhost:5433`).
    *   The `conftest.py` in `backend/tests` uses `settings.TEST_DATABASE_URL`. Ensure this points to a separate database that can be created/dropped during testing.
    *   If using `docker-compose`, ensure the `db` service is running and accessible (or launch a separate test DB). The CI setup uses separate ports for testing.
2.  Navigate to the `backend/` directory.
3.  Install `pytest` and related dependencies (`pip install -r requirements.txt`).
4.  Run tests:

    ```bash
    # Make sure env vars for test DB and Redis are set for pytest
    # Example (if not using docker-compose for tests):
    export DATABASE_URL="postgresql+asyncpg://test_user:test_password@localhost:5433/test_scraper_db"
    export REDIS_URL="redis://localhost:6380/0"
    export CELERY_BROKER_URL="redis://localhost:6380/0"
    export CELERY_RESULT_BACKEND="redis://localhost:6380/1"
    export SECRET_KEY="test_secret_key_for_ci" # Needs to match config
    export ADMIN_EMAIL="ci_admin@example.com"
    export ADMIN_PASSWORD="ci_admin_password"
    export DEBUG="True"
    
    pytest --cov=app --cov-report=term-missing tests/
    ```

To run frontend tests (if implemented with React Testing Library/Jest):

1.  Navigate to the `frontend/` directory.
2.  Run tests: `yarn test`

---

## Deployment Guide

The `docker-compose.yml` file is set up for local development but can serve as a strong base for production deployment.

### Production Considerations:

1.  **Environment Variables**: Use a proper `.env` file with production-grade `SECRET_KEY`, `DATABASE_URL`, etc. Do not expose sensitive information.
2.  **Scalability**:
    *   **Backend**: Use multiple FastAPI worker processes (e.g., `uvicorn --workers N`). `docker-compose.yml` currently runs 1.
    *   **Celery**: Scale Celery workers based on the scraping load. Add more `celery_worker` instances to `docker-compose.yml` or manage them separately.
    *   **Database**: Consider read replicas, connection pooling (e.g., PgBouncer).
3.  **Security**:
    *   Ensure all secrets are managed securely (e.g., Kubernetes Secrets, AWS Secrets Manager).
    *   Implement robust input validation and output sanitization.
    *   Monitor for security vulnerabilities using tools like Snyk or Bandit.
    *   Rate limiting and caching are already included, configure them appropriately.
4.  **Monitoring & Logging**:
    *   Integrate with a centralized logging system (ELK stack, Grafana Loki).
    *   Use Prometheus/Grafana for application and infrastructure monitoring.
    *   Health checks are provided (`/health` endpoint).
5.  **Reverse Proxy**: In a production setup, place a robust web server like Nginx or Caddy in front of the FastAPI app for SSL termination, load balancing, and static file serving. (The frontend service in `docker-compose` already uses Nginx, but you might need a separate one for the backend).
6.  **CI/CD**: The `.github/workflows/ci.yml` provides a basic CI pipeline. Extend it to include:
    *   Automated Docker image pushes to a container registry (e.g., Docker Hub, AWS ECR).
    *   Automated deployment to a cloud provider (Kubernetes, ECS, Render, Heroku).
7.  **Error Handling**: Ensure robust error logging and alerting mechanisms are in place.

---

## Frontend Implementation (Basic React)

The frontend is a simplified React application to demonstrate interaction with the backend API.

### frontend/package.json
```json