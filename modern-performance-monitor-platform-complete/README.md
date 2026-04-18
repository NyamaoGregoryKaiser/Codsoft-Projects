```markdown
# PerfoMetrics: An Enterprise-Grade Performance Monitoring System

PerfoMetrics is a comprehensive, full-stack web application designed to monitor the performance of your services. It provides real-time and historical insights into key metrics, supports alert configurations, and offers a robust API for metric ingestion and data retrieval.

## Table of Contents
1.  [Project Overview](#project-overview)
2.  [Architecture](#architecture)
3.  [Features](#features)
4.  [Technology Stack](#technology-stack)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker Compose)](#local-development-setup-docker-compose)
    *   [Backend (C++) - Manual Setup](#backend-cpp---manual-setup)
    *   [Frontend (React) - Manual Setup](#frontend-react---manual-setup)
6.  [Running Tests](#running-tests)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests](#performance-tests)
7.  [API Documentation](#api-documentation)
8.  [Deployment Guide](#deployment-guide)
9.  [Contributing](#contributing)
10. [License](#license)

## 1. Project Overview

PerfoMetrics addresses the need for robust performance monitoring in modern distributed systems. It allows developers and operations teams to:
*   Ingest various performance metrics (CPU, Memory, Latency, Error Rates, Custom Metrics) from their applications.
*   Store this data efficiently in a time-series optimized database.
*   Visualize metrics through a user-friendly dashboard.
*   Configure alert rules based on metric thresholds.
*   Manage monitored services.

## 2. Architecture

The system follows a microservices-like architecture (though bundled into a single backend for simplicity in this comprehensive example), with clear separation of concerns:

*   **Frontend (`perfo-metrics-frontend`):** A React.js application providing the user interface for dashboards, service management, and alert configuration.
*   **Backend (`perfo-metrics-backend`):** A high-performance C++ application handling API requests for metric ingestion, data retrieval, authentication, and core business logic.
*   **Database (`perfo-metrics-db`):** A PostgreSQL database for persistent storage of metrics, service configurations, user data, and alert rules.
*   **Reverse Proxy (`nginx`):** An Nginx server acting as a gateway, routing requests to the frontend static files or the backend API, and handling CORS/SSL.

**Communication Flow:**
1.  Users interact with the React frontend via their browser.
2.  The frontend makes API calls to Nginx, which proxies them to the C++ backend.
3.  Monitored applications directly push metrics to the C++ backend's ingestion endpoint, authenticated via API keys.
4.  The C++ backend processes requests, interacts with the PostgreSQL database, and applies business logic (e.g., authentication, rate limiting).

## 3. Features

*   **Metric Ingestion:** High-throughput API endpoint for services to send performance data (single or batch).
*   **Service Management:** Register, update, and view monitored services. Each service gets a unique API key for secure metric ingestion.
*   **User Authentication & Authorization:** JWT-based authentication for the frontend, with role-based access control (Admin, Viewer).
*   **Data Storage:** PostgreSQL database with optimized schema for time-series metrics using JSONB for flexible tags.
*   **Metric Querying:** Flexible API to retrieve historical metric data with filters (service, metric type, time range, limit/offset).
*   **Rate Limiting:** Protects the metric ingestion endpoint from abuse.
*   **Logging:** Centralized structured logging using `spdlog` for the backend.
*   **Error Handling:** Robust error handling middleware providing consistent API responses.
*   **Caching (Conceptual):** In-memory caching for frequently accessed static data (e.g., service configs) in the C++ backend.
*   **Containerization:** Dockerfiles and `docker-compose.yml` for easy setup and deployment.
*   **CI/CD:** Basic GitHub Actions workflow for automated build, test, and deployment.
*   **Comprehensive Documentation:** README, API documentation, Architecture overview, Deployment Guide.
*   **Testing:** Unit tests, Integration tests, API tests, Performance tests (Locust).

## 4. Technology Stack

**Backend (C++)**
*   **Language:** C++17
*   **Web Framework:** Crow
*   **JSON Handling:** `nlohmann/json`
*   **Database Client:** `libpqxx` (for PostgreSQL)
*   **Logging:** `spdlog`
*   **Authentication:** `jwt-cpp` (for JWT), `libcrypt` (for password hashing placeholder)
*   **Build System:** CMake
*   **Utility:** Boost.UUID (for API key generation)

**Frontend (React.js)**
*   **Framework:** React 18
*   **Language:** TypeScript
*   **State Management:** React Context API
*   **Routing:** React Router DOM
*   **API Client:** Axios
*   **Charting:** `react-chartjs-2` with Chart.js
*   **Styling:** Plain CSS

**Database**
*   **Type:** PostgreSQL 13+
*   **Extensions:** `pg_cron`, `timescaledb` (optional, for advanced time-series handling)

**Infrastructure**
*   **Containerization:** Docker, Docker Compose
*   **Reverse Proxy:** Nginx
*   **CI/CD:** GitHub Actions

## 5. Setup and Installation

### Prerequisites

*   **Docker** and **Docker Compose**: Recommended for easy setup.
*   **Git**

### Local Development Setup (Docker Compose)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/PerfoMetrics.git
    cd PerfoMetrics
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file and rename it to `.env`. Adjust values as needed.
    ```bash
    cp .env.example .env
    # You might want to change JWT_SECRET and DB_PASSWORD for security even in dev.
    ```

3.  **Build and run the services:**
    This command will build the Docker images for the backend and frontend, set up the PostgreSQL database, run migrations, and start Nginx.
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images (useful if you've made code changes).
    *   `-d`: Runs containers in detached mode (in the background).

4.  **Verify services:**
    Check the status of your containers:
    ```bash
    docker-compose ps
    ```
    You should see `perfo-metrics-db`, `perfo-metrics-backend`, `perfo-metrics-frontend`, and `nginx` running.

5.  **Access the application:**
    *   **Frontend:** Open your browser and navigate to `http://localhost`.
    *   **Backend API (via Nginx):** `http://localhost/api` (e.g., `http://localhost/api/auth/login`)

    **Default Credentials (from `db/init.sql`):**
    *   **Admin:** `username: admin`, `password: admin123`
    *   **Viewer:** `username: viewer`, `password: viewer123`

### Backend (C++) - Manual Setup (Linux/macOS)

1.  **Install dependencies:**
    *   **Build tools:** `cmake`, `g++` (C++17 capable)
    *   **Libraries:** `libpq-dev` (PostgreSQL client), `libpqxx-dev`, `libboost-uuid-dev`, `libcrypt-dev`
    *   **Crow:** Header-only, clone or install: `git clone https://github.com/ipkn/crow.git /usr/local/include/crow`
    *   **nlohmann/json:** Header-only, clone or install: `git clone https://github.com/nlohmann/json.git /usr/local/include/nlohmann/json`
    *   **spdlog:** Header-only, clone or install: `git clone https://github.com/gabime/spdlog.git /usr/local/include/spdlog`
    *   **jwt-cpp:** Clone or install: `git clone https://github.com/Thalhammer/jwt-cpp.git /usr/local/include/jwt-cpp`

    ```bash
    # Example for Ubuntu
    sudo apt update
    sudo apt install -y build-essential cmake libpq-dev libpqxx-dev libboost-dev libcrypt-dev
    # Manually clone header-only libs as shown above
    ```

2.  **Database:** Ensure a PostgreSQL instance is running and accessible. Create a database `perfo_metrics_db` and a user `perfo_user` with password `perfo_password` (or match your `.env`). Run the migrations:
    ```bash
    psql -h <DB_HOST> -p 5432 -U perfo_user -d perfo_metrics_db -f db/migrations/V1__initial_schema.sql
    ```

3.  **Build and Run:**
    ```bash
    cd PerfoMetrics/backend
    cmake .
    make
    ./PerfoMetricsBackend # This will load config from .env in the root directory
    ```

### Frontend (React) - Manual Setup

1.  **Install Node.js:** (version 16 or newer recommended)
    ```bash
    # Check node version
    node -v
    npm -v
    ```

2.  **Install dependencies:**
    ```bash
    cd PerfoMetrics/frontend
    npm install
    ```

3.  **Run in development mode:**
    ```bash
    npm start
    ```
    This will typically open `http://localhost:3000` in your browser. Note that it will try to connect to the backend API via `http://localhost:80/api` as configured in `.env.development`.

## 6. Running Tests

### Backend Tests

*   **Unit Tests (C++):** Uses Google Test framework.
    ```bash
    cd PerfoMetrics/backend
    # Assuming you've built the project
    # If using CMake's CTest integration:
    # ctest
    # Otherwise, run the test executable directly (e.g., if you created one like `PerfoMetricsBackend_test`)
    # ./tests/unit/PerfoMetricsBackend_test
    ```
    *(Note: The provided unit tests are illustrative. Full 80%+ coverage requires more detailed mocking and tests for all C++ service methods.)*

*   **API Tests (Python):** Uses `pytest` and `requests`.
    ```bash
    cd PerfoMetrics
    # Install Python dependencies
    pip install -r requirements.txt # (assuming requirements.txt lists pytest, requests)

    # Run tests (ensure backend is running via Docker Compose)
    pytest backend/tests/api/
    ```

### Frontend Tests

*   **Unit Tests (React/Jest):**
    ```bash
    cd PerfoMetrics/frontend
    npm test
    ```
    This will run tests in watch mode. Press `a` to run all tests. Coverage report can be generated with `npm test -- --coverage`.

*   **E2E Tests (Cypress):**
    ```bash
    cd PerfoMetrics/frontend
    npm run cypress:open
    ```
    This will open the Cypress test runner, where you can select and run the tests. Ensure the full application (backend + frontend) is running via Docker Compose before running E2E tests.

### Performance Tests

*   **Locust:** Simulates user load on the API.
    ```bash
    cd PerfoMetrics
    # Install Locust
    pip install locust

    # Run Locust (ensure backend is running via Docker Compose)
    locust -f tests/performance/locustfile.py
    ```
    Open your browser to `http://localhost:8089` (Locust UI) to configure and start the load test.

## 7. API Documentation

Comprehensive API documentation can be found in [API_DOCS.md](API_DOCS.md). It details all available endpoints, request/response formats, authentication requirements, and example usage.

## 8. Deployment Guide

A detailed guide on deploying PerfoMetrics to a production environment using Docker and Nginx, along with CI/CD considerations, is available in [DEPLOYMENT.md](DEPLOYMENT.md).

## 9. Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) (if available) for more information on how to submit pull requests, report bugs, and suggest features.

## 10. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```