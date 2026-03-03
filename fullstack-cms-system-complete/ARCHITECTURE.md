```markdown
# ApexContent Architecture Overview

ApexContent is a C++ backend designed for a modern CMS. It follows a layered architecture with clear separation of concerns, built upon the Drogon web framework.

## 1. High-Level Diagram

```
+-------------------+      +-----------------+      +-----------------+
|   Client (SPA)    |      |   Reverse Proxy   |      |   External Services   |
| (React/Vue/Angular) |      |   (Nginx/Caddy) |      |  (CDN, Object Storage)  |
+---------+---------+      +--------+--------+      +---------+---------+
          | AJAX/HTTP              | HTTP                 ^ HTTP
          |                        |                      |
          v                        v                      |
+---------+------------------------+----------------------+--------------------+
|                                  ApexContent Application (Drogon C++)       |
| +--------------------------------------------------------------------------+ |
| |                         HTTP Server (Drogon)                             | |
| |                                                                          | |
| | +----------------------------------------------------------------------+ | |
| | |                          Filters (Middleware)                        | | |
| | |  +-------------+   +--------------+   +-------------------+         | | |
| | |  | Rate Limiting |-->| Authentication |-->| Error Handling    |----->| | |
| | |  +-------------+   +--------------+   +-------------------+         | | |
| | +---------^----------------^----------------^------------------------+ | |
| |           |                |                |                          | | |
| |           |                |                |                          | | |
| | +---------v----------------v----------------v------------------------+ | |
| | |                              Controllers                             | | |
| | |   (Auth, User, ContentType, ContentItem, MediaAsset)                 | | |
| | +---------^----------------------------------------------------------+ | |
| |           | API Logic, Request/Response Handling                     | | |
| | +---------v----------------------------------------------------------+ | |
| | |                              Services                                | | |
| | |   (AuthService, UserService, ContentService, MediaService)           | | |
| | +---------^----------------------------------------------------------+ | |
| |           | Business Logic, Data Validation, Transaction Management    | | |
| | +---------v----------------------------------------------------------+ | |
| | |                              Models (ORM)                             | | |
| | |   (User, Role, ContentType, ContentItem, MediaAsset)                 | | |
| | +---------^----------------------------------------------------------+ | |
| |           | Data Access Layer (Drogon ORM / DbClient)                  | | |
| | +---------v----------------------------------------------------------+ | |
| | |                        Utilities & Common Libs                       | | |
| | |       (JwtManager, PasswordHasher, Logger)                           | | |
| | +---------^----------------------------------------------------------+ | |
| +-----------|----------------------------------------------------------+ |
|             | SQL Queries                                                |
+-------------+------------------------------------------------------------+
              |
              v
+-------------------+
|  PostgreSQL Database  |
+-------------------+
```

## 2. Key Components and Responsibilities

### a) HTTP Server (Drogon)
*   **Core Framework:** Drogon handles HTTP request/response cycles, routing, and asynchronous I/O.
*   **Configuration:** `config/config.json` drives server settings, database connections, and custom application parameters (e.g., JWT secrets, rate limits).

### b) Filters (Middleware - `src/filters/`)
Filters are executed before a request reaches its controller handler. They perform cross-cutting concerns.
*   **`AuthFilter`**:
    *   Validates JWT access tokens sent in the `Authorization: Bearer <token>` header.
    *   If valid, extracts user ID, username, and roles from the token and injects them into the request context for subsequent controller use.
    *   Returns `401 Unauthorized` or `403 Forbidden` if authentication fails or token is missing/invalid.
*   **`RateLimitFilter`**:
    *   Monitors incoming requests based on client IP address.
    *   Limits the number of requests within a defined time window.
    *   Returns `429 Too Many Requests` if the limit is exceeded.
*   **Error Handling:** Drogon's framework catches exceptions and provides a default error page. Custom global error handling can be implemented by setting custom error handlers.

### c) Controllers (`src/controllers/`)
These are the entry points for specific API routes.
*   **Mapping:** Map HTTP verbs (GET, POST, PUT, DELETE) and paths to C++ methods.
*   **Request Parsing:** Parse request bodies (JSON), query parameters, and path variables.
*   **Delegation:** Delegate complex business logic to `Services`.
*   **Response Generation:** Construct and send appropriate HTTP responses (JSON, status codes).

### d) Services (`src/services/`)
Encapsulate the core business logic.
*   **Orchestration:** Coordinate interactions between `Models` (database operations).
*   **Validation:** Perform data validation beyond basic schema checks.
*   **Transaction Management:** Ensure atomicity for multi-step database operations.
*   **Security Logic:** Implement specific authorization rules based on user roles and data ownership.

### e) Models (ORM - `src/models/`)
Represent the data structures (tables) in the database.
*   **Drogon ORM:** Utilizes Drogon's Object-Relational Mapping (ORM) capabilities to interact with the PostgreSQL database.
*   **Data Representation:** `User`, `Role`, `ContentType`, `ContentItem`, `MediaAsset` are examples.
*   **Custom Logic:** Extend Drogon-generated base models with custom methods (e.g., `User::getRoles()`).

### f) Utilities (`src/utils/`)
Reusable helper components.
*   **`JwtManager`**: Handles generation, signing, and verification of JSON Web Tokens.
*   **`PasswordHasher`**: Manages secure password hashing and verification (using SHA256 in this demo, *but Argon2/bcrypt is recommended for production*).
*   **`Logger`**: A wrapper around Drogon's logging mechanism for consistent logging throughout the application.

### g) Database Layer (`database/`)
*   **PostgreSQL:** Chosen for its robustness, reliability, and advanced features.
*   **Migrations (`database/migrations/`):** Sequential SQL scripts to manage schema changes over time.
*   **Seed Data (`database/seed/`):** SQL scripts for populating initial data (e.g., default roles, admin user).
*   **`init_db.sh`:** A script to apply migrations and seed data, typically run during container startup in development/CI.

## 3. Data Flow Example: User Login

1.  **Client Request:** A user sends a `POST /api/v1/auth/login` request with `username` and `password`.
2.  **RateLimitFilter:** Checks if the client IP has exceeded the allowed request rate. If so, `429 Too Many Requests` is returned.
3.  **AuthController (`login` method):**
    *   Parses the JSON request body.
    *   Calls `AuthService::login(username, password)`.
4.  **AuthService (`login` method):**
    *   Uses `drogon::orm::Mapper<User>` to query the `users` table for the given `username`.
    *   If the user is found, it calls `PasswordHasher::verifyPassword()` to check the provided password against the stored hash and salt.
    *   If credentials are valid, it fetches the user's roles from the database (`User::getRoles`).
    *   Calls `JwtManager::generateTokens()` to create a new access token and refresh token with embedded user ID, username, and roles.
    *   Returns the tokens to the `AuthController`.
5.  **AuthController:**
    *   Constructs a `200 OK` JSON response containing the access and refresh tokens.
    *   Sends the response back to the client.

## 4. Scalability and Performance Considerations

*   **C++ & Drogon:** Provides excellent performance due to C++'s native speed and Drogon's asynchronous, non-blocking I/O model.
*   **Database Pooling:** Drogon's `DbClient` uses a connection pool for efficient database interactions.
*   **Stateless API:** JWTs enable a stateless API, allowing horizontal scaling of the application servers.
*   **Caching:** A caching layer (e.g., Redis, or simple in-memory cache as demonstrated) can be integrated in `Services` to reduce database load for frequently accessed data.
*   **Rate Limiting:** Protects against abuse and ensures fair resource distribution.
*   **Asynchronous Operations:** Drogon's use of `std::future` and promises for database operations and other I/O allows the server to handle many concurrent requests efficiently without blocking threads.

## 5. Security Aspects

*   **JWT Authentication:** Industry-standard for stateless authentication.
*   **Password Hashing:** Passwords stored as one-way hashes with unique salts.
*   **Role-Based Access Control (RBAC):** Fine-grained control over resource access based on user roles.
*   **Input Validation:** JSON schema validation for content types, and explicit validation in controllers/services.
*   **Rate Limiting:** Mitigates brute-force attacks and denial-of-service attempts.
*   **HTTPS:** Deployment behind a reverse proxy (e.g., Nginx) is essential to enforce HTTPS for all traffic.
*   **Environment Variables:** Sensitive information (database credentials, JWT secret) is loaded from environment variables, not hardcoded.
```