```markdown
# Secure Task Management System

A full-stack, enterprise-grade task management system with comprehensive security implementations. This project demonstrates best practices for building secure and robust web applications using FastAPI, React, PostgreSQL, and Docker.

## Table of Contents

1.  [Features](#features)
2.  [Security Implementations](#security-implementations)
3.  [Architecture](#architecture)
4.  [Prerequisites](#prerequisites)
5.  [Setup Instructions](#setup-instructions)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Docker Compose Setup](#docker-compose-setup)
6.  [Running the Application](#running-the-application)
7.  [Testing](#testing)
8.  [API Documentation](#api-documentation)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

## 1. Features

*   **User Management:** Register, Login, Logout, Profile Update (for self), CRUD operations (for admin).
*   **Authentication:** JWT-based (Access & Refresh Tokens), password hashing.
*   **Authorization:** Role-Based Access Control (RBAC - admin/user roles) and Resource-Based Access Control (ownership for projects/tasks).
*   **Project Management:** Create, Read, Update, Delete projects.
*   **Task Management:** Create, Read, Update, Delete tasks within projects. Assign tasks to users.
*   **Input Validation:** Robust validation using Pydantic.
*   **Error Handling:** Custom exception handlers for clear API responses.
*   **Logging:** Structured application and security logging with `loguru`.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Caching:** Redis-based caching for improved performance on read operations.
*   **Database:** PostgreSQL with SQLAlchemy ORM and Alembic for migrations.
*   **Containerization:** Docker and Docker Compose for easy environment setup.
*   **CI/CD:** Basic GitHub Actions workflow for linting, testing, and building.

## 2. Security Implementations

This project prioritizes security at multiple layers:

*   **Authentication (JWT):**
    *   **Password Hashing:** Passwords stored using `bcrypt` (via `passlib`), never in plain text.
    *   **Access Tokens:** Short-lived JWTs for API access, signed with a strong `SECRET_KEY`.
    *   **Refresh Tokens:** Longer-lived JWTs to obtain new access tokens without re-authenticating with credentials.
    *   **Token Revocation/Blocklisting:** Access tokens can be "logged out" and immediately invalidated (blocked in Redis).
    *   **Secure Token Handling:** Tokens are passed via `Authorization: Bearer` header, not URL parameters.
*   **Authorization (RBAC & Resource-Based):**
    *   **Roles:** Users have `user` or `admin` roles, checked via dependencies (`get_current_admin_user`, `role_required`).
    *   **Ownership:** Projects and tasks are tied to owners/assignees. Specific endpoints (e.g., update/delete project) require the requesting user to be the owner or an admin (`verify_project_owner`, `verify_task_access`).
*   **Input Validation:**
    *   All incoming request bodies and query parameters are rigorously validated using Pydantic schemas, preventing common injection attacks and ensuring data integrity.
*   **Output Sanitization:**
    *   Response models (Pydantic) ensure that sensitive data (like `hashed_password`) is never exposed in API responses.
*   **SQL Injection Prevention:**
    *   SQLAlchemy ORM is used for all database interactions, which inherently uses parameterized queries, preventing SQL injection vulnerabilities.
*   **CORS Configuration:**
    *   Explicit Cross-Origin Resource Sharing (CORS) middleware is configured to allow requests only from specified frontend origins, preventing unauthorized cross-origin requests.
*   **Rate Limiting:**
    *   Implemented using `fastapi-limiter` and Redis, protecting endpoints (especially login/registration) from brute-force attacks and abuse.
*   **Logging & Monitoring:**
    *   Structured logging (`loguru`) captures application events, errors, and security-relevant actions (e.g., login attempts, token revocations). This is crucial for auditing and detecting suspicious activity.
*   **Error Handling:**
    *   Custom exception classes and global exception handlers provide consistent, informative error messages without leaking internal server details.
*   **Secret Management:**
    *   Sensitive configurations (e.g., `SECRET_KEY`, database credentials) are managed via environment variables (`.env` file, Docker Compose secrets in production), never hardcoded.
*   **HTTPS:**
    *   While not explicitly implemented within the FastAPI/React code itself, the `docker-compose.yml` provides a setup ready for a reverse proxy (like Nginx, often used with Let's Encrypt for SSL) to enforce HTTPS in production environments, ensuring data in transit is encrypted.
*   **Dependency Security:**
    *   `requirements.txt` and `package.json` list all dependencies. Regular updates and security scanning (e.g., `pip-audit`, `npm audit`) are recommended to mitigate known vulnerabilities in third-party libraries.

## 3. Architecture

The system follows a typical **two-tier (or three-tier logical)** architecture:

*   **Frontend (Client):**
    *   A React Single Page Application (SPA) providing the user interface.
    *   Communicates with the backend API via HTTP requests.
    *   Handles client-side routing, state management, and displays data.
*   **Backend (API Server):**
    *   Built with **FastAPI** (Python).
    *   Provides RESTful API endpoints for all business logic (User, Project, Task CRUD).
    *   Handles authentication, authorization, validation, and communicates with the database and caching layer.
    *   Uses **SQLAlchemy** as an ORM for database interactions.
*   **Database:**
    *   **PostgreSQL** for persistent data storage.
    *   Managed with **Alembic** for migrations.
*   **Caching & Rate Limiting:**
    *   **Redis** acts as an in-memory data store for API rate limiting (`fastapi-limiter`) and API response caching (`fastapi-cache2`).

**Data Flow Example (User Login):**
1.  User enters credentials on React frontend.
2.  Frontend sends POST request to `/api/v1/auth/login`.
3.  FastAPI receives request, validates input (Pydantic).
4.  FastAPI queries PostgreSQL via SQLAlchemy to find user and verify password (bcrypt).
5.  If successful, FastAPI generates an Access Token and a Refresh Token (JWTs) using `python-jose`.
6.  FastAPI returns tokens to frontend.
7.  Frontend stores tokens (e.g., in `localStorage` for access token, `httpOnly` cookie for refresh token for better security).
8.  For subsequent requests, frontend includes Access Token in `Authorization` header.
9.  FastAPI validates Access Token on each request (checks expiry, signature, blocklist in Redis).
10. If Access Token expires, frontend uses Refresh Token to get a new Access Token.

```mermaid
graph TD
    A[React Frontend] -->|1. Login Request| B(FastAPI Backend)
    B -->|2. Query User| C(PostgreSQL DB)
    C -->|3. User Data| B
    B -->|4. Generate JWTs, Hash Pass| D(Passlib & Python-jose)
    B -->|5. Store Blocked Tokens/Cache| E(Redis Cache/Limiter)
    B -->|6. Return Tokens| A
    A -->|7. Subsequent API Requests with Access Token| B
    B -->|8. Validate Token (check Redis blocklist)| E
    B -->|9. Authorize & Process Request| C
    B -->|10. Return Data| A
```

## 4. Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**
*   **Docker** and **Docker Compose**
*   **Python 3.11+** (for local development outside Docker)
*   **Node.js 18+** and **Yarn** (for local frontend development outside Docker)

## 5. Setup Instructions

Clone the repository:

```bash
git clone https://github.com/your-username/secure-task-management.git
cd secure-task-management
```

### Docker Compose Setup (Recommended)

This is the easiest way to get the entire stack (backend, frontend, PostgreSQL, Redis) up and running.

1.  **Create `.env` file:**
    Copy the `.env` template to `.env` in the project root and fill in necessary secrets.
    ```bash
    cp .env.example .env
    # Open .env and replace "your-super-secret-key-replace-me..." with a long, random string.
    # Keep other defaults for local development.
    ```
    *Note: For production, ensure `SECRET_KEY` is highly secure and not committed to source control. Docker secrets or Kubernetes secrets are preferred.*

2.  **Create `frontend/.env.development` file:**
    ```bash
    cp frontend/.env.development.example frontend/.env.development
    # Ensure REACT_APP_API_BASE_URL points to your backend:
    # REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
    ```

3.  **Build and Start with Docker Compose:**
    ```bash
    docker-compose build
    docker-compose up -d
    ```
    This will:
    *   Build Docker images for backend and frontend.
    *   Start PostgreSQL, Redis, FastAPI backend, and React frontend.
    *   Run Alembic migrations on the backend container startup.
    *   Seed initial admin user data (if not already present).

4.  **Access the Application:**
    *   **Backend API (Swagger Docs):** `http://localhost:8000/docs`
    *   **Frontend:** `http://localhost:3000`

### Backend Setup (Local Development - without Docker)

If you prefer to run the backend directly on your machine:

1.  **Create a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Set environment variables:**
    You need to configure your `DATABASE_URL`, `SECRET_KEY`, etc. You can either export them in your shell or use a tool like `direnv`.
    Example:
    ```bash
    export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/secure_task_db"
    export SECRET_KEY="your-secret-key"
    export REDIS_HOST="localhost"
    export REDIS_PORT="6379"
    export INITIAL_ADMIN_EMAIL="admin@example.com"
    export INITIAL_ADMIN_PASSWORD="admin_password"
    # ... other variables from .env
    ```
    *(For PostgreSQL and Redis, you'd need them running locally or via Docker Compose separately for just those services).*

4.  **Run database migrations:**
    ```bash
    alembic upgrade head
    ```

5.  **Seed initial data:**
    ```bash
    python app/initial_data.py
    ```

6.  **Run the FastAPI application:**
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The API will be available at `http://localhost:8000`.

### Frontend Setup (Local Development - without Docker)

If you prefer to run the frontend directly on your machine:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    yarn install
    # or npm install
    ```

3.  **Ensure `.env.development` is correctly configured:**
    Make sure `REACT_APP_API_BASE_URL` points to your running backend (e.g., `http://localhost:8000/api/v1`).

4.  **Start the React development server:**
    ```bash
    yarn start
    # or npm start
    ```
    The frontend will be available at `http://localhost:3000`.

## 6. Running the Application

After following the Docker Compose setup:

*   **Frontend:** Open your browser and navigate to `http://localhost:3000`.
*   **Backend API Documentation:** Open your browser and navigate to `http://localhost:8000/docs` (Swagger UI).

You can use the initial admin credentials for testing:
*   **Email:** `admin@example.com`
*   **Password:** `admin_password`

## 7. Testing

The project includes unit, integration, and API tests using `pytest`.

1.  **Ensure Docker Compose services are running** (at least `db` and `redis`).
    ```bash
    docker-compose up -d db redis
    ```
2.  **Run tests (from `backend` directory):**
    ```bash
    cd backend
    # If running locally (not in CI/CD container)
    pytest --cov=app --cov-report=term-missing tests/
    # Or, if you want to run inside a temporary container:
    docker-compose run --rm backend pytest --cov=app --cov-report=term-missing tests/
    ```
    The `pytest` command is configured to provide coverage reports.

3.  **Frontend tests:**
    ```bash
    cd frontend
    yarn test
    # or npm test
    ```

**Performance Tests:**
Refer to the conceptual section in `docs/PERFORMANCE.md` for guidance on setting up performance tests using tools like Locust.

## 8. API Documentation

FastAPI automatically generates OpenAPI (Swagger) documentation.
Once the backend is running, you can access it at:
*   **Swagger UI:** `http://localhost:8000/docs`
*   **ReDoc:** `http://localhost:8000/redoc`

For detailed API endpoint descriptions, refer to the `docs/API.md` file (conceptual, not fully generated).

## 9. Deployment Guide

Refer to `docs/DEPLOYMENT.md` for a conceptual guide on deploying this application to a production environment.

## 10. Future Enhancements

*   **Frontend:**
    *   More comprehensive UI/UX for project and task management.
    *   State management solution (e.g., Redux, Zustand, React Context).
    *   Better error feedback to users.
*   **Backend:**
    *   Asynchronous background tasks (e.g., email notifications, complex reporting) using Celery/Redis.
    *   Advanced search and filtering for projects and tasks.
    *   WebSockets for real-time updates (e.g., task status changes).
    *   Multi-factor authentication (MFA).
    *   OAuth2/OpenID Connect for external identity providers.
    *   More granular permissions (e.g., project members with different roles).
    *   Audit logging to a dedicated system (e.g., ELK stack).
    *   Distributed tracing (e.g., OpenTelemetry).
*   **Infrastructure:**
    *   Kubernetes deployment for scalability and orchestration.
    *   Managed database services (AWS RDS, GCP Cloud SQL).
    *   Dedicated secrets management service (AWS Secrets Manager, HashiCorp Vault).
    *   Monitoring and alerting (Prometheus, Grafana).
    *   CDN for frontend assets.
*   **Testing:**
    *   End-to-end tests (Cypress, Playwright).
    *   Security penetration testing.
    *   Accessibility testing.

## 11. License

This project is licensed under the MIT License - see the LICENSE file for details.
```