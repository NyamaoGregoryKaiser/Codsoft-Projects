# Secure Task Management System

This is a comprehensive, production-ready, full-stack web application with a strong focus on security implementations. It's built as a monorepo containing a NestJS backend API and a React frontend. The application allows users to manage projects and tasks, with robust authentication, authorization, and other security features.

## Table of Contents

1.  [Architecture Overview](#1-architecture-overview)
2.  [Features](#2-features)
    *   [Core Application](#core-application)
    *   [Database Layer](#database-layer)
    *   [Configuration & Setup](#configuration--setup)
    *   [Testing & Quality](#testing--quality)
    *   [Documentation](#documentation)
    *   [Security & Additional Features](#security--additional-features)
3.  [Technology Stack](#3-technology-stack)
4.  [Setup Instructions](#4-setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (Without Docker)](#local-development-without-docker)
    *   [Dockerized Development](#dockerized-development)
    *   [Database Migrations & Seeding](#database-migrations--seeding)
    *   [Running Tests](#running-tests)
5.  [API Documentation](#5-api-documentation)
6.  [Deployment Guide (High-Level)](#6-deployment-guide-high-level)
7.  [CI/CD Pipeline](#7-cicd-pipeline)
8.  [Security Implementations Deep Dive](#8-security-implementations-deep-dive)
    *   [Authentication](#authentication)
    *   [Authorization (RBAC & Resource-Based)](#authorization-rbac--resource-based)
    *   [Input Validation](#input-validation)
    *   [Rate Limiting](#rate-limiting)
    *   [CORS](#cors)
    *   [Security Headers (Helmet)](#security-headers-helmet)
    *   [Logging & Monitoring](#logging--monitoring)
    *   [Error Handling](#error-handling)
    *   [Database Security](#database-security)
    *   [Environment Variables](#environment-variables)
    *   [Caching](#caching)
    *   [XSS Protection](#xss-protection)
    *   [CSRF Protection](#csrf-protection)
    *   [Sensitive Data Handling](#sensitive-data-handling)
9.  [Future Enhancements](#9-future-enhancements)
10. [License](#10-license)

---

## 1. Architecture Overview

The system follows a typical client-server architecture with a clear separation of concerns:

```
+----------------+      +------------------+      +-----------------+
|                |      |                  |      |                 |
|    Frontend    |      |     Backend      |      |    Database     |
| (React, TS)    | <--> |  (NestJS, TS)    | <--> |   (PostgreSQL)  |
|                |      |                  |      |                 |
+----------------+      +------------------+      +-----------------+
        ^                        ^                        ^
        |                        |                        |
        |                        |                        |
+------------------------------------------------------------------+
|                          Security Layers                         |
|   (Auth, Authz, Validation, Rate Limiting, Logging, Caching)     |
+------------------------------------------------------------------+

```

*   **Frontend (React):** A single-page application (SPA) built with React and TypeScript, responsible for the user interface and interactions. It communicates with the backend API.
*   **Backend (NestJS):** A RESTful API built with NestJS (Node.js, TypeScript). It handles business logic, data processing, authentication, authorization, and interacts with the database.
*   **Database (PostgreSQL):** A relational database used for persistent storage of users, projects, and tasks. TypeORM is used as the ORM.
*   **Redis (Caching):** An in-memory data store used for caching frequently accessed data and managing refresh tokens.

The project is structured as a monorepo with `backend` and `frontend` directories.

## 2. Features

### Core Application

*   **User Management:** Register, Login, Logout, View Profile.
*   **Project Management:** Create, Read (single, all), Update, Delete projects.
*   **Task Management:** Create, Read (single, by project), Update, Delete tasks.
*   **CRUD Operations:** Full CRUD for projects and tasks.
*   **Role-Based Access:** `Admin` and `User` roles with different privileges.

### Database Layer

*   **PostgreSQL:** Chosen for its robustness and ACID compliance.
*   **TypeORM:** Used for object-relational mapping, providing a clean way to interact with the database using TypeScript classes.
*   **Schema Definitions:** Entities (`User`, `Project`, `Task`) defined with clear relationships and validations.
*   **Migration Scripts:** Auto-generated and custom migration scripts for schema evolution.
*   **Seed Data:** Scripts to populate the database with initial users and data for development.
*   **Query Optimization:** Implicitly handled by TypeORM for common queries. Explicit indexing on foreign keys and frequently queried fields.

### Configuration & Setup

*   **`package.json`:** Comprehensive dependency lists for both frontend and backend.
*   **Environment Configuration:** `.env` files for managing environment-specific variables (database credentials, JWT secrets, etc.).
*   **Docker Setup:** `Dockerfile`s for backend and frontend, and `docker-compose.yml` for orchestrating the entire application stack (backend, frontend, PostgreSQL, Redis).
*   **CI/CD Pipeline:** Basic GitHub Actions workflow for automated builds, tests, and static analysis.

### Testing & Quality

*   **Unit Tests:** Jest for both backend and frontend, covering services, controllers, utility functions, and React components (aiming for 80%+ coverage).
*   **Integration Tests:** NestJS testing utilities to test interactions between controllers and services, and component interactions in React.
*   **API Tests (E2E):** Supertest for the backend API endpoints, ensuring correct responses and data flow.
*   **Performance Tests:** (Mentioned, but actual scripts for K6/Artillery would be provided separately due to scope) Guidelines for setting up load testing.

### Documentation

*   **Comprehensive `README.md`:** This file serves as the main project documentation, covering setup, architecture, features, and security details.
*   **API Documentation:** Swagger (OpenAPI) integrated into the backend for interactive API exploration.
*   **Architecture Documentation:** Detailed in this README.
*   **Deployment Guide:** High-level steps for deploying the application to a production environment.

### Security & Additional Features

*   **Authentication:**
    *   JWT-based authentication (access token, refresh token).
    *   Access and refresh tokens are stored in secure HTTP-only cookies.
    *   Refresh token rotation for enhanced security.
    *   Password hashing using `bcrypt`.
    *   User registration, login, logout, and token refresh endpoints.
*   **Authorization:**
    *   Role-Based Access Control (RBAC) using NestJS Guards (`Admin`, `User` roles).
    *   Resource-based authorization (e.g., only a project owner can update/delete their project).
*   **Logging and Monitoring:**
    *   Winston for structured server-side logging (console, file).
    *   Logs include request details, errors, and security-relevant events.
    *   Mention integration with external services like Sentry or ELK stack.
*   **Error Handling Middleware:**
    *   Global exception filters in NestJS for consistent error responses.
    *   Custom HTTP exception classes for specific error scenarios.
*   **Caching Layer:**
    *   Redis integrated for caching frequently accessed data (e.g., user profiles, common configurations).
    *   Helps reduce database load and improve response times.
*   **Rate Limiting:**
    *   Implemented on critical endpoints (e.g., login, registration, password reset) to prevent brute-force attacks and denial-of-service.
*   **Input Validation:**
    *   `class-validator` and `class-transformer` used extensively for validating incoming DTOs (Data Transfer Objects) on the backend.
*   **CORS (Cross-Origin Resource Sharing):**
    *   Properly configured on the backend to allow requests only from trusted origins (the frontend).
*   **Helmet:**
    *   Integrated into NestJS to set various HTTP headers for enhanced security (e.g., XSS Protection, Content Security Policy, etc.).
*   **XSS Protection (Cross-Site Scripting):**
    *   React naturally provides some protection. Backend sanitization of user-generated content (though not explicitly shown for every field, it's a critical best practice).
*   **CSRF Protection (Cross-Site Request Forgery):**
    *   Mitigated by using `SameSite=Lax` for HTTP-only cookies. For full protection in complex scenarios, explicit CSRF tokens are recommended.
*   **Sensitive Data Handling:**
    *   All sensitive configurations managed via environment variables.
    *   Passwords stored as secure hashes.
    *   No sensitive data exposed in client-side code or public logs.

---

## 3. Technology Stack

*   **Backend:**
    *   Node.js
    *   NestJS (Framework)
    *   TypeScript
    *   TypeORM (ORM)
    *   PostgreSQL (Database)
    *   Redis (Caching, Session Management)
    *   Bcrypt (Password Hashing)
    *   JWT (Authentication)
    *   Winston (Logging)
    *   `class-validator`, `class-transformer` (Validation)
    *   `helmet` (Security Headers)
    *   `express-rate-limit` (Rate Limiting)
    *   Swagger (API Documentation)
    *   Jest, Supertest (Testing)
*   **Frontend:**
    *   React
    *   TypeScript
    *   Axios (HTTP Client)
    *   React Router DOM (Routing)
    *   React Context API (State Management)
    *   Jest, React Testing Library (Testing)
*   **DevOps/Tooling:**
    *   Docker, Docker Compose
    *   GitHub Actions (CI/CD)
    *   ESLint, Prettier (Linting, Formatting)

---

## 4. Setup Instructions

### Prerequisites

*   Node.js (v18+)
*   npm or Yarn
*   Docker and Docker Compose (recommended for easy setup)
*   Git

### Local Development (Without Docker)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/secure-task-management.git
    cd secure-task-management
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Edit .env file with your PostgreSQL connection details and JWT secrets
    # Ensure you have a PostgreSQL server running (e.g., via `docker run --name pg_db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres`)
    # And a Redis server running (e.g., via `docker run --name redis_cache -p 6379:6379 -d redis`)
    npm run typeorm migration:run # Run migrations
    npm run seed # Seed initial data
    npm run start:dev
    ```
    The backend will be running at `http://localhost:3000`. API documentation (Swagger) will be available at `http://localhost:3000/api`.

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    cp .env.example .env
    # Ensure REACT_APP_API_URL in .env points to your backend (e.g., http://localhost:3000)
    npm start
    ```
    The frontend will be running at `http://localhost:3001`.

### Dockerized Development

This is the recommended way to run the application, as it sets up all services (backend, frontend, PostgreSQL, Redis) automatically.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/secure-task-management.git
    cd secure-task-management
    ```

2.  **Create `.env` files:**
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    *   **Edit `backend/.env`**: Adjust `DATABASE_HOST`, `REDIS_HOST`, and `JWT_SECRET` variables if needed, though defaults should work with `docker-compose`.
    *   **Edit `frontend/.env`**: Ensure `REACT_APP_API_URL` is set to `http://localhost:3000` (the backend service exposed port).

3.  **Build and run the containers:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build Docker images for the backend and frontend.
    *   Start PostgreSQL, Redis, Backend, and Frontend services.
    *   Run TypeORM migrations and seed data in the backend container.

    Wait for all services to start. You can check logs with `docker-compose logs -f`.

    *   **Backend API:** `http://localhost:3000`
    *   **Backend Swagger Docs:** `http://localhost:3000/api`
    *   **Frontend UI:** `http://localhost:3001`

    To stop the services:
    ```bash
    docker-compose down
    ```

### Database Migrations & Seeding

*   **When running locally (without Docker Compose):**
    ```bash
    cd backend
    npm run typeorm migration:run
    npm run seed
    ```
*   **When using Docker Compose:** Migrations and seeding are automatically run on startup as part of the `backend` service's entrypoint script.

### Running Tests

*   **Backend Tests:**
    ```bash
    cd backend
    npm test          # Run all tests
    npm run test:unit # Run unit tests
    npm run test:int  # Run integration tests
    npm run test:e2e  # Run E2E (API) tests
    npm run test:cov  # Run tests with coverage report
    ```
*   **Frontend Tests:**
    ```bash
    cd frontend
    npm test # Runs tests in interactive watch mode
    npm run test:ci # Runs all tests once and exits (suitable for CI)
    ```

---

## 5. API Documentation

The backend API is documented using Swagger (OpenAPI). Once the backend is running, you can access the interactive documentation at:

*   **`http://localhost:3000/api`**

This documentation provides details on all available endpoints, request/response schemas, and allows you to test the API directly from the browser.

---

## 6. Deployment Guide (High-Level)

This section outlines high-level steps for deploying the application to a production environment. Specific steps will vary based on your chosen cloud provider (AWS, GCP, Azure, DigitalOcean, etc.).

1.  **Environment Configuration:**
    *   Ensure all production environment variables (`.env`) are securely managed (e.g., using secret management services like AWS Secrets Manager, Kubernetes Secrets, or your hosting provider's environment variable management). Never hardcode secrets.
2.  **Database Provisioning:**
    *   Provision a managed PostgreSQL database service (e.g., AWS RDS, GCP Cloud SQL).
    *   Configure security groups/firewalls to restrict access only from your application servers.
    *   Run TypeORM migrations (`npm run typeorm migration:run`) to set up the schema.
    *   Consider running seed data script for initial admin users if needed.
3.  **Redis Provisioning:**
    *   Provision a managed Redis service (e.g., AWS ElastiCache, GCP Memorystore).
    *   Configure security groups/firewalls.
4.  **Backend Deployment:**
    *   Build the backend Docker image (`docker build -f Dockerfile.backend -t secure-task-backend .`).
    *   Push the image to a container registry (e.g., Docker Hub, AWS ECR, GCP GCR).
    *   Deploy the container to a suitable compute service (e.g., Kubernetes, AWS ECS/Fargate, GCP Cloud Run, DigitalOcean App Platform).
    *   Configure scaling, load balancing, and health checks.
    *   Ensure the backend can access the PostgreSQL and Redis instances.
5.  **Frontend Deployment:**
    *   Build the frontend Docker image (`docker build -f Dockerfile.frontend -t secure-task-frontend .`). This image typically uses NGINX to serve the static React build.
    *   Push the image to a container registry.
    *   Deploy the container.
    *   Alternatively, build the frontend (`npm run build` in `frontend` directory) and deploy the resulting static files to a static site hosting service (e.g., AWS S3 + CloudFront, Netlify, Vercel).
    *   Configure a custom domain and SSL/TLS certificate (e.g., Let's Encrypt).
6.  **CI/CD Integration:**
    *   Ensure your CI/CD pipeline (e.g., GitHub Actions, GitLab CI, Jenkins) is configured to automatically build, test, and deploy changes upon merging to your main branch.
7.  **Monitoring & Logging:**
    *   Integrate with production-grade logging and monitoring solutions (e.g., ELK stack, Datadog, Sentry, Prometheus/Grafana) to track application health, performance, and security events.
8.  **Security Best Practices:**
    *   Regularly update dependencies to patch vulnerabilities.
    *   Implement Web Application Firewall (WAF) for additional protection.
    *   Conduct regular security audits and penetration testing.
    *   Ensure all network communication is encrypted (HTTPS/TLS).

---

## 7. CI/CD Pipeline

A basic CI/CD pipeline is configured using GitHub Actions. The workflow is defined in `.github/workflows/ci.yml`.

**Workflow Steps:**

1.  **Trigger:** Runs on pushes to `main` branch and pull requests.
2.  **Checkout Code:** Clones the repository.
3.  **Setup Node.js:** Installs Node.js.
4.  **Backend Build & Test:**
    *   Installs backend dependencies.
    *   Runs backend linting (`npm run lint`).
    *   Runs backend build (`npm run build`).
    *   Runs backend tests with coverage (`npm run test:cov`).
5.  **Frontend Build & Test:**
    *   Installs frontend dependencies.
    *   Runs frontend linting (`npm run lint`).
    *   Runs frontend build (`npm run build`).
    *   Runs frontend tests (`npm run test:ci`).
6.  **(Optional) Docker Build & Push:** (Placeholder, would require Docker login credentials as GitHub Secrets)
    *   Builds Docker images for backend and frontend.
    *   Pushes images to a container registry.
7.  **(Optional) Deployment:** (Placeholder, would require cloud provider credentials as GitHub Secrets)
    *   Deploys the application to a cloud environment.

This pipeline ensures that code changes are automatically built and tested, maintaining code quality and catching regressions early.

---

## 8. Security Implementations Deep Dive

This section elaborates on the security features implemented in this project.

### Authentication

*   **JWT (JSON Web Tokens):** Used for stateless authentication.
    *   **Access Token:** Short-lived (e.g., 15 minutes), used to authenticate requests to protected resources. Stored in an **HTTP-only cookie** to mitigate XSS attacks.
    *   **Refresh Token:** Long-lived (e.g., 7 days), used to obtain new access tokens when the current one expires. Stored in a separate **HTTP-only cookie** and in Redis for revocation.
    *   **Refresh Token Rotation:** When a refresh token is used, a new refresh token is issued, and the old one is invalidated. This limits the window of opportunity for a compromised refresh token.
    *   **Blacklisting/Revocation:** Refresh tokens are stored in Redis with their expiration time. Upon logout or token refresh, the old refresh token is removed or marked as invalid in Redis.
*   **Password Hashing:**
    *   `bcrypt` library is used to securely hash user passwords before storing them in the database. A high cost factor (e.g., 10-12) is used.
    *   Passwords are never stored in plain text.
*   **Secure Storage:**
    *   Tokens are stored in `HttpOnly` and `Secure` cookies.
        *   `HttpOnly` prevents client-side JavaScript from accessing the cookie, mitigating XSS.
        *   `Secure` ensures the cookie is only sent over HTTPS connections.
        *   `SameSite=Lax` helps mitigate CSRF attacks (though not a complete solution on its own for all scenarios).
*   **Login/Registration:**
    *   Strong input validation for email and password.
    *   Rate limiting on these endpoints.

### Authorization (RBAC & Resource-Based)

*   **Role-Based Access Control (RBAC):**
    *   Users are assigned roles (e.g., `Admin`, `User`).
    *   NestJS Guards (`RolesGuard`) are used to protect routes based on the required roles. The `@Roles()` decorator specifies which roles can access an endpoint.
    *   Example: An admin can manage all users; a regular user cannot.
*   **Resource-Based Authorization (Ownership):**
    *   Beyond roles, some operations require checking if the authenticated user owns the resource they are trying to modify/delete.
    *   NestJS Guards (`ProjectOwnerGuard`, `TaskOwnerGuard`) are implemented to check ownership by comparing the authenticated user's ID with the resource's owner ID.
    *   Example: A user can only update/delete their own projects or tasks. An admin, however, might bypass this check.

### Input Validation

*   **`class-validator` and `class-transformer`:** Integrated with NestJS DTOs.
    *   Ensures that incoming request bodies, query parameters, and route parameters conform to expected data types and formats.
    *   Prevents common injection attacks by ensuring data types are correct (e.g., preventing a string from being used where a number is expected).
    *   Removes unexpected fields (`whitelist: true`, `forbidNonWhitelisted: true`).
*   **Pipes:** NestJS `ValidationPipe` automatically applies validation rules defined in DTOs.

### Rate Limiting

*   **`express-rate-limit` (or `nest-rate-limiter`):** Middleware applied to specific routes.
    *   Protects against brute-force attacks on login, registration, and password reset endpoints.
    *   Prevents denial-of-service (DoS) attacks by limiting the number of requests a user can make within a certain timeframe.
    *   Configurable limits (e.g., 10 requests per minute).

### CORS (Cross-Origin Resource Sharing)

*   **Explicit Configuration:** The backend is configured to accept requests only from the trusted frontend origin.
    *   `app.enableCors()` with specific `origin`, `credentials`, `methods`, and `allowedHeaders` options.
    *   Prevents malicious websites from making unauthorized requests to your API.

### Security Headers (Helmet)

*   **`helmet`:** A collection of 14 middleware functions to help secure Express/NestJS apps by setting various HTTP headers.
    *   `Content-Security-Policy`: Mitigates XSS attacks by restricting sources of content.
    *   `X-Content-Type-Options`: Prevents browsers from MIME-sniffing a response away from the declared content-type.
    *   `X-Frame-Options`: Prevents clickjacking attacks.
    *   `Strict-Transport-Security`: Enforces HTTPS for future requests.
    *   `X-Powered-By`: Removes the `X-Powered-By` header, which can reveal server technologies.
    *   And others.

### Logging & Monitoring

*   **Winston:** A powerful and flexible logging library for Node.js.
    *   Structured logging (JSON format) makes logs easy to parse and analyze.
    *   Logs include request details (IP, user ID, endpoint), errors, and security-relevant events (failed logins, authorization failures).
    *   Configurable transports (console, file, external services).
*   **Monitoring:** While not fully implemented here, the framework supports integration with services like Sentry for error tracking, Prometheus/Grafana for metrics, and ELK stack for centralized log management.

### Error Handling

*   **Global Exception Filters:** NestJS provides a robust mechanism to catch and handle all unhandled exceptions globally.
    *   Consistent error response format (JSON) across the API.
    *   Prevents sensitive internal error details from being exposed to clients.
*   **Custom HTTP Exceptions:** Define custom exception classes (`NotFoundException`, `ForbiddenException`, `UnauthorizedException`) to return specific, meaningful HTTP status codes and messages.

### Database Security

*   **TypeORM:** Utilizes parameterized queries by default, preventing SQL injection vulnerabilities.
*   **Schema Design:** Proper use of foreign keys, constraints, and data types.
*   **Indexing:** Applied to frequently queried columns (e.g., `email` for users, foreign keys) to improve performance and prevent DoS from slow queries.
*   **Password Hashing:** (already covered in Authentication).
*   **Principle of Least Privilege:** Database users should have only the necessary permissions.

### Environment Variables

*   **`.env` Files:** All sensitive configuration (database credentials, JWT secrets, Redis credentials, API URLs) are externalized into `.env` files.
*   **`dotenv`:** Used to load these variables into the application's environment.
*   **Never hardcode secrets** directly into the codebase.

### Caching

*   **Redis:** Used as an in-memory cache.
    *   **Data Caching:** Frequently accessed, non-sensitive data (e.g., lists of projects for anonymous users, if applicable; user profile snippets) can be cached to reduce database load.
    *   **Refresh Token Management:** Used to store and manage refresh tokens for revocation and rotation.
*   **Security Considerations:** Ensure sensitive data is not inappropriately cached or cached without proper invalidation strategies.

### XSS Protection

*   **Frontend (React):** React automatically escapes content by default, preventing most common reflected XSS attacks.
*   **Backend Sanitization:** For user-generated content (e.g., project descriptions, task notes), it is crucial to sanitize input on the server-side to remove potentially malicious scripts or HTML tags. While not explicitly detailed for every input field in this example, libraries like `DOMPurify` (or similar for Node.js) should be used.

### CSRF Protection

*   **`SameSite=Lax` Cookies:** All cookies (including access and refresh tokens) are set with `SameSite=Lax`. This prevents the browser from sending cookies with cross-site requests (except for top-level navigations with safe HTTP methods), significantly mitigating CSRF risks for most GET requests and some POST requests.
*   **HTTP-Only Cookies:** Tokens are HTTP-only, meaning client-side JavaScript cannot access them, preventing them from being read and sent by a malicious script in a CSRF attack.
*   **Stateless JWT (Implicit):** While tokens are in cookies, the API itself uses JWTs which are stateless. If tokens were sent in `Authorization` headers (e.g., from `localStorage`), CSRF is generally not an issue as an attacker cannot simply forge headers. For cookie-based JWTs, `SameSite` is critical.
*   **Full CSRF Token (Recommendation for stricter security):** For maximum protection with cookie-based authentication, especially with `SameSite=None` (required for cross-domain iframes or certain mobile flows), implement a dedicated CSRF token (e.g., double-submit cookie or synchronizer token). This would involve generating a unique token on the server, sending it to the client, and requiring the client to include it in a custom HTTP header for all state-changing requests.

### Sensitive Data Handling

*   **Encryption at Rest:** PostgreSQL handles this at the filesystem/disk level.
*   **Encryption in Transit:** Always use HTTPS/TLS for all communication between client and server, and between backend services (e.g., backend to database, backend to Redis).
*   **Password Storage:** As discussed, `bcrypt` hashing.
*   **No PII in Logs:** Avoid logging Personally Identifiable Information (PII) or sensitive data in raw forms. Mask or redact such data if it must appear in logs.

---

## 9. Future Enhancements

*   **Email Verification:** Implement email verification for new user registrations.
*   **Password Reset Flow:** Secure password reset functionality (token-based).
*   **Two-Factor Authentication (2FA):** Add support for TOTP or SMS-based 2FA.
*   **Audit Logging:** More detailed audit trails for critical actions.
*   **More Advanced RBAC:** Granular permissions beyond simple roles (e.g., view, edit, delete for specific resource types).
*   **Content Security Policy (CSP):** More strict and finely tuned CSP.
*   **Frontend Security:** Implement more specific frontend security practices like input sanitization on the client-side before sending to the backend (in addition to backend validation).
*   **Infrastructure as Code (IaC):** Use Terraform or CloudFormation to manage cloud infrastructure.
*   **Docker Security Scanning:** Integrate tools like Clair or Trivy into CI/CD.
*   **Performance Testing:** Full implementation with K6 or Artillery scripts.
*   **Observability:** Integrate with APM tools (e.g., New Relic, Datadog) for deeper insights.
*   **WebSockets:** Implement real-time updates for tasks/projects.
*   **File Uploads:** Secure file upload functionality with virus scanning and storage in cloud object storage (e.g., S3).

---

## 10. License

This project is open-source and available under the MIT License.

---