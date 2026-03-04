```markdown
# OptiDB - Production-Ready Database Optimization System

OptiDB is a comprehensive backend system designed to monitor, analyze, and provide recommendations for optimizing target PostgreSQL databases. Built with C++ for high performance, it offers a robust API for managing target databases, collecting performance metrics, identifying slow queries, and suggesting actionable improvements like index creation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
    - [Prerequisites](#prerequisites)
    - [Local Development (Docker Compose)](#local-development-docker-compose)
    - [Manual Build & Run](#manual-build--run)
- [Configuration](#configuration)
- [Database Migrations](#database-migrations)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Target Database Management (CRUD):** Register, view, update, and delete PostgreSQL databases to be optimized.
- **Secure Connection:** Stores target database credentials encrypted.
- **Connection Testing:** Verify connectivity to target databases.
- **Performance Metric Collection:** Gathers slow query statistics and execution plans from target databases using `pg_stat_statements` and `EXPLAIN ANALYZE`.
- **Recommendation Engine:** Analyzes collected data to suggest optimizations (e.g., missing indexes for slow queries).
- **User Authentication:** Secure access to the OptiDB system via JWT tokens.
- **Robust API:** RESTful API with proper error handling.
- **Logging & Monitoring:** Structured logging for operational insights.
- **Containerized Deployment:** Docker setup for easy deployment and scaling.
- **CI/CD Pipeline:** Automated build, test, and deployment with GitHub Actions.

## Architecture

OptiDB follows a modular, layered architecture:

- **Client (Conceptual Frontend):** A web UI (e.g., React, Vue) or other client applications interact with the OptiDB API. (Not part of this codebase, but APIs are designed for it.)
- **C++ Backend (OptiDB Application):**
    - **Crow Web Framework:** Handles HTTP requests and routing.
    - **Middleware:** Implements cross-cutting concerns like logging, authentication, error handling.
    - **Controllers:** Define API endpoints and orchestrate service calls.
    - **Services:** Contain the core business logic: `AuthService` (user management), `TargetDbService` (target DB CRUD, connection, metric collection), `OptimizationEngine` (analysis and recommendation generation).
    - **Database Layer (`pqxx`):** Manages connections to OptiDB's own PostgreSQL database and dynamically to target databases.
    - **Utilities:** JWT management, logging, JSON handling.
- **OptiDB System Database (PostgreSQL):** Stores OptiDB's internal data: user accounts, target database configurations, collected query metrics, and generated recommendations.
- **Target Databases (PostgreSQL):** The external databases that OptiDB monitors and optimizes.

For a detailed architectural diagram, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech Stack

- **Backend:** C++17
    - **Web Framework:** [Crow](https://github.com/ipkn/crow)
    - **PostgreSQL Client:** [pqxx](https://github.com/jtv/libpqxx)
    - **JSON Library:** [nlohmann/json](https://github.com/nlohmann/json)
    - **JWT Library:** [jwt-cpp](https://github.com/Thalhammer/jwt-cpp)
    - **Password Hashing:** [bcrypt](https://github.com/eladboh/bcrypt) (C++ port)
    - **Encryption:** [Crypto++](https://www.cryptopp.com/) (for target DB passwords)
    - **Logging:** [spdlog](https://github.com/gabime/spdlog)
- **Database:** PostgreSQL (for OptiDB's own data and as target DBs)
- **Build System:** CMake
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Testing:** Google Test

## Setup & Installation

### Prerequisites

- Git
- Docker & Docker Compose (recommended)
- C++ development environment (GCC/Clang, CMake, Make) if building manually
- PostgreSQL client (`psql`) if running migrations manually outside Docker.

### Local Development (Docker Compose)

The easiest way to get started is using Docker Compose, which sets up both the OptiDB application and its PostgreSQL database.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/optidb.git
    cd optidb
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` to `.env` and fill in the `JWT_SECRET` with a strong random string.
    ```bash
    cp .env.example .env
    # Edit .env and set JWT_SECRET, e.g., JWT_SECRET=$(openssl rand -base64 32)
    ```
    **Important:** For production, ensure `JWT_SECRET` and encryption keys are securely managed and not hardcoded.

3.  **Build and run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    -   Build the `optidb_app` Docker image.
    -   Start a `optidb_postgres` container.
    -   Wait for the database to be ready.
    -   Run database migrations for OptiDB's system database.
    -   Start the OptiDB C++ application.

4.  **Verify:**
    ```bash
    docker-compose ps
    ```
    You should see `optidb_postgres` and `optidb_app` running.
    The API should be available at `http://localhost:18080`.

### Manual Build & Run

If you prefer to build and run the C++ application directly:

1.  **Install dependencies:**
    On Ubuntu/Debian:
    ```bash
    sudo apt-get update
    sudo apt-get install -y cmake libpqxx-dev libssl-dev pkg-config git build-essential
    ```
    For Crypto++: It's typically built from source. CMake's FetchContent will handle it.
    For bcrypt (C++ port): Typically header-only or small source, managed by CMake.

2.  **Set up PostgreSQL database:**
    You need a running PostgreSQL instance for OptiDB's internal data.
    ```bash
    # Example: Create user and database
    sudo -u postgres psql -c "CREATE USER optidb_user WITH PASSWORD 'optidb_password';"
    sudo -u postgres psql -c "CREATE DATABASE optidb OWNER optidb_user;"
    ```
    Ensure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in your `.env` (or environment variables) match your PostgreSQL setup.

3.  **Apply database migrations:**
    ```bash
    cd db_migrations
    ./apply_migrations.sh
    cd ..
    ```

4.  **Build the application:**
    ```bash
    mkdir build && cd build
    cmake -DCMAKE_BUILD_TYPE=Release .. # Or Debug for development
    make -j$(nproc)
    ```

5.  **Run the application:**
    Ensure your `.env` file is present in the root directory or environment variables are set.
    ```bash
    cd .. # Back to project root
    ./build/OptiDB
    ```

## Configuration

All configuration is managed through environment variables. A `.env` file in the project root is used by Docker Compose and the `entrypoint.sh` script to load these variables.

See [`./.env.example`](./.env.example) for a list of configurable parameters.

**Critical configurations:**
-   `JWT_SECRET`: Essential for JWT token signing and verification. **Must be a strong, unique secret.**
-   `DB_PASSWORD`: Password for OptiDB's system database.
-   **Target DB Encryption Keys:** In `src/services/target_db_service.cpp`, hardcoded encryption keys are used for demonstration. **These must be replaced with a secure key management solution in production.**

## Database Migrations

Database schema changes for OptiDB's internal database are managed via SQL migration scripts located in the `db_migrations/` directory. These are applied automatically by `entrypoint.sh` when using Docker Compose.

-   `V1_create_initial_schema.sql`: Sets up basic tables (users, target_databases, query_metrics, recommendations).
-   `V2_add_admin_user.sql`: Adds a default 'admin' user for initial access.
-   `V3_add_pg_stat_statements_extension.sql`: **Important! This applies to the *target* PostgreSQL database, not OptiDB's database.** It's a reminder for users to enable `pg_stat_statements` on their target DBs for OptiDB to collect metrics.

## API Endpoints

The OptiDB backend provides a RESTful API. For detailed API documentation, including request/response formats, see [API.md](API.md).

**Key Endpoints:**
-   `POST /auth/register`: Register a new user.
-   `POST /auth/login`: Authenticate a user and get a JWT token.
-   `GET /targets`: Get all registered target databases (requires authentication).
-   `POST /targets`: Register a new target database (requires authentication).
-   `GET /targets/{id}`: Get details of a specific target database.
-   `PUT /targets/{id}`: Update a target database.
-   `DELETE /targets/{id}`: Delete a target database.
-   `GET /targets/{id}/test-connection`: Test connection to a target database.
-   `POST /targets/{id}/analyze`: Trigger a performance analysis on a target database.
-   `GET /targets/{id}/metrics`: Get historical query metrics for a target database.
-   `GET /targets/{id}/recommendations`: Get optimization recommendations for a target database.

## Testing

OptiDB includes a comprehensive test suite:

-   **Unit Tests:** Using Google Test, covering individual components (AuthService, TargetDbService).
-   **Integration Tests:** Using Google Test, starting the full C++ application and making HTTP requests to verify API functionality and database interactions.
-   **API Tests:** Covered by integration tests.
-   **Performance Tests (Conceptual):** Guidance on using tools like Apache JMeter or `ab` is provided, but full performance test scripts are not included due to scope.

To run tests:

1.  **Ensure test database is set up:**
    The CI/CD pipeline sets up a `optidb_test` database. If running locally, you need to ensure this database and user exist, and `db_migrations/apply_migrations.sh` has been run against it.
    ```bash
    sudo -u postgres psql -c "CREATE USER optidb_test_user WITH PASSWORD 'optidb_test_password';"
    sudo -u postgres psql -c "CREATE DATABASE optidb_test OWNER optidb_test_user;"
    ```
    Then run `db_migrations/apply_migrations.sh` with `DB_NAME=optidb_test`, etc.

2.  **Run tests (after building):**
    ```bash
    cd build
    ctest --output-on-failure
    # Or for detailed output:
    ./tests/optidb_tests
    ```

## Deployment

A basic deployment strategy using Docker and Docker Compose is provided. For production deployment, consider:

-   **Orchestration:** Kubernetes, AWS ECS, Docker Swarm for managing containers at scale.
-   **Database Hosting:** Managed PostgreSQL services (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL).
-   **Secrets Management:** Integrate with a robust secrets manager (AWS KMS/Secrets Manager, HashiCorp Vault).
-   **Monitoring & Alerting:** Integrate with Prometheus/Grafana for application and database metrics, and alert on anomalies.
-   **Load Balancing:** Use a load balancer (e.g., Nginx, ALB) in front of multiple application instances.
-   **HTTPS:** Configure SSL/TLS for all API traffic.

For a detailed deployment guide, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```