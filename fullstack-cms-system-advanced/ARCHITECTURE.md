# Architecture Documentation: Enterprise-Grade CMS

This document outlines the high-level architecture of the Content Management System, detailing its components, their interactions, and the underlying design principles.

## 1. High-Level Overview

The CMS follows a **microservices-like architecture** (though implemented as a single backend service for demonstration) and a **single-page application (SPA)** pattern for the frontend. All services are containerized using Docker and orchestrated with Docker Compose for ease of development, deployment, and scalability.

```
+----------------+          +--------------------+         +-----------------+
|   User/Admin   | <------> |     Frontend SPA   | <-----> |   Nginx Reverse |
|  (Web Browser) |          |   (React.js, TS)   |         |      Proxy      |
+----------------+          +--------------------+         |    (Container)  |
                                                                   ^
                                                                   | HTTP/HTTPS
                                                                   v
+----------------+          +--------------------+         +-----------------+
|   API Clients  | <------> |  Backend API       | <-----> |   Load Balancer |
| (Postman, etc) |          |  (Node.js, Express, TS)    |         |  (Optional, Prod)|
+----------------+          +--------------------+         +-----------------+
                                       ^                            ^
                                       | HTTP/HTTPS                 |
                                       v                            v
                               +----------------+           +-----------------+
                               |   Database     |           |     Cache       |
                               | (PostgreSQL)   |           |    (Redis)      |
                               +----------------+           +-----------------+
```

## 2. Key Components

### 2.1. Frontend (Client-side)

*   **Technology:** React.js with TypeScript.
*   **Purpose:** Provides the user interface for content creators, administrators, and public visitors. It consumes the Backend API to fetch and manage data.
*   **Styling:** TailwindCSS for utility-first styling, ensuring a consistent and maintainable UI.
*   **Routing:** React Router DOM for client-side navigation.
*   **State Management:** Local component state, React Context API for global state (e.g., authentication).
*   **Build & Serve:** Built using Vite and served via an Nginx container.

### 2.2. Backend API (Server-side)

*   **Technology:** Node.js with Express.js and TypeScript.
*   **Purpose:** Exposes RESTful API endpoints for all data operations (CRUD for users, roles, content, categories, tags). Handles business logic, data validation, authentication, authorization, and integrates with the database and caching layers.
*   **Modular Design:** Organized into feature-based modules (e.g., `modules/auth`, `modules/users`, `modules/content`), promoting separation of concerns.
*   **Middleware:** Extensively uses middleware for cross-cutting concerns:
    *   **Authentication (`auth.middleware.ts`):** Validates JWT tokens and attaches user information to the request.
    *   **Authorization (`auth.middleware.ts`):** Role-Based Access Control (RBAC) to restrict access based on user roles.
    *   **Error Handling (`error.middleware.ts`):** Centralized error processing, converting various errors into standardized HTTP responses.
    *   **Logging (`logger.middleware.ts`):** Logs incoming requests and outgoing responses using Winston.
    *   **Caching (`cache.middleware.ts`):** Intercepts requests to cache responses and serve from Redis where applicable.
    *   **Rate Limiting (`rateLimit.middleware.ts`):** Protects endpoints from excessive requests.
*   **Data Validation:** Utilizes `class-validator` and DTOs (Data Transfer Objects) for robust input validation.

### 2.3. Database

*   **Technology:** PostgreSQL.
*   **Purpose:** Persistent storage for all application data (users, roles, content, metadata).
*   **ORM:** TypeORM is used to interact with PostgreSQL, providing an object-relational mapping layer that simplifies database operations and enforces schema.
*   **Migrations:** Database schema changes are managed via TypeORM migrations, ensuring controlled evolution of the database.
*   **Seeding:** Initial data (roles, admin user, sample content) can be populated using seeding scripts.
*   **Query Optimization:** TypeORM provides tools for eager/lazy loading relations and raw queries for performance-critical operations. Connection pooling is configured.

### 2.4. Caching Layer

*   **Technology:** Redis.
*   **Purpose:** In-memory data store used for API response caching. This reduces the load on the database and improves response times for frequently accessed, less volatile data (e.g., public content lists, categories).
*   **Integration:** `ioredis` client with custom caching middleware (`cache.middleware.ts`).

### 2.5. DevOps & Infrastructure

*   **Docker:** All application components (backend, frontend, PostgreSQL, Redis) are containerized.
*   **Docker Compose:** Orchestrates the multi-container application, defining services, networks, and volumes for local development and simplified deployment.
*   **CI/CD (GitHub Actions):** Automates the testing and deployment pipeline:
    *   **Unit/Integration Tests:** Runs tests for both frontend and backend on every push/pull request.
    *   **Build & Push Docker Images:** Builds optimized Docker images and pushes them to a container registry (e.g., Docker Hub) upon successful tests on the `main` branch.
    *   **Deployment (Example):** Includes a placeholder step for deploying new images to a production server (e.g., EC2/VPS) via SSH.

## 3. Data Flow

1.  **Client Request:** A user interacts with the Frontend SPA, which sends an HTTP request to the Nginx proxy (or directly to the Backend in development).
2.  **Frontend to Backend:** The Frontend SPA uses Axios to send requests to `/api/*` endpoints.
3.  **Backend Processing:**
    *   Requests first hit Express middleware (rate limiting, logging, authentication, authorization).
    *   If authenticated/authorized, the request proceeds to the appropriate controller.
    *   The controller invokes a service layer method.
    *   The service layer contains business logic and interacts with the ORM (TypeORM).
    *   TypeORM fetches/saves data from/to PostgreSQL.
    *   Caching middleware can intercept GET requests:
        *   If data is in Redis, it's served directly.
        *   If not, data is fetched from DB, stored in Redis, then sent to client.
        *   Data modification requests (POST, PUT, DELETE) trigger cache invalidation.
4.  **Response:** The backend sends an HTTP response (JSON) back to the Frontend.
5.  **Frontend Rendering:** The Frontend updates its UI based on the API response.

## 4. Security Considerations

*   **Authentication:** JWTs are used, stored in HTTP-only cookies (in production) or Local Storage (development for simplicity).
*   **Authorization:** RBAC ensures users only access resources they are permitted to.
*   **Data Validation:** All incoming data is validated using `class-validator` to prevent malformed requests and injection attacks.
*   **Password Hashing:** `bcryptjs` is used to securely hash user passwords.
*   **CORS:** Configured to allow requests only from the specified frontend URL.
*   **Helmet:** Adds various HTTP headers to enhance security (XSS, MIME-sniffing, etc.).
*   **Rate Limiting:** Protects against brute-force attacks and DoS.
*   **Environment Variables:** Sensitive information (database credentials, JWT secrets) is stored in environment variables, not hardcoded.
*   **Dependency Security:** Regular updates and vulnerability scanning of project dependencies are crucial (though not explicitly implemented here, part of best practices).

## 5. Scalability & Performance

*   **Stateless Backend:** The use of JWTs makes the backend stateless, allowing horizontal scaling of backend instances.
*   **Database:** PostgreSQL is highly scalable and robust. Using TypeORM helps with efficient queries, and connection pooling reduces overhead. Proper indexing is key.
*   **Caching (Redis):** Reduces database load and improves response times, especially for read-heavy operations. Redis itself can be scaled.
*   **Dockerization:** Facilitates easy scaling of individual services in a container orchestration environment (Kubernetes, AWS ECS, etc.).
*   **Load Balancing:** Essential in production to distribute traffic across multiple backend and frontend instances.

## 6. Observability

*   **Structured Logging (Winston):** Provides detailed, queryable logs for debugging, monitoring, and auditing. Log files are rotated daily and separated by level.
*   **Monitoring (Discussed):** In a production setup, integration with tools like Prometheus/Grafana for metrics collection and visualization, or Sentry for error tracking, would be implemented.

This architecture provides a solid foundation for a robust, scalable, and maintainable CMS.
```

#### **5.3 `API_DOCS.md`**

```markdown