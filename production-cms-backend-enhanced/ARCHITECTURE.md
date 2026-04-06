# CMS System Architecture

## 1. High-Level Overview

The CMS System is designed as a modular, layered application, primarily leveraging the Spring Boot ecosystem. It follows a classic N-Tier architecture pattern, separating concerns into distinct layers for better maintainability, scalability, and testability.

```
+----------------+       +-------------------+       +--------------------+
| Frontend (UI)  | <---> | Spring Boot       | <---> | Persistence (DB)   |
| (Thymeleaf/JS) |       | (Backend Services)|       | (PostgreSQL/Flyway)|
+----------------+       +-------------------+       +--------------------+
        ^                        ^
        |                        |
        |                  +----------------+
        |                  | External       |
        |                  | Integrations   |
        +------------------+ (e.g., CDN, Cache)
```

## 2. Layered Architecture

The backend application is structured into the following layers:

### 2.1. Presentation Layer (Controllers)
*   **Purpose:** Handles incoming HTTP requests, routes them to appropriate service methods, and returns HTTP responses.
*   **Components:**
    *   **REST API Controllers (`*ApiController.java`):** Expose JSON-based RESTful APIs for CRUD operations on resources (Users, Content, Categories). These are designed for consumption by single-page applications (SPAs) or mobile clients.
    *   **Web Controllers (`*WebController.java`, `DashboardController.java`):** Handle requests for server-side rendered views using Thymeleaf. They prepare models and return view names.
*   **Key Responsibilities:**
    *   Request parsing and validation.
    *   Serialization/deserialization of JSON (for APIs).
    *   Authentication and Authorization enforcement (handled by Spring Security filters and `@PreAuthorize`).
    *   Global exception handling (`GlobalExceptionHandler`).
    *   Rate limiting (`RateLimitingInterceptor`).

### 2.2. Service Layer (Business Logic)
*   **Purpose:** Contains the core business logic of the application. It orchestrates operations, applies business rules, and interacts with the data access layer.
*   **Components:**
    *   **`*Service.java` classes:** E.g., `UserService`, `ContentService`, `CategoryService`. Each service encapsulates operations related to a specific domain entity.
*   **Key Responsibilities:**
    *   Applying business rules and workflows.
    *   Transactional management (`@Transactional`).
    *   Data transformation between DTOs and entities.
    *   Caching (`@Cacheable`, `@CacheEvict`, `@CachePut`).
    *   Interacting with multiple repositories if a business operation spans across several entities.

### 2.3. Data Access Layer (Repositories)
*   **Purpose:** Provides an abstraction over the persistence store. It handles database operations (CRUD) for entities.
*   **Components:**
    *   **`*Repository.java` interfaces:** E.g., `UserRepository`, `ContentRepository`, `CategoryRepository`. These extend Spring Data JPA's `JpaRepository`.
*   **Key Responsibilities:**
    *   Performing database interactions (queries, inserts, updates, deletes).
    *   Translating object-oriented calls into database operations.
    *   Providing custom query methods if needed.

### 2.4. Domain Layer (Models & DTOs)
*   **Purpose:** Represents the core entities and data structures of the application.
*   **Components:**
    *   **Models (`*.java` in `model` package):** JPA entities (e.g., `User`, `Content`, `Category`, `Role`) representing tables in the database.
    *   **DTOs (`*Dto.java`, `*Request.java`, `*Response.java` in `dto` package):** Data Transfer Objects used to transfer data between layers, particularly between the Presentation and Service layers. This decouples domain models from external API contracts.
*   **Key Responsibilities:**
    *   Defining entity relationships and database mappings.
    *   Encapsulating data with minimal behavior.
    *   Defining API request/response structures.

## 3. Cross-Cutting Concerns

*   **Security (Spring Security):**
    *   **Authentication:** JWT-based for REST APIs, Session-based for Thymeleaf UI.
    *   **Authorization:** Role-based (`@PreAuthorize`) access control for methods and URL patterns.
    *   Custom `UserDetailsService` (`AuthUserDetailsService`) to load user details.
    *   `JwtAuthFilter` to validate JWT tokens.
*   **Logging (SLF4J + Logback):**
    *   Structured logging to console and file, with configurable levels.
*   **Error Handling (`@ControllerAdvice`):**
    *   Global exception handler to provide consistent error responses (JSON for API, error page for UI).
*   **Caching (Spring Cache + Caffeine):**
    *   Declarative caching using annotations (`@Cacheable`, `@CachePut`, `@CacheEvict`) to reduce database load and improve response times.
*   **Rate Limiting (Custom Interceptor + Bucket4j):**
    *   Implemented as a Spring `HandlerInterceptor` to protect API endpoints from abuse by limiting the number of requests from a single IP address over a time window.
*   **Database Migrations (Flyway):**
    *   Manages database schema evolution with version-controlled SQL scripts. Ensures consistent database state across environments.

## 4. Deployment Architecture (Containerized)

The application is designed for containerized deployment using Docker and Docker Compose.

```
+-------------------------------------------------+
| Docker Host / Kubernetes Cluster                |
|                                                 |
| +---------------------+   +-------------------+ |
| |  Application (APP)  |   |  Database (DB)    | |
| | (Spring Boot JAR    |   |  (PostgreSQL)     | |
| | in Docker Container)|   |                   | |
| | - Exposes 8080      |   | - Exposes 5432    | |
| | - Connects to DB    |   | - Persists data   | |
| +---------------------+   +-------------------+ |
|                                                 |
| +-----------------------------------------------+
| | Reverse Proxy / Load Balancer (e.g., Nginx)   |
| | - SSL Termination                             |
| | - Request Routing                             |
| | - Further Rate Limiting / WAF                 |
| +-----------------------------------------------+
        ^
        |
        | HTTPS
        |
+-----------------+
| Internet/Clients|
+-----------------+
```

*   **Application Container:** Encapsulates the Spring Boot application, making it portable and easy to deploy.
*   **Database Container:** Runs PostgreSQL, providing a dedicated and isolated database instance. Data is persisted via Docker volumes.
*   **Docker Compose:** Orchestrates the multi-container application, defining services, networks, and volumes for local development and single-server deployments.
*   **Production Deployment:** In a production environment, this setup would typically be deployed on a cloud platform (AWS, GCP, Azure) using orchestration tools like Kubernetes, fronted by a reverse proxy/load balancer for SSL termination, advanced traffic management, and potentially a Web Application Firewall (WAF).

## 5. Scalability Considerations

*   **Stateless API:** The JWT-based authentication makes the API stateless, enabling easy horizontal scaling of application instances.
*   **Caching Layer:** Reduces load on the database by serving frequently requested data from in-memory cache. Can be extended to distributed caches (Redis, Memcached) for multi-instance deployments.
*   **Database:** PostgreSQL is robust and scalable. For extreme loads, consider read replicas, sharding, or moving to a managed database service.
*   **Asynchronous Processing:** For long-running tasks (e.g., image processing, bulk data imports), a message queue (Kafka, RabbitMQ) and separate worker services could be introduced.
*   **Microservices:** While currently a monolithic design, the clear layering and domain separation would facilitate a transition to a microservices architecture if the complexity and scale warrant it in the future.

This architecture provides a solid foundation for an enterprise-grade CMS, balancing functionality, performance, and maintainability.