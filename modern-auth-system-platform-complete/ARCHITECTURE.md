# Authentication System Architecture Documentation

This document outlines the high-level architecture, key components, and design principles of the Authentication System.

## 1. High-Level Overview

The Authentication System is a full-stack web application designed to provide secure user authentication and authorization functionalities. It follows a layered, modular architecture, adhering to common enterprise patterns.

It consists of:
*   A **Backend API** built with Spring Boot (Java) responsible for business logic, data persistence, and exposing RESTful endpoints.
*   A **PostgreSQL Database** for storing user and role information.
*   A **Frontend Application** (basic HTML/JS for demonstration) that interacts with the Backend API.
*   **Containerization** with Docker for easy deployment and environment consistency.

```
+-------------------+      +---------------------+      +---------------------+
|   User (Browser)  |<---->|   Frontend (HTML/JS)  |<---->| Backend API (Spring Boot) |<---->|  PostgreSQL Database  |
|                   |      |                     |      |                     |      |                       |
+-------------------+      +---------------------+      +---------------------+      +---------------------+
                                   ^                       ^         |
                                   |                       |         | Logging/Metrics
                                   |                       |         V
                                   |                       +------------------+
                                   |                       |  Monitoring &    |
                                   |                       |  Alerting (Actuator)|
                                   |                       +------------------+
                                   |
                                   +--------------------------+
                                   |       Docker Compose     |
                                   | (Containerization/Orchestration) |
                                   +--------------------------+
```

## 2. Backend Architecture (Spring Boot)

The backend is a Spring Boot application structured into several layers and modules to promote separation of concerns and maintainability.

### 2.1. Layered Architecture

*   **Controller Layer (`com.authapp.controller`):**
    *   Handles incoming HTTP requests.
    *   Performs input validation (using `jakarta.validation`).
    *   Delegates business logic to the Service Layer.
    *   Returns HTTP responses.
    *   Utilizes `@RestController` and `@RequestMapping`.
*   **Service Layer (`com.authapp.service`):**
    *   Contains the core business logic of the application.
    *   Orchestrates operations across multiple repositories.
    *   Applies `@Transactional` annotations for ACID properties.
    *   Handles exceptions and converts them into business-specific exceptions.
    *   Uses Spring Security `UserDetailsService` for user loading.
*   **Repository Layer (`com.authapp.repository`):**
    *   Responsible for data access operations.
    *   Extends `JpaRepository` from Spring Data JPA for CRUD operations.
    *   Defines custom query methods (e.g., `findByUsername`, `existsByEmail`).
*   **Model Layer (`com.authapp.model`):**
    *   Defines the JPA entities that map to database tables (`User`, `Role`).
    *   Includes `RoleName` enum for defining user roles.
    *   Uses Lombok for boilerplate code reduction (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`).
    *   `@EntityListeners(AuditingEntityListener.class)` for `createdAt` and `updatedAt` automatic population.
*   **DTO Layer (`com.authapp.dto`):**
    *   Data Transfer Objects for transferring data between client and server, and between different layers.
    *   Separates internal data model from API representation.
    *   Used in controllers for request bodies and response payloads.
*   **Security Layer (`com.authapp.config`, `com.authapp.util`, `com.authapp.service.JwtUserDetailsService`):**
    *   **Spring Security:** Configured to secure HTTP endpoints.
    *   **JWT (JSON Web Tokens):** Used for stateless authentication.
        *   `JwtTokenUtil`: Utility for generating, parsing, and validating JWTs.
        *   `JwtRequestFilter`: Intercepts incoming requests, validates JWT, and sets Spring Security context.
        *   `JwtAuthenticationEntryPoint`: Handles unauthorized access attempts.
    *   `JwtUserDetailsService`: Loads user-specific data during authentication.
    *   Role-based authorization using `hasRole()` in `@PreAuthorize` annotations.
*   **Exception Handling (`com.authapp.exception`):**
    *   `GlobalExceptionHandler`: Centralized exception handling using `@ControllerAdvice` to provide consistent error responses (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error).
    *   Custom exceptions like `ResourceNotFoundException`.
*   **Configuration Layer (`com.authapp.config`):**
    *   Contains configuration classes for Spring Security, OpenAPI (Swagger), etc.

### 2.2. Data Flow

1.  **Request Initiation:** A client (e.g., Frontend) sends an HTTP request to the Backend API.
2.  **JWT Authentication Filter (`JwtRequestFilter`):**
    *   Intercepts requests with an `Authorization: Bearer <token>` header.
    *   Validates the JWT signature and expiration.
    *   If valid, extracts the username and loads user details via `JwtUserDetailsService`.
    *   Sets the `Authentication` object in `SecurityContextHolder`.
3.  **Spring Security Filters:** Other Spring Security filters apply, including authorization checks (`@PreAuthorize`).
4.  **Controller:** The appropriate controller method receives the request. Input validation is performed.
5.  **Service:** The controller invokes a service method to execute business logic.
6.  **Repository:** The service interacts with one or more repositories to fetch or persist data.
7.  **Database:** The repository communicates with the PostgreSQL database.
8.  **Response Generation:** Data is returned through the layers (Repository -> Service -> Controller), mapped to DTOs, and sent back as an HTTP response to the client.

## 3. Database Architecture (PostgreSQL)

*   **Technology:** PostgreSQL is chosen for its robustness, reliability, and rich feature set suitable for enterprise applications.
*   **Schema:**
    *   `users`: Stores user credentials (username, email, hashed password) and audit timestamps.
    *   `roles`: Stores predefined roles (`ROLE_USER`, `ROLE_ADMIN`).
    *   `user_roles`: A many-to-many join table linking users to their roles.
*   **Migrations:** Flyway is used for managing database schema changes and initial data seeding. It ensures that the database schema evolves predictably and consistently across environments.
*   **ORM:** Spring Data JPA with Hibernate as the JPA provider simplifies data access and object-relational mapping.

## 4. Frontend Architecture (Basic HTML/JS)

The provided frontend is a simple HTML page with vanilla JavaScript. It demonstrates:
*   Making asynchronous requests to the backend API (`fetch` API).
*   Handling user input for registration and login.
*   Storing JWT in `localStorage` for session management.
*   Displaying user-specific content based on authentication status and roles.
*   Basic error and success message display.

For a full-scale production application, a modern JavaScript framework like React, Angular, or Vue.js would be used to build a richer and more maintainable UI.

## 5. DevOps & Infrastructure

*   **Docker:** Used for containerizing the Spring Boot application and PostgreSQL database, ensuring environment consistency from development to production.
*   **Docker Compose:** Orchestrates the multi-container application locally, simplifying setup and interaction between services.
*   **CI/CD (GitHub Actions - Conceptual):** A workflow is defined to automate:
    *   Code checkout.
    *   Maven build (compile, package).
    *   Unit, Integration, and API tests.
    *   Code quality checks (e.g., JaCoCo coverage).
    *   Docker image building and pushing to a registry (e.g., Docker Hub, GitHub Container Registry).
    *   Deployment triggers (manual or automated to staging/production).
*   **Monitoring:** Spring Boot Actuator endpoints (`/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`) are enabled to expose operational information and metrics for integration with monitoring tools like Prometheus and Grafana.
*   **Logging:** Configured with SLF4J and Logback for structured logging, allowing easy integration with centralized logging systems.

## 6. Security Considerations

*   **Password Hashing:** BCrypt algorithm is used for securely storing user passwords.
*   **JWT Security:**
    *   Tokens are signed with a strong, asymmetric key to prevent tampering.
    *   Tokens have a defined expiration time.
    *   Tokens are transmitted over HTTPS to prevent interception.
    *   While not explicitly implemented in this initial version, refresh tokens can be added for enhanced security and better user experience for longer sessions.
*   **Input Validation:** All API endpoints validate incoming request data to prevent common vulnerabilities like SQL injection and cross-site scripting (XSS).
*   **CORS:** Cross-Origin Resource Sharing is disabled by default in Spring Security; for a production frontend hosted separately, proper CORS configuration is essential.
*   **Rate Limiting:** Not implemented in this version but crucial for production to prevent brute-force attacks and resource exhaustion. (Could be added via a Spring Cloud Gateway or custom filter).

## 7. Future Enhancements

*   **Refresh Tokens:** Implement refresh token mechanism for better JWT management and security.
*   **OAuth2/OpenID Connect:** Integrate with an industry-standard protocol for more complex authentication flows and third-party integrations.
*   **Multi-Factor Authentication (MFA):** Add support for SMS, email, or authenticator app-based MFA.
*   **Email Verification:** Implement email verification for new user registrations.
*   **Password Reset:** Add "Forgot Password" functionality with email-based token reset.
*   **Auditing:** Enhance auditing beyond `createdAt`/`updatedAt` to include who performed actions.
*   **Caching:** Implement a caching layer (e.g., Redis) for frequently accessed data (e.g., user roles, session data) to improve performance.
*   **Rate Limiting:** Implement rate limiting on authentication endpoints to prevent brute-force attacks.
*   **Frontend Framework:** Replace the basic HTML/JS frontend with a robust framework (React, Angular, Vue.js).
*   **Error Reporting:** Integrate with an error tracking service (e.g., Sentry, Bugsnag).
*   **Health Checks:** More advanced custom health indicators for specific services.
```