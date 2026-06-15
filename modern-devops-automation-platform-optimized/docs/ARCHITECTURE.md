```markdown
# Architecture Documentation: Enterprise Product Catalog System

This document outlines the architectural design of the Enterprise Product Catalog System, detailing its components, their interactions, and the underlying principles that govern its structure.

---

## 1. Overview

The Enterprise Product Catalog System is a backend service designed to manage product information via a RESTful API. It adheres to a layered architectural style, promoting separation of concerns, modularity, and maintainability. The system is built with performance, security, and scalability in mind, leveraging modern C++ and containerization technologies.

## 2. High-Level Diagram

```mermaid
graph TD
    A[Client Application/Frontend] -->|HTTP/HTTPS| B(Load Balancer / API Gateway)
    B -->|HTTP/HTTPS| C[Product Catalog Service (Containerized)]

    subgraph Product Catalog Service
        C --1. Request Routing--> D(Web Server / Drogon)
        D --2. Middleware (Auth, Rate Limit, Error)--> E(API Controllers)
        E --3. Business Logic Invocation--> F(Service Layer)
        F --4. Data Access & Cache--> G(Database Client)
        G --5. SQL Queries--> H[PostgreSQL Database]
        F --6. Cache Read/Write--> I(In-Memory Cache)
    end

    C --Monitoring & Logging--> J[Centralized Logging/Monitoring System]
    C --- K[Container Registry]
    K --Deployment Trigger--> L[CI/CD Pipeline]
    L --> C
```

## 3. Component Breakdown

### 3.1. Client Application / Frontend (`web/`)

*   **Purpose:** Provides a user interface for interacting with the Product Catalog API.
*   **Technology:** Simple HTML/JavaScript for demonstration purposes. In a real-world scenario, this would typically be a modern SPA (React, Vue, Angular), mobile app, or another backend service.
*   **Interaction:** Communicates with the Product Catalog Service via RESTful HTTP/HTTPS requests. Handles user authentication and displays product data.

### 3.2. Load Balancer / API Gateway (Conceptual)

*   **Purpose:** Distributes incoming traffic across multiple instances of the Product Catalog Service, provides SSL termination, and potentially other API management features (e.g., advanced rate limiting, analytics, security policies).
*   **Technology:** Nginx, HAProxy, AWS ALB, Kubernetes Ingress Controller, Apigee, Kong, etc.
*   **Note:** Not explicitly implemented in the codebase but assumed for production deployments.

### 3.3. Product Catalog Service (C++ Backend - `src/`)

This is the core of the application, implemented in C++ with the `drogon` framework. It's designed as a standalone, stateless microservice.

#### 3.3.1. Web Server / Drogon Core

*   **Component:** `drogon::app()` in `src/main.cpp`
*   **Purpose:** The entry point and HTTP server responsible for listening for incoming requests, managing event loops, and handling request/response cycles.
*   **Features:** Multi-threading, HTTPS support, static file serving, request routing.

#### 3.3.2. Middleware (`src/middleware/`)

A chain of filters (Drogon's term for middleware) applied to requests before they reach the controllers.
*   **`ErrorHandlingMiddleware`:**
    *   **Purpose:** Global exception handler. Catches exceptions thrown by controllers or services and formats them into consistent JSON error responses (e.g., 400 Bad Request, 500 Internal Server Error).
    *   **Placement:** Typically the outermost filter to wrap all subsequent processing.
*   **`RateLimitingMiddleware`:**
    *   **Purpose:** Protects the API from abuse by limiting the number of requests from a single client IP within a defined time window.
    *   **Mechanism:** Uses an in-memory map to track request counts per IP.
    *   **Response:** `429 Too Many Requests` status code with `Retry-After` header.
*   **`AuthMiddleware`:**
    *   **Purpose:** Authenticates incoming requests by verifying JWT tokens provided in the `Authorization: Bearer` header.
    *   **Mechanism:** Delegates token verification to `JwtManager`. Stores authenticated user information (e.g., user ID, roles) in the request context for subsequent use by controllers.
    *   **Response:** `401 Unauthorized` if token is missing, invalid, or expired.
*   **Other Potential Middleware:** Logging, CORS, Request Validation, Tracing, etc.

#### 3.3.3. API Controllers (`src/controllers/`)

*   **Component:** `AppControllers::ProductController`
*   **Purpose:** Handle specific API routes (e.g., `/api/v1/products`), parse request bodies/parameters, perform basic input validation, and delegate business logic to the `Service Layer`.
*   **Responsibility:** Map HTTP requests to appropriate service methods and format service responses into HTTP responses (JSON). Enforces authorization rules using user information from `AuthMiddleware`.

#### 3.3.4. Service Layer (`src/services/`)

*   **Component:** `AppServices::ProductService`
*   **Purpose:** Encapsulate the core business logic of the application. It acts as an orchestrator, coordinating between different data sources (database, cache) and applying business rules.
*   **Responsibility:**
    *   Perform CRUD operations on products.
    *   Handle authentication logic (user lookup, password verification, token generation).
    *   Interact with `DbClient` for database operations.
    *   Utilize `Cache` for performance optimization.
    *   Implement data validation (beyond basic format checks in controllers).

#### 3.3.5. Data Access Layer / Database Client (`src/database/`)

*   **Component:** `AppDb::DbClient`
*   **Purpose:** Provide a clean interface for the `Service Layer` to interact with the underlying database. Manages database connection pooling.
*   **Technology:** Drogon's `orm::DbClient` for PostgreSQL.
*   **Responsibility:** Abstract away raw SQL queries, handle connection management, and translate database results into application-specific models.

#### 3.3.6. Utility Modules (`src/utils/`)

*   **`AppUtils::Logger`:**
    *   **Purpose:** Centralized logging utility using `Poco::Logger` for structured, configurable logging to console and files.
*   **`AppUtils::JwtManager`:**
    *   **Purpose:** Manages JWT token generation and verification.
    *   **Note:** The provided implementation is simplified for demonstration. A production system *must* use a robust cryptographic library for JWTs.
*   **`AppUtils::Cache`:**
    *   **Purpose:** Provides a simple in-memory caching mechanism with Time-To-Live (TTL) for performance optimization of frequently accessed data.
    *   **Note:** For distributed or high-availability systems, this would be replaced by an external distributed cache (e.g., Redis).

#### 3.3.7. Configuration (`src/config/`, `config/`)

*   **`AppConfig::ConfigManager`:**
    *   **Purpose:** Manages application configuration, loading settings from `config/app_config.json` and overriding them with environment variables (e.g., from `.env` or Docker).
*   **Files:** `config/app_config.json`, `.env.example`.

### 3.4. PostgreSQL Database (`db/`)

*   **Purpose:** Persistent storage for product and user data.
*   **Technology:** PostgreSQL.
*   **Structure:** Defined by SQL schema files (`db/schema.sql`, `db/migrations/V1__initial_schema.sql`).
*   **Data Management:** Includes seed data (`db/seed.sql`) for initial population.
*   **Containerization:** Runs as a Docker container, often with a persistent volume for data.

### 3.5. CI/CD Pipeline (`.github/workflows/`)

*   **Component:** `ci-cd.yml`
*   **Purpose:** Automates the build, test, and (conceptual) deployment process, ensuring code quality and rapid delivery.
*   **Technology:** GitHub Actions.
*   **Stages:**
    *   **Build:** Compiles the C++ application and creates a Docker image.
    *   **Test:** Executes unit, integration (against a test PostgreSQL instance), and API tests (against a running Dockerized application instance).
    *   **Deploy (Conceptual):** Placeholder for pushing Docker images to a registry and deploying to a target environment (e.g., Kubernetes, cloud VMs).

### 3.6. Container Registry (Conceptual)

*   **Purpose:** Stores Docker images of the application, making them available for deployment.
*   **Technology:** Docker Hub, AWS ECR, Google Container Registry, GitLab Container Registry.
*   **Interaction:** CI/CD pipeline pushes images; deployment processes pull images.

### 3.7. Centralized Logging / Monitoring System (Conceptual)

*   **Purpose:** Aggregates logs from all application instances and provides tools for monitoring, alerting, and analysis.
*   **Technology:** ELK Stack (Elasticsearch, Logstash, Kibana), Prometheus/Grafana, DataDog, Splunk, Loki.
*   **Interaction:** Application logs are streamed to this system.

## 4. Data Flow Example: Create Product

1.  **Client:** Sends `POST /api/v1/products` request with product data to the Load Balancer/API Gateway.
2.  **Load Balancer:** Forwards the request to an available instance of the Product Catalog Service.
3.  **Drogon Web Server:** Receives the request.
4.  **Middleware Chain:**
    *   `ErrorHandlingMiddleware`: Starts a try-catch block.
    *   `RateLimitingMiddleware`: Checks and updates the client's request count. If limit exceeded, returns `429`.
    *   `AuthMiddleware`: Extracts JWT from `Authorization` header, verifies it using `JwtManager`. If valid, extracts user claims (`isAdmin`) and stores them in request context. If invalid, returns `401`.
5.  **ProductController:**
    *   Receives the request.
    *   Checks `isAdmin` flag from request context for authorization. If not admin, returns `403`.
    *   Parses the JSON request body.
    *   Performs basic input validation (e.g., required fields).
    *   Calls `ProductService::createProduct()`.
6.  **ProductService:**
    *   Generates a new UUID for the product.
    *   Constructs an SQL `INSERT` statement.
    *   Calls `DbClient::client().execSqlCoro()` to execute the query against PostgreSQL.
    *   Awaits the database response.
    *   Invalidates relevant cache entries (e.g., `product:new_id`, `products:all`).
    *   Returns the created `Product` object.
7.  **ProductController:**
    *   Receives the `Product` object.
    *   Formats it into a JSON response.
    *   Sets HTTP status to `201 Created`.
    *   Sends the response back.
8.  **Drogon Web Server:** Sends the HTTP response back through the middleware chain (which can perform post-processing if needed) and then to the Load Balancer.
9.  **Load Balancer:** Forwards the response to the Client.
10. **Client:** Receives the response, confirms product creation.

## 5. Scalability Considerations

*   **Stateless Services:** The C++ backend is designed to be stateless, making it easy to scale horizontally by running multiple instances behind a load balancer.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding, specialized solutions like CitusDB).
*   **Caching:** While an in-memory cache is present, a production environment would utilize a distributed cache (e.g., Redis) for consistent caching across multiple service instances.
*   **Connection Pooling:** Drogon's `DbClient` uses connection pooling to efficiently manage database connections.
*   **Asynchronous Operations:** Drogon's coroutine-based asynchronous design allows the server to handle many concurrent requests efficiently without blocking threads.

## 6. Security Considerations

*   **Authentication (JWT):** Secure token-based authentication.
*   **Authorization (RBAC):** Role-based access control enforces permissions.
*   **HTTPS:** All communication should be over HTTPS in production.
*   **Input Validation:** Essential at the controller and service layers to prevent injection attacks and data corruption.
*   **Password Hashing:** Passwords in the database are stored as bcrypt hashes (conceptual implementation in `db/seed.sql` and `ProductService::authenticateUser`). **Never store plain text passwords.**
*   **Secrets Management:** Sensitive information (DB credentials, JWT secret) should be managed via environment variables and robust secrets management systems (e.g., Kubernetes Secrets, AWS Secrets Manager, Vault) in production, not hardcoded.
*   **Rate Limiting:** Protects against brute-force attacks and denial-of-service attempts.

## 7. Future Enhancements

*   **Distributed Cache:** Replace in-memory cache with Redis.
*   **Asynchronous Tasks:** Implement a message queue (e.g., RabbitMQ, Kafka) for background tasks (e.g., processing large product imports, sending notifications).
*   **Observability:** Integrate with Prometheus/Grafana for metrics, OpenTelemetry for distributed tracing.
*   **More Robust JWT:** Use a dedicated C++ JWT library.
*   **Schema Migration Tool:** Integrate Flyway or Liquibase for more advanced database migration management.
*   **Container Orchestration:** Deploy to Kubernetes for advanced scaling, self-healing, and service discovery.
*   **API Gateway:** Implement a dedicated API Gateway for advanced routing, security, and traffic management.
*   **Detailed Metrics:** Add custom metrics to track specific business logic performance.

---
```