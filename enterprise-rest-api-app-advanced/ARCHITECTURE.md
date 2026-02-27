# Architecture Documentation for ProjectPulse

This document describes the architecture of the ProjectPulse application, outlining its various components, layers, and how they interact.

## 1. High-Level Overview

ProjectPulse is a full-stack web application following a client-server architecture.
It consists of:

*   **Frontend:** A Single Page Application (SPA) built with React.js, responsible for the user interface and interactions.
*   **Backend:** A RESTful API built with Spring Boot, handling business logic, data persistence, security, and external integrations.
*   **Database:** A PostgreSQL relational database, storing all application data.

These components communicate primarily via HTTP requests (REST APIs) and are containerized using Docker for consistency across environments.

```mermaid
graph TD
    User((User)) --> |HTTP/HTTPS| Frontend[React SPA]
    Frontend --> |HTTP/HTTPS (REST API)| Backend[Spring Boot API]
    Backend --> |JDBC| Database[PostgreSQL]
    Backend --> |Logs/Metrics| Monitoring[Monitoring Tools (e.g., Prometheus/Grafana)]
    Backend --> |Email/SMS (future)| ExternalServices[External Services]
```

## 2. Backend Architecture (Spring Boot)

The backend follows a layered architecture, promoting separation of concerns and maintainability.

### 2.1. Layers

1.  **Controller Layer (`com.projectpulse.projectpulse.*.controller`)**:
    *   **Responsibility:** Handles incoming HTTP requests, performs input validation (using JSR-303 annotations), delegates requests to the Service Layer, and returns HTTP responses.
    *   **Technologies:** Spring Web (REST Controllers), JSR-303 (Jakarta Validation).
    *   **Authentication/Authorization:** Uses Spring Security's `@PreAuthorize` annotations and custom access checkers to control endpoint access.
    *   **API Documentation:** Annotated with OpenAPI (`@Tag`, `@Operation`, `@SecurityRequirement`) for Swagger UI generation.

2.  **Service Layer (`com.projectpulse.projectpulse.*.service`)**:
    *   **Responsibility:** Contains the core business logic, orchestrates operations across multiple repositories, and applies transactional boundaries.
    *   **Technologies:** Spring's `@Service` annotation, `@Transactional` annotation.
    *   **Security Context:** Interacts with `SecurityContextHolder` to get authenticated user details for authorization checks within business logic.
    *   **Caching:** Uses Spring's caching annotations (`@Cacheable`, `@CachePut`, `@CacheEvict`) for performance optimization.

3.  **Repository Layer (`com.projectpulse.projectpulse.*.repository`)**:
    *   **Responsibility:** Handles data access operations, communicating directly with the database.
    *   **Technologies:** Spring Data JPA, providing interfaces extending `JpaRepository` for common CRUD operations and custom query methods.

4.  **Entity Layer (`com.projectpulse.projectpulse.*.entity`)**:
    *   **Responsibility:** Defines the data models (POJOs) that map directly to database tables.
    *   **Technologies:** JPA annotations (`@Entity`, `@Table`, `@Id`, `@Column`, `@OneToMany`, `@ManyToOne`).
    *   **Lombok:** Used for boilerplate code reduction (`@Data`, `@NoArgsConstructor`).

5.  **DTO Layer (`com.projectpulse.projectpulse.*.dto`)**:
    *   **Responsibility:** Data Transfer Objects used to transfer data between the client and the server, and between different layers of the backend. They hide internal entity structures and tailor data for specific API needs.
    *   **Technologies:** Simple POJOs. Validation annotations (`@NotBlank`, `@Size`, `@Email`) are applied here.

### 2.2. Cross-Cutting Concerns

*   **Authentication & Authorization (`com.projectpulse.projectpulse.auth`, `config.SecurityConfig`, `auth.jwt`)**:
    *   **Mechanism:** JWT (JSON Web Tokens).
    *   **Flow:** User sends credentials -> `AuthController` authenticates via `AuthenticationManager` -> `JwtService` generates JWT -> Token is returned. For subsequent requests, `JwtAuthFilter` extracts and validates the token, setting `SecurityContextHolder`.
    *   **Roles:** `USER`, `ADMIN` defined in `User` entity, used for `ROLE_` prefixed authorities.

*   **Exception Handling (`com.projectpulse.projectpulse.exception`)**:
    *   **Mechanism:** `@ControllerAdvice` with `@ExceptionHandler` methods.
    *   **Purpose:** Provides a consistent JSON error response format across the API for different exception types (e.g., `ResourceNotFoundException`, `UnauthorizedException`, `MethodArgumentNotValidException`).
    *   **Logging:** Errors are logged with appropriate levels.

*   **Logging (`application.yml`)**:
    *   **Mechanism:** SLF4J with Logback (Spring Boot default).
    *   **Configuration:** Configured to output to console and a file (`logs/projectpulse.log`). Debugging levels set for application packages.

*   **Monitoring (`application.yml`, Spring Boot Actuator`)**:
    *   **Mechanism:** Spring Boot Actuator exposes endpoints like `/health`, `/info`, `/metrics`, `/loggers`, `/caches`.
    *   **Metrics:** Configured to expose metrics in Prometheus format for easy integration with Prometheus/Grafana.

*   **Caching (`config.CacheConfig`, `@EnableCaching`)**:
    *   **Mechanism:** Spring Cache Abstraction with Caffeine as the in-memory cache provider.
    *   **Purpose:** Reduces database load and improves response times for frequently accessed immutable or slowly changing data (e.g., projects, tasks, user profiles).
    *   **Configuration:** Cache names and eviction policies defined in `CacheConfig.java` and `application.yml`.

*   **Rate Limiting (`config.RateLimitingInterceptor`)**:
    *   **Mechanism:** Custom `HandlerInterceptor` using `Bucket4j` library.
    *   **Purpose:** Prevents abuse by limiting the number of requests a client can make within a specified time window (e.g., 10 requests per minute per IP).
    *   **Error Response:** Returns `429 Too Many Requests` status.

*   **CORS (`config.SecurityConfig`)**:
    *   **Mechanism:** Spring Security's `CorsConfigurationSource` bean.
    *   **Configuration:** Configured to allow requests from the frontend origin (`http://localhost:3000`) and other specified origins, methods, and headers.

### 2.3. Data Flow within Backend

1.  **Request:** HTTP request hits `ProjectController`.
2.  **Authentication Filter:** `JwtAuthFilter` validates JWT, sets `SecurityContext`.
3.  **Authorization:** Spring Security checks `@PreAuthorize` on controller method.
4.  **Validation:** `@Valid` annotation triggers DTO validation.
5.  **Controller Delegation:** Controller calls `ProjectService`.
6.  **Service Logic:** Service layer performs business logic, possibly with additional authorization checks (e.g., `isProjectCreator` logic).
7.  **Data Access:** Service calls `ProjectRepository` for database operations.
8.  **Database Interaction:** `ProjectRepository` (via JPA/Hibernate) interacts with PostgreSQL.
9.  **Response:** Data flows back from database -> repository -> service -> controller -> HTTP response to client.

```mermaid
graph LR
    A[HTTP Request] --> B{JWTAuthFilter}
    B -- Valid Token --> C[SecurityContextHolder]
    B -- Invalid Token --> D[401 Unauthorized]
    C --> E[Controller (e.g., ProjectController)]
    E -- @PreAuthorize --> F{Spring Security Authorization}
    F -- Authorized --> G[Input Validation (@Valid)]
    G -- Valid DTO --> H[Service (e.g., ProjectService)]
    H -- Business Logic / Caching --> I[Repository (e.g., ProjectRepository)]
    I -- JPA / Hibernate --> J[PostgreSQL Database]
    J -- Data --> I
    I -- Data --> H
    H -- DTO --> E
    E -- HTTP Response --> K[Client]
    F -- Not Authorized --> L[403 Forbidden]
    G -- Invalid DTO --> M[400 Bad Request]
    H -- Exception --> N[GlobalExceptionHandler]
    N -- Error Response --> K
```

## 3. Frontend Architecture (React)

The frontend is a React Single Page Application (SPA).

### 3.1. Components

*   **`App.js`**: The root component, setting up `react-router-dom` for navigation.
*   **Pages (`src/pages`)**: Top-level components representing distinct views or routes (e.g., `LoginPage`, `ProjectListPage`, `ProjectDetailsPage`).
*   **Components (`src/components`)**: Reusable UI elements (e.g., `Header`, `Button`, `InputField`, `Spinner`, `ProtectedRoute`).
*   **Auth Context (`src/auth/AuthContext.js`)**: Manages authentication state (`isAuthenticated`, `user`, `jwtToken`). Provides `signIn`, `signUp`, `signOut` functions.
*   **Hooks (`src/hooks/useAuth.js`)**: Custom hook to easily consume the `AuthContext`.
*   **API Client (`src/api/projectPulseApi.js`)**: An Axios instance configured with base URL and request/response interceptors (for JWT handling and global error handling).

### 3.2. Data Flow within Frontend

1.  **User Interaction:** User interacts with UI components (e.g., clicks login button).
2.  **Event Handler:** Component's event handler calls a function from `useAuth` or directly from `projectPulseApi`.
3.  **API Call:** `projectPulseApi` (Axios) makes an HTTP request to the backend.
    *   `request interceptor`: Attaches JWT token from `localStorage` if available.
4.  **Backend Response:** Backend processes request and sends a JSON response.
5.  **Response Handling:**
    *   `response interceptor`: Catches global errors (e.g., 401 Unauthorized) and can initiate logout/redirect.
    *   Component/Auth Context receives data or error.
6.  **State Update:** Component/Auth Context updates its local state or global authentication state.
7.  **UI Re-render:** React re-renders affected parts of the UI based on new state.

```mermaid
graph LR
    A[User Action (e.g., Login)] --> B[React Component (e.g., LoginPage)]
    B --> C[useAuth Hook / projectPulseApi]
    C -- API Request --> D[Axios Request Interceptor]
    D -- Add JWT (if exists) --> E[HTTP Request to Backend]
    E -- HTTP Response from Backend --> F[Axios Response Interceptor]
    F -- Handle Global Errors (e.g., 401) --> G[Error Handling / Redirect]
    F -- Success Response --> C
    C -- Update State --> B
    B --> H[UI Re-render]
```

## 4. Database Layer (PostgreSQL)

*   **Type:** Relational Database.
*   **Schema Definition:** `db/schema.sql` defines tables, relationships (foreign keys), and indexes for `users`, `projects`, and `tasks`.
*   **Seed Data:** `db/data.sql` populates the database with initial users and sample data.
*   **Query Optimization:**
    *   **Indexing:** Critical fields (e.g., `username`, `email`, foreign keys) are indexed to speed up lookup operations.
    *   **JPA/Hibernate:** Leveraging JPA's query optimization capabilities. Custom queries are minimized where `Spring Data JPA` derived query methods are sufficient and optimized.
    *   **Lazy Loading:** Default for `@ManyToOne` and `@OneToMany` to prevent N+1 issues; fetched explicitly only when needed to avoid performance overhead.

## 5. Deployment & CI/CD

*   **Docker Compose:** Facilitates local development and easy orchestration of services.
*   **Dockerfiles:** Provided for both backend and frontend for containerization.
*   **CI/CD Pipeline (Conceptual):** Defined in `CI_CD_PIPELINE.md`, emphasizing automated testing, building, and deployment stages.

This architectural overview provides a solid foundation for understanding, maintaining, and extending the ProjectPulse application.
```