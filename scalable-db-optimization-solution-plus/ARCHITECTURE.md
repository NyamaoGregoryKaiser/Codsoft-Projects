```markdown
# OptiDB - Architecture Documentation

This document provides an overview of the architecture, key components, and data flow within the OptiDB Database Optimization System.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    A[User/Frontend UI] -- HTTP/REST --> B(OptiDB C++ Backend)

    subgraph OptiDB C++ Backend
        B -- Handles Requests --> C{Middleware Stack}
        C -- Routes to --> D[Controllers]
        D -- Orchestrates --> E[Services]
        E -- Interacts with --> F[DB Layer (pqxx)]
        F -- System DB (CRUD, Metrics, Recom.) --> G(OptiDB PostgreSQL)
        F -- Target DB (Connect, Collect) --> H(Target PostgreSQL DBs)
    end

    subgraph Monitoring & External Services (Conceptual)
        B -- Emits Logs/Metrics --> I[Logging System (e.g., ELK Stack)]
        B -- Emits Metrics --> J[Monitoring System (e.g., Prometheus/Grafana)]
        E -- Optionally uses --> K[Caching (e.g., Redis)]
        E -- For advanced crypto --> L[KMS (e.g., AWS KMS)]
    end

    H -- Requires Extension --> M[pg_stat_statements]
```

## 2. Core Components

### 2.1. OptiDB C++ Backend

The heart of the system, responsible for handling all API requests, business logic, and interactions with databases.

-   **Crow Web Framework:** A lightweight, fast C++ web microframework. It's used for defining API routes, handling HTTP requests, and managing the request-response lifecycle.
-   **Middleware Stack:**
    -   **`LoggingMiddleware`:** Logs incoming requests and outgoing responses, including method, URL, IP, status code, and duration.
    -   **`AuthMiddleware`:** Intercepts requests, validates JWT tokens, and injects the authenticated user's ID into the request context. Protects sensitive routes.
    -   **`ErrorMiddleware`:** Catches unhandled exceptions or processes HTTP error codes, returning standardized JSON error responses.
    -   **(Conceptual) Rate Limiting Middleware:** Limits the number of requests a client can make within a time window to prevent abuse.
    -   **(Conceptual) Caching Middleware:** Intercepts requests for frequently accessed data and serves from cache if available.
-   **Controllers:** (e.g., `AuthController`, `TargetDbController`)
    -   Act as the entry points for specific API routes.
    -   Parse request bodies, validate inputs, and delegate tasks to corresponding services.
    -   Format service responses into JSON for HTTP output.
-   **Services:** Implement the core business logic.
    -   **`AuthService`:** Handles user registration, login, password hashing (using bcrypt), and JWT token generation/validation. Interacts with the `users` table in OptiDB's system database.
    -   **`TargetDbService`:** Manages CRUD operations for `target_databases`. Responsible for encrypting/decrypting target DB passwords, testing connections to target databases, collecting `pg_stat_statements` metrics, fetching `EXPLAIN ANALYZE` plans, and storing these metrics in OptiDB's system database.
    -   **`OptimizationEngine`:** The analytical core. It uses data from `TargetDbService` (slow queries, query plans) to identify performance bottlenecks and generate `Recommendation` objects (e.g., index suggestions) which are then stored.
-   **Database Layer (`pqxx`):**
    -   **`PostgresConnection`:** Manages a connection pool for OptiDB's *own* PostgreSQL database. Provides methods to acquire and release `pqxx::connection` objects.
    -   It also offers a static method to create transient, one-off connections to *target* PostgreSQL databases for data collection and analysis, ensuring isolation and preventing pool exhaustion for external connections.
    -   Uses parameterized queries to prevent SQL injection and enable query plan caching.
-   **Models:** (e.g., `User`, `TargetDB`, `QueryMetric`, `Recommendation`)
    -   Plain Old C++ Objects (POCOs) representing the data structures.
    -   Include `to_json()` methods for easy serialization to JSON.
-   **Utilities:**
    -   **`JWTManager`:** Encapsulates JWT token creation and validation logic.
    -   **`Logger` (`spdlog`):** Provides structured, multi-level logging to console and file.
    -   **`JsonUtil`:** Helper functions for JSON manipulation.
    -   **`Exceptions`:** Custom exception hierarchy for structured error handling.

### 2.2. OptiDB PostgreSQL (System Database)

This is the dedicated database for the OptiDB application itself.

-   **Tables:**
    -   `users`: Stores OptiDB user accounts (username, email, hashed password, timestamps).
    -   `target_databases`: Stores configurations for each external PostgreSQL database being monitored (host, port, DB name, user, *encrypted* password, status, last error, timestamps).
    -   `query_metrics`: Stores historical performance data collected from target databases (query text, total/mean time, calls, rows, execution plan, timestamps).
    -   `recommendations`: Stores generated optimization suggestions (type, description, SQL suggestion, rationale, impact score, applied status, timestamps).
-   **Schema Design:** Normalized, with appropriate primary keys, foreign keys, and indexes for efficient data retrieval.
-   **Migrations:** SQL scripts manage schema evolution (see `db_migrations/`).

### 2.3. Target PostgreSQL Databases

These are the external PostgreSQL instances that OptiDB connects to, analyzes, and provides recommendations for.

-   **`pg_stat_statements`:** A crucial PostgreSQL extension required on target databases for OptiDB to collect detailed query performance statistics (total execution time, call count, mean time, etc.).
-   **`EXPLAIN ANALYZE`:** OptiDB issues `EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON)` commands to get detailed execution plans for specific slow queries.

## 3. Data Flow

1.  **User Authentication:**
    -   User sends `POST /auth/register` or `POST /auth/login`.
    -   `AuthController` calls `AuthService`.
    -   `AuthService` queries/updates `users` table in OptiDB DB, hashes passwords (bcrypt), and generates a JWT via `JWTManager`.
    -   JWT is returned to the user.

2.  **Target Database Registration:**
    -   Authenticated user sends `POST /targets` with target DB credentials.
    -   `TargetDbController` calls `TargetDbService`.
    -   `TargetDbService` encrypts the password (Crypto++), attempts an initial connection test to the *target DB*, and stores the encrypted config in `target_databases` table in OptiDB DB.

3.  **Performance Analysis & Recommendation Generation:**
    -   Authenticated user sends `POST /targets/{id}/analyze`.
    -   `TargetDbController` retrieves the target DB config from OptiDB DB via `TargetDbService`.
    -   `TargetDbController` calls `OptimizationEngine`.
    -   `OptimizationEngine` decrypts the target DB password (Crypto++), then uses `TargetDbService` to establish a transient connection to the *target DB*.
    -   `TargetDbService` queries `pg_stat_statements` on the target DB to fetch slow queries.
    -   For each slow query, `TargetDbService` executes `EXPLAIN ANALYZE` on the target DB to get its execution plan.
    -   Collected metrics and query plans are stored in the `query_metrics` table in OptiDB DB.
    -   `OptimizationEngine` analyzes the metrics and plans (e.g., identifies queries using `WHERE` clauses on unindexed columns, suggesting `CREATE INDEX`).
    -   Generated `Recommendation` objects are stored in the `recommendations` table in OptiDB DB.

4.  **Retrieving Data:**
    -   Authenticated user sends `GET /targets`, `GET /targets/{id}/metrics`, or `GET /targets/{id}/recommendations`.
    -   Controllers call respective services (`TargetDbService`, `OptimizationEngine`).
    -   Services query OptiDB's internal PostgreSQL database to retrieve and return the requested data.

## 4. Security Considerations

-   **JWT:** Used for stateless authentication.
-   **Password Hashing:** `bcrypt` is used for user passwords.
-   **Target DB Password Encryption:** Passwords for target databases are stored encrypted in OptiDB's system DB. **The current example uses hardcoded keys for demonstration; in production, a robust Key Management System (KMS) is critical.**
-   **Parameterized Queries:** All database interactions from C++ use `pqxx`'s parameterized queries to prevent SQL injection.
-   **Authorization:** Middleware ensures users can only access/manage target databases they own.
-   **Logging:** Sensitive information (like raw passwords) is not logged.

## 5. Scalability & Resilience

-   **Stateless Backend:** The C++ backend is largely stateless (excluding in-memory caches), allowing for easy horizontal scaling by running multiple instances behind a load balancer.
-   **Database Connection Pooling:** `PostgresConnection` uses a connection pool for OptiDB's system database to manage resources efficiently.
-   **Separate Concerns:** Clear separation of concerns (services, controllers) aids maintainability and independent scaling of logic.
-   **Background Processing (Future Work):** The `POST /targets/{id}/analyze` endpoint is synchronous in this example. For very large databases or frequent analyses, this would be offloaded to a background job queue (e.g., using Redis/RabbitMQ) to avoid blocking the API.

## 6. Future Enhancements

-   **Frontend UI:** A dedicated web interface (e.g., React, Vue) to consume the API.
-   **Advanced Recommendation Engine:** More sophisticated analysis (e.g., machine learning for anomaly detection, detailed schema analysis, PostgreSQL configuration tuning advice).
-   **Scheduled Analysis:** Automate periodic analysis of target databases.
-   **Alerting:** Integrate with alert systems (e.g., PagerDuty, Slack) for critical performance issues.
-   **Multi-tenancy:** Further isolation and management for multiple organizations.
-   **Support for Other Databases:** Extend to MySQL, SQL Server, etc.
```