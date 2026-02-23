```markdown
# Enterprise Data Visualization Tools System

This project is a comprehensive, production-ready full-stack web application designed for data visualization. It allows users to connect to various data sources, create custom visualizations (charts), and arrange them into interactive dashboards. The system is built with a focus on modularity, scalability, and enterprise-grade features.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Backend Setup (Manual)](#backend-setup-manual)
    *   [Frontend Setup (Manual)](#frontend-setup-manual)
5.  [Running Tests](#running-tests)
6.  [Database Migrations](#database-migrations)
7.  [API Documentation](#api-documentation)
8.  [Architecture](#architecture)
9.  [Deployment Guide](#deployment-guide)
10. [Additional Features](#additional-features)
11. [Contributing](#contributing)
12. [License](#license)

## 1. Features

*   **User Management:** Secure user registration, login, and role-based access control (Admin, Editor, Viewer).
*   **Data Source Management:** CRUD operations for connecting to various databases (PostgreSQL, MySQL) and file-based sources (CSV).
*   **Visualization Builder:** Create, edit, and delete different types of charts (bar, line, pie) from connected data sources.
*   **Dashboard Builder:** Design interactive dashboards by arranging and resizing visualizations.
*   **Public Dashboards:** Option to make dashboards publicly accessible via a shareable link.
*   **Data Processing:** Backend service to securely query data sources and return processed results for visualization.
*   **Authentication & Authorization:** JWT-based authentication with role-based authorization.
*   **Caching:** Redis-backed caching for API responses and data queries to improve performance.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Logging & Error Handling:** Centralized logging and custom error responses.
*   **Containerization:** Docker for consistent development and deployment environments.
*   **CI/CD:** Automated testing and deployment with GitHub Actions.
*   **Comprehensive Testing:** Unit, integration, and API tests.

## 2. Technology Stack

*   **Backend:** Python 3.10+
    *   **Framework:** Flask
    *   **ORM:** SQLAlchemy
    *   **Migrations:** Alembic
    *   **Authentication:** Flask-JWT-Extended
    *   **Serialization:** Flask-Marshmallow
    *   **Caching:** Flask-Caching (Redis)
    *   **Rate Limiting:** Flask-Limiter (Redis)
    *   **Data Processing:** Pandas, SQLAlchemy core
    *   **WSGI Server:** Gunicorn
*   **Frontend:** React 18+
    *   **Toolchain:** Create React App
    *   **Routing:** React Router DOM
    *   **HTTP Client:** Axios
    *   **UI/Styling:** Tailwind CSS (or similar, implicit in basic components)
    *   **Charting Libraries:** @nivo (or Chart.js, Plotly.js - placeholder for implementation)
    *   **Dashboard Layout:** React Grid Layout
*   **Database:** PostgreSQL
*   **Caching/Rate Limiting Store:** Redis
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions

## 3. Project Structure

```
.
├── .github/                     # CI/CD workflows
├── .env.example                 # Environment variables example
├── backend/                     # Flask backend application
│   ├── app/                     # Flask app modules
│   ├── migrations/              # Alembic migration scripts
│   ├── tests/                   # Backend tests
│   ├── seed_data.py             # Script to populate initial data
│   ├── alembic.ini              # Alembic configuration
│   ├── Dockerfile               # Backend Dockerfile
│   └── requirements.txt         # Python dependencies
├── frontend/                    # React frontend application
│   ├── public/
│   ├── src/                     # React source code
│   ├── .env.development         # Frontend environment variables
│   ├── package.json             # Node dependencies
│   └── Dockerfile               # Frontend Dockerfile
├── docker-compose.yml           # Docker orchestration
├── README.md
├── API.md                       # API documentation
├── ARCHITECTURE.md              # Architecture overview
├── DEPLOYMENT.md                # Deployment guide
└── .gitignore
```

## 4. Setup Instructions

### Prerequisites

*   **Docker & Docker Compose:** Essential for running the application locally.
*   **Git:** For cloning the repository.
*   (Optional, for manual setup/development)
    *   **Python 3.10+**
    *   **Node.js 18+ & npm/yarn**

### Local Development with Docker Compose

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Create `.env` file:**
    Copy `.env.example` to `.env` and fill in your desired environment variables.
    ```bash
    cp .env.example .env
    # Open .env and customize. Make sure SECRET_KEY and JWT_SECRET_KEY are long, random strings.
    ```

3.  **Build and run services with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build Docker images for `backend` and `frontend`.
    *   Start `db` (PostgreSQL), `db_test` (PostgreSQL for tests), `redis` (for caching/rate limiting).
    *   Run backend migrations and seed initial data into `db`.
    *   Start the Flask backend (on port 5000).
    *   Start the React frontend (served by Nginx on port 3000).

4.  **Access the application:**
    *   **Frontend:** Open your browser to `http://localhost:3000`
    *   **Backend API (direct):** `http://localhost:5000/api` (for testing/debugging directly)

    **Default Seeded Users:**
    *   **Admin/Editor:** `username: admin`, `password: adminpass`
    *   **Editor:** `username: editor`, `password: editorpass`
    *   **Viewer:** `username: viewer`, `password: viewerpass`

### Backend Setup (Manual - if not using Docker Compose for dev)

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```
2.  **Create a Python virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set environment variables:**
    Copy `.env.example` from the project root to `../.env` and source it, or manually set.
    ```bash
    # From project root:
    cp .env.example .env
    # From backend dir:
    export FLASK_APP=wsgi.py
    export FLASK_ENV=development
    export SECRET_KEY='your_secret' # Must match .env
    export JWT_SECRET_KEY='your_jwt_secret' # Must match .env
    export DATABASE_URL='postgresql://user:password@localhost:5432/dashboard_db' # Adjust if DB is not in Docker
    # ... other variables
    ```
5.  **Run database migrations and seed data:**
    You'll need a running PostgreSQL instance locally or separately.
    ```bash
    flask db upgrade head # if using Flask-Migrate CLI, or:
    alembic -c alembic.ini upgrade head
    python seed_data.py
    ```
6.  **Run the Flask application:**
    ```bash
    flask run -h 0.0.0.0 -p 5000
    # Or, if using wsgi.py
    gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
    ```

### Frontend Setup (Manual - if not using Docker Compose for dev)

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Set environment variables:**
    Create a `.env.development` file in `frontend/` (if it doesn't exist) and set `REACT_APP_API_BASE_URL`.
    ```
    # frontend/.env.development
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
4.  **Run the React development server:**
    ```bash
    npm start
    # or yarn start
    ```
    This will typically open the app at `http://localhost:3000`.

## 5. Running Tests

### Backend Tests

1.  **Ensure Docker Compose test services are up:**
    ```bash
    docker-compose up -d db_test redis
    # Wait for services to be healthy
    docker-compose run --rm backend sh -c "until pg_isready -h db_test -U test_user; do echo 'Waiting for db_test...'; sleep 1; done;"
    docker-compose run --rm backend sh -c "redis-cli -h redis ping || exit 1"
    ```
    (These are also handled by the CI/CD pipeline, but useful for local testing)

2.  **Run tests using `pytest`:**
    ```bash
    # From the project root (assuming backend/ is in PYTHONPATH or set up correctly)
    export FLASK_ENV=testing
    export PYTHONPATH=$(pwd)/backend
    pytest backend/tests/ --cov=backend/app --cov-report=html --cov-report=xml
    ```
    *   `--cov=backend/app`: Generates coverage report for `backend/app` module.
    *   `--cov-report=html`: Creates an HTML coverage report (look in `htmlcov/` in `backend/`).
    *   `--cov-report=xml`: Creates an XML coverage report (for CI tools like Codecov).

### Frontend Tests

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Run tests using `jest`:**
    ```bash
    npm test -- --coverage --watchAll=false
    # or yarn test -- --coverage --watchAll=false
    ```
    *   `--coverage`: Generates a coverage report.
    *   `--watchAll=false`: Runs tests once without watching for file changes.

## 6. Database Migrations

This project uses Alembic for database migrations.

1.  **Ensure your `backend` Docker container is running or your local backend environment is set up and `backend/alembic.ini` is correctly configured.**
2.  **Generate a new migration script (after changing models):**
    ```bash
    # From project root, with backend service running or local env active
    export PYTHONPATH=$(pwd)/backend
    alembic -c backend/alembic.ini revision --autogenerate -m "Add description of your changes"
    ```
3.  **Apply migrations:**
    ```bash
    export PYTHONPATH=$(pwd)/backend
    alembic -c backend/alembic.ini upgrade head
    ```
4.  **Revert migrations (use with caution):**
    ```bash
    export PYTHONPATH=$(pwd)/backend
    alembic -c backend/alembic.ini downgrade -1 # Revert last migration
    ```

## 7. API Documentation

Refer to [API.md](API.md) for detailed information on available endpoints, request/response formats, and authentication.

## 8. Architecture

Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for a high-level overview of the system's design, component interactions, and data flow.

## 9. Deployment Guide

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying the application to a production environment.

## 10. Additional Features

*   **Logging and Monitoring:**
    *   Backend logging configured via Python's `logging` module to a file (`logs/dashboard_app.log`).
    *   For production, integrate with a centralized logging solution like ELK Stack (Elasticsearch, Logstash, Kibana) or cloud-native options (AWS CloudWatch, Google Cloud Logging, Azure Monitor).
    *   Monitoring with tools like Prometheus/Grafana or cloud-specific services. Sentry for error tracking.
*   **Error Handling Middleware:** Custom Flask error handlers provide consistent JSON error responses.
*   **Caching Layer:** Flask-Caching is integrated with Redis to cache API responses and data query results. `@cache.cached()` and `@cache.memoize()` decorators are used.
*   **Rate Limiting:** Flask-Limiter is integrated with Redis to protect API endpoints from excessive requests. `@limiter.limit()` decorator is used.
*   **Authentication/Authorization:** JWT (JSON Web Tokens) for authentication. Role-based access control implemented using custom decorators (`@role_required`).

## 11. Contributing

Contributions are welcome! Please see the guidelines for submitting issues and pull requests.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```