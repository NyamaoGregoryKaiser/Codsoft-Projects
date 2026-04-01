```markdown
# CppDBOptimizer - Product Catalog Management System

A full-stack web application built with a C++ backend (Pistache), PostgreSQL database, and a vanilla JavaScript frontend. This project demonstrates enterprise-grade features including database optimization, authentication (JWT), logging, caching, rate limiting, and a robust CI/CD pipeline.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup with Docker Compose](#local-setup-with-docker-compose)
  - [Manual Backend Setup (Linux/macOS)](#manual-backend-setup-linuxmacos)
- [Configuration](#configuration)
- [Database Management](#database-management)
- [API Endpoints](#api-endpoints)
- [Frontend Usage](#frontend-usage)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [API Tests](#api-tests)
  - [Performance Tests](#performance-tests)
- [CI/CD](#cicd)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Management**: Register, Login (JWT-based authentication).
- **Product Catalog**: CRUD operations for products, categories, and manufacturers.
- **Advanced Search**: Filter products by name, category, manufacturer, and price range.
- **Database Optimization**:
    - Normalized schema design.
    - Strategic indexing for common queries.
    - Efficient JOINs and parameterized queries.
    - Connection pooling.
- **Caching Layer**: In-memory caching for frequently accessed static data (e.g., categories).
- **Middleware**: Logging, Error Handling, Authentication, Rate Limiting.
- **Containerization**: Docker for easy setup and deployment.
- **Comprehensive Testing**: Unit, Integration, and API tests.
- **CI/CD Pipeline**: Automated build, test, and deployment using GitHub Actions.
- **Detailed Documentation**: README, API Docs, Architecture, Deployment Guide.

## Technology Stack
- **Backend**: C++17, Pistache (HTTP framework), `pqxx` (PostgreSQL driver), `nlohmann/json`, `spdlog` (logging), `jwt-cpp`, `Catch2` (testing), CMake.
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS).
- **Database**: PostgreSQL 14.
- **Containerization**: Docker, Docker Compose.
- **Web Server (Frontend)**: Nginx.
- **CI/CD**: GitHub Actions.

## Project Structure
```
cpp-db-optimizer/
├── backend/                  # C++ Backend application
│   ├── src/                  # Source code for the backend
│   │   ├── main.cpp
│   │   ├── server/           # HTTP server setup and route definitions
│   │   ├── database/         # DB connection, models, and low-level interactions
│   │   ├── controllers/      # API endpoint handlers
│   │   ├── middleware/       # Global request/response processing (auth, logging, error, rate limit)
│   │   ├── services/         # Business logic layer
│   │   └── utils/            # Utilities (JSON, config, logger, cache)
│   ├── tests/                # Unit and Integration tests for backend
│   ├── CMakeLists.txt        # CMake build configuration for backend
│   └── Dockerfile            # Dockerfile for backend service
├── frontend/                 # Static Frontend application
│   ├── index.html
│   ├── css/
│   └── js/
├── database/                 # Database scripts
│   ├── schema.sql            # Core database schema
│   ├── migrations/           # Incremental schema changes
│   └── seed.sql              # Initial data for development/testing
├── .github/                  # GitHub Actions CI/CD workflows
├── docker-compose.yml        # Orchestration for backend, db, and frontend
├── nginx.conf                # Nginx configuration for the frontend
├── README.md                 # Project overview and setup instructions (You are here!)
├── ARCHITECTURE.md           # Detailed architectural design
├── API_DOCS.md               # API endpoint documentation
└── DEPLOYMENT.md             # Guide for deploying the application
```

## Getting Started

### Prerequisites
- Docker & Docker Compose (recommended for easiest setup)
- Git

### Local Setup with Docker Compose (Recommended)
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cpp-db-optimizer.git
    cd cpp-db-optimizer
    ```
2.  **Copy environment variables:**
    ```bash
    cp backend/.env.example backend/.env
    # You can edit backend/.env if you want to change default settings
    ```
3.  **Build and start services:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    - Build the C++ backend Docker image.
    - Start a PostgreSQL database container.
    - Initialize the database schema and seed data.
    - Start the C++ backend application.
    - Start an Nginx container to serve the frontend.

4.  **Verify services:**
    - Backend API: `http://localhost:9080/api/v1/health` (or check logs `docker-compose logs backend`)
    - Frontend: `http://localhost:80`
    - PostgreSQL: Connect to `localhost:5432` with user `user`, password `password`, database `cppdboptimizer_db`.

### Manual Backend Setup (Linux/macOS)
If you prefer to run the backend without Docker (e.g., for faster development iterations):

1.  **Install Dependencies:**
    - C++ compiler (GCC 10+ or Clang)
    - CMake (3.10+)
    - `libpq-dev` (PostgreSQL client library)
    - `libssl-dev` (OpenSSL development files, for JWT)
    - `libpistache-dev` (Pistache web framework, or build from source)
    - `libpqxx-dev` (Pqxx PostgreSQL C++ client)
    - `nlohmann/json` (header-only, often just needs `apt install nlohmann-json3-dev` or similar)
    - `spdlog` (logging library, `apt install libspdlog-dev`)
    - `jwt-cpp` (header-only, or via `vcpkg`/`conan`)

    Example for Debian/Ubuntu:
    ```bash
    sudo apt update
    sudo apt install build-essential cmake libpq-dev libssl-dev libpistache-dev libpqxx-dev nlohmann-json3-dev libspdlog-dev git
    ```

2.  **Set up PostgreSQL Database:**
    - Ensure a PostgreSQL server is running locally.
    - Create a database and user matching `backend/.env` (e.g., `cppdboptimizer_db`, `user`, `password`).
    - Apply schema and seed data:
        ```bash
        psql -U user -d cppdboptimizer_db -h localhost -f database/schema.sql
        psql -U user -d cppdboptimizer_db -h localhost -f database/seed.sql
        psql -U user -d cppdboptimizer_db -h localhost -f database/migrations/002_add_indexes.sql
        ```

3.  **Build the Backend:**
    ```bash
    cd backend
    cp .env.example .env # Create .env if you haven't already
    mkdir build && cd build
    cmake ..
    make
    ```

4.  **Run the Backend:**
    ```bash
    ./CppDBOptimizerBackend
    ```
    The server should start on port `9080`.

## Configuration
All application configurations are managed via environment variables. Refer to `backend/.env.example` for available options. When running with Docker Compose, these are loaded from `backend/.env`.

## Database Management
- **Schema**: Defined in `database/schema.sql`.
- **Migrations**: Incremental changes are in `database/migrations/`. For local Docker setup, `schema.sql` and `seed.sql` are automatically applied on first `docker-compose up`. For real production, use a dedicated migration tool (e.g., Flyway, Liquibase, or custom scripts).
- **Seed Data**: Initial data is provided in `database/seed.sql`.

## API Endpoints
Refer to `API_DOCS.md` for a comprehensive list of all available API endpoints, request/response formats, and authentication requirements.

## Frontend Usage
Access the frontend at `http://localhost:80`. The JavaScript (`frontend/js/main.js`) interacts with the C++ backend API (proxied via Nginx at `/api/v1/`). You'll need to register and log in to access protected routes.

## Testing
The project includes various levels of testing.

### Unit Tests
-   **Location**: `backend/tests/`
-   **Framework**: Catch2
-   **Running**:
    ```bash
    cd backend/build
    ctest --verbose # Or ./TestRunner
    ```
    When using Docker Compose:
    ```bash
    docker-compose run backend /app/backend/build/TestRunner
    ```
    (Note: This might require building the backend image again if you changed tests locally)

### API Tests
-   Demonstrated with `curl` in `README.md` and `API_DOCS.md`.
-   Can be automated with tools like Postman/Newman, Pytest with `requests`, etc.

### Performance Tests
-   **Tools**: ApacheBench (`ab`), k6, Locust.
-   **Purpose**: Measure API response times, throughput, and identify bottlenecks.
-   **Example (using `ab` after login and getting token):**
    ```bash
    # Test an authenticated endpoint
    AUTH_TOKEN=$(curl -s -X POST http://localhost:80/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"testuser_api","password":"apitestpassword"}' | jq -r .token)
    ab -n 1000 -c 100 -H "Authorization: Bearer $AUTH_TOKEN" "http://localhost:80/api/v1/products?limit=50&offset=0"
    ```
    - Replace `testuser_api` and `apitestpassword` with valid credentials.
    - Adjust `-n` (number of requests) and `-c` (concurrency) as needed.

## CI/CD
A GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is provided for Continuous Integration and Continuous Deployment:
-   **Build**: Compiles the C++ backend.
-   **Test**: Runs unit tests.
-   **Lint**: (Placeholder, could integrate Clang-Tidy or similar)
-   **Docker Build & Push**: Builds Docker images for backend (and optionally pushes to a registry).
-   **Deployment**: (Placeholder for deploying to a server, e.g., SSH into a VM and run `docker-compose pull && docker-compose up -d`)

## Architecture
For a detailed overview of the system's architecture, including component diagrams, data flow, and design patterns, please refer to `ARCHITECTURE.md`.

## Deployment
For detailed instructions on deploying the application to a production environment (e.g., cloud VMs), refer to `DEPLOYMENT.md`.

## Contributing
Contributions are welcome! Please see `CONTRIBUTING.md` (conceptual) for guidelines.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
```