# Secure C++ Web Application

This project provides a comprehensive, production-ready full-stack web application with a focus on robust security implementations. It features a high-performance C++ backend, a PostgreSQL database, a minimalist JavaScript frontend, and is fully containerized with Docker.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Setup with Docker Compose](#local-setup-with-docker-compose)
    *   [Running Tests](#running-tests)
5.  [API Documentation](#api-documentation)
6.  [Architecture](#architecture)
7.  [Security Implementations](#security-implementations)
8.  [CI/CD](#ci/cd)
9.  [Future Enhancements](#future-enhancements)
10. [Contributing](#contributing)
11. [License](#license)

## Features

*   **Core Application (C++ Backend):**
    *   Built with C++20 and Crow web framework.
    *   RESTful API endpoints with CRUD operations for Users (and example Products).
    *   Modular design: Controllers, Services, Repositories, Models.
    *   Business logic and data processing.
*   **Database Layer (PostgreSQL):**
    *   Schema definitions (`users`, `products` tables).
    *   Initial migration scripts.
    *   Seed data for initial setup (admin and regular users).
    *   `pqxx` for secure and efficient database interactions.
*   **Frontend (Vanilla JavaScript):**
    *   Simple HTML/CSS/JS client for interacting with the backend API.
    *   Demonstrates user registration, login, and accessing protected resources.
*   **Configuration & Setup:**
    *   `CMake` for C++ build system.
    *   `Conan` for C++ dependency management (`libsodium`, `jwt-cpp`, `spdlog`, `pqxx`, `crow`, `nlohmann_json`).
    *   Environment configuration using `.env.example` and environment variables.
    *   `Docker` and `Docker Compose` for containerization and orchestration.
*   **Testing & Quality:**
    *   `Catch2` for C++ unit and integration tests.
    *   Demonstrates tests for critical security components (Argon2Hasher, JwtManager).
    *   CI/CD pipeline includes test execution.
*   **Documentation:**
    *   Comprehensive README.md (this file!).
    *   API documentation (docs/api.md).
    *   Architecture overview (docs/architecture.md).
    *   Deployment guide (part of README and CI/CD).
*   **Additional Features (Security Focus):**
    *   **Authentication:** JWT-based (Access & Refresh Tokens), Argon2 password hashing via `libsodium`.
    *   **Authorization:** Role-Based Access Control (RBAC) middleware for endpoint protection.
    *   **Logging & Monitoring:** Structured logging with `spdlog` for security events, errors, and application flow.
    *   **Error Handling:** Global exception handling middleware providing consistent JSON error responses.
    *   **Caching Layer:** Simple in-memory cache for potential future use (e.g., storing user permissions, config data).
    *   **Rate Limiting:** Token bucket algorithm-based middleware to protect API endpoints from abuse.
    *   **Secure Communication:** HTTPS enforced by Nginx reverse proxy with self-signed certificates for local development.

## Technology Stack

*   **Backend:** C++20, Crow Framework, `libsodium`, `jwt-cpp`, `spdlog`, `pqxx`, `nlohmann/json`.
*   **Database:** PostgreSQL 16.
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript.
*   **Containerization:** Docker, Docker Compose.
*   **Build System:** CMake, Conan.
*   **Testing:** Catch2.
*   **Web Server/Reverse Proxy:** Nginx.
*   **CI/CD:** GitHub Actions.

## Project Structure

```
my_secure_app/
├── .github/                      # GitHub Actions CI/CD workflows
├── backend/                      # C++ Backend source, build, tests, and config
├── database/                     # PostgreSQL setup: schema, migrations, seed data, Dockerfile
├── frontend/                     # Minimalist HTML/CSS/JS client
├── nginx/                        # Nginx configuration and SSL certificates
├── docker-compose.yml            # Docker Compose orchestration file
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation (this file)
└── docs/                         # Additional documentation (API, Architecture)
```

## Setup Instructions

### Prerequisites

*   **Git:** For cloning the repository.
*   **Docker & Docker Compose:** For containerization and running the application stack.
    *   Ensure Docker Desktop is running or Docker daemon is active on Linux.
*   **`jq` (optional):** For parsing JSON in shell scripts (e.g., in CI/CD or local testing).

### Local Setup with Docker Compose

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/my_secure_app.git
    cd my_secure_app
    ```

2.  **Generate Nginx SSL Certificates:**
    Nginx is configured to serve the application over HTTPS. For local development, you need self-signed certificates.
    ```bash
    mkdir -p nginx/certs
    cd nginx/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost.key -out localhost.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    cd ../.. # Go back to the project root
    ```
    *You will likely get a browser warning about these self-signed certificates. Accept it to proceed.*

3.  **Create `.env` file:**
    The `docker-compose.yml` uses environment variables defined in `backend/.env.example`. Copy it to `.env` in the `backend` directory and modify if necessary.
    ```bash
    cp backend/.env.example backend/.env
    ```
    You can edit `backend/.env` to change ports, DB credentials, JWT secrets, etc.

4.  **Build and Run the Docker Compose Stack:**
    This command will build the Docker images for the backend and database, then start all services (db, backend, nginx).
    *The first build might take a while as C++ dependencies are fetched and compiled.*
    ```bash
    docker-compose up --build -d
    ```
    * `--build`: Rebuild images (important for initial setup or after code changes).
    * `-d`: Run in detached mode (in the background).

5.  **Verify Services:**
    Check if all containers are running:
    ```bash
    docker ps
    ```
    You should see `secure_app_db`, `secure_app_backend`, and `secure_app_nginx` running.
    You can view logs for any service:
    ```bash
    docker logs secure_app_backend
    docker logs secure_app_db
    docker logs secure_app_nginx
    ```

6.  **Access the Application:**
    *   **Frontend:** Open your browser to `https://localhost/`. (Accept the self-signed certificate warning).
    *   **Backend API:** The API is served through Nginx at `https://localhost/api/`.

### Running Tests

Unit and integration tests for the C++ backend can be run within the `backend` container.

1.  **Ensure Docker Compose stack is up (or at least `backend` service is built):**
    ```bash
    docker-compose up -d --build backend
    ```

2.  **Execute tests in the backend container:**
    ```bash
    docker-compose exec backend /app/SecureCppAppTests
    ```
    This will run all Catch2 tests defined in the `backend/tests` directory.

3.  **API Tests (Manual/Curl):**
    You can manually test API endpoints using `curl` or a tool like Postman/Insomnia.
    *   **Register a user:**
        ```bash
        curl -k -X POST -H "Content-Type: application/json" \
             -d '{"email":"testuser@example.com","password":"securepassword123","role":"USER"}' \
             https://localhost/api/auth/register
        ```
    *   **Login a user:**
        ```bash
        LOGIN_RESPONSE=$(curl -k -X POST -H "Content-Type: application/json" \
             -d '{"email":"testuser@example.com","password":"securepassword123"}' \
             https://localhost/api/auth/login)
        echo $LOGIN_RESPONSE # Copy accessToken and refreshToken
        ```
    *   **Access protected user profile:**
        Replace `YOUR_ACCESS_TOKEN` with the token obtained from login.
        ```bash
        curl -k -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
             https://localhost/api/users/me
        ```
    *   **Access admin-only endpoint (e.g., get another user):**
        First, register/login an `ADMIN` user (e.g., using `admin@example.com` from seed data if its password hash is generated correctly). Then use *their* access token.
        ```bash
        # Assuming you have an admin access token
        ADMIN_ACCESS_TOKEN="..." 
        USER_ID_TO_FETCH="a2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e" # ID of user@example.com from seed data
        curl -k -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
             https://localhost/api/users/$USER_ID_TO_FETCH
        ```
    *   **Test Rate Limiting:** Repeatedly call an endpoint until you hit the limit (e.g., `APP_PORT` configuration).
        ```bash
        for i in {1..110}; do curl -s -o /dev/null -w "%{http_code}\n" -k https://localhost/api/auth/register; done
        # You should eventually see 429 Too Many Requests
        ```

## API Documentation

For detailed information on API endpoints, request/response formats, and authentication requirements, refer to the [API Documentation](docs/api.md).

## Architecture

An overview of the application's architecture can be found in [Architecture Documentation](docs/architecture.md).

## Security Implementations

This project prioritizes security by implementing several enterprise-grade features:

*   **Authentication (JWT & Argon2):**
    *   User passwords are never stored in plaintext. `libsodium`'s Argon2id hashing algorithm is used for strong, adaptive hashing.
    *   Authentication uses JSON Web Tokens (JWTs) for stateless session management.
    *   Both short-lived `accessToken`s and longer-lived `refreshToken`s are issued.
    *   `JwtManager` handles token generation, signing (HS256), and verification.
*   **Authorization (RBAC Middleware):**
    *   `AuthMiddleware` validates JWTs and extracts `userId` and `userRole` from the token claims, storing them in the request context.
    *   `RBACMiddleware` is route-specific, checking if the authenticated user's role (from the token) is among the allowed roles for that endpoint.
    *   Examples: `/users/me` (any authenticated user), `/users/<id>` (admin only).
*   **Secure Communication (HTTPS with Nginx):**
    *   All traffic is routed through Nginx, which enforces HTTPS (using self-signed certificates for dev).
    *   Nginx also adds various security headers (HSTS, X-Content-Type-Options, X-XSS-Protection, X-Frame-Options, Referrer-Policy, Permissions-Policy).
*   **Input Validation & Parameterized Queries:**
    *   The application relies on `pqxx` for database interactions, which inherently supports parameterized queries, preventing SQL injection.
    *   Crow framework and manual checks in controllers/services handle basic input validation (e.g., checking for required fields, valid email format).
*   **Error Handling:**
    *   `ErrorHandler` middleware catches all exceptions, providing consistent JSON error responses with HTTP status codes and custom error codes, preventing sensitive information leakage.
    *   Custom exception types (`ApiException`, `UnauthorizedException`, `NotFoundException`, etc.) provide granular error reporting.
*   **Logging:**
    *   `spdlog` is used for structured, categorized logging (TRACE, DEBUG, INFO, WARN, ERROR, CRITICAL).
    *   Security-relevant events (login attempts, authentication failures, authorization denials, critical errors) are logged with sufficient detail for monitoring and auditing.
*   **Rate Limiting:**
    *   `RateLimit` middleware implements a token bucket algorithm to limit the number of requests per client (by IP address in this example) within a time window.
    *   Protects against brute-force attacks, API abuse, and denial-of-service attempts.
*   **Environment Configuration:**
    *   Sensitive credentials (database passwords, JWT secret keys) are managed via environment variables and `.env` files, never hardcoded into the application.
*   **C++ Best Practices:**
    *   Memory safety: C++20 features, smart pointers, RAII.
    *   Resource management: Proper database connection handling.
    *   Minimal dependencies where feasible, but leveraging well-maintained libraries for complex tasks like crypto and JWT.

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that performs the following steps on pushes and pull requests to `main` and `develop` branches:

1.  **Build and Test Backend:**
    *   Builds the C++ backend Docker image.
    *   Runs unit and integration tests defined with Catch2 inside the backend container.
2.  **Build and Run Full-stack (Integration/API Test):**
    *   Builds all services (db, backend, nginx) using `docker-compose`.
    *   Waits for services to be healthy.
    *   Runs basic `curl`-based API tests to verify endpoints, authentication, and authorization are working end-to-end.
    *   Includes teardown to clean up Docker resources.

This pipeline ensures that code changes are continuously validated, maintaining quality and preventing regressions.

## Future Enhancements

*   **More Robust Input Validation:** Use a dedicated C++ validation library or more extensive manual checks for all input fields.
*   **Refined Rate Limiting:** Implement a persistent store (e.g., Redis) for rate limiting data across multiple backend instances.
*   **Advanced Caching:** Integrate a robust caching solution like Redis for scalable performance.
*   **Audit Logging:** Implement a dedicated audit log for all sensitive actions and data changes.
*   **Security Audits & Static Analysis:** Integrate tools like SonarQube, Clang-Tidy, or Coverity into CI/CD.
*   **OAuth2/OIDC Integration:** For enterprise environments, integrate with external identity providers.
*   **Multi-Factor Authentication (MFA):** Add support for MFA for enhanced user security.
*   **Frontend Framework:** Upgrade the frontend to a modern framework like React, Vue, or Angular for better UI/UX and maintainability.
*   **Container Security Scanning:** Integrate Trivy or Clair into the CI/CD pipeline to scan Docker images for vulnerabilities.
*   **Secrets Management:** Use a proper secrets management system (e.g., HashiCorp Vault, AWS Secrets Manager) instead of `.env` files in production.
*   **Deployment Automation:** Extend CI/CD for automated deployments to cloud platforms (AWS, GCP, Azure) using tools like Terraform or Kubernetes.
*   **More comprehensive product management** (if this were a full e-commerce app).

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. Ensure your code adheres to the existing style and all tests pass.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```