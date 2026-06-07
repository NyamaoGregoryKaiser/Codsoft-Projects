```markdown
# Architecture Documentation: Comprehensive Authentication System

This document outlines the high-level architecture of the Authentication System, providing an overview of its components, their interactions, and the design principles guiding its development.

## 1. System Overview

The Authentication System is a full-stack web application designed to manage users and products with robust authentication and authorization mechanisms. It consists of a Java Spring Boot backend, a React frontend, and a PostgreSQL database, all orchestrated using Docker Compose for ease of development and deployment.

## 2. Core Components

The system is logically divided into three main layers:

### 2.1. Frontend (React Application)

*   **Purpose**: Provides the user interface for interacting with the system. Handles user input, displays data, and manages client-side authentication state.
*   **Key Responsibilities**:
    *   User registration and login forms.
    *   Displaying protected dashboards and administration panels.
    *   Making API calls to the backend using JWT for authentication.
    *   Client-side JWT storage (localStorage) and token refresh logic.
    *   Route protection based on user authentication status and roles.
*   **Technologies**: React 18, React Router, Axios, JWT-Decode, HTML/CSS (Bootstrap for basic styling).

### 2.2. Backend (Spring Boot Application)

*   **Purpose**: Serves as the central API for the frontend, enforcing business rules, handling data persistence, and managing all security concerns.
*   **Key Modules/Layers**:
    *   **Controllers (`com.example.authsystem.controller`)**:
        *   Expose RESTful API endpoints (e.g., `/api/auth`, `/api/users`, `/api/products`).
        *   Handle incoming HTTP requests and map them to appropriate service methods.
        *   Perform input validation using `@Valid` annotations.
        *   Responsible for returning HTTP responses.
    *   **Services (`com.example.authsystem.service`)**:
        *   Implement the core business logic.
        *   Orchestrate data operations, interact with repositories.
        *   Enforce authorization rules (e.g., using `@PreAuthorize`).
        *   Manage transactions (`@Transactional`).
    *   **Repositories (`com.example.authsystem.repository`)**:
        *   Interface-based data access using Spring Data JPA.
        *   Abstracts database interactions (CRUD operations).
    *   **Entities (`com.example.authsystem.entity`)**:
        *   JPA entities (`User`, `Role`, `Product`) representing database tables.
        *   Define relationships and data structures.
        *   `User` entity implements Spring Security's `UserDetails`.
    *   **Configuration (`com.example.authsystem.config`)**:
        *   **Spring Security Configuration (`SecurityConfig.java`)**: Defines security filter chain, authentication providers, password encoder, CORS settings, and public/protected URL patterns.
        *   **JWT Configuration (`JwtAuthFilter.java`, `JwtUtil.java`)**: Filters for validating JWTs and utility for token generation/parsing.
        *   **OpenAPI Configuration (`OpenApiConfig.java`)**: Configures Swagger/OpenAPI documentation.
        *   **Cache Configuration (`CacheConfig.java`)**: Sets up Caffeine local cache.
    *   **DTOs (`com.example.authsystem.dto`)**:
        *   Data Transfer Objects for input/output of API endpoints.
        *   Decouple internal entities from external API contracts.
    *   **Exceptions (`com.example.authsystem.exception`)**:
        *   Custom exceptions for specific business errors.
        *   `GlobalExceptionHandler` for consistent error responses across the API.
    *   **Utilities & Cross-Cutting Concerns**:
        *   **`RateLimitFilter.java`**: Implements basic rate limiting for API endpoints.
        *   **`RequestLoggingFilter.java`**: Logs incoming request and outgoing response details for auditing and debugging.
        *   **Actuator**: Provides production-ready features like health checks and metrics (`/actuator/prometheus`).
*   **Technologies**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA, PostgreSQL, Flyway, JJWT, Lombok, Caffeine, Logback, Springdoc-OpenAPI, Maven.

### 2.3. Database (PostgreSQL)

*   **Purpose**: Persistent storage for all application data.
*   **Schema**:
    *   `users`: Stores user information (first name, last name, email, hashed password).
    *   `roles`: Stores predefined roles (USER, ADMIN).
    *   `user_roles`: Join table for many-to-many relationship between users and roles.
    *   `products`: Stores product details (name, description, price, stock).
*   **Migration**: Flyway is used to manage database schema evolution and seed initial data.
*   **Technologies**: PostgreSQL 15, Flyway.

## 3. Data Flow (Authentication Example)

1.  **User Registration/Login (Frontend to Backend)**:
    *   User enters credentials on the React frontend.
    *   Frontend sends `POST /api/auth/register` or `POST /api/auth/login` to the backend.
    *   `RequestLoggingFilter` logs the incoming request.
    *   `RateLimitFilter` checks if the client has exceeded the request limit.
    *   `AuthController` receives the request, validates input.
    *   `AuthService` handles business logic: checks for existing users (registration), authenticates credentials using `AuthenticationManager` (login), interacts with `UserRepository` and `RoleRepository`.
    *   `PasswordEncoder` hashes/verifies passwords.
    *   `JwtUtil` generates `accessToken` and `refreshToken`.
    *   Backend returns `AuthResponse` (containing tokens) to the frontend.
    *   Frontend stores tokens in `localStorage` and updates global `AuthContext`.

2.  **Accessing Protected Resources (Frontend to Backend)**:
    *   Frontend (e.g., `DashboardPage`) attempts to access `GET /api/products`.
    *   `authorizedApi` (Axios instance) in the frontend's `auth.service.js` automatically attaches the `accessToken` from `localStorage` to the `Authorization` header (`Bearer <token>`).
    *   The `AuthContext` handles token refresh if the access token is expired using the `refreshToken`.
    *   `RequestLoggingFilter` logs the incoming request.
    *   `JwtAuthFilter` intercepts the request, extracts JWT, validates it using `JwtUtil`, and sets up `SecurityContextHolder`.
    *   Spring Security's `@PreAuthorize` on `ResourceController` method checks if the authenticated user has the required roles (e.g., `hasAnyRole('USER', 'ADMIN')`).
    *   If authorized, `ResourceController` delegates to `ProductService`.
    *   `ProductService` retrieves data from `ProductRepository` (potentially using `Caffeine` cache).
    *   Backend returns product data.

## 4. Security Aspects

*   **JWT (JSON Web Tokens)**: Used for stateless authentication. Access tokens are short-lived, refresh tokens are longer-lived.
*   **Role-Based Access Control (RBAC)**: Managed by Spring Security's `@PreAuthorize` annotations on controller methods.
*   **Password Hashing**: BCrypt algorithm is used for securely storing user passwords.
*   **CORS**: Configured to allow cross-origin requests from the React frontend.
*   **Input Validation**: `jakarta.validation` annotations ensure data integrity and prevent common vulnerabilities.
*   **Error Handling**: A `GlobalExceptionHandler` provides consistent and informative error messages.
*   **Rate Limiting**: Protects authentication endpoints from brute-force attacks.

## 5. Observability

*   **Logging**: `Logback` configuration for structured logging to console and files. `RequestLoggingFilter` provides detailed request/response logs.
*   **Monitoring**: Spring Boot Actuator endpoints (e.g., `/actuator/health`, `/actuator/prometheus`) provide insights into application health and metrics for integration with monitoring tools (Prometheus, Grafana).

## 6. Deployment Strategy

The system is designed for containerized deployment using Docker. `docker-compose.yml` orchestrates the backend, frontend (Nginx serving static files), and PostgreSQL database. This allows for consistent environments across development, testing, and production. GitHub Actions are configured to automate the build, test, and deployment process.

## 7. Scalability Considerations

*   **Stateless Backend**: The JWT-based authentication makes the backend stateless, allowing for easy horizontal scaling of backend instances.
*   **Database**: PostgreSQL can be scaled vertically or horizontally using techniques like replication and sharding (beyond the scope of this initial project).
*   **Caching**: Local Caffeine cache improves response times for frequently accessed data. For a distributed system, this would be replaced with an external cache like Redis.
*   **Load Balancing**: In a production environment, a load balancer (e.g., Nginx, AWS ALB) would distribute traffic among multiple backend instances.
```