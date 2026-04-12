```markdown
# Comprehensive Web Scraping Tools System

This project provides a full-scale, production-ready web scraping tools system. It features a high-performance C++ backend, a robust PostgreSQL database, a modern React frontend (minimal example), and comprehensive tooling for development, testing, and deployment.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (without Docker)](#local-development-setup-without-docker)
    *   [Docker-Compose Setup (Recommended)](#docker-compose-setup-recommended)
5.  [Running the Application](#running-the-application)
6.  [Testing](#testing)
7.  [API Documentation](#api-documentation)
8.  [Architecture Documentation](#architecture-documentation)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [Contributing](#contributing)
12. [License](#license)

## Features

*   **User Management:** Register, Login, JWT-based Authentication/Authorization.
*   **Scraping Job Management:** CRUD operations for scraping jobs (create, retrieve, update, delete).
    *   Define target URLs, CSS selectors for data extraction.
    *   Specify cron schedules for automated scraping (e.g., "every 30 minutes", "0 0 * * *").
    *   Manual job triggering.
    *   Job status tracking (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED).
*   **Scraped Data Storage:** Store extracted data as JSON in PostgreSQL.
*   **Background Job Scheduler:** C++-based scheduler to execute scraping jobs based on their cron schedules.
*   **Robust Error Handling:** Centralized exception handling and logging.
*   **Logging & Monitoring:** Structured logging using `spdlog`.
*   **Configuration Management:** Environment-variable based configuration.
*   **Database:** PostgreSQL with schema migrations and seed data.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **CI/CD Pipeline:** Conceptual `Jenkinsfile` for automated builds, tests, and deployment.
*   **Frontend:** Minimal React application to demonstrate API interaction (login, job listing, data viewing).

## Architecture

The system is composed of several loosely coupled components:

*   **C++ Backend (Scraper API):**
    *   Developed with **Pistache** for a high-performance RESTful API.
    *   **Auth Manager:** Handles user registration, login, and JWT token issuance/verification.
    *   **Database Manager:** Provides an ORM-like interface for interacting with PostgreSQL using `pqxx`. Manages `Users`, `ScrapingJobs`, and `ScrapedData`.
    *   **Scraper Core:** Utilizes `libcurl` for HTTP requests and a custom/mock HTML parser (conceptually integrating with libraries like Gumbo or a CSS selector engine).
    *   **Job Scheduler:** A custom C++ scheduler that manages and dispatches scraping tasks based on cron expressions, running them in background threads.
    *   **Middleware:** For authentication, error handling, and future features like rate limiting/caching.
*   **PostgreSQL Database:** The primary data store.
*   **React Frontend:** A single-page application that consumes the C++ Backend API.
*   **Nginx (in Docker):** Serves the static React frontend and acts as a reverse proxy to the C++ API.

For a detailed architectural overview, refer to `ARCHITECTURE.md`.

## Technology Stack

**Backend (C++)**
*   **Web Framework:** Pistache
*   **JSON Handling:** nlohmann/json
*   **HTTP Client:** libcurl
*   **Database Driver:** pqxx (PostgreSQL)
*   **Authentication:** jwt-cpp, bcrypt (mocked for demo)
*   **Logging:** spdlog
*   **UUID Generation:** libuuid
*   **Testing:** Google Test, Google Mock

**Frontend (React - Minimal)**
*   React, JavaScript, HTML, CSS
*   Axios for API calls

**Database**
*   PostgreSQL

**DevOps & Tools**
*   Docker, Docker Compose
*   CMake (C++ build system)
*   Jenkins (CI/CD - conceptual `Jenkinsfile`)
*   `curl` (for API testing)
*   `pg_isready` (PostgreSQL health checks)

## Setup and Installation

### Prerequisites

*   **Git:** For cloning the repository.
*   **Docker & Docker Compose:** (Recommended setup) Install Docker Desktop or Docker Engine.
*   **C++ Compiler:** (For local development/testing without Docker) C++17 or newer (e.g., GCC 9+, Clang 9+).
*   **CMake:** (For local development/testing without Docker) Version 3.12 or higher.
*   **PostgreSQL:** (For local development/testing without Docker) Running instance and `libpqxx-dev` (or equivalent) headers.
*   **`libcurl-dev`, `libssl-dev`, `uuid-dev`, `zlib1g-dev`:** (For local development/testing without Docker) Development libraries for C++ backend dependencies.
*   **Node.js & npm:** (For local frontend development) Version 18+.

### Local Development Setup (without Docker)

This setup is useful for C++ backend development and debugging.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/scraper-app.git
    cd scraper-app
    ```

2.  **Install C++ dependencies:**
    On Debian/Ubuntu:
    ```bash
    sudo apt update
    sudo apt install build-essential cmake libcurl4-openssl-dev libpqxx-dev libpq-dev libssl-dev uuid-dev zlib1g-dev pkg-config
    ```
    On macOS (using Homebrew):
    ```bash
    brew install cmake libcurl libpqxx openssl libuuid zlib
    ```
    *Note: Ensure `libpqxx` is correctly linked to your PostgreSQL installation.*

3.  **Set up Database (PostgreSQL):**
    *   Ensure a PostgreSQL server is running locally (e.g., `brew services start postgresql` on macOS, or `sudo systemctl start postgresql` on Linux).
    *   Create a dedicated database and user:
        ```bash
        sudo -u postgres psql
        CREATE DATABASE test_scraper_db;
        CREATE USER user WITH PASSWORD 'password';
        GRANT ALL PRIVILEGES ON DATABASE test_scraper_db TO user;
        \q
        ```
    *   Apply initial schema and seed data:
        ```bash
        psql -U user -d test_scraper_db -f database/init.sql
        psql -U user -d test_scraper_db -f database/seed.sql
        ```

4.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp config/.env.example config/.env
        ```
    *   Edit `config/.env` if necessary, ensuring `DATABASE_URL` matches your local setup (e.g., `postgresql://user:password@localhost:5432/test_scraper_db`).

5.  **Build C++ Backend:**
    ```bash
    mkdir build && cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug # Use Debug for development
    make -j$(nproc)
    ```

6.  **Run C++ Backend:**
    ```bash
    ./scraper_backend
    ```
    The API server should start on `http://localhost:9080`.

7.  **Run React Frontend (Optional, for local UI development):**
    ```bash
    cd ../web
    npm install
    cp .env.example .env # Ensure REACT_APP_API_BASE_URL points to your backend
    # If running backend on 9080, and frontend dev server on 3000, 
    # and you want to proxy API requests through `nginx.conf` logic, 
    # set REACT_APP_API_BASE_URL=/api and handle proxy in local dev server or manual proxy.
    # For simplicity, if not using Nginx locally: REACT_APP_API_BASE_URL=http://localhost:9080/api
    npm start
    ```
    The frontend will be available at `http://localhost:3000` (or another port).

### Docker-Compose Setup (Recommended)

This is the easiest way to get the entire system running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/scraper-app.git
    cd scraper-app
    ```

2.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp config/.env.example config/.env
        ```
    *   You can customize values in `config/.env` (e.g., `JWT_SECRET`). The `DATABASE_URL` in `.env` should point to the `db` service within the Docker network, as configured in `docker-compose.yml` (`postgresql://user:password@db:5432/scraper_db`).

3.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the `scraper_backend` Docker image from `docker/Dockerfile.backend`.
    *   Build the `scraper_frontend` Docker image from `docker/Dockerfile.frontend`.
    *   Start the `db` (PostgreSQL), `backend` (C++ API), and `frontend` (Nginx + React) services.
    *   Apply `database/init.sql` and `database/seed.sql` to the PostgreSQL container.
    *   The `-d` flag runs containers in detached mode.

4.  **Verify Services:**
    ```bash
    docker-compose ps
    ```
    All services (`db`, `backend`, `frontend`) should be in an `Up` state. Check logs if any service is restarting:
    ```bash
    docker-compose logs backend
    ```

5.  **Access the Application:**
    *   **Frontend UI:** Open your web browser and navigate to `http://localhost`.
    *   **Backend API:** The API is exposed on `http://localhost:9080`. You can test the health endpoint:
        ```bash
        curl http://localhost:9080/health
        # Expected output: {"status":"UP"}
        ```

## Running the Application

After successful setup (using Docker Compose or local development):

*   **Frontend:** Access the UI at `http://localhost` (Docker) or `http://localhost:3000` (local React dev server).
    *   You can register a new user or log in with the seeded user: `username: testuser`, `password: password123`.
*   **Backend API:**
    *   The API endpoints are documented in `API_DOCS.md`.
    *   Use `curl` or a tool like Postman/Insomnia to interact with `http://localhost:9080/api/v1/...`.

## Testing

The project includes a comprehensive testing suite.

1.  **Unit Tests (C++):**
    *   Found in `tests/unit/`.
    *   Test individual components (ConfigManager, AuthManager, DatabaseManager, Scraper logic).
    *   Run from the `build` directory:
        ```bash
        cd build
        ./scraper_tests --gtest_filter=TestAuthManager.* # Run specific tests
        ./scraper_tests # Run all tests
        ```
    *   **Coverage:** Aim for 80%+ coverage (requires tools like `gcov`/`lcov` integrated with CMake).

2.  **Integration Tests (C++):**
    *   Found in `tests/integration/`.
    *   Test interactions between multiple components, particularly the API server with a live (test) database.
    *   These tests require the backend API server and PostgreSQL database to be running.
    *   Run similarly to unit tests:
        ```bash
        cd build
        ./scraper_tests --gtest_filter=ApiIntegrationTest.*
        ```

3.  **API Tests:**
    *   The integration tests serve as API tests for the C++ backend.
    *   Can also be performed manually using `curl` or Postman/Insomnia against `http://localhost:9080`.
    *   The `Jenkinsfile` includes conceptual API tests using `curl`.

4.  **Performance Tests (C++):**
    *   A basic C++ performance test using `Pistache::Http::Client` is in `tests/perf/perf_test.cpp`.
    *   This demonstrates concurrent requests and collects basic latency/RPS metrics.
    *   For enterprise-grade performance testing, consider external tools like:
        *   **Locust:** Python-based load testing tool.
        *   **Apache JMeter:** Java-based load testing tool.
        *   **k6:** JavaScript-based load testing tool.
    *   Run:
        ```bash
        cd build
        ./scraper_tests --gtest_filter=PerformanceTest.*
        ```

## API Documentation

Detailed API endpoint specifications, including request/response examples and authentication requirements, are available in `API_DOCS.md`.

## Architecture Documentation

A high-level overview of the system design, component interactions, and key architectural decisions can be found in `ARCHITECTURE.md`.

## Deployment Guide

Instructions for deploying the application to a production environment using Docker and Docker Compose, along with considerations for scaling and security, are available in `DEPLOYMENT.md`.

## Future Enhancements

*   **Advanced HTML Parsing:** Implement proper DOM parsing with CSS selector support (e.g., Gumbo-query, libxml2).
*   **JavaScript Rendering:** Integrate a headless browser (e.g., `Chromium` via `puppeteer-web-socket-client` or custom C++ binding) for scraping dynamic, JavaScript-rendered content.
*   **Distributed Scraping:** Implement a queue (e.g., RabbitMQ, Kafka) and multiple scraper workers for parallel and fault-tolerant scraping.
*   **Proxy Rotator:** Integrate proxy services to avoid IP blocking.
*   **CAPTCHA Solving:** Integrate with CAPTCHA solving services.
*   **User Interface:** Expand the React frontend with more comprehensive job creation forms, data visualization, and user dashboards.
*   **Monitoring & Alerting:** Integrate with Prometheus/Grafana for detailed metrics and alerts.
*   **Admin Panel:** For managing users, reviewing all jobs, and system health.
*   **Caching Layer:** Integrate Redis or Memcached for API response caching.
*   **Rate Limiting:** Implement robust rate limiting for API endpoints.
*   **Webhooks:** Allow users to configure webhooks for job completion notifications.
*   **Data Export:** Implement options to export scraped data in various formats (CSV, Excel).

## Contributing

Contributions are welcome! Please refer to `CONTRIBUTING.md` (not provided in this initial response but would be in a real project) for guidelines.

## License

This project is licensed under the MIT License. See the `LICENSE` file (not provided here) for details.
```