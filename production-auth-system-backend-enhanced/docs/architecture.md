# Architecture Overview

This document outlines the architecture of the Enterprise-Grade Authentication System, focusing on its components, interactions, and design principles.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    UserClient[User (Web Browser)] -- HTTPS --> CDN[CDN / Load Balancer (Nginx)]
    CDN -- Proxy HTTP/S --> Frontend[Frontend Service (React + Nginx)]
    Frontend -- API Requests --> CDN
    CDN -- Proxy API Requests --> Backend[Backend Service (Node.js/Express)]
    Backend -- Database Queries --> Database[PostgreSQL Database]

    subgraph Authentication Flow
        UserClient -- Login/Register --> Frontend
        Frontend -- /api/v1/auth/login --> Backend
        Backend -- Issues Access JWT & Refresh Token (HttpOnly Cookie) --> Frontend
        Frontend -- Stores Access JWT (LocalStorage) --> UserClient
        UserClient -- Subsequent Protected Requests (Auth Header) --> Frontend
        Frontend -- Includes Access JWT --> Backend
        Backend -- Verifies Access JWT --> Backend
        Backend -- If Access JWT Expired --> Frontend[Frontend (Interceptor)]
        Frontend -- /api/v1/auth/refresh-token (with Refresh Token Cookie) --> Backend
        Backend -- Issues New Access JWT & Refresh Token --> Frontend
    end
```

## 2. Component Breakdown

### 2.1. Client (Frontend) - React Application

*   **Technology:** React, TypeScript, React Router DOM, Axios.
*   **Purpose:** Provides the user interface for registration, login, dashboard, and other protected views.
*   **Key Features:**
    *   **User Interface:** Intuitive forms for authentication.
    *   **Auth Context:** Manages authentication state (user info, tokens) across the application.
    *   **Protected Routes:** Guards routes based on authentication status and user roles.
    *   **API Client (`axios`):** Handles HTTP requests to the backend.
    *   **Interceptor for Token Refresh:** Automatically detects expired access tokens (401 response) and attempts to refresh them using the refresh token stored in an HttpOnly cookie.
    *   **Local Storage:** Stores the JWT access token and basic user information for persistent sessions.

### 2.2. Gateway / Load Balancer (Nginx)

*   **Technology:** Nginx (used in Docker setup).
*   **Purpose:**
    *   Serves the static React frontend files.
    *   Acts as a reverse proxy, routing API requests from the frontend to the backend service.
    *   Can terminate SSL/TLS (not configured in this example, but standard for production).
*   **Benefits:** Decoupling, load balancing (in multi-instance setups), SSL offloading, static file serving optimization.

### 2.3. Server (Backend) - Node.js Application

*   **Technology:** Node.js, Express.js, TypeScript, TypeORM, bcryptjs, JWT.
*   **Purpose:** The core API server that handles all business logic related to authentication and user management.
*   **Layers:**
    *   **`server.ts`:** Entry point, connects to DB, starts Express app.
    *   **`app.ts`:** Express application setup, middleware (security, logging, parsing, rate limiting), and route registration.
    *   **`config/`:** Centralized configuration for database, JWT secrets, etc.
    *   **`entities/`:** TypeORM entity definitions (`User`, `RefreshToken`), representing database tables. Includes password hashing methods directly on the `User` entity.
    *   **`migrations/`:** TypeORM database migration scripts for schema changes.
    *   **`dtos/`:** Data Transfer Objects used with `class-validator` for request payload validation.
    *   **`middleware/`:**
        *   **`errorHandler.ts`:** Catches and formats all errors into consistent API responses.
        *   **`auth.middleware.ts`:** `protect` (authenticates JWT access token) and `authorize` (checks user roles) functions.
        *   **`rateLimit.middleware.ts`:** Applies rate limiting using `express-rate-limit`.
        *   **`validation.middleware.ts`:** Integrates `class-validator` for DTO validation.
    *   **`services/`:** Contains core business logic. `AuthService` handles registration, login, token refresh, logout, password reset. `UserService` handles user CRUD operations.
    *   **`controllers/`:** Handles incoming HTTP requests, orchestrates calls to services, and sends back responses.
    *   **`routes/`:** Defines API endpoints and maps them to controller methods.
    *   **`utils/`:** Helper functions (e.g., `jwt.utils.ts` for token generation/verification, `logger.ts` for logging).
*   **Security:** Implements password hashing, JWT signing/verification, refresh token management (storage, revocation, rotation), CORS, Helmet, HPP.
*   **Observability:** Integrated with Winston for structured logging and Morgan for HTTP request logging.

### 2.4. Database - PostgreSQL

*   **Technology:** PostgreSQL.
*   **Purpose:** Persistent storage for user accounts and refresh tokens.
*   **Key Design:**
    *   `users` table: Stores user credentials (hashed password), email, roles, verification status.
    *   `refresh_tokens` table: Stores refresh tokens, their expiry, and revocation status, linked to users via a foreign key. This allows server-side revocation of refresh tokens.

## 3. Authentication Flow

1.  **Registration/Login:**
    *   User provides email/password to Frontend.
    *   Frontend sends credentials to `/api/v1/auth/register` or `/api/v1/auth/login`.
    *   Backend hashes password (if registering), verifies credentials, and generates an **Access Token** (JWT) and a **Refresh Token** (JWT).
    *   Access Token is returned in the JSON response payload.
    *   Refresh Token is set as an `HttpOnly` cookie.
    *   Frontend stores Access Token in Local Storage and sets the user context.

2.  **Accessing Protected Resources:**
    *   Frontend attaches the Access Token to the `Authorization: Bearer <token>` header for every API request to protected routes.
    *   Backend's `protect` middleware verifies the Access Token.
    *   If valid, the request proceeds; `req.user` is populated with user details from the token payload.
    *   `authorize` middleware further checks user roles if specific permissions are required.

3.  **Token Refresh (when Access Token expires):**
    *   When an Access Token expires, a protected API request will likely return a `401 Unauthorized`.
    *   Frontend's Axios interceptor catches this `401` error.
    *   The interceptor sends a request to `/api/v1/auth/refresh-token`.
    *   The browser automatically includes the `HttpOnly` Refresh Token cookie.
    *   Backend's `refresh-token` endpoint verifies the Refresh Token.
    *   If valid and not revoked/expired:
        *   The old Refresh Token is revoked (marked `isRevoked=true` in DB).
        *   A **NEW** Access Token and a **NEW** Refresh Token are generated (token rotation).
        *   New Access Token is returned in JSON response.
        *   New Refresh Token is set as a new `HttpOnly` cookie.
    *   Frontend updates its stored Access Token, retries the original failed request with the new Access Token, and updates the user context.
    *   If the Refresh Token is invalid, expired, or revoked, the interceptor clears all local authentication state and redirects to the login page.

4.  **Logout:**
    *   Frontend sends a request to `/api/v1/auth/logout`.
    *   The browser includes the `HttpOnly` Refresh Token cookie.
    *   Backend's `logout` endpoint marks the Refresh Token as `isRevoked=true` in the database.
    *   Backend also sends a `Set-Cookie` header to instruct the browser to clear the Refresh Token cookie.
    *   Frontend clears its local Access Token and user state, then redirects to the login page.

## 4. Security Considerations

*   **Password Hashing:** `bcryptjs` is used for strong, salted password hashing.
*   **JWT Security:** JWTs are short-lived (Access Tokens) to minimize the window of opportunity for token compromise.
*   **Refresh Token Security:**
    *   Stored in `HttpOnly` and `Secure` cookies to prevent JavaScript access (XSS) and ensure transmission over HTTPS.
    *   Stored in the database, allowing server-side revocation for compromised tokens or forced logouts.
    *   Implemented with rotation (new token on refresh) to detect and mitigate replay attacks.
*   **CORS:** Explicitly configured to allow requests only from the specified frontend origin.
*   **Helmet:** A collection of 14 middleware functions to set various HTTP headers for security.
*   **HPP (HTTP Parameter Pollution):** Middleware to protect against parameter pollution attacks.
*   **Rate Limiting:** Prevents brute-force attacks on login/registration and protects against DoS.
*   **Input Validation:** `class-validator` enforces schema and type validation on incoming request bodies, preventing malformed data.

## 5. Scalability & Maintainability

*   **Stateless Access Tokens:** Allow multiple backend instances to serve requests without sticky sessions.
*   **Modular Codebase:** Clear separation of concerns (controllers, services, entities, middleware) makes the codebase easy to understand, test, and extend.
*   **TypeScript:** Provides type safety, reducing runtime errors and improving code readability/maintainability.
*   **Containerization (Docker):** Ensures a consistent development, testing, and production environment.
*   **Database Migrations:** Manages schema changes robustly and reproducibly.
*   **Centralized Error Handling & Logging:** Simplifies debugging and monitoring in production.

This architecture provides a solid foundation for a secure, scalable, and maintainable authentication system suitable for enterprise applications.