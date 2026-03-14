# Architecture Documentation - Enterprise-Grade Authentication System

This document details the architectural design of the Authentication System, covering its components, interactions, and design principles.

## 1. High-Level Architecture

The system employs a multi-tier, decoupled architecture suitable for modern web applications. It consists of three primary services orchestrated via Docker Compose:

1.  **Frontend (React/Next.js)**: The client-side application providing the user interface.
2.  **Backend (C++ Pistache)**: The core application logic and API server.
3.  **Database (PostgreSQL)**: The persistent data store.

```mermaid
graph TD
    UserBrowser[User Browser (Frontend)] -->|HTTP/S| CDN & WAF
    CDN & WAF -->|HTTP/S API Requests| LoadBalancer[Load Balancer]
    LoadBalancer -->|HTTP/S API Requests| BackendService[C++ Backend (Pistache)]
    BackendService -->|SQL Protocol| Database[PostgreSQL Database]

    subgraph Authentication Flow
        UserBrowser -- Login/Register --> BackendService
        BackendService -- Generates JWTs --> UserBrowser
        UserBrowser -- Subsequent API Calls (with JWT) --> BackendService
    end

    subgraph Monitoring & Logging
        BackendService -- Logs --> CentralizedLogging[ELK Stack/Loki]
        BackendService -- Metrics --> MetricsServer[Prometheus/Grafana]
        Database -- Logs & Metrics --> CentralizedLogging & MetricsServer
    end
```

## 2. Frontend (React/Next.js)

*   **Technology Stack**: React.js with Next.js framework.
*   **Purpose**: Provides a rich, interactive user interface for:
    *   User Registration
    *   User Login
    *   Token Refresh
    *   User Profile viewing and updating
    *   Admin interfaces (conceptual)
*   **Communication**: Interacts with the C++ backend purely via RESTful API calls using standard HTTP methods.
*   **Authentication State Management**: Manages JWT tokens (access and refresh) in browser storage (e.g., `localStorage` or `sessionStorage` with appropriate security considerations, though typically `HttpOnly` cookies are preferred for security in production deployments, which would require backend support for cookie setting). Uses `swr` for data fetching and caching.
*   **Deployment**: Served as static assets with server-side rendering (SSR) or static site generation (SSG) capabilities provided by Next.js, often behind a web server like Nginx or a CDN.

## 3. Backend (C++ Pistache)

The C++ backend is the core of the authentication system, handling all business logic, data interactions, and security mechanisms.

*   **Technology Stack**: C++17, Pistache (HTTP server), pqxx (PostgreSQL client), jwt-cpp (JWT library), cpp-bcrypt (password hashing), spdlog (logging), nlohmann/json (JSON parsing).
*   **Design Principles**:
    *   **Modularity**: Code is organized into distinct modules (config, database, utils, middleware, handlers) to promote separation of concerns and maintainability.
    *   **Statelessness**: Employs JWTs, making the application stateless and easier to scale horizontally.
    *   **Security-First**: Focus on secure password hashing, JWT validation, and role-based access control.
    *   **Observability**: Integrated logging and error handling.
*   **Key Components**:

    *   **`main.cpp`**: Entry point, initializes configurations, database connection, logger, and mounts API handlers to the Pistache router.
    *   **`config/`**:
        *   `Config.h`/`Config.cpp`: Manages environment-specific configurations (database credentials, JWT secrets, server ports, rate limits). Loads settings from `.env` files.
    *   **`database/`**:
        *   `DBManager.h`/`DBManager.cpp`: Singleton class managing the PostgreSQL connection (using `pqxx`). Provides an abstraction layer for CRUD operations on user data using prepared statements to prevent SQL injection.
    *   **`models/`**:
        *   `User.h`/`User.cpp`: Represents the `User` entity, including properties like ID, username, password hash, and `UserRole`. Includes serialization to JSON for API responses.
    *   **`utils/`**:
        *   `PasswordHasher.h`/`PasswordHasher.cpp`: Encapsulates password hashing and verification using `bcrypt`.
        *   `JWTManager.h`/`JWTManager.cpp`: Handles the creation, decoding, and validation of JSON Web Tokens. Differentiates between access and refresh tokens.
    *   **`middleware/`**:
        *   `ErrorMiddleware.h`: A global exception handler that catches various exceptions (e.g., `AuthException`, JSON parsing errors) and converts them into standardized JSON error responses with appropriate HTTP status codes.
        *   `AuthMiddleware.h`: Intercepts incoming requests to validate JWTs. Extracts user information (ID, username, role) from valid access tokens and makes it available to subsequent handlers via a `thread_local` context. Throws `AuthException` for unauthorized access.
        *   `RateLimitMiddleware.h`: Implements a basic in-memory, IP-based rate limiting mechanism. Prevents a single IP from making too many requests within a defined time window, mitigating brute-force attacks.
    *   **`handlers/`**:
        *   `AuthHandler.h`/`AuthHandler.cpp`: Implements API endpoints for user registration (`/api/auth/register`), login (`/api/auth/login`), and token refresh (`/api/auth/refresh`).
        *   `UserHandler.h`/`UserHandler.cpp`: Implements user profile management (`/api/users/profile`) and admin-specific user CRUD operations (`/api/admin/users/:id`). These handlers leverage `AuthMiddleware` and `AuthorizeMiddleware` (within AuthMiddleware) for access control.
    *   **`exceptions/`**:
        *   `AuthException.h`: Custom exception class for authentication and authorization-related errors, allowing granular error handling and specific HTTP status code mapping.
    *   **`logger/`**:
        *   `Logger.h`/`Logger.cpp`: Wraps `spdlog` for consistent and configurable logging across the application.

## 4. Database (PostgreSQL)

*   **Technology Stack**: PostgreSQL 15-alpine.
*   **Schema**:
    *   `users` table: Stores `id`, `username` (unique), `password_hash`, `role` (USER/ADMIN), `created_at`, `updated_at`.
*   **Migrations**: SQL scripts are used for schema definition and initial data seeding. These are designed to be idempotent and are run automatically by Docker Compose on the first startup of the `db` service.
*   **Query Optimization**: The `DBManager` uses `pqxx` with prepared statements, which helps prevent SQL injection and improves performance for frequently executed queries by pre-compiling the query plan. Indices are applied to frequently searched columns (e.g., `username`).

## 5. Data Flow (Example: User Login)

1.  **Frontend**: User enters credentials on the login page and clicks submit. An AJAX (fetch/axios) request is sent to the backend.
2.  **Request to Backend**: `POST /api/auth/login` containing `username` and `password` in JSON body.
3.  **Rate Limiting Middleware**: The `RateLimitMiddleware` intercepts the request, checks the client's IP, and determines if it exceeds the configured request limit. If so, it short-circuits the request with a 429 Too Many Requests error.
4.  **Auth Handler**: The request reaches the `AuthHandler::loginUser` method.
    *   Parses the request body for `username` and `password`.
    *   Calls `DBManager::findUserByUsername` to retrieve user data from PostgreSQL.
    *   Uses `PasswordHasher::verifyPassword` to compare the provided password with the stored hash. If mismatch, throws `AuthException::InvalidCredentials`.
    *   If credentials are valid, `JWTManager` generates a short-lived `accessToken` and a longer-lived `refreshToken`.
5.  **Response from Backend**: A `200 OK` response is sent back to the frontend, containing the user details, `accessToken`, and `refreshToken`.
6.  **Frontend**: Stores the tokens (e.g., in `localStorage`) and redirects the user to a protected route (e.g., `/profile`).
7.  **Subsequent Authenticated Request (e.g., Get Profile)**:
    *   Frontend attaches the `accessToken` to the `Authorization: Bearer <token>` header of the `GET /api/users/profile` request.
    *   **Auth Middleware**: Intercepts the request.
        *   Extracts the token from the header.
        *   Uses `JWTManager::decodeToken` to validate the token's signature and expiration using the `JWT_SECRET`.
        *   If valid, it extracts `userId`, `username`, and `role` from the token and stores them in `thread_local Middleware::currentRequestUser`. If invalid or expired, throws `AuthException::InvalidToken` or `AuthException::Unauthorized`.
    *   **User Handler**: The request reaches `UserHandler::getUserProfile`. It retrieves the authenticated user's ID from `Middleware::currentRequestUser` and fetches the full user profile from the database.
    *   **Response**: Sends back the user's profile data.

## 6. Scalability Considerations

*   **Stateless Backend**: The use of JWTs makes the backend stateless. Any instance of the C++ backend can handle any request, facilitating easy horizontal scaling (running multiple instances behind a load balancer).
*   **Dockerization**: Each service is containerized, enabling consistent deployment across different environments and simplifying orchestration.
*   **Database**: PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding for extreme loads) independent of the application.
*   **Rate Limiting**: The current in-memory rate limiter is per-instance. For a horizontally scaled backend, a distributed rate limiter (e.g., using Redis) would be necessary to ensure consistent limits across all instances.
*   **Caching**: While basic for rate limiting, integrating a robust distributed cache (like Redis) for frequently accessed data or session management would further reduce database load and improve response times.

## 7. Security Considerations

*   **Password Hashing**: `bcrypt` with a strong work factor is used to securely hash passwords, protecting against rainbow table attacks and making brute-force attacks computationally expensive.
*   **JWT Security**:
    *   HS256 algorithm with strong, unique secrets for access and refresh tokens.
    *   Short-lived access tokens to minimize the window of opportunity for token compromise.
    *   Longer-lived refresh tokens, typically used only to obtain new access tokens. In a more advanced system, refresh tokens might be stored in the DB and invalidated on logout.
*   **Input Validation**: All API endpoints perform input validation to prevent common attacks like SQL injection (further mitigated by prepared statements) and cross-site scripting (XSS, though primarily a frontend concern, backend should sanitize inputs).
*   **Role-Based Access Control**: `AuthMiddleware` enforces authorization rules, ensuring users can only access resources permitted by their assigned roles.
*   **Rate Limiting**: Basic protection against brute-force login attempts and denial-of-service (DoS) attacks.
*   **HTTPS (Not shown in code, but critical for deployment)**: All communication between frontend, backend, and external clients should be encrypted using HTTPS/SSL. This is typically handled by a reverse proxy (e.g., Nginx) or load balancer in production.
*   **Environment Variables**: Sensitive information (database credentials, JWT secrets) are loaded from environment variables and not hardcoded.
```

### `API.md`
```markdown