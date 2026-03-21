# Horizon Monitor

Horizon Monitor is a comprehensive, production-ready performance monitoring system designed for full-stack applications. It provides real-time insights into application performance, allowing users to define custom metrics, ingest data, and visualize trends through an intuitive dashboard.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Database Migrations and Seeding](#database-migrations-and-seeding)
    *   [Running the Application](#running-the-application)
4.  [API Documentation](#api-documentation)
5.  [Testing](#testing)
6.  [Deployment Guide](#deployment-guide)
7.  [CI/CD Configuration](#cicd-configuration)
8.  [Additional Features](#additional-features)
9.  [Project Structure](#project-structure)
10. [License](#license)

## 1. Features

*   **Core Application (Python FastAPI & React/Next.js):**
    *   User authentication (Registration, Login, JWT-based tokens, Refresh tokens).
    *   CRUD operations for Applications (Create, Read, Update, Delete).
    *   CRUD operations for Metrics associated with Applications.
    *   API endpoint for external applications to ingest real-time metric data.
    *   API endpoint for retrieving raw and aggregated metric data.
    *   Interactive frontend dashboard for application and metric visualization.
*   **Database Layer (PostgreSQL):**
    *   SQLAlchemy ORM with Pydantic for data validation.
    *   Alembic for database schema migrations.
    *   Seed data for initial setup and demonstration.
    *   Indexes for query optimization (e.g., on `metric_data.timestamp`).
*   **Configuration & Setup:**
    *   `requirements.txt` / `package.json` for dependency management.
    *   `.env.example` for environment-specific configuration.
    *   `Dockerfile` for containerizing backend and frontend.
    *   `docker-compose.yml` for orchestrating multi-service local development.
*   **Testing & Quality:**
    *   Unit tests for core logic (Python & React).
    *   Integration tests for database interactions and service layers.
    *   API tests for endpoint validation.
    *   Performance tests (conceptual guidance with Locust mentioned).
*   **Documentation:**
    *   Comprehensive README.md (this file!).
    *   Auto-generated OpenAPI/Swagger UI documentation for the API.
    *   Architecture overview.
    *   Deployment instructions.
*   **Additional Features:**
    *   **Authentication/Authorization:** JWTs for user sessions, HTTP-only cookies for refresh tokens, role-based access control (`is_admin`).
    *   **Logging:** Structured logging with `Loguru` for backend.
    *   **Error Handling:** Centralized custom exception handling middleware in FastAPI.
    *   **Caching Layer:** Redis integration for application data and frequently accessed metric aggregates.
    *   **Rate Limiting:** API rate limiting using `FastAPILimiter` with Redis.

## 2. Architecture

Horizon Monitor follows a layered architecture, comprising a FastAPI backend, a React/Next.js frontend, a PostgreSQL database, and Redis for caching and rate limiting.

```mermaid
graph TD
    A[Client Browser] -->|HTTP/HTTPS| B(React Frontend)
    B -->|API Calls (JWT)| C(FastAPI Backend)
    D[External Monitored Application] -->|API Calls (API Key)| C

    C --> E(PostgreSQL Database)
    C --> F(Redis Cache/Rate Limiter)

    subgraph CI/CD
        G[GitHub Push] --> H(GitHub Actions)
        H --> I(Test, Build & Push Docker Images)
    end
```

*   **React Frontend:** User interface, built with Next.js for SSR/SSG capabilities and optimized performance. It communicates with the FastAPI backend via RESTful APIs.
*   **FastAPI Backend:** Provides the API endpoints, handles business logic, authentication, data validation, and orchestrates interactions with the database and caching layer.
*   **PostgreSQL:** The primary data store for all persistent data, including user accounts, application configurations, metric definitions, and high-volume time-series metric data.
*   **Redis:** An in-memory data structure store used for:
    *   **Caching:** Storing frequently accessed application details or latest metric data to reduce database load.
    *   **Rate Limiting:** Tracking API request counts to prevent abuse.
*   **Monitored Applications:** These are external services that integrate with Horizon Monitor by sending their performance metrics to the `/api/v1/metric_data/ingest` endpoint using a unique API Key.

## 3. Getting Started

Follow these instructions to set up and run Horizon Monitor locally using Docker Compose.

### Prerequisites

*   **Docker Desktop:** Ensure Docker Desktop is installed and running on your system. This includes Docker Engine and Docker Compose.
*   **Git:** For cloning the repository.

### Local Development Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/horizon-monitor.git
    cd horizon-monitor
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the project root directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    You can customize the values in `.env`, especially `SECRET_KEY` and database credentials. For development, the defaults are usually sufficient.

3.  **Build and Start Services:**
    From the project root, build the Docker images and start the services:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Builds images from Dockerfiles (required for the first run or if Dockerfiles change).
    *   `-d`: Runs containers in detached mode (in the background).

    This command will:
    *   Build the `db`, `redis`, `backend`, and `frontend` Docker images.
    *   Start a PostgreSQL database container.
    *   Start a Redis cache/rate-limiter container.
    *   Run Alembic migrations on the backend.
    *   Seed initial data into the database (if not already present).
    *   Start the FastAPI backend server.
    *   Start the Next.js frontend development server.

4.  **Verify Services:**
    You can check the status of your Docker containers:
    ```bash
    docker-compose ps
    ```
    All services should be in an `Up` state.

### Database Migrations and Seeding

The `docker-compose.yml` is configured to automatically run migrations and seed data on `backend` service startup.

*   **Migrations (Alembic):**
    *   The backend's `Dockerfile` ensures Alembic is installed.
    *   The `command` in `docker-compose.yml` for the `backend` service runs `alembic upgrade head` before starting the Uvicorn server.
    *   To generate new migrations manually (e.g., after changing models):
        1.  Exec into the backend container: `docker-compose exec backend bash`
        2.  Run Alembic revision: `alembic revision --autogenerate -m "Add new feature table"`
        3.  Exit container: `exit`
        4.  Bring down and up the backend service to apply: `docker-compose restart backend`

*   **Seed Data:**
    *   The `backend` service's `command` also runs `python /app/scripts/seed_data.py`. This script checks if the default admin user exists and, if not, creates:
        *   An admin user: `admin@example.com` / `adminpassword`
        *   A regular user: `user@example.com` / `userpassword`
        *   Sample applications, metrics, and data points.

### Running the Application

*   **Backend API:** Accessible at `http://localhost:8000`
    *   API Documentation (Swagger UI): `http://localhost:8000/api/docs`
    *   API ReDoc: `http://localhost:8000/api/redoc`
*   **Frontend Web UI:** Accessible at `http://localhost:3000`

You can log in to the frontend with:
*   **Admin User:** `admin@example.com` / `adminpassword`
*   **Regular User:** `user@example.com` / `userpassword`

## 4. API Documentation

The FastAPI backend automatically generates OpenAPI documentation, accessible via Swagger UI and ReDoc:

*   **Swagger UI:** `http://localhost:8000/api/docs`
*   **ReDoc:** `http://localhost:8000/api/redoc`

These interfaces provide an interactive way to explore available endpoints, request/response schemas, and even test API calls directly.

## 5. Testing

The project includes various types of tests to ensure quality and reliability.

### Backend Tests (Python)

To run backend tests:

1.  Ensure the `db` and `redis` containers are running (e.g., `docker-compose up -d db redis`).
2.  Exec into the backend container:
    ```bash
    docker-compose exec backend bash
    ```
3.  Run pytest:
    ```bash
    pytest backend/tests/
    ```
    For coverage report:
    ```bash
    pytest --cov=app --cov-report=term-missing --cov-report=html backend/tests/
    ```
    *   **Unit Tests:** Located in `backend/tests/unit/`. These test individual components (e.g., `security.py` functions) in isolation.
    *   **Integration Tests:** Located in `backend/tests/integration/`. These test interactions between components, especially the `CRUD` layer with the database.
    *   **API Tests:** Located in `backend/tests/api/`. These test the FastAPI endpoints directly using an `httpx.AsyncClient` client, simulating HTTP requests and verifying responses.

### Frontend Tests (React/Next.js)

To run frontend tests:

1.  Exec into the frontend container:
    ```bash
    docker-compose exec frontend bash
    ```
2.  Run Jest:
    ```bash
    npm test
    ```
    For watch mode:
    ```bash
    npm run test:watch
    ```
    *   **Unit Tests:** Located in `frontend/tests/unit/`. These test React components and utilities in isolation using Jest and React Testing Library.
    *   **Integration Tests:** Located in `frontend/tests/integration/`. These test how several React components or modules work together, e.g., `ProtectedRoute.test.tsx` verifying authentication flow.

### Performance Tests (Conceptual)

For real-world performance testing, tools like [Locust](https://locust.io/) can be used.

*   **Locust:** You would typically write Python scripts for Locust that simulate user behavior (login, creating applications, fetching metrics) and application behavior (ingesting data via API keys).
    *   A simple Locust test file (`locustfile.py`) might look like this (not included in the project for brevity, but a common pattern):
        ```python
        from locust import HttpUser, task, between

        class WebsiteUser(HttpUser):
            wait_time = between(1, 2) # seconds

            host = "http://localhost:8000" # Replace with your backend URL

            def on_start(self):
                # Login as a user to get JWT token
                self.client.post("/api/v1/auth/token", data={"username": "user@example.com", "password": "userpassword"})
                self.token = self.environment.runner.user.client.cookies.get('access_token') # Example, or parse from response
                self.client.headers = {"Authorization": f"Bearer {self.token}"}


            @task(3)
            def view_dashboard(self):
                self.client.get("/api/v1/applications/", name="/applications [list]")

            @task(1)
            def ingest_metric_data(self):
                # This would typically come from a monitored application
                app_api_key = "some-app-api-key" # Replace with a valid API key
                self.client.post(
                    "/api/v1/metric_data/ingest",
                    json={
                        "api_key": app_api_key,
                        "data_points": [
                            {"name": "cpu_usage", "value": 45.6, "timestamp": "2023-01-01T12:00:00Z"}
                        ]
                    },
                    name="/metric_data/ingest"
                )
        ```
    *   You would run Locust separately (e.g., `locust -f locustfile.py`) and access its UI at `http://localhost:8089`.

## 6. Deployment Guide

This project is designed for containerized deployment, making it highly portable. The `docker-compose.yml` provides a local development setup. For production, you would typically use a more robust orchestrator like Kubernetes or a cloud-specific container service (e.g., AWS ECS, Google Cloud Run, Azure Container Apps).

**Production Considerations:**

1.  **Environment Variables:** Ensure all sensitive environment variables (e.g., `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`) are properly configured in your production environment, ideally using a secrets management system. Do NOT commit `.env` to version control in production.
2.  **HTTPS:** Deploy with HTTPS enabled. Use a reverse proxy (like Nginx, Caddy, or a cloud Load Balancer) to handle SSL termination.
3.  **Database Backup & High Availability:** Implement regular database backups and consider a high-availability setup for PostgreSQL (e.g., master-replica).
4.  **Scalability:**
    *   **Backend:** FastAPI services are asynchronous and performant. Scale horizontally by running multiple instances behind a load balancer.
    *   **Frontend:** Next.js can be deployed as static assets or with server-side rendering scaled independently.
    *   **Database:** Optimize queries, add appropriate indexes, and consider database partitioning for very large `metric_data` tables.
5.  **Logging & Monitoring:** Integrate with a centralized logging system (e.g., ELK stack, Datadog, Prometheus/Grafana) and application performance monitoring (APM) tools. Our backend includes structured logging with Loguru.
6.  **Security:** Regularly update dependencies, configure strict firewall rules, and follow security best practices.
7.  **Resource Limits:** Set CPU and memory limits for containers in production to prevent resource exhaustion.
8.  **Volume Management:** Use persistent volumes for your PostgreSQL data.
9.  **Frontend Build:** The `frontend/Dockerfile` builds the Next.js application for production. For `NEXT_PUBLIC_BACKEND_URL`, ensure it points to your public-facing backend URL.

**Example Production Setup (Conceptual with Nginx reverse proxy):**

A more complete production setup might involve:

*   **Nginx:** As a reverse proxy for both frontend and backend, handling SSL, static file serving for frontend, and routing API requests to the backend.
*   **Docker Swarm / Kubernetes:** For orchestrating multiple instances of backend, frontend, database, and Redis.
*   **Managed Database Service:** Using cloud-managed PostgreSQL (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) for better reliability and scaling.
*   **Managed Redis Service:** Similar to database, use a managed Redis service.

```yaml
# Simplified conceptual docker-compose.prod.yml (not fully tested)
version: '3.8'

services:
  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
      - "443:443" # For HTTPS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro # Certbot for SSL or manual certs
      # - /etc/letsencrypt:/etc/letsencrypt # For certbot
      - ./frontend/.next/static:/app/static # Serve static assets
    depends_on:
      - frontend
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      # Production-ready DB & Redis URLs
      DATABASE_URL: ${PROD_DATABASE_URL}
      REDIS_URL: ${PROD_REDIS_URL}
      SECRET_KEY: ${PROD_SECRET_KEY}
      FASTAPI_ENV: production
    # No direct ports exposed for backend, Nginx handles routing
    # Command for production should not seed data unless specifically needed
    command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner # Use the runner stage for smaller image
    environment:
      NEXT_PUBLIC_BACKEND_URL: https://api.yourdomain.com # Point to public API URL
      NODE_ENV: production
    # No direct ports exposed for frontend, Nginx handles routing
    command: npm start

  # Managed DB and Redis would be external services in production,
  # but locally you'd keep them as in dev setup or replace with bind mounts.
  # db:
  #   image: postgres:15-alpine
  #   ...
  # redis:
  #   image: redis:7-alpine
  #   ...
```

## 7. CI/CD Configuration

A basic GitHub Actions workflow is provided to demonstrate continuous integration. This workflow will lint code, run tests, and build Docker images upon pushes to the `main` branch.