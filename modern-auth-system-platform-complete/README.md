# Authentication System with Spring Boot and JWT

This is a comprehensive, production-ready authentication system built using Spring Boot, Spring Security, JWT (JSON Web Tokens), and PostgreSQL. It provides robust user management, including registration, login, profile management, and role-based access control (RBAC). A basic HTML/JavaScript frontend is included for demonstration purposes.

## Features

*   **User Authentication:**
    *   User Registration (Sign-up)
    *   User Login (Sign-in)
    *   Password Hashing (BCrypt)
    *   JWT-based stateless authentication
*   **Authorization:**
    *   Role-Based Access Control (RBAC) with `ROLE_USER` and `ROLE_ADMIN`
    *   Endpoint security with `@PreAuthorize`
*   **User Management:**
    *   Retrieve authenticated user's profile (`/api/users/me`)
    *   Update user's email and password (`/api/users/me`)
    *   Admin functionality: View all users, Delete users (`/api/admin/**`)
*   **Database:**
    *   PostgreSQL
    *   Flyway for database migrations
    *   JPA with Spring Data JPA for data access
*   **API Development:**
    *   RESTful API design
    *   Request/Response DTOs with validation (`jakarta.validation`)
    *   Global exception handling
    *   OpenAPI/Swagger UI for API documentation
*   **Developer Experience:**
    *   Lombok for boilerplate reduction
    *   Docker and Docker Compose for easy setup
    *   Maven for dependency management and build
    *   Actuator endpoints for monitoring
*   **Quality & Testing:**
    *   Unit tests (Mockito, JUnit 5)
    *   Integration tests (Spring Boot Test, Testcontainers for PostgreSQL)
    *   API tests (MockMvc)
    *   JaCoCo for code coverage reporting (aiming for 80%+)
*   **Logging:** SLF4J and Logback configured for structured logging.

## Technologies Used

*   **Backend:** Java 17, Spring Boot 3.2.x, Spring Security 6.2.x, Spring Data JPA, JWT (jjwt)
*   **Database:** PostgreSQL 15
*   **Migrations:** Flyway
*   **Build Tool:** Maven 3.8+
*   **Containerization:** Docker, Docker Compose
*   **Testing:** JUnit 5, Mockito, Testcontainers, Spring Boot Test, JaCoCo
*   **API Docs:** Springdoc OpenAPI (Swagger UI)
*   **Frontend:** HTML, JavaScript (basic demo)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Java 17 Development Kit (JDK)
*   Maven 3.8+
*   Docker and Docker Compose (recommended for easy setup)
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/auth-system.git
cd auth-system
```

### 2. Configure Environment Variables

The application uses environment variables for sensitive configurations like database credentials and JWT secret.
You can set them in your shell session, in a `.env` file (if using Docker Compose), or directly in `docker-compose.yml`.

**Minimum Required:**

*   `JWT_SECRET`: A strong, long, random secret string for signing JWT tokens. **CRITICAL FOR SECURITY**.
    *   Example: `JWT_SECRET=thisisareallylongandsecurejwtsecretkeythatisatleast256bitslongandveryrandom`

Database configuration can be overridden if needed, otherwise, `docker-compose.yml` provides defaults.

### 3. Build the Application

Navigate to the project root directory and build the Spring Boot application using Maven:

```bash
mvn clean install -DskipTests
```
The `-DskipTests` flag is used here to skip tests during the build, which might fail if the database is not yet running or configured. Tests will be run separately later.

### 4. Run with Docker Compose (Recommended)

This will set up both the PostgreSQL database and the Spring Boot application.

1.  **Ensure Docker Desktop is running.**
2.  **Create a `.env` file** in the root of the project (sibling to `docker-compose.yml`) and add your `JWT_SECRET`:
    ```
    JWT_SECRET=your_super_secret_key_for_jwt_which_is_at_least_256_bit_long_and_very_secure
    ```
    **Remember to replace `your_super_secret_key...` with an actual strong secret.**
3.  **Start the services:**
    ```bash
    docker-compose up --build
    ```
    The `--build` flag ensures your application image is rebuilt if changes were made since the last `mvn install`.

The backend application will be accessible at `http://localhost:8080`.
The PostgreSQL database will be accessible at `localhost:5432`.

### 5. Access the Application

*   **Frontend Demo:** Open your browser to `http://localhost:8080/`.
    *   You can register new users.
    *   You can log in with:
        *   **Admin User:** `username: admin`, `password: adminpass`
        *   **Regular User:** `username: user`, `password: userpass`
        *   *(These seeded users are created by the `V1__initial_setup.sql` migration)*
*   **Swagger UI (API Documentation):** Visit `http://localhost:8080/swagger-ui.html` to explore the API endpoints.
*   **Spring Boot Actuator:** Check application health and metrics at `http://localhost:8080/actuator`.

## Running Tests

To run all tests (unit, integration, API, and generate coverage report):

```bash
mvn clean test jacoco:report
```

This will execute tests and generate a JaCoCo code coverage report in `target/site/jacoco/index.html`.
The JaCoCo plugin is configured to fail the build if line or branch coverage drops below 80%.

## Project Structure

Refer to the "Project Structure Overview" section at the top of this document.

## API Documentation

See [API.md](API.md) for a detailed breakdown of all API endpoints, request/response formats, and authentication requirements. You can also access an interactive version via Swagger UI at `http://localhost:8080/swagger-ui.html` when the application is running.

## Architecture Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for an overview of the system's architecture, key components, and design decisions.

## Deployment

### Local Docker Deployment (already covered)

Using `docker-compose up --build` will deploy the application and database locally.

### Production Deployment Considerations

For a production environment, consider the following:

*   **Database:** Use a managed database service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) instead of running PostgreSQL directly in Docker on the same host as your application.
*   **Load Balancing:** Deploy multiple instances of the application behind a load balancer for high availability and scalability.
*   **Container Orchestration:** Use Kubernetes (EKS, AKS, GKE) or other container orchestration platforms for managing deployments, scaling, and self-healing.
*   **Secrets Management:** Do not hardcode `JWT_SECRET` or database credentials. Use a dedicated secrets management service (e.g., AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).
*   **Monitoring & Alerting:** Integrate with advanced monitoring tools (Prometheus, Grafana) and set up alerts for critical metrics and errors. Spring Boot Actuator already exposes Prometheus metrics.
*   **Logging:** Ship logs to a centralized logging system (ELK stack, Splunk, Datadog).
*   **HTTPS:** Always use HTTPS in production. Configure a reverse proxy (Nginx, Caddy, API Gateway) to handle SSL termination.
*   **Firewall Rules:** Restrict network access to your application and database only from necessary sources.
*   **Backup & Recovery:** Implement robust backup and recovery strategies for your database.
*   **CI/CD:** Automate builds, tests, and deployments using a CI/CD pipeline.

## CI/CD Pipeline Configuration (Conceptual - GitHub Actions)

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for a conceptual GitHub Actions workflow.

---

## Contributing

Feel free to fork the repository, open issues, and submit pull requests.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
*(Note: A LICENSE file is not generated here, but implies its presence)*

```