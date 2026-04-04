# Secure Project Management System

This is a comprehensive, production-ready Project Management System built with Spring Boot, focusing on robust security implementations, clean architecture, and full-stack capabilities.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Setup and Installation](#setup-and-installation)
    - [Prerequisites](#prerequisites)
    - [Running with Maven](#running-with-maven)
    - [Running with Docker Compose](#running-with-docker-compose)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Management:** Registration, Login, Logout with form-based (UI) and JWT-based (API) authentication.
- **Role-Based Access Control (RBAC):** Users can have `ROLE_USER` or `ROLE_ADMIN` with fine-grained access to resources.
- **Project Management:** CRUD operations for projects, including ownership.
- **Task Management:** CRUD operations for tasks associated with projects, including assignment to users.
- **Comment System:** Add comments to tasks.
- **Password Security:** BCrypt hashing for stored passwords.
- **Rate Limiting:** Prevents abuse and protects against brute-force attacks.
- **Caching:** Improves performance for frequently accessed data.
- **Error Handling:** Centralized exception handling with clear error responses.
- **Logging & Monitoring:** Structured logging and Spring Boot Actuator endpoints for health checks and metrics.
- **Database Migrations:** Managed with Liquibase.
- **Containerization:** Docker support for easy deployment.
- **CI/CD:** Basic GitHub Actions workflow for automated build, test, and deployment.

## Technologies Used

- **Backend:**
    - Java 17
    - Spring Boot 3.x
    - Spring Data JPA
    - Spring Security (with JWT)
    - Project Lombok
    - Liquibase
    - H2 Database (in-memory for development/testing), PostgreSQL (for Docker)
    - Caffeine (for caching)
    - Bucket4j (for rate limiting)
- **Frontend:**
    - Thymeleaf (server-side rendering)
    - HTML5, CSS3
- **Build Tool:**
    - Apache Maven
- **Containerization:**
    - Docker, Docker Compose
- **CI/CD:**
    - GitHub Actions
- **Testing:**
    - JUnit 5
    - Mockito
    - Spring Boot Test
    - Testcontainers
    - JaCoCo (for code coverage)

## Architecture

The application follows a standard layered architecture:

-   **Presentation Layer (Controllers):** Handles HTTP requests, maps URLs to actions, and manages UI rendering (Thymeleaf) or API responses (JSON).
-   **Service Layer:** Contains business logic, transaction management, and orchestrates operations between repositories. Also where `@PreAuthorize` and `@Cacheable` annotations are applied.
-   **Persistence Layer (Repositories):** Interacts with the database using Spring Data JPA.
-   **Domain Layer (Models):** POJOs representing database entities and core business objects.
-   **Security Layer:** Customizes Spring Security for authentication (JWT, Form), authorization (RBAC), and filters (Rate Limiting).
-   **Configuration Layer:** Sets up application properties, database connections, security rules, and caching.

(See `ARCHITECTURE.md` for more detailed diagrams and explanations.)

## Setup and Installation

### Prerequisites

-   Java 17 JDK
-   Maven 3.x
-   Docker and Docker Compose (optional, but recommended for production-like setup)
-   Git

### Running with Maven (Local H2 Database)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/secure-project-management.git
    cd secure-project-management
    ```

2.  **Build the project:**
    ```bash
    mvn clean install
    ```
    This will compile the code, run tests, and package the application into a JAR file.

3.  **Run the application:**
    ```bash
    mvn spring-boot:run
    ```
    The application will start on `http://localhost:8080`. An in-memory H2 database will be used, initialized with Liquibase seed data (admin/user accounts).

    -   **Admin User:** `username: admin`, `password: adminpass`
    -   **Regular User:** `username: user`, `password: userpass`

    You can access the H2 console at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:projectdb`, Username: `sa`, Password: `password`).

### Running with Docker Compose (PostgreSQL Database)

This is the recommended setup for a more production-like environment.

1.  **Build the Docker image:**
    ```bash
    docker build -t secure-pm .
    ```
    (Alternatively, `docker-compose build` will also build the `app` service image.)

2.  **Start the services:**
    ```bash
    docker-compose up -d
    ```
    This will start the PostgreSQL database and the Spring Boot application. It might take a minute for the database and application to fully initialize.

3.  **Access the application:**
    The application will be available at `http://localhost:8080`.
    The PostgreSQL database will be accessible on `localhost:5432`.

4.  **Stop the services:**
    ```bash
    docker-compose down
    ```

## Security Features

This project implements a comprehensive set of security features:

-   **Authentication:**
    -   **Form-based Login:** For traditional web UI (Thymeleaf).
    -   **JWT (JSON Web Token) Authentication:** For stateless REST API endpoints. Tokens are issued upon successful login and validated for subsequent API requests.
    -   **Password Hashing:** Passwords are securely stored using BCrypt.
-   **Authorization:**
    -   **Role-Based Access Control (RBAC):** Users are assigned roles (`ROLE_USER`, `ROLE_ADMIN`).
    -   **Method-Level Security:** Using `@PreAuthorize` annotations to enforce specific role or ownership checks before method execution (e.g., only project owners or admins can edit a project).
-   **Rate Limiting:** A custom `RateLimitFilter` (using Bucket4j) limits the number of requests per IP address to prevent brute-force and denial-of-service attacks. Configurable via `application.yml`.
-   **Secure Defaults:**
    -   CSRF protection for UI forms (disabled for `/api` paths as JWT handles statelessness).
    -   HttpOnly and Secure flags for session cookies (for production with HTTPS).
    -   Frame Options header for H2 console.
    -   Validation for DTOs to prevent malformed data.
    -   Centralized exception handling for graceful error responses.

## API Documentation

The API endpoints follow RESTful principles. A full OpenAPI (Swagger) specification would typically be generated using libraries like Springdoc-OpenAPI.

**Conceptual API Endpoints:**

-   **Authentication:**
    -   `POST /api/auth/register` - Register a new user.
        -   Body: `{"username": "...", "email": "...", "password": "..."}`
        -   Response: `201 Created` or `400 Bad Request`
    -   `POST /api/auth/login` - Authenticate user and get JWT.
        -   Body: `{"username": "...", "password": "..."}`
        -   Response: `200 OK` with `{"accessToken": "...", "tokenType": "Bearer", "userId": ..., "username": "...", "roles": "ROLE_USER,ROLE_ADMIN"}` and JWT cookie.
-   **Projects (Requires JWT in `Authorization: Bearer <token>` header or `jwtToken` cookie):**
    -   `GET /api/projects` - Get all projects.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN`
    -   `GET /api/projects/{id}` - Get project by ID.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (owner or admin only)
    -   `POST /api/projects` - Create a new project.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN`
        -   Body: `{"name": "...", "description": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}`
    -   `PUT /api/projects/{id}` - Update an existing project.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (owner or admin only)
        -   Body: `{"name": "...", "description": "...", ...}`
    -   `DELETE /api/projects/{id}` - Delete a project.
        -   Auth: `ROLE_ADMIN` (or owner)
-   **Tasks (Requires JWT):**
    -   `GET /api/projects/{projectId}/tasks` - Get all tasks for a project.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner or assignee)
    -   `GET /api/projects/{projectId}/tasks/{taskId}` - Get task by ID.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner or assignee)
    -   `POST /api/projects/{projectId}/tasks` - Create a new task.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner)
        -   Body: `{"title": "...", "description": "...", "status": "OPEN", "priority": "MEDIUM", "dueDate": "YYYY-MM-DD", "assignedToId": ...}`
    -   `PUT /api/projects/{projectId}/tasks/{taskId}` - Update an existing task.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner or assignee)
        -   Body: `{"title": "...", "description": "...", ...}`
    -   `DELETE /api/projects/{projectId}/tasks/{taskId}` - Delete a task.
        -   Auth: `ROLE_ADMIN` (or project owner)
-   **Comments (Requires JWT):**
    -   `GET /api/projects/{projectId}/tasks/{taskId}/comments` - Get all comments for a task.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner or task assignee)
    -   `GET /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}` - Get comment by ID.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner, task assignee or comment owner)
    -   `POST /api/projects/{projectId}/tasks/{taskId}/comments` - Create a new comment.
        -   Auth: `ROLE_USER`, `ROLE_ADMIN` (project owner or task assignee)
        -   Body: `{"content": "..."}`
    -   `PUT /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}` - Update an existing comment.
        -   Auth: `ROLE_ADMIN` (or comment owner)
        -   Body: `{"content": "..."}`
    -   `DELETE /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}` - Delete a comment.
        -   Auth: `ROLE_ADMIN` (or comment owner)

## Testing

The project includes unit, integration, and API tests to ensure quality and correctness.

-   **Unit Tests:** Focus on individual components (e.g., service methods, repository methods) using Mockito for dependencies. (Example: `UserServiceTest.java`)
-   **Integration Tests:** Test interactions between components (e.g., controller to service, service to repository). Spring Boot's testing utilities and `Testcontainers` are used for a real database environment. (Examples: `AuthControllerIntegrationTest.java`, `ProjectControllerIntegrationTest.java`)
-   **API Tests:** Test public API endpoints, including authentication and authorization flows. `MockMvc` is used for in-container API testing.
-   **Code Coverage:** Achieved using JaCoCo. The `pom.xml` is configured to aim for 80%+ line coverage and will fail the build if not met.

To run all tests and generate coverage report:
```bash
mvn clean verify
```
The JaCoCo report will be generated in `target/site/jacoco/index.html`.

## Deployment

Refer to `DEPLOYMENT.md` for a detailed guide on deploying the application to various environments.

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes, adhering to code style and best practices.
4.  Write comprehensive tests for your changes.
5.  Ensure all tests pass and code coverage requirements are met.
6.  Submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.