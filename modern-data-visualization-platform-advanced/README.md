# DataViz - Comprehensive Data Visualization System

DataViz is a full-stack, enterprise-grade data visualization platform built with FastAPI (Python) for the backend and React/TypeScript for the frontend. It allows users to connect to various data sources, create datasets, design interactive charts, and organize them into dashboards.

## Features

**Backend (FastAPI, Python)**
*   **User Management:** Registration, login, profile management.
*   **Authentication & Authorization:** JWT-based authentication, role-based access control (user/admin).
*   **CRUD Operations:** For Datasets, Charts, and Dashboards.
*   **Data Processing:** Placeholder for connecting to external data sources (CSV upload implemented, SQL/API conceptual).
*   **Caching:** Redis-backed caching for improved API response times.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Logging & Monitoring:** Structured logging with `Loguru`.
*   **Error Handling:** Centralized exception handling.
*   **Database:** PostgreSQL with SQLAlchemy ORM and Alembic migrations.

**Frontend (React, TypeScript) - Conceptual Outline**
*   **Intuitive UI/UX:** Chakra UI for a modern, accessible interface.
*   **Dashboard Management:** Create, view, edit, and delete dashboards.
*   **Chart Builder:** Interactive tool to design charts (Bar, Line, Pie, etc.) from datasets.
    *   Select dataset fields for X/Y axes.
    *   Customize chart types and visual properties.
*   **Dataset Explorer:** Upload CSVs, view dataset schema and preview data.
*   **Authentication Flow:** Login, registration, protected routes.
*   **Responsive Design:** Optimized for various screen sizes.
*   **State Management:** Leveraging React Query for data fetching and caching.

## Project Structure

```
.
├── .github/                      # CI/CD (GitHub Actions)
├── .env.example                  # Example environment variables
├── app/                          # Backend Python application
│   ├── api/                      # API endpoints (v1)
│   ├── core/                     # Configuration, security, exceptions
│   ├── crud/                     # CRUD operations on database models
│   ├── db/                       # Database setup (sessions, models, migrations)
│   ├── dependencies/             # FastAPI dependency injection
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic schemas (request/response)
│   ├── services/                 # Business logic for core features
│   └── utils/                    # Utility functions (logger, rate limiter)
│   └── main.py                   # Main FastAPI application
├── alembic.ini                   # Alembic configuration
├── frontend/                     # React/TypeScript frontend
│   ├── public/
│   ├── src/                      # React source code (components, pages, services etc.)
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml            # Docker orchestration for dev/prod
├── Dockerfile                    # Dockerfile for backend
├── Dockerfile.frontend           # Dockerfile for frontend
├── requirements.txt              # Python dependencies
├── tests/                        # Unit, integration, API tests
├── scripts/                      # Database seeding scripts
├── README.md                     # This file
├── ARCHITECTURE.md               # High-level architecture
└── DEPLOYMENT.md                 # Deployment instructions
```

## Setup and Installation

### Prerequisites

*   Docker & Docker Compose
*   Python 3.11+ (for local development without Docker)
*   Node.js 20+ & npm (for frontend development without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dataviz.git
cd dataviz
```

### 2. Environment Configuration

Create a `.env` file in the root directory by copying `.env.example` and filling in the values.

```bash
cp .env.example .env
# Edit .env to set your secrets and desired database/redis credentials
```

**Important:** Change `SECRET_KEY` to a strong, random string in production.

### 3. Run with Docker Compose (Recommended)

This will set up the PostgreSQL database, Redis, FastAPI backend, and Nginx-served React frontend.

```bash
docker compose up --build -d
```

*   The backend will run on `http://localhost:8000`.
*   The frontend will be served by Nginx on `http://localhost:3000`.
*   PostgreSQL will be on `localhost:5432`.
*   Redis will be on `localhost:6379`.

Wait for all services to be healthy (you can check with `docker compose ps`). The backend `command` in `docker-compose.yml` automatically runs Alembic migrations and seeds the database.

**Default Credentials (from `scripts/seed_db.py`):**
*   **Admin User:** `admin@example.com` / `adminpassword`
*   **Demo User:** `user@example.com` / `userpassword`

### 4. Access the Application

*   **Frontend:** Open your browser to `http://localhost:3000`
*   **Backend API Documentation (Swagger UI):** `http://localhost:8000/api/docs`
*   **Backend API Documentation (Redoc):** `http://localhost:8000/api/redoc`
*   **Health Check:** `http://localhost:8000/health`

### 5. Local Development (without Docker Compose for app/frontend services)

If you prefer to run the backend and frontend locally for faster iteration, you'll still need Docker for PostgreSQL and Redis.

**Start Database & Redis:**
```bash
docker compose up -d db redis
```

**Backend Local Development:**

```bash
# Ensure you have Python 3.11+ installed
pip install -r requirements.txt
# Run migrations (ensure .env is configured for local DB connection)
alembic upgrade head
# Seed data
python scripts/seed_db.py
# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Local Development:**

```bash
# Navigate to the frontend directory
cd frontend
# Ensure you have Node.js 20+ installed
npm install
npm run dev
```

The frontend will typically run on `http://localhost:3000` and will proxy `/api` requests to `http://localhost:8000`.

## Testing

The project uses `pytest` for backend tests.

1.  **Ensure test database is ready:** The `docker-compose.test.yml` file is provided to start a dedicated PostgreSQL and Redis for testing.
    ```bash
    docker compose -f docker-compose.test.yml up -d db redis
    ```
2.  **Run tests:**
    ```bash
    pytest tests/ --cov=app --cov-report=term-missing --cov-report=xml
    ```
    This will run all tests and generate a coverage report. The `conftest.py` handles setting up a clean database for each test session.

3.  **Stop test database:**
    ```bash
    docker compose -f docker-compose.test.yml down
    ```

## CI/CD

The `.github/workflows/main.yml` file provides a GitHub Actions CI/CD pipeline that:
*   Runs backend tests (unit, integration, API) with coverage.
*   Lints and builds the frontend application.
*   Builds and pushes Docker images to Docker Hub (on `main` branch pushes).

You'll need to configure `DOCKER_USERNAME` and `DOCKER_PASSWORD` as GitHub Secrets in your repository settings for the Docker push step to work.

## Next Steps / Future Enhancements

*   **Advanced Data Sources:** Implement actual connectors for SQL databases (MySQL, MSSQL), NoSQL, external APIs, etc.
*   **Data Transformation UI:** Provide a UI for users to perform ETL operations (joins, filters, aggregations) on datasets.
*   **Interactive Chart Configuration:** A richer frontend UI for defining chart properties (colors, labels, axes ranges).
*   **Dashboard Layout Editor:** Drag-and-drop interface for arranging charts on a dashboard.
*   **Scheduled Data Refresh:** Implement background tasks for refreshing dataset data.
*   **Real-time Dashboards:** Integrate WebSockets for real-time data updates.
*   **User Collaboration:** Sharing dashboards/charts with other users.
*   **Embeddable Charts:** Allow charts to be embedded in other applications.
*   **Data Export:** Export chart data or dashboard images/PDFs.
*   **Tenant Separation:** For multi-tenant deployments.

---
[ARCHITECTURE.md](#architecture-documentation)
[DEPLOYMENT.md](#deployment-guide)
[API Documentation](#api-documentation)