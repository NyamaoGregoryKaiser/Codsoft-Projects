# Task Management System

A comprehensive, production-ready full-stack task management system built with FastAPI (Python) for the backend and React for the frontend. This project demonstrates enterprise-grade features, including authentication, authorization, database management, testing, CI/CD, and robust error handling.

## Table of Contents

1.  [Features](#features)
2.  [Technologies Used](#technologies-used)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Backend Setup (without Docker)](#manual-backend-setup-without-docker)
    *   [Manual Frontend Setup (without Docker)](#manual-frontend-setup-without-docker)
5.  [Running the Application](#running-the-application)
6.  [Database Management (Alembic)](#database-management-alembic)
7.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (Locust)](#performance-tests-locust)
8.  [API Documentation](#api-documentation)
9.  [Architecture Documentation](#architecture-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Additional Features](#additional-features)
12. [Contributing](#contributing)
13. [License](#license)

---

## 1. Features

**Core Functionality:**

*   **User Management**: Register, login, manage user profiles.
*   **Project Management**: Create, view, update, and delete projects. Projects are owned by users.
*   **Task Management**: Create, view, update, and delete tasks within projects. Tasks have status, priority, due dates, assignees, and creators.
*   **Comments**: Add and manage comments on tasks.

**Enterprise-Grade Features:**

*   **Authentication & Authorization**: JWT-based authentication for secure API access. Role-based authorization (User, Admin, Superuser) controlling access to resources.
*   **Database Layer**: PostgreSQL database with SQLAlchemy ORM and Alembic for robust schema migrations.
*   **Configuration Management**: Environment variables for sensitive data and application settings.
*   **Dockerization**: Dockerfiles for backend and frontend, `docker-compose.yml` for easy local setup.
*   **CI/CD**: Placeholder GitHub Actions workflow for automated testing and deployment.
*   **Testing**: Comprehensive unit, integration, and API tests with Pytest (backend) and Jest/React Testing Library (frontend). Performance testing with Locust.
*   **Logging & Monitoring**: Structured logging for backend operations and error tracking.
*   **Error Handling**: Centralized error handling middleware for consistent API responses.
*   **Caching Layer**: Redis integration for caching API responses to improve performance.
*   **Rate Limiting**: API rate limiting using Redis to protect against abuse.
*   **Notifications**: Basic notification service (extensible for email, SMS, real-time).
*   **UI/UX**: Modern React frontend with intuitive design for task management.

## 2. Technologies Used

**Backend (Python - FastAPI)**:

*   **FastAPI**: High-performance, easy-to-use web framework.
*   **SQLAlchemy**: Powerful SQL toolkit and Object-Relational Mapper (ORM).
*   **Alembic**: Database migration tool for SQLAlchemy.
*   **PostgreSQL**: Robust relational database.
*   **Pydantic**: Data validation and settings management.
*   **python-jose**: JWT (JSON Web Token) implementation.
*   **Passlib**: Secure password hashing library.
*   **Redis**: In-memory data store for caching and rate limiting.
*   **FastAPI-Limiter**: Rate limiting middleware for FastAPI.
*   **pytest**: Testing framework.
*   **httpx**: Async HTTP client for API testing.
*   **rich**: For beautiful tracebacks and logging.

**Frontend (JavaScript - React)**:

*   **React**: JavaScript library for building user interfaces.
*   **React Router Dom**: Declarative routing for React.
*   **Axios**: Promise-based HTTP client for the browser and Node.js.
*   **Zustand**: Small, fast, and scalable bearbones state-management solution for React.
*   **Day.js**: Lightweight JavaScript date library.
*   **Jest & React Testing Library**: For frontend testing.
*   **Nginx**: Web server for serving the React build in production/Docker.

**Infrastructure & Tools**:

*   **Docker & Docker Compose**: Containerization and orchestration for development and deployment.
*   **GitHub Actions**: CI/CD pipeline automation.
*   **Locust**: Open-source load testing tool.

## 3. Project Structure

```
task-management-system/
├── backend/                  # FastAPI backend application
│   ├── app/                  # Core application logic
│   │   ├── api/              # API endpoints (v1)
│   │   ├── core/             # Core settings, security, exceptions
│   │   ├── crud/             # CRUD operations for database models
│   │   ├── db/               # Database models, session, initial data
│   │   ├── middleware/       # Custom FastAPI middleware (error handling, rate limiting)
│   │   ├── schemas/          # Pydantic schemas for data validation
│   │   ├── services/         # Business services (cache, notifications)
│   │   └── main.py           # FastAPI application entry point
│   ├── migrations/           # Alembic migration scripts
│   ├── tests/                # Backend tests (unit, integration, API)
│   ├── alembic.ini           # Alembic configuration
│   ├── Dockerfile            # Dockerfile for backend service
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Example environment variables for backend
│   └── gunicorn_conf.py      # Gunicorn configuration for production deployment
├── frontend/                 # React frontend application
│   ├── public/               # Public assets
│   ├── src/                  # React source code
│   │   ├── api/              # API client for backend communication
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context for global state (e.g., Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page-level components (views)
│   │   ├── styles/           # CSS styles
│   │   ├── App.js            # Main application component
│   │   └── index.js          # React app entry point
│   ├── Dockerfile            # Dockerfile for frontend service (Nginx)
│   ├── package.json          # Node.js dependencies
│   ├── .env.example          # Example environment variables for frontend
│   └── nginx.conf            # Nginx configuration for serving React app
├── docker-compose.yml        # Docker Compose configuration for local dev
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml
├── docs/                     # Project documentation
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── locustfile.py             # Performance testing script
├── .env.example              # Root level example environment variables for Docker Compose
└── README.md                 # This README file
```

## 4. Setup and Installation

### Prerequisites

*   **Git**: For cloning the repository.
*   **Docker & Docker Compose**: For easiest local development setup.
*   **Python 3.11+** (Optional, for manual backend setup/testing outside Docker).
*   **Node.js 18+ & npm** (Optional, for manual frontend setup/testing outside Docker).

### Local Development with Docker Compose

This is the recommended way to get started quickly.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/task-management-system.git
    cd task-management-system
    ```

2.  **Create `.env` file:**
    Copy the example environment file and populate it with your settings.
    ```bash
    cp ./.env.example ./.env
    ```
    **Note**: You **must** change `SECRET_KEY` in `.env` to a strong, random string.

3.  **Build and run the services:**
    This command will build the Docker images for the backend and frontend, and start all services (PostgreSQL, Redis, Backend, Frontend).
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Builds images if they don't exist or if changes are detected in Dockerfiles.
    *   `-d`: Runs containers in detached mode (in the background).

4.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
    You should see `db`, `redis`, `backend`, and `frontend` services in a healthy state.

5.  **Access the application:**
    *   **Frontend**: `http://localhost:3000`
    *   **Backend API (Swagger UI)**: `http://localhost:8000/api/v1/docs`

### Manual Backend Setup (without Docker)

1.  **Create and activate a Python virtual environment:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Create `.env` file:**
    ```bash
    cp ./.env.example ./.env
    ```
    Modify `.env` to point to your local PostgreSQL and Redis instances (e.g., `POSTGRES_SERVER=localhost`, `REDIS_HOST=localhost`). Ensure you have PostgreSQL and Redis running locally.

4.  **Run Alembic migrations:**
    ```bash
    alembic upgrade head
    ```

5.  **Run the FastAPI application:**
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The `--reload` flag is useful for development as it restarts the server on code changes.

### Manual Frontend Setup (without Docker)

1.  **Install Node.js dependencies:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Create `.env` file:**
    ```bash
    cp ./.env.example ./.env
    ```
    Ensure `REACT_APP_API_BASE_URL` points to your backend API (e.g., `http://localhost:8000/api/v1`).

3.  **Run the React development server:**
    ```bash
    npm start
    ```
    This will open the application in your browser at `http://localhost:3000`.

## 5. Running the Application

After following the Docker Compose setup:

*   **Frontend**: Open your web browser and navigate to `http://localhost:3000`.
*   **Backend API (Swagger UI)**: Navigate to `http://localhost:8000/api/v1/docs` for interactive API documentation.
*   **Default Admin User**:
    *   **Email**: `admin@example.com`
    *   **Password**: `adminpassword`
    (These credentials are for the initial superuser created by `init_db.py`. Change them in `.env` and restart if you wish.)

## 6. Database Management (Alembic)

Alembic is used for managing database migrations.

**From inside the `backend` directory:**

*   **Initialize Alembic (first time setup):**
    ```bash
    alembic init migrations
    ```
    (Already done in this project, so you usually don't need to do this).

*   **Generate a new migration script:**
    After making changes to your `app/db/models.py` files:
    ```bash
    alembic revision --autogenerate -m "Add new feature X"
    ```
    Review the generated script in `backend/migrations/versions/`.

*   **Apply migrations to the database:**
    ```bash
    alembic upgrade head
    ```

*   **Revert to a previous migration:**
    ```bash
    alembic downgrade -1 # Revert last migration
    alembic downgrade base # Revert all migrations
    ```

## 7. Testing

### Backend Tests

Backend tests are written using `pytest`.
A `conftest.py` is provided for common fixtures (database session, HTTP client, authenticated users).
Tests use an in-memory SQLite database for speed and isolation, and `fakeredis` for mocking Redis.

**To run backend tests:**

1.  Ensure you have `pytest`, `pytest-asyncio`, `httpx`, `fakeredis` installed (included in `requirements.txt`).
2.  From the project root:
    ```bash
    cd backend
    pytest --cov=app --cov-report=html tests/
    ```
    *   `--cov=app`: Measures test coverage for the `app` directory.
    *   `--cov-report=html`: Generates an HTML coverage report in `htmlcov/`.

### Frontend Tests

Frontend tests are written using Jest and React Testing Library.

**To run frontend tests:**

1.  From the `frontend` directory:
    ```bash
    cd frontend
    npm test
    ```
    This will run tests in watch mode. Press `a` to run all tests. To run once and exit (e.g., for CI):
    ```bash
    npm test -- --coverage --watchAll=false
    ```

### Performance Tests (Locust)

Locust is used for load testing the backend API.

1.  Ensure your `backend` and `db` services are running (e.g., with `docker-compose up -d`).
2.  From the project root, start Locust:
    ```bash
    locust -f locustfile.py
    ```
3.  Open your browser to `http://localhost:8089` (Locust web UI).
4.  Enter the host (e.g., `http://localhost:8000`), number of users, and spawn rate, then start swarming.

## 8. API Documentation

The FastAPI backend automatically generates OpenAPI documentation, accessible via:

*   **Swagger UI**: `http://localhost:8000/api/v1/docs`
*   **ReDoc**: `http://localhost:8000/api/v1/redoc`

Additionally, a human-readable API reference is available:

**docs/api.md**
```markdown