# Architecture Documentation: ML Utilities Hub

## 1. Overview

The ML Utilities Hub is a full-stack web application designed to provide a centralized platform for common Machine Learning data preprocessing and feature engineering tasks, along with basic dataset management. It follows a layered architecture, separating concerns between the frontend, backend, and database, and incorporates modern cloud-native principles like containerization and microservices (though the backend is currently a monolithic API for simplicity).

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    User(Browser/Client) --> |HTTP/HTTPS| Frontend(React App: 3000)
    Frontend --> |API Calls (HTTP/HTTPS)| Backend(Node.js/Express App: 5000)
    Backend --> |Database Connection| PostgreSQL(Database)
    Backend --> |Cache Connection| Redis(Cache)

    subgraph Infrastructure
        Frontend --- Docker(Docker Containers)
        Backend --- Docker
        PostgreSQL --- Docker
        Redis --- Docker
    end

    subgraph CI/CD
        Code(GitHub Repository) --> |Push/PR| GitHubActions(GitHub Actions)
        GitHubActions --> |Build & Test| Frontend & Backend Images
        GitHubActions --> |Deploy| Docker(Docker Containers)
    end
```

## 3. Component Breakdown

### 3.1. Frontend (Client-side)

*   **Technology Stack**: React, TypeScript, Chakra UI, Axios, React Router.
*   **Purpose**: Provides an intuitive and responsive user interface for interacting with the ML utilities and managing datasets.
*   **Key Components**:
    *   **Pages**: `LoginPage`, `RegisterPage`, `DashboardPage`, `DatasetsPage`, `DatasetDetailPage`, `DataUtilitiesPage`.
    *   **Components**: Reusable UI elements like `Navbar`, forms, tables, modals.
    *   **Contexts**: `AuthContext` for managing global authentication state (user, token, loading).
    *   **API Services (`src/api`)**: Encapsulates API calls using Axios, handling authorization headers and response interceptors (e.g., redirect on 401).
    *   **Routing (`src/routes`)**: Manages client-side navigation and protected routes with `PrivateRoute`.
*   **Deployment**: Served as static files, typically from an Nginx server or a lightweight Node.js static server in a Docker container.

### 3.2. Backend (Server-side)

*   **Technology Stack**: Node.js, Express, TypeScript, TypeORM, Winston, JWT, bcryptjs, Redis (ioredis), express-rate-limit, helmet, cors.
*   **Purpose**: Exposes RESTful API endpoints for user authentication, dataset management, and ML utility operations. Handles business logic, data persistence, security, and caching.
*   **Key Layers/Modules**:
    *   **`src/config`**: Centralized configuration management (environment variables, logger setup).
    *   **`src/database`**: TypeORM DataSource, entities (`User`, `Dataset`), migrations, and seeding scripts.
    *   **`src/middleware`**:
        *   `auth.ts`: JWT authentication (`protect` middleware).
        *   `errorHandler.ts`: Global error handling for consistent API responses.
        *   `rateLimiter.ts`: Rate limiting for authentication routes.
        *   `cache.ts`: Redis-based caching for GET requests.
    *   **`src/modules`**: Feature-specific modules, each containing:
        *   **Entities**: TypeORM models (`User`, `Dataset`).
        *   **DTOs**: Data Transfer Objects for request/response validation (though not explicitly validated with a library like `class-validator` in this demo, it's good practice).
        *   **Services**: Encapsulate business logic and database interactions (`auth.service.ts`, `dataset.service.ts`, `data-utility.service.ts`).
        *   **Controllers**: Handle incoming requests, call services, and send responses.
        *   **Routes**: Define API endpoints and apply middleware (`auth.routes.ts`, `user.routes.ts`, `dataset.routes.ts`, `data-utility.routes.ts`).
    *   **`src/shared`**: Common utilities (e.g., `ApiError`, `catchAsync` wrapper).
    *   **`app.ts`**: Express application setup, global middleware, and route registration.
    *   **`server.ts`**: Application entry point, database initialization, and server startup.
*   **Deployment**: Runs as a Docker container, exposing API on port 5000.

### 3.3. Database Layer

*   **Technology**: PostgreSQL.
*   **ORM**: TypeORM.
*   **Purpose**: Stores all persistent application data, including user credentials, dataset metadata.
*   **Schema**:
    *   `users`: Stores user information (email, hashed password, names, timestamps).
    *   `datasets`: Stores metadata about uploaded datasets (name, description, file path, size, mime type, linked to `users`).
*   **Migrations**: Ensures controlled schema evolution.
*   **Seeding**: Populates initial data (e.g., an admin user).

### 3.4. Caching Layer

*   **Technology**: Redis (via `ioredis`).
*   **Purpose**: Improves API response times and reduces database load by storing frequently accessed data.
*   **Implementation**: A custom Express middleware (`src/middleware/cache.ts`) caches GET requests based on `req.originalUrl`. Cache invalidation is triggered manually after `POST`, `PATCH`, `DELETE` operations.

## 4. Data Flow Example: Register User

1.  **Frontend**: User fills out registration form on `RegisterPage`.
2.  **Frontend (API Call)**: `AuthContext` calls `api/auth.ts` -> `registerUser` -> `axios.post('/auth/register', userData)`.
3.  **Backend (Router)**: `backend/src/modules/auth/auth.routes.ts` matches `POST /auth/register` and applies `authLimiter` middleware.
4.  **Backend (Controller)**: `auth.controller.ts` calls `auth.service.ts` -> `registerUser`.
5.  **Backend (Service)**:
    *   Checks if email already exists in `userRepository`.
    *   Hashes password using `bcryptjs`.
    *   Creates and saves a new `User` entity to the PostgreSQL database via TypeORM.
    *   Generates a JWT token using `jsonwebtoken`.
6.  **Backend (Response)**: `auth.controller.ts` sends back `user` object (without password) and `token` (201 Created).
7.  **Frontend (Context)**: `AuthContext` stores the token in `localStorage`, updates `user` state, and redirects to `DashboardPage`.

## 5. Security Considerations

*   **Authentication**: JWT for stateless authentication.
*   **Password Hashing**: `bcryptjs` is used to securely hash passwords.
*   **CORS**: `cors` middleware configured.
*   **HTTP Headers**: `helmet` middleware provides various security headers.
*   **Rate Limiting**: `express-rate-limit` protects against brute-force attacks on auth endpoints.
*   **Environment Variables**: Sensitive information is stored in `.env` files and loaded via `dotenv`, not hardcoded.
*   **SQL Injection**: TypeORM's query builder and repository methods inherently protect against SQL injection.

## 6. Scalability and Reliability

*   **Containerization (Docker)**: Enables easy deployment, scaling, and isolation of services.
*   **Database (PostgreSQL)**: Scalable and robust, widely used in production.
*   **Caching (Redis)**: Offloads database and speeds up reads. Can be deployed as a cluster for higher availability.
*   **Horizontal Scaling**: Backend (Node.js) and Frontend (static files) are stateless and can be easily scaled horizontally by adding more container instances behind a load balancer.
*   **CI/CD**: Automates testing and deployment, improving reliability and consistency.

## 7. Future Enhancements

*   **Input Validation**: Implement more robust input validation on the backend (e.g., using a library like `class-validator` or `Joi`).
*   **File Uploads**: Integrate a proper file storage solution (e.g., AWS S3, Google Cloud Storage) for actual dataset files, rather than just storing paths.
*   **Asynchronous Tasks**: For computationally intensive ML tasks, consider worker queues (e.g., RabbitMQ, Kafka, BullMQ) and separate worker services.
*   **Advanced ML Utilities**: Add more sophisticated tools (e.g., dimensionality reduction, feature selection, text preprocessing).
*   **Monitoring & Alerting**: Integrate with tools like Prometheus/Grafana or cloud-native monitoring solutions.
*   **Frontend Testing**: Implement unit and integration tests for React components using Jest and React Testing Library.
*   **Role-Based Access Control (RBAC)**: Extend `User` model with roles and implement authorization middleware.
*   **TypeScript**: Enhance strictness and type safety across the board.