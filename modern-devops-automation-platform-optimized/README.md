```markdown
# Enterprise Product Catalog System (C++ Backend)

This project implements a comprehensive, production-ready backend service for managing a product catalog. It is built with C++ using the `drogon` web framework, leverages PostgreSQL for data persistence, and incorporates enterprise-grade DevOps practices including Docker, Docker Compose, and a GitHub Actions CI/CD pipeline.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Core Technologies](#core-technologies)
3.  [Features](#features)
4.  [Architecture](#architecture)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Building the Application](#building-the-application)
    *   [Running with Docker Compose](#running-with-docker-compose)
6.  [Usage](#usage)
    *   [Frontend Interaction](#frontend-interaction)
    *   [API Endpoints](#api-endpoints)
7.  [Testing](#testing)
    *   [Unit Tests (C++)](#unit-tests-c)
    *   [Integration Tests (C++)](#integration-tests-c)
    *   [API Tests (Python)](#api-tests-python)
    *   [Performance Tests (Conceptual)](#performance-tests-conceptual)
8.  [Configuration](#configuration)
9.  [Logging and Monitoring](#logging-and-monitoring)
10. [Authentication and Authorization](#authentication-and-authorization)
11. [Caching](#caching)
12. [Rate Limiting](#rate-limiting)
13. [Deployment](#deployment)
14. [Contributing](#contributing)
15. [License](#license)

---

## 1. Project Overview

The Product Catalog System provides a robust RESTful API to manage product data, including creation, retrieval, updating, and deletion of product entries. It's designed with scalability and maintainability in mind, demonstrating a full-stack approach where the C++ backend serves data to a conceptual frontend.

## 2. Core Technologies

*   **Backend:** C++17/20, `drogon` (web framework), `Poco::JSON` (JSON handling), `libpq` (PostgreSQL client).
*   **Database:** PostgreSQL.
*   **Containerization:** Docker, Docker Compose.
*   **Build System:** CMake.
*   **Testing:** Google Test (C++ unit/integration), Python `requests` (API tests).
*   **CI/CD:** GitHub Actions.
*   **Frontend (Conceptual):** Simple HTML/JavaScript for demonstration.

## 3. Features

*   **Product CRUD:** Full Create, Read, Update, Delete functionality for product items.
*   **RESTful API:** Standard HTTP methods (POST, GET, PATCH, DELETE) for resource management.
*   **Authentication:** Token-based authentication (JWT) for secure API access.
*   **Authorization:** Role-based access control (Admin vs. User) for product management actions.
*   **Logging:** Structured logging for application events and errors.
*   **Error Handling:** Centralized error handling middleware for consistent API error responses.
*   **Caching:** In-memory caching layer for frequently accessed product data to improve performance.
*   **Rate Limiting:** IP-based rate limiting to protect against abuse and ensure service availability.
*   **Database Migrations:** SQL scripts for managing database schema evolution.
*   **Seed Data:** Initial data scripts for populating the database.
*   **Containerization:** Dockerfiles and Docker Compose for easy setup and deployment.
*   **CI/CD:** Automated build, test, and (conceptual) deployment pipeline with GitHub Actions.
*   **Comprehensive Documentation:** README, API docs, Architecture overview, and Deployment guide.

## 4. Architecture

The system follows a layered, service-oriented architecture:

*   **Presentation Layer (Frontend):** A simple HTML/JS client that interacts with the backend API. (Conceptual, provided as `web/index.html` and `web/script.js`).
*   **API Layer (Controllers):** Drogon controllers (`src/controllers/ProductController.cpp`) handle HTTP requests, validate input, and delegate business logic to the service layer. Includes authentication, authorization, error handling, and rate limiting middleware.
*   **Service Layer (Business Logic):** `src/services/ProductService.cpp` encapsulates core business logic, interacts with the database client, and incorporates caching.
*   **Data Access Layer (Database Client):** `src/database/DbClient.cpp` manages PostgreSQL connections and provides an interface for performing database operations using Drogon's ORM capabilities.
*   **Database (PostgreSQL):** Stores product and user data. Managed by SQL schema, migration, and seed scripts.
*   **Utilities:** Common functionalities like logging, JWT management, and caching are encapsulated in `src/utils`.

The application runs within Docker containers, orchestrated by Docker Compose for local development and potentially Kubernetes for production deployment.

For a detailed architecture overview, refer to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 5. Setup and Installation

### Prerequisites

*   **Git:** For cloning the repository.
*   **Docker & Docker Compose:** For containerized development and running the application.
*   **CMake (Optional):** For building the C++ application directly on your host machine (if not using Docker for building).
*   **C++ Compiler (GCC/Clang) & Build Tools (Optional):** If building natively.
*   **Drogon (Optional):** If building natively, install Drogon and its dependencies (`libpq-dev`, `libjsoncpp-dev`, `uuid-dev`, `libpoco-dev`).

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/product-catalog-system.git
    cd product-catalog-system
    ```

2.  **Copy environment variables:**
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file to customize database credentials or application ports if needed. Default values are set for convenience.

3.  **Ensure `drogon` is installed (for native build & test) or Docker will handle it.**
    For Debian/Ubuntu, `sudo apt install drogon-dev libpq-dev libpoco-dev`.

### Building the Application

The `Dockerfile` handles the build process within a multi-stage build. You typically don't need to build outside Docker for development unless you prefer a native setup.

**To build natively (without Docker):**

```bash
mkdir build
cd build
cmake ..
make -j$(nproc)
```

### Running with Docker Compose

Docker Compose will set up both the PostgreSQL database and the C++ backend application. It will also initialize the database schema and seed data.

1.  **Start the services:**
    ```bash
    docker-compose up -d --build
    ```
    *   `--build`: Rebuilds the application image if changes were made to the C++ source code or `Dockerfile`.
    *   `-d`: Runs the containers in detached mode.

2.  **Verify services are running:**
    ```bash
    docker-compose ps
    ```
    You should see `product-catalog-service` and `product-catalog-db` with `Up` status.

3.  **Access the frontend:**
    Open your browser to `http://localhost:8080` (or the port specified in `.env`). The simple HTML/JS frontend will load and interact with the backend API.

4.  **Stop the services:**
    ```bash
    docker-compose down
    ```
    This will stop and remove the containers and default networks. The database volume (`pgdata`) will persist data. To remove the volume as well:
    ```bash
    docker-compose down -v
    ```

## 6. Usage

### Frontend Interaction

The `web/index.html` and `web/script.js` provide a basic web interface to:
1.  **Login:** Authenticate as `admin` (username: `admin`, password: `adminpass`) or `user` (username: `user`, password: `userpass`).
2.  **Create Products:** As an admin user.
3.  **View Products:** As any authenticated user.
4.  **Update Products:** As an admin user.
5.  **Delete Products:** As an admin user.

### API Endpoints

The API is accessible at `http://localhost:8080/api/v1`. All endpoints (except `/auth/login`) require a JWT token in the `Authorization: Bearer <token>` header.

See [docs/API.md](docs/API.md) for detailed API documentation, including request/response examples.

## 7. Testing

The project includes various levels of testing to ensure quality and reliability.

### Unit Tests (C++)

Located in `tests/unit/`. Implemented using Google Test. These tests focus on individual components or functions in isolation.

**To run C++ Unit Tests (after native build):**
```bash
./build/UnitTests
```
*Note: Due to the complexity of mocking Drogon's `DbClient` and async `co_await` calls for true unit isolation, the provided `UnitTests.cpp` may still exhibit dependencies or mock placeholder exceptions. In a full project, robust mocking would be employed.*

### Integration Tests (C++)

Located in `tests/integration/`. Implemented using Google Test. These tests verify the interaction between components, especially the `ProductService` and the actual PostgreSQL database.

**To run C++ Integration Tests (requires `docker-compose up -d db`):**
```bash
./build/IntegrationTests
```

### API Tests (Python)

Located in `tests/api/api_tests.py`. Implemented using `pytest` and `requests`. These tests simulate client interactions with the live API endpoints.

**To run API Tests (requires `docker-compose up -d` for both `app` and `db`):**
```bash
# Ensure pytest and requests are installed: pip install requests pytest
python3 -m pytest tests/api/api_tests.py
```
Or, use the provided script:
```bash
./scripts/run_tests.sh
```

### Performance Tests (Conceptual)

While a full JMeter setup is beyond the scope of this file, a typical approach would involve:
*   **JMeter (`tests/performance/jmeter_plan.jmx` - conceptual):** Define test plans to simulate high load on API endpoints (e.g., GET /products, POST /products).
*   **Load Generation:** Run JMeter tests from a separate machine or container.
*   **Monitoring:** Monitor backend resource utilization (CPU, memory, network, database metrics) during load.

## 8. Configuration

The application uses a layered configuration approach:
1.  **`config/app_config.json`:** Default application settings.
2.  **Environment Variables (`.env` file or Docker environment):** Override `app_config.json` values. This is ideal for sensitive data (passwords, secrets) and environment-specific settings (DB host).

The `src/config/AppConfig.cpp` module handles loading and merging these configurations.

## 9. Logging and Monitoring

*   **Structured Logging:** Utilizes `Poco::Logger` for structured logging. Log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL) can be configured via `APP_LOG_LEVEL` environment variable or `app_config.json`.
*   **Log Output:** Logs are directed to console and optionally to files (`./log/` directory) with rotation and compression.
*   **Monitoring (Conceptual):** In a production environment, logs would be shipped to a centralized logging solution (e.g., ELK Stack, Splunk, DataDog). Application metrics (request times, error rates, CPU/memory usage) would be collected via Prometheus/Grafana or similar tools.

## 10. Authentication and Authorization

*   **Authentication:** Implemented via JWT (JSON Web Tokens). Users log in to `POST /api/v1/auth/login` to receive a token. This token must be sent in the `Authorization: Bearer <token>` header for subsequent authenticated requests.
*   **Authorization:** The `AuthMiddleware` verifies the JWT and extracts user claims (e.g., `isAdmin`). Controllers then use these claims to enforce role-based access control (e.g., only admins can `POST`, `PATCH`, `DELETE` products).
*   **`src/utils/JwtManager.cpp`:** Provides a conceptual (not cryptographically secure for production) implementation for JWT generation and verification. **For production, replace this with a robust, well-vetted JWT library like `jwt-cpp` and use strong secrets.**

## 11. Caching

*   **In-Memory Cache:** A simple in-memory cache (`src/utils/Cache.cpp`) is implemented to store `Product` data fetched by ID.
*   **Configurable TTL:** Cache expiry (Time-To-Live) for products is configurable via `CACHE_PRODUCT_TTL` in `.env` or `app_config.json`.
*   **Cache Invalidation:** The `ProductService` explicitly invalidates cache entries when products are created, updated, or deleted to maintain data consistency.
*   **Scalability:** For distributed environments, this would be replaced by a distributed cache like Redis.

## 12. Rate Limiting

*   **IP-based Rate Limiting:** The `RateLimitingMiddleware` (`src/middleware/RateLimitingMiddleware.cpp`) limits the number of requests from a single IP address within a defined time window.
*   **Configurable:** `RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` can be set in `.env` or `app_config.json`.
*   **Error Response:** Clients exceeding the limit receive a `429 Too Many Requests` HTTP status.

## 13. Deployment

The project is designed for containerized deployment.

*   **Docker Images:** The `Dockerfile` creates a lightweight image for the C++ application.
*   **GitHub Actions CI/CD:** The `.github/workflows/ci-cd.yml` workflow automates:
    *   Building the Docker image.
    *   Running unit, integration, and API tests.
    *   (Conceptual) Pushing the image to a container registry.
    *   (Conceptual) Deploying to a target environment (e.g., Kubernetes, EC2 with Docker Compose).

For a detailed deployment guide, refer to [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 14. Contributing

Contributions are welcome! Please feel free to open issues or pull requests to improve this project.

## 15. License

This project is open-sourced under the MIT License. See the `LICENSE` file for details.
```