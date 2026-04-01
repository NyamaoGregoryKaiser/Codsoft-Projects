# Horizon PMS: System Architecture

This document outlines the architectural design of the Horizon PMS, detailing its components, layers, and how they interact.

## 1. High-Level Overview

The Horizon PMS follows a **monorepo structure** containing both frontend and backend applications. It's built as a **client-server application** where the frontend consumes a RESTful API provided by the backend. The entire system is designed for **containerization** using Docker.

```
+--------------------------------------------------------------------------------+
|                                     Cloud / Server                             |
|                                                                                |
|  +-------------------------------------+    +--------------------------------+ |
|  |             Frontend (React)        |    |      Backend (Node.js/TS)      | |
|  | (Served by Nginx in Production)     |    | (Express.js, TypeORM, Winston) | |
|  |                                     |    |                                | |
|  |  +------------+   +-------------+  |    | +------------+  +-------------+| |
|  |  | Components |<->| React Pages |  |    | | Controllers|<->| Services    || |
|  |  |            |   |             |  |    | | (API Logic)|  | (Bus. Logic)|| |
|  |  +------------+   +-------------+  |    | +------------+  +-------------+| |
|  |        ^ ^                          |    |      ^ ^          ^ ^        | |
|  |        | |                          |    |      | |          | |        | |
|  |        | |                          |    | +----+----+    +----+-----+  | |
|  |        +----------------------------+    | | Middleware|  | Utils/Auth|  | |
|  |             HTTP/HTTPS (Axios)           | +-----------+  +-----------+  | |
|  |                                     |    |       ^ ^                     | |
|  |                                     |    |       | |                     | |
|  |                                     |    | +-----+---------------------+ | |
|  |                                     |    | |      TypeORM (ORM)        | | |
|  |                                     |    | +---------------------------+ | |
|  +-------------------------------------+    +--------------------------------+ |
|                                              ^                                |
|                                              |                                |
|                                        (DB/Cache Connections)                 |
|                                              |                                |
|                        +---------------------+---------------------+          |
|                        |                     |                     |          |
|                        |   PostgreSQL DB     |      Redis Cache    |          |
|                        | (Data Persistence)  |   (Caching Layer)   |          |
|                        +---------------------+---------------------+          |
|                                                                                |
+--------------------------------------------------------------------------------+
```

## 2. Backend Architecture (Node.js/TypeScript)

The backend is built with Node.js and Express.js, leveraging TypeScript for type safety and maintainability. It follows a layered architecture pattern.

### 2.1. Core Layers

*   **`src/app.ts` / `src/server.ts`**: Entry point, initializes Express application, middleware, and routes. `server.ts` handles database initialization.
*   **`src/config`**: Manages environment variables, database connection settings, and Redis configuration. Centralized configuration ensures easy modification and environment-specific settings.
*   **`src/middleware`**:
    *   **Authentication (`auth.middleware.ts`)**: JWT verification, extracts user from token, performs role-based authorization.
    *   **Error Handling (`error.middleware.ts`)**: Catches all errors (including `HttpException`), logs them, and sends a standardized error response to the client.
    *   **Caching (`cache.middleware.ts`)**: Intercepts `GET` requests, checks Redis for cached responses, and caches new successful responses.
    *   **Rate Limiting (`rateLimit.middleware.ts`)**: Prevents abuse by limiting the number of requests a user can make within a time window.
    *   **Validation (`class-validator` hooks)**: Uses `class-validator` decorators on DTOs and `plainToClass`/`validateOrReject` in controllers for request body validation.
*   **`src/models`**: Defines the TypeORM Entities (User, Project, Task, Comment). These classes represent the database schema and contain relationships (`@OneToMany`, `@ManyToOne`) and validation decorators (`@IsEmail`, `@MinLength`, etc.).
*   **`src/repositories`**: (Optional/Implicit) TypeORM provides default repositories. Custom repositories can be added here for more complex database interactions. For simpler cases, direct use of `AppDataSource.getRepository()` is sufficient.
*   **`src/services`**: Contains the core business logic.
    *   Services are responsible for data manipulation, interactions with the database (via TypeORM), and complex operations.
    *   They abstract database operations from controllers and can be easily tested independently (unit tests).
    *   E.g., `AuthService`, `UserService`, `ProjectService`, `TaskService`, `CommentService`.
*   **`src/controllers`**: Handles incoming HTTP requests, calls appropriate service methods, and sends HTTP responses.
    *   Lightweight, focusing on request/response handling and input validation (using DTOs).
    *   Uses dependency injection (implicitly via `new Service()`) or constructor injection (demonstrated).
*   **`src/routes`**: Defines API endpoints, maps them to controller methods, and applies middleware (authentication, authorization, caching).
*   **`src/utils`**: Contains utility functions such as:
    *   `logger.ts`: Configures Winston for structured logging.
    *   `jwt.ts`: Functions for generating and verifying JWTs.
    *   `password.ts`: Handles password hashing and comparison (using Bcrypt).
    *   `http-exception.ts`: Custom error class for API-specific errors.
*   **`src/validators`**: Contains Data Transfer Objects (DTOs) with `class-validator` decorators for input validation.

### 2.2. Data Flow (Example: Create Project)

1.  **Client (Frontend)** sends a `POST /api/projects` request with project data and an Access Token.
2.  **`express-rate-limit`** middleware checks the request rate.
3.  **Logging Middleware** logs the incoming request.
4.  **`auth.middleware.ts`** verifies the Access Token and attaches `req.user` (containing `id`, `email`, `role`) to the request. It also checks if the user role is authorized to create projects.
5.  **`project.routes.ts`** directs the request to `ProjectController.createProject`.
6.  **`ProjectController.createProject`**:
    *   Uses `plainToClass` and `validateOrReject` to validate the request body against `CreateProjectDto`. If validation fails, it throws a `HttpException` (400).
    *   Calls `ProjectService.createProject` with the validated data and `req.user.id`.
7.  **`ProjectService.createProject`**:
    *   Fetches the `User` entity for `req.user.id` to set as the project owner.
    *   Uses `projectRepository.create()` and `projectRepository.save()` to persist the new project to PostgreSQL.
    *   Calls `clearCache('/api/projects')` to invalidate the cached list of projects.
    *   Returns the created project object.
8.  **`ProjectController.createProject`** receives the project object and sends a `201 Created` response to the client.
9.  If any error occurs, `error.middleware.ts` catches it, logs it, and sends a standardized error response.

## 3. Frontend Architecture (React/TypeScript)

The frontend is a single-page application (SPA) built with React and TypeScript.

*   **`src/App.tsx`**: Main application component, sets up React Router.
*   **`src/index.tsx`**: Renders the root React component.
*   **`src/context/AuthContext.tsx`**: Provides application-wide authentication state (user, tokens, login/logout functions) using React Context API. It handles token storage (`localStorage`) and refresh logic.
*   **`src/pages`**: Contains top-level components for different routes/views (e.g., `LoginPage`, `DashboardPage`, `ProjectDetailPage`). These pages orchestrate data fetching and display.
*   **`src/components`**: Reusable UI components (e.g., `AuthForm`, `ProjectCard`, `TaskList`). They are presentational or encapsulate small bits of logic.
*   **`src/services/api.ts`**: Configures Axios for HTTP requests.
    *   Sets `baseURL` to the backend API.
    *   **Request Interceptor**: Automatically attaches the JWT Access Token to all outgoing requests.
    *   **Response Interceptor**: Catches 401 (Unauthorized) errors, attempts to refresh the Access Token using the Refresh Token, retries the original failed request, or forces logout if refresh fails.
    *   Exports categorized API client functions (e.g., `authApi`, `projectApi`).
*   **`src/types`**: Defines TypeScript interfaces and types for consistent data structures across the frontend.

## 4. Database Layer (PostgreSQL with TypeORM)

*   **PostgreSQL**: A robust, open-source relational database used for data persistence.
*   **TypeORM**: An Object-Relational Mapper (ORM) for TypeScript and JavaScript.
    *   **Entities (`src/models`)**: TypeScript classes decorated with `@Entity`, `@PrimaryGeneratedColumn`, `@Column`, `@OneToMany`, `@ManyToOne` to map to database tables and define relationships.
    *   **Migrations (`src/database/migrations`)**: Version-controlled schema changes. TypeORM generates SQL migrations based on entity changes, ensuring database consistency across environments.
    *   **Seeders (`src/database/seeds`)**: Scripts to populate the database with initial or test data.
    *   **Query Optimization**: TypeORM provides tools for efficient querying.
        *   **Eager/Lazy Relations**: `relations: []` option in `find` or `findOne` to fetch related entities in one query (eager loading).
        *   **Select specific columns**: `select: {}` to fetch only necessary data.
        *   **Query Builder**: For complex queries, TypeORM's query builder allows writing more optimized and custom SQL.
        *   **Indexing**: Implicitly handled by TypeORM for primary keys and foreign keys. Explicit indexes can be added in migrations using `TableIndex`.

## 5. Caching Layer (Redis)

*   **Redis**: An in-memory data store, used here as a distributed cache.
*   **`src/config/redis.ts`**: Initializes and configures the `ioredis` client. Includes error handling and reconnection strategies.
*   **`src/middleware/cache.middleware.ts`**:
    *   Intercepts `GET` requests.
    *   Checks if the response for the request URL is present in Redis. If found (cache hit), returns cached data immediately.
    *   If not found (cache miss), the request proceeds to the route handler. After a successful `200 OK` response, the response body is stored in Redis for a defined duration.
*   **`clearCache` Utility**: Allows invalidating cache entries (e.g., after creating/updating/deleting a project, the list of projects and specific project details should be cleared from cache).

## 6. Logging and Monitoring

*   **Winston (`src/utils/logger.ts`)**: A versatile logging library.
    *   Configured for structured JSON logging.
    *   Logs to console (colored for dev, simple for prod), error file (`error.log`), and combined file (`combined.log`).
    *   Includes exception and rejection handlers for robust error capture.
*   **Monitoring**: While full-fledged Prometheus/Grafana or APM integration is beyond a single response, the architecture supports it:
    *   **Metrics**: Custom metrics can be exposed (e.g., request duration, error rates) via libraries like `prom-client` and scraped by Prometheus.
    *   **Tracing**: Distributed tracing (e.g., OpenTelemetry) can be integrated to track requests across services.
    *   **Alerting**: Thresholds can be set on collected metrics to trigger alerts (e.g., high error rate, low disk space).

## 7. Security Considerations

*   **Authentication**: JWT for secure stateless authentication.
*   **Password Hashing**: Bcrypt for strong password storage.
*   **HTTPS**: Assumed for production deployment (handled by Nginx/load balancer).
*   **CORS**: Configured in Express (`cors` middleware) to control allowed origins.
*   **Helmet**: Secures Express apps by setting various HTTP headers.
*   **Rate Limiting**: Prevents brute-force attacks and DoS.
*   **Input Validation**: `class-validator` guards against common injection attacks (though backend must still sanitize output for XSS etc.).
*   **Environment Variables**: Sensitive information (keys, database credentials) are stored in `.env` files and accessed via `process.env`, not hardcoded.

## 8. Development and Operations (DevOps)

*   **Docker Compose**: Orchestrates the multi-service application (backend, frontend, db, redis) for local development, providing isolated and consistent environments.
*   **Dockerfiles**: Separate Dockerfiles for backend and frontend, optimized for both development and production builds.
*   **GitHub Actions (`.github/workflows/ci-cd.yml`)**: Automates the CI/CD pipeline:
    *   **Continuous Integration**: Linting, unit tests, integration tests, API tests run on every push/pull request.
    *   **Continuous Delivery**: On merge to `main`, Docker images are built (for production) and pushed to a registry. Further steps for deployment to a cloud environment would follow.

This architecture aims for modularity, scalability, and maintainability, providing a solid foundation for enterprise-grade applications.