# Backend Architecture Documentation

This document describes the architectural decisions and design patterns applied to the mobile app backend system.

## 1. High-Level Architecture

The backend follows a **Monolithic Service-Oriented Architecture (SOA)**, organized into logical modules. It's built on a **Layered Architecture** pattern to separate concerns and promote maintainability, scalability, and testability.

```
+------------------+
|    Clients       |  (Mobile App, Web Frontend)
+--------+---------+
         | HTTP/HTTPS (RESTful API)
+--------v---------+
|   Load Balancer  | (e.g., Nginx, AWS ELB, K8s Ingress)
+--------+---------+
         |
+--------v---------+
|    API Gateway   | (or direct API exposure for simple setups)
+--------+---------+
         |
+-------------------------------------------------------------+
|                     Backend Application (Node.js/Express)   |
|                                                             |
| +---------------------------------------------------------+ |
| |                    Presentation Layer (Controllers)       | |
| | - Request parsing & validation (Zod)                      | |
| | - API response formatting (ApiResponse)                   | |
| | - Delegates business logic to Services                    | |
| +-------------------------^-------------------------------+ |
|                           |                                 |
| +-------------------------v-------------------------------+ |
| |                    Business Logic Layer (Services)        | |
| | - Core business rules & workflows                         | |
| | - Interacts with Data Access Layer                        | |
| | - Orchestrates complex operations (e.g., order creation)  | |
| +-------------------------^-------------------------------+ |
|                           |                                 |
| +-------------------------v-------------------------------+ |
| |                   Data Access Layer (Prisma ORM)          | |
| | - Type-safe database interactions                         | |
| | - Abstraction over raw SQL queries                        | |
| +-------------------------^-------------------------------+ |
|                           |                                 |
| +-------------------------v-------------------------------+ |
| |                       Cross-Cutting Concerns              | |
| | - **Authentication/Authorization:** JWT, RBAC Middleware  | |
| | - **Error Handling:** Centralized Middleware              | |
| | - **Logging:** Winston                                    | |
| | - **Caching:** Redis Middleware                           | |
| | - **Rate Limiting:** Express-rate-limit Middleware        | |
| | - **Security:** Helmet, HPP, CORS                         | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
         |                                |
+--------v----------------+-------------v---------+
|    Database (PostgreSQL)|   Cache/Session (Redis)|
+-------------------------+-----------------------+
```

## 2. Layered Architecture

The backend is structured into distinct layers, each with a specific responsibility:

### 2.1. Presentation Layer (Controllers)
*   **Purpose:** Handles incoming HTTP requests, validates input, and prepares responses. It acts as the entry point for API interactions.
*   **Technologies:** Express.js Routers, Controller functions, `zod` for request validation.
*   **Responsibilities:**
    *   Receiving HTTP requests.
    *   Extracting data from request (body, params, query).
    *   Validating request data using `zod` schemas.
    *   Calling appropriate service methods to execute business logic.
    *   Formatting the service's result into an HTTP response (JSON).
    *   Catching and passing errors to the error handling middleware.
*   **Key Principle:** Controllers should be thin. They orchestrate, not implement complex business logic.

### 2.2. Business Logic Layer (Services)
*   **Purpose:** Contains the core business rules and workflows of the application.
*   **Technologies:** Service classes/functions.
*   **Responsibilities:**
    *   Implementing application-specific business logic (e.g., user registration, product inventory management, order processing).
    *   Interacting with the Data Access Layer (Prisma) to fetch and persist data.
    *   Performing complex data manipulations and calculations.
    *   Enforcing business constraints and invariants.
    *   Handling transactional operations.
    *   Throwing custom `ApiError` exceptions for business-level errors.
*   **Key Principle:** Services encapsulate the "what" and "how" of business operations, independent of the external API format.

### 2.3. Data Access Layer (Prisma ORM)
*   **Purpose:** Provides an abstraction over the raw database, managing persistence and retrieval of data.
*   **Technologies:** Prisma Client, `schema.prisma` definitions.
*   **Responsibilities:**
    *   Mapping application objects to database records.
    *   Executing database queries (CRUD operations).
    *   Managing database connections.
    *   Handling database-specific concerns (e.g., query optimization, transaction management, migration).
    *   Providing type-safe access to database models.
*   **Key Principle:** Isolates the rest of the application from database specifics, allowing for easier database changes.

## 3. Cross-Cutting Concerns

These functionalities are applied across multiple layers and modules to enhance security, observability, and performance.

### 3.1. Authentication & Authorization
*   **Authentication:** JWT-based.
    *   **Access Tokens:** Short-lived, used for protecting API endpoints.
    *   **Refresh Tokens:** Long-lived, used to obtain new access tokens without re-logging in. Stored securely in the database.
    *   `auth.middleware.ts` handles token verification and attaches user info to `req.user`.
*   **Authorization:** Role-Based Access Control (RBAC).
    *   `authorize` middleware checks if the authenticated user's role (`UserRole.USER`, `UserRole.ADMIN`) is permitted for a specific route.

### 3.2. Error Handling
*   **Centralized Middleware (`error.middleware.ts`):** Catches all errors (including `ApiError` and `ZodError`) thrown during request processing.
*   **Custom `ApiError` Class:** Allows services and controllers to throw structured errors with specific HTTP status codes and messages.
*   **Consistent Response Format:** Ensures all error responses adhere to a predefined JSON structure.
*   **Logging:** Errors are logged with `Winston` for debugging and monitoring.

### 3.3. Logging
*   **Winston (`config/logger.ts`):** A robust logging library.
*   **Structured Logging:** Logs are formatted with timestamps and log levels, making them easier to parse and analyze.
*   **Environment-Specific Levels:** Log verbosity can be configured via environment variables (e.g., `debug` in development, `info` in production).
*   **Prisma Logging:** Prisma's query, info, warn, and error events are piped through the Winston logger.

### 3.4. Caching
*   **Redis (`middleware/cache.middleware.ts`):** Used as an in-memory data store for API response caching.
*   **Cache-Aside Pattern:** The caching middleware checks Redis first. If data is found, it's returned immediately. Otherwise, the request proceeds, and the response is cached before being sent.
*   **Configurable TTL:** Cache Time-To-Live (TTL) is configurable per endpoint or globally via environment variables.

### 3.5. Rate Limiting
*   **`express-rate-limit` (`middleware/rateLimit.middleware.ts`):** Prevents abuse by limiting the number of requests a user can make within a specified time window.
*   **Configurable Limits:** Window and max requests are configurable via environment variables.

### 3.6. Security
*   **Helmet:** Middleware to set various HTTP headers for security (e.g., `X-Content-Type-Options`, `Strict-Transport-Security`).
*   **CORS:** Configured to allow cross-origin requests from specified origins.
*   **HPP (HTTP Parameter Pollution):** Middleware to protect against HTTP Parameter Pollution attacks.
*   **Password Hashing:** `bcryptjs` is used to securely hash and verify user passwords.
*   **Input Validation:** `zod` schemas enforce data integrity and prevent injection vulnerabilities.

## 4. Modularity (Feature-based)

The application code is organized into feature-centric modules (e.g., `auth`, `users`, `products`, `orders`). Each module contains its own:
*   **Controller:** Handles API requests for the module.
*   **Service:** Implements the business logic for the module.
*   **Routes:** Defines API endpoints for the module.
*   **Validation:** Zod schemas for validating module-specific request data.

This modular structure enhances:
*   **Maintainability:** Easier to understand, modify, and debug specific features.
*   **Scalability:** Allows for potential future decomposition into microservices.
*   **Team Collaboration:** Multiple teams can work on different modules concurrently.

## 5. Technology Choices Justification

*   **TypeScript:** Provides static typing, improving code quality, readability, and reducing runtime errors. Essential for large, enterprise-grade projects.
*   **Node.js/Express:** A fast, scalable, and non-blocking runtime and minimalist web framework, ideal for building high-performance APIs.
*   **PostgreSQL:** A powerful, reliable, and open-source relational database, known for its data integrity and advanced features.
*   **Prisma ORM:** A modern, type-safe ORM that simplifies database interactions in TypeScript, provides powerful migrations, and integrates well with the development workflow.
*   **Zod:** A schema declaration and validation library, preferred over Joi or Yup for its TypeScript-first approach and inference capabilities.
*   **Redis:** An in-memory data store excellent for caching and session management, offering low-latency data access.
*   **JWT:** Industry-standard for stateless authentication, suitable for mobile and distributed applications.
*   **Docker/Docker Compose:** Enables consistent development, testing, and deployment environments, simplifying setup and scaling.
*   **Jest/Supertest:** Comprehensive testing tools for JavaScript/TypeScript, providing a rich framework for unit and integration tests.
*   **Winston:** Flexible logging library for effective monitoring and debugging.
*   **Swagger UI Express:** Provides interactive API documentation, crucial for frontend developers and external integrators.

## 6. Future Considerations

*   **Microservices:** As the application grows, consider breaking down modules into independent microservices.
*   **Observability:** Integrate with dedicated monitoring tools (e.g., Prometheus, Grafana, ELK stack) for more advanced metrics and log aggregation.
*   **Message Queues:** For asynchronous operations (e.g., sending email notifications, processing large batches), integrate a message queue (e.g., RabbitMQ, Kafka).
*   **GraphQL:** For complex data fetching requirements, consider adding a GraphQL layer alongside or as an alternative to REST.
*   **Database Sharding/Replication:** For extreme scale, explore database scaling strategies.
*   **CI/CD Pipeline Enhancement:** Expand the GitHub Actions pipeline to include deployment to cloud environments (e.g., AWS, GCP, Azure, Kubernetes).
*   **Frontend-Backend contract:** Use OpenAPI generation from code (e.g., `ts-to-openapi`) to ensure strict type synchronization.
```