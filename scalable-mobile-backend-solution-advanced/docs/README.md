```markdown
# Mobile App Backend (C++ with Drogon)

This project provides a comprehensive, production-ready backend system for mobile applications, built using C++ and the high-performance Drogon web framework. It includes a robust API, database management, authentication, caching, logging, and full test suite, designed for enterprise-grade applications.

## Table of Contents

1.  [Features](#1-features)
2.  [Project Structure](#2-project-structure)
3.  [Technologies Used](#3-technologies-used)
4.  [Setup and Local Development](#4-setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Clone the Repository](#clone-the-repository)
    *   [Environment Configuration](#environment-configuration)
    *   [Building the Application (Native)](#building-the-application-native)
    *   [Running the Application (Native)](#running-the-application-native)
    *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
5.  [Database](#5-database)
    *   [Schema](#schema)
    *   [Migrations and Seed Data](#migrations-and-seed-data)
6.  [API Endpoints](#6-api-endpoints)
7.  [Testing](#7-testing)
    *   [Unit Tests](#unit-tests)
    *   [Integration Tests](#integration-tests)
    *   [API Tests (Examples)](#api-tests-examples)
    *   [Performance Testing (Conceptual)](#performance-testing-conceptual)
8.  [Documentation](#8-documentation)
9.  [CI/CD](#9-cicd)
10. [Contributing](#10-contributing)
11. [License](#11-license)

## 1. Features

*   **Core Application (C++ Drogon)**:
    *   RESTful API with full CRUD operations for Users, Products, and Orders.
    *   Modular design with clear separation of concerns (Controllers, Services, Repositories, Models).
    *   Business logic for handling complex operations like order creation, stock management.
*   **Database Layer (PostgreSQL)**:
    *   Detailed schema definitions for `users`, `products`, `orders`, and `order_items`.
    *   Migration scripts (`V1__initial_schema.sql`, `V2__seed_data.sql`).
    *   Query optimization through indexing and efficient data modeling.
*   **Configuration & Setup**:
    *   `CMakeLists.txt` for C++ dependency management and build automation.
    *   Environment variable management via `.env` files.
    *   Docker setup (`Dockerfile`, `docker-compose.yml`) for containerization.
*   **Testing & Quality**:
    *   Unit tests (Google Test) for core logic (e.g., Auth, JWT, Config).
    *   Integration tests (Google Test) for API endpoints interacting with the database.
    *   Examples for API testing using `curl`.
    *   Guidelines for performance testing.
*   **Additional Features**:
    *   **Authentication/Authorization**: JWT-based authentication for secure API access. Role-based authorization (e.g., admin-only endpoints).
    *   **Logging and Monitoring**: Structured logging with `spdlog`.
    *   **Error Handling Middleware**: Consistent JSON error responses across the API.
    *   **Caching Layer**: Redis integration for rate limiting and potential data caching.
    *   **Rate Limiting**: Basic rate limiting to protect API endpoints from abuse.

## 2. Project Structure

```
.
├── CMakeLists.txt              # CMake build configuration for the entire project
├── .env.example                # Example environment variables
├── ci-cd/                      # CI/CD pipeline configurations (e.g., GitHub Actions)
├── config/                     # Application configuration files
│   └── drogon_config.json      # Drogon's native server configuration
├── database/                   # Database-related files
│   ├── migrations/             # SQL migration scripts for schema and seed data
│   └── README.md               # Database specific documentation
├── docker/                     # Dockerization files
│   ├── Dockerfile              # Dockerfile for building the C++ application
│   └── docker-compose.yml      # Orchestration for app, Postgres, Redis
├── docs/                       # Comprehensive documentation
│   ├── API_DOCS.md             # Detailed API endpoint documentation
│   ├── ARCHITECTURE.md         # System architecture overview
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── README.md               # Project overview (this file)
├── src/                        # Core C++ application source code
│   ├── main.cc                 # Application entry point
│   ├── config/                 # Configuration management (e.g., .env reader)
│   ├── controllers/            # Drogon HTTP controllers (API endpoints)
│   ├── database/               # Database connection management
│   ├── filters/                # Drogon filters (middleware like Auth, Rate Limiting)
│   ├── models/                 # Data structures representing database entities
│   ├── repositories/           # Database CRUD operations
│   ├── services/               # Business logic
│   └── utils/                  # Utility functions (Logger, JWT, Password Hashing)
└── tests/                      # Application tests
    ├── CMakeLists.txt          # CMake for tests
    ├── integration/            # Integration tests (DB interaction)
    └── unit/                   # Unit tests (isolated logic)
```

## 3. Technologies Used

*   **C++17**: Core language
*   **Drogon**: High-performance C++ web framework
*   **PostgreSQL**: Relational database
*   **Redis**: In-memory data store for caching and rate limiting
*   **spdlog**: Fast C++ logging library
*   **jwt-cpp**: C++ library for JSON Web Tokens
*   **libbcrypt**: C library for bcrypt password hashing
*   **Docker & Docker Compose**: Containerization and orchestration
*   **CMake**: Build system
*   **Google Test**: C++ testing framework

## 4. Setup and Local Development

### Prerequisites

*   Docker & Docker Compose (recommended for ease of setup)
*   Alternatively, for native build:
    *   C++ Compiler (GCC/Clang supporting C++17)
    *   CMake 3.10+
    *   Drogon (installed globally or via vcpkg)
    *   spdlog, jsoncpp, hiredis, libpq-dev, libssl-dev, uuid-dev, libbcrypt-dev

### Clone the Repository

```bash
git clone https://github.com/your-username/mobile-backend.git
cd mobile-backend
```
*(Replace `your-username` with your actual GitHub username or the repository URL)*

### Environment Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

**Edit the `.env` file and set a strong, unique value for `APP_JWT_SECRET`**. This is critical for security. You can also customize database credentials, Redis passwords, etc.

### Building the Application (Native)

If you prefer to build and run the C++ application directly on your host machine (without Docker Compose):

1.  **Install Drogon and other dependencies**: Follow Drogon's installation guide and ensure `spdlog`, `libpq-dev`, `libhiredis-dev`, `libjsoncpp-dev`, `libssl-dev`, `uuid-dev`, `libbcrypt-dev` are installed. For `jwt-cpp`, it's often header-only or can be vendored.
    ```bash
    # Example for Ubuntu/Debian
    sudo apt update
    sudo apt install -y build-essential cmake git libjsoncpp-dev libpq-dev libhiredis-dev libssl-dev uuid-dev libbcrypt-dev zlib1g-dev
    # Follow Drogon's install instructions (e.g., cloning and building)
    # git clone https://github.com/drogonframework/drogon.git
    # cd drogon && mkdir build && cd build && cmake .. && make && sudo make install
    # Repeat for spdlog
    ```

2.  **Create build directory and configure CMake**:
    ```bash
    mkdir build
    cd build
    cmake ..
    ```

3.  **Build the application**:
    ```bash
    cmake --build .
    ```

### Running the Application (Native)

You'll need a running PostgreSQL database and Redis instance accessible from your host. You can use Docker for these even if running the app natively:

```bash
# In a separate terminal, start Postgres and Redis
docker-compose -f docker/docker-compose.yml up -d postgres redis

# Apply database migrations (see Database section for details)
# Then, run the application from the build directory
cd build
./MobileBackend
```

### Running with Docker Compose (Recommended)

This sets up the entire stack (backend app, PostgreSQL, Redis) with minimal effort.

1.  **From the project root directory**:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```
    *   `--build`: Rebuilds the C++ application image. Omit this if your code hasn't changed.
    *   `-d`: Runs containers in the background.

2.  **Verify services**:
    ```bash
    docker-compose -f docker/docker-compose.yml ps
    ```
    You should see `mobile_backend_app`, `mobile_backend_postgres`, and `mobile_backend_redis` all in `Up` status.

3.  **Check logs**:
    ```bash
    docker-compose -f docker/docker-compose.yml logs -f app
    ```

4.  **Test the API**:
    Access the health check endpoint:
    ```bash
    curl http://localhost:8080/api/v1/
    # Expected: "Mobile Backend is running!"
    ```
    Now you can use the API endpoints as documented in `docs/API_DOCS.md`.

## 5. Database

The database is PostgreSQL, managed via Docker Compose.

### Schema

The schema is defined in `database/migrations/V1__initial_schema.sql`, including tables for `users`, `products`, `orders`, and `order_items`, with appropriate foreign keys and indexes.

### Migrations and Seed Data

`docker-compose.yml` is configured to run `database/migrations/*.sql` scripts automatically when the `postgres` container starts for the first time.
*   `V1__initial_schema.sql`: Creates all necessary tables and indexes.
*   `V2__seed_data.sql`: Populates the database with initial users, products, and orders.
    *   Two seed users: `admin@example.com` and `jane.doe@example.com`.
    *   Both have password: `password123`.

## 6. API Endpoints

A complete list of API endpoints, request/response formats, and authentication requirements can be found in `docs/API_DOCS.md`.

**Example Endpoints:**

*   `POST /api/v1/auth/register` - Register a new user
*   `POST /api/v1/auth/login` - Authenticate and get a JWT
*   `GET /api/v1/users` - Get all users (Admin only, authenticated)
*   `GET /api/v1/products` - Get all products (Public)
*   `POST /api/v1/orders` - Create a new order (Authenticated)

## 7. Testing

The project includes unit, integration, and API tests.

### Unit Tests

Located in `tests/unit/`. These tests verify individual components in isolation (e.g., `ConfigManager`, `JwtManager`, `PasswordHasher`).

To run unit tests (after building):

```bash
cd build
ctest --output-on-failure -L "unit"
```

### Integration Tests

Located in `tests/integration/`. These tests verify the interaction between multiple components, including the database. They require a running PostgreSQL and Redis instance.

To run integration tests (after building and with `docker-compose up -d postgres redis`):

```bash
cd build
ctest --output-on-failure -L "integration"
```

### API Tests (Examples)

You can manually test the API using `curl` or a tool like Postman/Insomnia.

1.  **Register a user**:
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}' http://localhost:8080/api/v1/auth/register
    ```
    *(Note the JWT in the response!)*

2.  **Login a user**:
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"email": "test@example.com", "password": "password123"}' http://localhost:8080/api/v1/auth/login
    ```
    *(Extract the `token` from the response)*

3.  **Access a protected endpoint (e.g., get users)**:
    ```bash
    # Replace <YOUR_JWT_TOKEN> with the actual token from login
    curl -X GET -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://localhost:8080/api/v1/users
    ```

### Performance Testing (Conceptual)

For performance testing, consider tools like:
*   **JMeter**: Open-source load testing tool.
*   **k6**: Modern load testing tool written in Go.
*   **Locust**: Python-based load testing tool.

You would write test scripts to simulate concurrent users making requests to various API endpoints and measure metrics like response time, throughput, and error rates.

## 8. Documentation

*   **`docs/README.md`**: Project overview (this file).
*   **`docs/API_DOCS.md`**: Detailed documentation for all API endpoints, including request/response formats, authentication, and error handling.
*   **`docs/ARCHITECTURE.md`**: Explains the high-level and detailed architecture of the backend system, component interactions, and data flow.
*   **`docs/DEPLOYMENT.md`**: Provides a guide for deploying the application locally with Docker Compose and outlines considerations for production deployment.
*   **`database/README.md`**: Specific documentation for the database layer.

## 9. CI/CD

An example GitHub Actions workflow (`ci-cd/github-actions.yml`) is provided. It demonstrates:
*   Building the C++ application.
*   Running unit tests.
*   Setting up Docker Compose for integration tests (Postgres, Redis).
*   Running integration tests against the live database.
*   Building and pushing Docker images to Docker Hub (on `main` branch).
*   Conceptual deployment steps to a remote server.

## 10. Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write and run tests.
5.  Commit your changes (`git commit -am 'Add new feature'`).
6.  Push to the branch (`git push origin feature/your-feature-name`).
7.  Create a new Pull Request.

## 11. License

This project is open-sourced under the MIT License. See the `LICENSE` file for more details.
```