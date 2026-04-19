# ProjectFlow - Enterprise DevOps Automation System

ProjectFlow is a full-scale, production-ready task and project management system built with Python Flask, PostgreSQL, and Redis. It demonstrates a comprehensive DevOps automation setup, including a robust CI/CD pipeline, extensive testing, containerization, and enterprise-grade features.

## Table of Contents

1.  [Features](#1-features)
2.  [Architecture](#2-architecture)
3.  [Technology Stack](#3-technology-stack)
4.  [Setup and Local Development](#4-setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Clone the Repository](#clone-the-repository)
    *   [Environment Variables](#environment-variables)
    *   [Docker Compose Setup](#docker-compose-setup)
    *   [Database Migrations](#database-migrations)
    *   [Seeding Initial Data](#seeding-initial-data)
    *   [Running the Application](#running-the-application)
    *   [Accessing the Application](#accessing-the-application)
5.  [API Endpoints Documentation](#5-api-endpoints-documentation)
    *   [Authentication](#authentication)
    *   [Users](#users)
    *   [Projects](#projects)
    *   [Tasks](#tasks)
6.  [Testing](#6-testing)
    *   [Unit and Integration Tests](#unit-and-integration-tests)
    *   [Performance Tests (Locust)](#performance-tests-locust)
7.  [CI/CD Pipeline (GitHub Actions)](#7-cicd-pipeline-github-actions)
8.  [Logging and Monitoring](#8-logging-and-monitoring)
9.  [Caching and Rate Limiting](#9-caching-and-rate-limiting)
10. [Error Handling](#10-error-handling)
11. [Deployment Guide](#11-deployment-guide)
12. [Future Enhancements](#12-future-enhancements)
13. [Contributing](#13-contributing)
14. [License](#14-license)

---

## 1. Features

**Core Application:**

*   **User Management:** Register, Login, Logout, User Profiles (admin/self-view/update).
*   **Project Management:** CRUD operations for projects, linked to an owner.
*   **Task Management:** CRUD operations for tasks, linked to a project and an assignee.
*   **Authentication & Authorization:** JWT-based authentication, role-based (admin) and ownership-based authorization.
*   **Pagination & Filtering:** For listing users, projects, and tasks.
*   **Error Handling:** Centralized custom error handling for API consistency.
*   **Logging:** Structured logging for debugging and operational insights.
*   **Caching:** Redis-backed caching for frequently accessed data.
*   **Rate Limiting:** Protects API endpoints against excessive requests.
*   **Basic Frontend:** A minimal HTML/JS interface to demonstrate API interaction.

**DevOps & Infrastructure:**

*   **Containerization:** Docker for the Python application, PostgreSQL, and Redis.
*   **Orchestration:** Docker Compose for local development environment.
*   **Database Migrations:** Alembic for schema evolution.
*   **Seed Data:** Script to populate initial database data for development.
*   **Comprehensive Testing:** Unit, Integration, and API tests with Pytest (aiming for 80%+ coverage).
*   **Performance Testing:** Basic load testing with Locust.
*   **CI/CD Pipeline:** GitHub Actions for automated build, test, and deployment.

---

## 2. Architecture

ProjectFlow follows a microservice-lite architecture, focusing on clear separation of concerns within a single Flask application for manageability in this demo.

```
+------------------+     +------------------+     +------------------+
|    Client (Web)  |     |   CI/CD System   |     | Monitoring/Alerts|
| (HTML/JS/Postman)|     | (GitHub Actions) |     |  (Future/Ext.)   |
+--------+---------+     +--------+---------+     +---------+--------+
         |                        |                           |
         | (HTTP/S)               | (Git pushes, webhooks)    | (Logs, Metrics)
         |                        |                           |
         v                        v                           v
+-------------------------------------------------------------------+
|               Load Balancer / API Gateway (e.g., Nginx/Envoy)   |
+------------------------------+------------------------------------+
                               |
                               | (HTTP/S)
                               v
+-------------------------------------------------------------------+
|                     ProjectFlow Flask Application                 |
|                   (Containerized - Docker/Gunicorn)               |
+-------------------------------------------------------------------+
|  Auth | Users | Projects | Tasks | Utils | Config | Error Handling|
| (JWT) | (CRUD)|  (CRUD)  | (CRUD)| (Decorators)   | (Custom Exceptions) |
+------------------+-------------+-------------+--------------------+
                   |             |             |
                   | (SQLAlchemy)| (ORM)       | (Redis Client)
                   v             v             v
        +----------+---------+  +------------+------------+
        |   PostgreSQL DB    |  |       Redis Cache        |
        | (Containerized)    |  | (Containerized)          |
        | - Users, Projects  |  | - JWT Blacklist          |
        | - Tasks            |  | - API Responses (per endpoint)|
        | - Alembic Migrations| | - Rate Limiting Counts   |
        +--------------------+  +--------------------------+
```

**Key Architectural Decisions:**

*   **Modular Flask App:** Uses Flask Blueprints to organize API endpoints into logical modules (auth, users, projects, tasks), promoting maintainability.
*   **SQLAlchemy ORM:** Provides an object-relational mapper for database interactions, simplifying data access and manipulation.
*   **Containerization with Docker:** Ensures consistency across development, testing, and production environments.
*   **Redis for Caching & Rate Limiting:** Offloads database read operations and protects against abuse.
*   **JWT for Stateless Authentication:** Scalable and widely adopted method for securing APIs.
*   **Centralized Error Handling:** Consistent error responses across the API.
*   **Layered Security:** Authentication (who you are), Authorization (what you can do), Rate Limiting.

---

## 3. Technology Stack

*   **Backend:** Python 3.10+, Flask
*   **Web Server:** Gunicorn (for production deployment)
*   **Database:** PostgreSQL
*   **ORM:** SQLAlchemy with Flask-SQLAlchemy
*   **Database Migrations:** Alembic with Flask-Migrate
*   **Authentication:** Flask-JWT-Extended, Flask-Bcrypt
*   **Caching:** Redis with Flask-Caching
*   **Rate Limiting:** Flask-Limiter
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** Pytest, Pytest-Cov, Locust
*   **Frontend (minimal):** HTML, CSS, JavaScript (Vanilla)

---

## 4. Setup and Local Development

### Prerequisites

*   Docker Desktop (includes Docker Engine and Docker Compose)
*   Git

### Clone the Repository

```bash
git clone https://github.com/your-username/projectflow.git # Replace with your repo URL
cd projectflow
```

### Environment Variables

Create a `.env` file in the root directory of the project based on `.env.example`.
**Remember to change the placeholder secret keys and passwords!**

```bash
cp .env.example .env
# Open .env and customize the values
```

### Docker Compose Setup

Build and start the services (PostgreSQL, Redis, and Flask app):

```bash
docker-compose up --build -d
```
This command will:
*   Build the `app` service Docker image based on the `Dockerfile`.
*   Pull `postgres` and `redis` images.
*   Create and start containers for `db`, `redis`, and `app`.
*   The `app` container will wait for `db` and `redis` to be healthy before running `flask db upgrade` and `python scripts/seed_db.py`.

Check the status of your services:
```bash
docker-compose ps
```
You should see all services running and healthy.

### Database Migrations

The `docker-compose.yml` automatically runs `flask db upgrade` on `app` startup.
If you need to generate new migrations after model changes:

1.  Stop the `app` container: `docker-compose stop app`
2.  Start just `db` and `redis`: `docker-compose up -d db redis`
3.  Manually run migrations, ensuring `FLASK_APP` and `FLASK_CONFIG` are set:
    ```bash
    docker-compose run --rm app flask db migrate -m "Description of changes"
    docker-compose run --rm app flask db upgrade
    ```
    Then restart the app: `docker-compose restart app`

### Seeding Initial Data

The `docker-compose.yml` also runs `python scripts/seed_db.py` on `app` startup for development. This script populates the database with some sample users, projects, and tasks.

*   **Admin User:** `username: admin`, `password: admin_password`
*   **Regular User:** `username: johndoe`, `password: password123`

You can manually re-run seeding if needed (e.g., after `flask db upgrade` on an empty DB):
```bash
docker-compose run --rm app python scripts/seed_db.py
```

### Running the Application

Once `docker-compose up -d` is complete, the application should be running.

### Accessing the Application

*   **Backend API:** `http://localhost:5000/api/v1/`
*   **Frontend (basic demo):** `http://localhost:5000/`
*   **Health Check:** `http://localhost:5000/health`

You can use the basic frontend to register, login, and interact with the API, or use tools like Postman/Insomnia.

---

## 5. API Endpoints Documentation

All endpoints are prefixed with `/api/v1`.

### Authentication

*   **`POST /auth/register`**
    *   Registers a new user.
    *   **Body:** `{"username": "string", "email": "string", "password": "string"}`
    *   **Response:** `{"message": "User registered successfully", "user_id": 1}`
    *   **Errors:** `400` (Bad Request), `409` (Conflict - username/email exists)
*   **`POST /auth/login`**
    *   Authenticates a user and returns JWT tokens.
    *   **Body:** `{"username": "string", "password": "string"}`
    *   **Response:** `{"access_token": "jwt_token", "refresh_token": "jwt_token", "user": {user_details}}`
    *   **Errors:** `400` (Bad Request), `401` (Unauthorized - invalid credentials)
*   **`POST /auth/refresh`**
    *   Refreshes an expired access token using a refresh token.
    *   **Requires:** `Authorization: Bearer <refresh_token>` header.
    *   **Response:** `{"access_token": "new_jwt_token"}`
    *   **Errors:** `401` (Unauthorized)
*   **`POST /auth/logout`**
    *   Revokes the current access token.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Response:** `{"message": "Successfully logged out"}`
    *   **Errors:** `401` (Unauthorized)
*   **`GET /auth/me`**
    *   Gets details of the currently authenticated user.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Response:** `{user_details}`
    *   **Errors:** `401` (Unauthorized)

### Users

*   **`GET /users/`**
    *   Lists all users.
    *   **Requires:** `Authorization: Bearer <access_token>` header, **Admin access**.
    *   **Query Params:** `page`, `per_page`, `is_admin`
    *   **Response:** `{"users": [{user_details}], "total": int, "pages": int, "current_page": int, "per_page": int}`
    *   **Errors:** `401` (Unauthorized), `403` (Forbidden)
*   **`GET /users/<int:user_id>`**
    *   Gets details of a specific user.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** User can view their own profile, or Admin can view any.
    *   **Response:** `{user_details}`
    *   **Errors:** `401`, `403`, `404` (Not Found)
*   **`PUT /users/<int:user_id>`**
    *   Updates user details.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** User can update their own profile, or Admin can update any. Admin can change `is_admin` or `is_active` status.
    *   **Body:** `{"username": "string", "email": "string", "password": "string", "is_admin": bool, "is_active": bool}` (fields are optional, 'password' only settable by self)
    *   **Response:** `{updated_user_details}`
    *   **Errors:** `401`, `403`, `404`, `400` (Bad Request), `409` (Conflict), `422` (Validation Error)
*   **`DELETE /users/<int:user_id>`**
    *   Deletes a user.
    *   **Requires:** `Authorization: Bearer <access_token>` header, **Admin access**.
    *   **Authorization:** Admin only, and cannot delete own account.
    *   **Response:** `{"message": "User deleted successfully"}`
    *   **Errors:** `401`, `403`, `404`, `400` (Bad Request - cannot delete self)

### Projects

*   **`POST /projects/`**
    *   Creates a new project.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Body:** `{"name": "string", "description": "string"}`
    *   **Response:** `{project_details}`
    *   **Errors:** `401`, `400`, `409` (Conflict - project with same name by same owner exists)
*   **`GET /projects/`**
    *   Lists projects.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Regular users see their own projects. Admins see all projects. Filters `owner_id` (admin only for others), `is_completed`.
    *   **Query Params:** `page`, `per_page`, `owner_id`, `is_completed`
    *   **Response:** `{"projects": [{project_details}], ...}`
    *   **Errors:** `401`, `403`
*   **`GET /projects/<int:project_id>`**
    *   Gets details of a specific project.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Project owner or Admin.
    *   **Response:** `{project_details}`
    *   **Errors:** `401`, `403`, `404`
*   **`PUT /projects/<int:project_id>`**
    *   Updates project details.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Project owner or Admin.
    *   **Body:** `{"name": "string", "description": "string", "is_completed": bool}` (fields are optional)
    *   **Response:** `{updated_project_details}`
    *   **Errors:** `401`, `403`, `404`, `400`, `409`, `422`
*   **`DELETE /projects/<int:project_id>`**
    *   Deletes a project and all its associated tasks.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Project owner or Admin.
    *   **Response:** `{"message": "Project deleted successfully"}`
    *   **Errors:** `401`, `403`, `404`

### Tasks

*   **`POST /tasks/project/<int:project_id>`**
    *   Creates a new task for a given project.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Project owner or Admin.
    *   **Body:** `{"title": "string", "description": "string", "assignee_id": int, "status": "string", "priority": "string", "due_date": "ISO 8601 datetime string"}`
    *   **Valid Statuses:** `todo`, `in-progress`, `completed`, `blocked`
    *   **Valid Priorities:** `low`, `medium`, `high`, `critical`
    *   **Response:** `{task_details}`
    *   **Errors:** `401`, `403`, `404` (Project/Assignee not found), `400` (Bad Request), `422` (Validation Error)
*   **`GET /tasks/project/<int:project_id>`**
    *   Lists tasks for a specific project.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Project owner or Admin.
    *   **Query Params:** `page`, `per_page`, `status`, `priority`, `assignee_id`
    *   **Response:** `{"tasks": [{task_details}], ...}`
    *   **Errors:** `401`, `403`, `404`
*   **`GET /tasks/<int:task_id>`**
    *   Gets details of a specific task.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Task assignee, project owner, or Admin.
    *   **Response:** `{task_details}`
    *   **Errors:** `401`, `403`, `404`
*   **`PUT /tasks/<int:task_id>`**
    *   Updates task details.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Task assignee, project owner, or Admin.
    *   **Body:** `{"title": "string", "description": "string", "assignee_id": int, "status": "string", "priority": "string", "due_date": "ISO 8601 datetime string"}` (fields are optional)
    *   **Response:** `{updated_task_details}`
    *   **Errors:** `401`, `403`, `404`, `400`, `422`
*   **`DELETE /tasks/<int:task_id>`**
    *   Deletes a task.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Task assignee, project owner, or Admin.
    *   **Response:** `{"message": "Task deleted successfully"}`
    *   **Errors:** `401`, `403`, `404`
*   **`GET /tasks/`**
    *   Lists all tasks accessible by the current user.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Authorization:** Admin sees all tasks. Regular users see tasks they are assigned to or tasks belonging to projects they own.
    *   **Query Params:** `page`, `per_page`, `status`, `priority`, `project_id`, `assignee_id` (admin only)
    *   **Response:** `{"tasks": [{task_details}], ...}`
    *   **Errors:** `401`, `400`

---

## 6. Testing

ProjectFlow includes a comprehensive testing suite.

### Unit and Integration Tests

Tests are written using `pytest`.

*   **Unit Tests:** Focus on individual components like models, utility functions, etc. (e.g., `tests/unit/test_models.py`).
*   **Integration Tests:** Test the interaction between multiple components, primarily API endpoints with a test database (e.g., `tests/integration/test_api.py`).

**To run tests locally:**

1.  Ensure your Docker Compose environment is running (`db` and `redis` are crucial).
2.  Install test dependencies if running outside `docker-compose run`:
    `pip install -r requirements.txt`
3.  Execute pytest:
    ```bash
    docker-compose run --rm app pytest
    ```
    To generate coverage reports:
    ```bash
    docker-compose run --rm app pytest --cov=app --cov-report=term-missing
    ```
    The coverage target is 80%+, which the provided code aims to achieve for critical paths.

### Performance Tests (Locust)

Basic load tests are provided using `Locust` to simulate user traffic.

**To run performance tests:**

1.  Ensure your Docker Compose environment (including `app`) is fully up and running.
2.  Run Locust in a separate terminal:
    ```bash
    docker-compose run --rm -p 8089:8089 app locust -f tests/performance/locustfile.py --web-host 0.0.0.0
    ```
    This maps Locust's web UI to `http://localhost:8089`.
3.  Open your browser to `http://localhost:8089`, enter the host (`http://localhost:5000`), number of users, and spawn rate, then start the test.

The `locustfile.py` includes logic to register/login a unique user per Locust worker and perform various API operations (get projects, create projects, get tasks, create tasks).

---

## 7. CI/CD Pipeline (GitHub Actions)

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml`. It automates the build, test, and (simulated) deployment processes whenever changes are pushed to `main` or pull requests are opened.

**`ci-cd.yml` Workflow:**

1.  **`on` Triggers:** Runs on `push` to `main` and `pull_request` to `main`.
2.  **`jobs`:**
    *   **`build-and-test`:**
        *   **Checkout Code:** Clones the repository.
        *   **Set up Python:** Installs Python 3.10.
        *   **Install Dependencies:** Installs `pip` dependencies from `requirements.txt`.
        *   **Set up Docker Compose Environment:** Starts PostgreSQL and Redis containers for testing.
        *   **Wait for Services:** Uses a small script to wait until `db` and `redis` services are healthy within Docker Compose.
        *   **Run Migrations:** Executes `flask db upgrade` on the test database.
        *   **Run Pytest:** Executes unit and integration tests with coverage. Fails if tests don't pass or coverage requirements aren't met.
        *   **Upload Coverage Report:** (Optional) Uploads coverage XML for external tools like Codecov.
    *   **`build-and-push-docker-image`:** (Depends on `build-and-test` success)
        *   **Login to DockerHub/Registry:** Authenticates with a Docker registry (e.g., Docker Hub).
        *   **Build Docker Image:** Builds the application's Docker image using `Dockerfile`.
        *   **Tag Image:** Tags the image with commit SHA and latest.
        *   **Push Image:** Pushes the image to the configured Docker registry.
    *   **`deploy`:** (Depends on `build-and-push-docker-image` success, runs only on `main` branch pushes)
        *   **Simulated Deployment:** For a real enterprise project, this step would involve:
            *   Connecting to a cloud provider (AWS, GCP, Azure) or Kubernetes cluster.
            *   Updating a Kubernetes deployment, ECS service, or other infrastructure.
            *   Performing rolling updates, health checks, etc.
        *   **Placeholder:** In this demo, it simply prints a message indicating a successful deployment, demonstrating the stage in the pipeline.

```yaml