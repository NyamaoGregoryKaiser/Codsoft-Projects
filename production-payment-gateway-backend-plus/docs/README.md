```markdown
# Zenith Payments: Production-Ready C++ Payment Processing System

[![Build Status](https://github.com/yourusername/zenith-payments/actions/workflows/main.yml/badge.svg)](https://github.com/yourusername/zenith-payments/actions/workflows/main.yml)
[![Docker Image](https://img.shields.io/docker/pulls/yourusername/zenith-payments.svg)](https://hub.docker.com/r/yourusername/zenith-payments)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Zenith Payments is a robust, secure, and scalable payment processing backend built with C++. It provides a RESTful API for managing users, payment methods, and financial transactions, integrating with external payment gateways, and includes essential enterprise features like authentication, logging, caching, and rate limiting.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Running the Application](#running-the-application)
- [Database Management](#database-management)
  - [Schema](#schema)
  - [Migrations](#migrations)
  - [Seed Data](#seed-data)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **User Management**: CRUD operations for user accounts.
- **Payment Method Management**: Securely store and manage tokenized payment methods linked to users.
- **Transaction Processing**: Handle various transaction types (payment, refund, withdrawal, deposit) with status tracking.
- **Payment Gateway Integration**: Abstracted layer for communicating with external payment processors (mocked for this example).
- **Authentication & Authorization**: JWT-based authentication for API access, role-based authorization.
- **Comprehensive Logging**: Structured logging for application events and errors using `spdlog`.
- **Error Handling**: Centralized API error responses.
- **Caching Layer**: In-memory caching (extendable to Redis).
- **Rate Limiting**: Protects API endpoints from abuse.
- **Database Management**: PostgreSQL with `pqxx` for C++ interaction, SQL migrations.
- **Dockerization**: Containerized application for consistent environments.
- **CI/CD**: Automated build, test, and deployment pipelines (GitHub Actions example).

## Architecture

Zenith Payments follows a layered, modular architecture to promote separation of concerns, maintainability, and scalability:

- **API Layer**: Handles HTTP requests, routing, authentication, authorization, and marshaling JSON data. Uses `cpp-httplib`.
- **Service Layer**: Contains the core business logic, orchestrating interactions between repositories and external services.
- **Repository Layer**: Abstracts database access, performing CRUD operations on specific data models. Uses `pqxx`.
- **Database Layer**: PostgreSQL for persistent storage.
- **Utilities**: Common functionalities like logging (`spdlog`), JWT management (`jwt-cpp`), caching, and configuration.
- **Models**: Plain C++ structs representing database entities.

For a detailed overview, refer to [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technologies Used

- **Backend**: C++17/20
  - **Web Framework**: `cpp-httplib`
  - **JSON**: `nlohmann/json`
  - **Database ORM/Client**: `pqxx` (PostgreSQL C++ client)
  - **Logging**: `spdlog`
  - **Authentication**: `jwt-cpp`
  - **Build System**: CMake
- **Database**: PostgreSQL
- **Caching**: Redis (planned/optional, currently in-memory cache)
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Testing**: Catch2, k6 (for performance)

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Git
- Docker and Docker Compose (recommended for local development)
- C++ Compiler (GCC 11+ or Clang 11+)
- CMake 3.10+
- `libpq-dev` (PostgreSQL client library headers)
- `pkg-config` (for `libpqxx`)
- `libcryptopp-dev` (for password hashing example)

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/zenith-payments.git
    cd zenith-payments
    ```

2.  **Copy environment variables:**
    ```bash
    cp .env.example .env
    # Edit .env if you need to change default configurations
    ```

3.  **Build and Run with Docker Compose (Recommended):**
    This will spin up the `db` (PostgreSQL), `redis`, and `app` (Zenith Payments C++ service) containers.

    ```bash
    docker-compose up --build -d
    ```
    Wait for all services to become healthy. You can check their status with `docker-compose ps`.

4.  **Run Database Migrations and Seed Data:**
    The `entrypoint.sh` script in the `app` container will automatically run the migrations and seed data when the container starts for the first time or if the migration script detects new changes.
    You can also manually run the script inside the container for development:
    ```bash
    docker-compose exec app /app/tools/setup_db.sh
    ```

5.  **Access the Application:**
    The API server should be running on `http://localhost:8080`.
    You can test it with a simple health check:
    ```bash
    curl http://localhost:8080/health
    # Expected output: {"status": "UP"}
    ```

### Building and Running Natively (Alternative)

1.  **Install dependencies:**
    ```bash
    # On Debian/Ubuntu
    sudo apt update
    sudo apt install build-essential cmake libpq-dev libcryptopp-dev pkg-config
    ```

2.  **Build the project:**
    ```bash
    mkdir build && cd build
    cmake .. -DCMAKE_BUILD_TYPE=Release # Or Debug
    cmake --build . -j$(nproc)
    ```

3.  **Run the executable:**
    Ensure your PostgreSQL and Redis instances are running and accessible. Update `.env` with correct `localhost` settings if not using Docker Compose.
    ```bash
    cd .. # Go back to project root
    ./build/zenith-payments
    ```

## Database Management

### Schema
The complete database schema is defined in [`database/schema.sql`](database/schema.sql). It includes tables for `users`, `payment_methods`, `transactions`, and `audit_logs`.

### Migrations
Database schema changes are managed through SQL migration scripts located in [`database/migrations/`](database/migrations/). The `tools/setup_db.sh` script applies these migrations incrementally, tracking applied migrations in a `schema_migrations` table.

### Seed Data
Initial data for development and testing environments is provided in [`database/seed_data.sql`](database/seed_data.sql). This includes example users, payment methods, and transactions.

## API Documentation

The RESTful API endpoints are documented in [API.md](docs/API.md). This includes request/response formats, authentication requirements, and example usage.

## Testing

The project emphasizes quality through various testing types:
- **Unit Tests**: Using Catch2, located in `tests/unit/`. Aim for 80%+ code coverage.
- **Integration Tests**: Using Catch2, located in `tests/integration/`, testing component interactions (e.g., Service-Repository-DB).
- **API Tests**: Integrated within `tests/integration/` using `httplib::Client` to test full API flows.
- **Performance Tests**: Using k6, scripts located in `tests/performance/`.

To run tests:
```bash
# After building (either natively or inside docker-compose exec app)
./build/tests
```

## Configuration

Environment variables are used for configuration. Refer to the `.env.example` file for available options. These are loaded by the `AppConfig` singleton.

## Deployment

A detailed deployment guide for a production environment (e.g., using Kubernetes, or a VM with Docker Compose) can be found in [DEPLOYMENT.md](docs/DEPLOYMENT.md). The `ci/github_actions.yml` provides an example of a CI/CD pipeline for building and deploying.

## Contributing

Contributions are welcome! Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please open an issue in the GitHub repository or contact [your-email@example.com](mailto:your-email@example.com).
```