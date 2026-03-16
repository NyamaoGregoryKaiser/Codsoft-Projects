```markdown
# Project Management API Architecture Documentation

This document outlines the architectural design and key components of the C++ Project Management API.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    A[Client Applications] -->|HTTP/HTTPS| B(Load Balancer / API Gateway)
    B --> C[API Server Cluster (Dockerized C++ App)]
    C -->|Database Calls (SOCI)| D[PostgreSQL Database (Dockerized)]
    C -->|JWT Validation| E[JWT Manager (In-memory)]
    C -->|Logging| F[Centralized Logging (e.g., ELK/Loki)]
    C -->|Caching / Rate Limiting (Optional/Conceptual)| G[Redis Cache]

    subgraph API Server Components
        C1(Pistache HTTP Endpoint)
        C2(Middleware Chain)
        C3(Controllers)
        C4(Services)
        C5(Models)
        C6(Database Manager)
        C7(Utilities: Logger, Config, JWTManager)
    end

    C --- C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C4 --> C6
    C2 --> C7
    C3 --> C7
    C4 --> C7
```

## 2. Component Breakdown

The application follows a layered architectural pattern, promoting separation of concerns and maintainability.

### 2.1. Core Application (C++)

The C++ backend is built upon the following layers:

*   **`main.cpp`**:
    *   Application entry point.
    *   Initializes global components: `Config`, `Logger`, `DatabaseManager`, `JWTManager`.
    *   Instantiates and starts the `App` (Pistache HTTP server).

*   **`src/app/App.cpp`**:
    *   Orchestrates the HTTP server using `Pistache::Http::Endpoint`.
    *   Sets up the `Pistache::Rest::Router`.
    *   Registers global middleware (`ErrorHandler`, `RateLimiter`, `AuthMiddleware`).
    *   Registers all API routes and maps them to respective controller methods.

#### 2.1.1. Core Layer (`src/core/`)

This layer contains fundamental, reusable components that are not specific to the project management domain.

*   **`core/database/DatabaseManager`**:
    *   Manages the global database connection (`soci::session`).
    *   Provides a singleton interface to initialize and retrieve the `soci::session`.
    *   Abstracts direct `soci` initialization details from services.
    *   Supports SQLite (development) and designed for PostgreSQL (production).
    *   Includes `DatabaseException` for specific database-related errors.

*   **`core/models/`**:
    *   **`User`**, **`Project`**, **`Task`**: Plain Old C++ Objects (POCOs) representing the core entities of the application.
    *   Contain data fields corresponding to database columns.
    *   Include methods for serialization to/deserialization from `nlohmann::json` (e.g., `toJson()`, `fromJson()`).
    *   `std::optional` is used for `id` fields to distinguish between new (not-yet-persisted) and existing entities.

*   **`core/utils/`**:
    *   **`Config`**:
        *   Singleton responsible for loading application configuration from JSON files and environment variables.
        *   Provides static methods to retrieve configuration values (strings, ints, bools).
    *   **`JWTManager`**:
        *   Handles creation, signing, and verification of JSON Web Tokens.
        *   Uses `jwt-cpp` library.
        *   Manages the JWT secret key, issuer, and expiry time.
    *   **`Logger`**:
        *   Wrapper around `spdlog` for structured, leveled logging.
        *   Provides static methods for different log levels (`info`, `warn`, `error`, `critical`, etc.).
        *   Configurable output (console, rotating file) via `config/log_config.json`.

#### 2.1.2. Application Layer (`src/app/`)

This layer contains the business logic, API endpoint definitions, and request processing components.

*   **`app/services/`**:
    *   **`AuthService`**, **`ProjectService`**, **`TaskService`**: Implement the core business logic for each domain.
    *   Interact with the `DatabaseManager` to perform CRUD operations on models.
    *   Perform validation, authorization checks (e.g., project ownership), and data transformations.
    *   Abstract direct database access from controllers.
    *   `AuthService` handles password hashing and JWT generation/validation.

*   **`app/controllers/`**:
    *   **`AuthController`**, **`ProjectController`**, **`TaskController`**: Handle incoming HTTP requests.
    *   Parse request bodies, extract parameters (path, query), and call appropriate methods in the `Service` layer.
    *   Format responses in JSON and send them back using `Pistache::Http::ResponseWriter`.
    *   Catch exceptions from services and map them to appropriate HTTP error responses.
    *   Rely on `AuthMiddleware` to extract authenticated `user_id` from the request.

*   **`app/middleware/`**:
    *   **`AuthMiddleware`**:
        *   Intercepts requests to protected routes.
        *   Extracts the JWT from the `Authorization` header.
        *   Verifies the token using `JWTManager`.
        *   If valid, extracts `user_id` and attaches it to the `Pistache::Rest::Request` attributes for downstream controllers.
        *   If invalid, sends a `401 Unauthorized` response.
    *   **`ErrorHandler`**:
        *   A global middleware designed to catch unhandled exceptions (though Pistache's exception handling might be configured to intercept before it reaches here).
        *   Provides a fallback `500 Internal Server Error` response for unexpected issues.
        *   Includes a `notFound` handler for `404 Not Found` routes.
    *   **`RateLimiter`**:
        *   In-memory rate limiting mechanism (per IP address).
        *   Tracks request counts within a time window.
        *   Sends `429 Too Many Requests` if limits are exceeded.
        *   **Note**: For production, this would typically be replaced by a distributed cache like Redis or an API Gateway feature.

### 2.2. Database Layer

*   **Schema Definitions (`database/migrations/`)**:
    *   SQL scripts define table structures (`users`, `projects`, `tasks`) and indexes.
    *   Uses SQLite-compatible syntax with comments for PostgreSQL equivalents.
    *   Foreign key constraints (`ON DELETE CASCADE`) ensure data integrity and automatic cleanup of related records.
*   **Migrations Script (`database/init_db.sh`)**:
    *   Automates the application of schema changes and initial seed data.
    *   Maintains a `schema_migrations` table to track applied migrations, ensuring idempotency.
*   **Query Optimization**:
    *   **Indexing**: Crucial for performance on `WHERE` clause fields (e.g., `email`, `owner_id`, `project_id`).
    *   **Prepared Statements**: `SOCI` naturally uses prepared statements with `soci::use` and `soci::into`, preventing SQL injection and improving efficiency.
    *   **Connection Pooling**: For PostgreSQL, `SOCI` supports connection pooling, which would be managed by `DatabaseManager` to reuse database connections, reducing overhead.

### 2.3. Configuration & Setup

*   **`config/log_config.json`**: JSON file for detailed logging configuration (levels, sinks).
*   **`.env` file**: Stores sensitive credentials (JWT secret, DB connection) and environment-specific settings. Loaded by `Config` and prioritized over `config.json` for security and flexibility.
*   **`CMakeLists.txt`**: Defines the C++ project's build process, dependencies, and test targets.
*   **`Dockerfile.app`**: Builds the C++ application into a lightweight Docker image, installing dependencies and copying the executable. Uses a multi-stage build for smaller image size.
*   **`Dockerfile.db`**: Creates a PostgreSQL Docker image, ready to run the database.
*   **`docker-compose.yml`**: Defines a multi-container application, linking the API service with the database service, managing networks, volumes, and environment variables. Ensures services start in the correct order (`depends_on` and `healthcheck`).

### 2.4. Testing & Quality

*   **Unit Tests (`tests/unit/`)**: Verify individual classes and functions in isolation using Google Test. Aims for high code coverage (80%+).
*   **Integration Tests (`tests/integration/`)**: Test interactions between different components (e.g., service with database, controller with service). `TestAPI.cpp` simulates client-server interaction.
*   **API Tests**: External tests (e.g., `curl` commands, Python `requests` scripts, or tools like `k6`) to validate API endpoints from a client's perspective.
*   **Performance Tests**: Conceptualized with `k6` script example. Focuses on throughput, latency, and error rates under load.

### 2.5. Additional Features

*   **Caching Layer (Conceptual)**: For a production system, a separate caching layer (e.g., Redis) would be integrated. Services would first check the cache for frequently accessed read-heavy data before hitting the database. Cache invalidation strategies (write-through, write-back, invalidate-on-write) would be considered.
*   **Container Orchestration**: For high availability and scalability in production, Docker Compose would be replaced by Kubernetes or similar orchestration platforms.
*   **Observability**: Beyond logging, integrating metrics (e.g., Prometheus) and tracing (e.g., OpenTelemetry with Jaeger) would provide deeper insights into application health and performance.

## 3. Design Principles

*   **Separation of Concerns**: Each component and layer has a distinct responsibility, making the codebase easier to understand, test, and maintain.
*   **Modularity**: Code is organized into logical modules (`core`, `app`, `services`, `controllers`), promoting reusability and reducing coupling.
*   **Loose Coupling**: Components interact through well-defined interfaces (e.g., services don't directly manipulate HTTP responses; controllers don't contain business logic).
*   **Testability**: The design facilitates unit and integration testing by isolating dependencies and using dependency injection (implicit in the service-controller pattern).
*   **Scalability**: Stateless API design (JWT-based authentication) allows for easy horizontal scaling of API instances. Database optimization and caching support future scaling needs.
*   **Security**: JWT for authentication, HTTPS (implied by load balancer/API Gateway), parameterized queries (via SOCI) for SQL injection prevention, basic rate limiting. Password hashing.
*   **Configuration Externalization**: Environment variables and config files keep sensitive data and environment-specific settings out of the codebase.

This architecture provides a solid foundation for building a robust and scalable enterprise-grade C++ API.
```