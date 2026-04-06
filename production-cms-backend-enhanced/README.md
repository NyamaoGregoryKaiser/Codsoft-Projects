# CMS System: Production-Ready Content Management System

## Overview
The CMS System is a comprehensive, enterprise-grade content management solution built using Spring Boot (Java) for the backend and a minimal Thymeleaf-based UI, while offering a full RESTful API for integration with modern frontend frameworks (e.g., React, Angular, Vue.js). It supports user management with role-based access control, content creation/editing/publishing, category management, and is designed for scalability, security, and maintainability.

## Features
*   **Core Application (Spring Boot):**
    *   RESTful API endpoints for Users, Content, Categories with full CRUD operations.
    *   Layered architecture: Controllers, Services, Repositories.
    *   Robust business logic and data processing.
    *   Basic Thymeleaf UI for demonstration and quick content management.
*   **Database Layer (PostgreSQL):**
    *   Defined schema for users, roles, categories, content.
    *   Database migrations handled by Flyway.
    *   Seed data for initial roles and an admin user.
    *   Indices for query optimization.
*   **Authentication & Authorization:**
    *   JWT-based authentication for API endpoints.
    *   Session-based authentication for Thymeleaf UI.
    *   Role-based Access Control (`ROLE_ADMIN`, `ROLE_EDITOR`, `ROLE_USER`) using Spring Security's `@PreAuthorize`.
*   **Error Handling:**
    *   Global exception handler with custom error response formats.
    *   Specific exceptions for resource not found, bad requests, etc.
*   **Logging & Monitoring:**
    *   SLF4J with Logback for flexible logging.
    *   Spring Boot Actuator endpoints for application monitoring and health checks.
*   **Caching:**
    *   Spring Cache abstraction with Caffeine as the underlying cache provider.
    *   Annotations (`@Cacheable`, `@CachePut`, `@CacheEvict`) applied to service methods for performance optimization.
*   **Rate Limiting:**
    *   Custom Spring `HandlerInterceptor` using Bucket4j for API request rate limiting based on IP address.
*   **Validation:**
    *   JSR 303/349 (Bean Validation) using `@Valid` annotations on DTOs.
*   **Containerization:**
    *   `Dockerfile` for building the Spring Boot application image.
    *   `docker-compose.yml` for orchestrating the application with a PostgreSQL database.
*   **CI/CD:**
    *   Basic GitHub Actions workflow for automated build, test, Docker image creation, and deployment.
*   **Testing:**
    *   Unit tests (Mockito, JUnit 5).
    *   Integration tests (Spring Boot Test, MockMvc).
    *   Conceptual API and Performance Test Plan.
*   **Documentation:**
    *   Comprehensive `README.md`.
    *   `ARCHITECTURE.md` for system overview.
    *   `API_DOCS.md` for API endpoint details.
    *   `DEPLOYMENT.md` for deployment instructions.

## Technologies Used
*   **Backend:** Java 17, Spring Boot 3.2.x, Spring Data JPA, Spring Security, Lombok, JJWT, Caffeine.
*   **Database:** PostgreSQL, Flyway.
*   **Web:** RESTful APIs, Thymeleaf (for minimal UI).
*   **Build Tool:** Maven.
*   **Containerization:** Docker, Docker Compose.
*   **CI/CD:** GitHub Actions.
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, JaCoCo.

## Setup and Running

### Prerequisites
*   Java 17 JDK
*   Maven 3.x
*   Docker and Docker Compose (Optional, but recommended for easy setup)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cms-system.git
cd cms-system
```

### 2. Database Setup (with Docker Compose)
The easiest way to get the database running is using Docker Compose.

1.  **Create a `.env` file** in the project root directory:
    ```
    DB_NAME=cmsdb
    DB_USERNAME=cmsuser
    DB_PASSWORD=cmspass
    JWT_SECRET_KEY=a_super_secret_key_at_least_32_characters_long_for_production
    ```
    **Note:** For `JWT_SECRET_KEY`, generate a secure Base64-encoded key in production. Example: `openssl rand -base64 32`
2.  **Start the database container:**
    ```bash
    docker-compose up -d db
    ```
    This will start a PostgreSQL container. Flyway will handle schema creation and seeding when the Spring Boot app starts.

### 3. Build and Run the Application

#### A. Using Maven (Local Development)
```bash
# Build the project
mvn clean install -DskipTests

# Run the application (ensure .env variables are set or passed)
# Example:
# export DB_NAME=cmsdb
# export DB_USERNAME=cmsuser
# export DB_PASSWORD=cmspass
# export JWT_SECRET_KEY=a_super_secret_key_at_least_32_characters_long_for_production
mvn spring-boot:run
```
The application will start on `http://localhost:8080`.

#### B. Using Docker Compose (Recommended for Local Dev & Testing)
This will build the application image and start both the app and database containers.

```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost:8080`.

### Default Credentials
Upon first run, an admin user is created if not exists (only in `dev` profile):
*   **Username:** `admin`
*   **Password:** `adminpass`
*   **Roles:** `ROLE_ADMIN`, `ROLE_EDITOR`, `ROLE_USER`

### Accessing the Application
*   **UI Dashboard:** `http://localhost:8080/dashboard` (Requires login with admin/adminpass)
*   **API Endpoints:** `http://localhost:8080/api/...` (See `API_DOCS.md` for details)

## Testing
Run unit and integration tests:
```bash
mvn test
```
To run tests with code coverage report (JaCoCo):
```bash
mvn clean verify
# The report will be generated in target/site/jacoco/index.html
```

## Further Documentation
*   [**ARCHITECTURE.md**](ARCHITECTURE.md): High-level system architecture and design decisions.
*   [**API_DOCS.md**](API_DOCS.md): Detailed API endpoint documentation.
*   [**DEPLOYMENT.md**](DEPLOYMENT.md): Guide for deploying to production environments.
*   [**performance-test-plan.md**](performance-test-plan.md): Conceptual plan for performance testing.

## Contributing
Contributions are welcome! Please feel free to open issues or submit pull requests.

## License
This project is licensed under the MIT License.