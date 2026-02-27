# ProjectPulse: A Comprehensive Project Management System

ProjectPulse is a full-stack, enterprise-grade web application designed for managing projects and tasks. It features a robust Java Spring Boot backend, a modern React frontend, and a PostgreSQL database. This system emphasizes production readiness, including authentication, comprehensive testing, logging, caching, rate limiting, and extensive documentation.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Docker Setup (Recommended)](#docker-setup-recommended)
5.  [Running the Application](#running-the-application)
    *   [Using Docker Compose](#using-docker-compose)
    *   [Running Manually (Backend & Frontend Separately)](#running-manually-backend--frontend-separately)
6.  [Default Credentials](#default-credentials)
7.  [API Documentation (Swagger UI)](#api-documentation-swagger-ui)
8.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests](#performance-tests)
9.  [Architecture](#architecture)
10. [Deployment](#deployment)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Additional Features](#additional-features)
    *   [Authentication & Authorization (JWT)](#authentication--authorization-jwt)
    *   [Logging & Monitoring (Actuator)](#logging--monitoring-actuator)
    *   [Error Handling](#error-handling)
    *   [Caching](#caching)
    *   [Rate Limiting](#rate-limiting)
13. [Contributing](#contributing)
14. [License](#license)

## 1. Features

*   **User Management:** Register, login, view, update, and delete users (Admin role required for some operations).
*   **Project Management:** Create, view, update, and delete projects. Projects are associated with a creator.
*   **Task Management:** Create, view, update, and delete tasks. Tasks are linked to projects and can be assigned to users.
*   **Role-Based Access Control (RBAC):** Differentiated access for `USER` and `ADMIN` roles.
*   **RESTful API:** Clean and consistent API endpoints for all CRUD operations.
*   **Interactive UI:** A basic React frontend to interact with the API.

## 2. Technology Stack

### Backend
*   **Language:** Java 17+
*   **Framework:** Spring Boot 3.x
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA / Hibernate
*   **Security:** Spring Security, JWT (JSON Web Tokens)
*   **Validation:** Spring Validation
*   **API Docs:** Springdoc-openapi (Swagger UI)
*   **Caching:** Caffeine
*   **Rate Limiting:** Bucket4j
*   **Build Tool:** Maven

### Frontend
*   **Framework:** React 18+
*   **State Management:** React Context API (simple)
*   **Routing:** React Router Dom
*   **Styling:** Tailwind CSS
*   **HTTP Client:** Axios
*   **Build Tool:** NPM

### Other
*   **Containerization:** Docker, Docker Compose
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers (Backend); Jest, React Testing Library (Frontend)
*   **Monitoring:** Spring Boot Actuator

## 3. Project Structure

```
project-pulse/
├── backend/                # Spring Boot backend application
│   ├── src/main/java/com/projectpulse/projectpulse/
│   │   ├── auth/           # Authentication (JWT) related DTOs, filters, controllers
│   │   ├── config/         # Spring Boot configurations (Security, Swagger, Cache, RateLimit)
│   │   ├── exception/      # Custom exceptions and global handler
│   │   ├── project/        # Project module (DTOs, entity, repo, service, controller)
│   │   ├── task/           # Task module (DTOs, entity, repo, service, controller)
│   │   ├── user/           # User module (DTOs, entity, repo, service, controller)
│   │   └── util/           # Utility classes (Mappers)
│   ├── src/main/resources/ # Application properties, database schema/data
│   ├── src/test/           # Backend unit, integration, and controller tests
│   └── Dockerfile          # Dockerfile for backend
├── frontend/               # React frontend application
│   ├── public/             # Static assets, index.html
│   ├── src/                # React source code
│   │   ├── api/            # API client (Axios)
│   │   ├── auth/           # Auth context and components
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page-level components (Login, ProjectList, etc.)
│   │   ├── styles/         # Tailwind CSS imports and custom CSS
│   │   └── tests/          # Frontend unit tests
│   └── Dockerfile          # Dockerfile for frontend
├── docker-compose.yml      # Orchestrates backend, frontend, and database
├── README.md               # This documentation
├── ARCHITECTURE.md         # Detailed architecture overview
├── DEPLOYMENT.md           # Deployment instructions
└── CI_CD_PIPELINE.md       # CI/CD pipeline configuration notes
```

## 4. Setup and Installation

### Prerequisites

*   **Git:** For cloning the repository.
*   **Java 17+ SDK:** If running the backend manually.
*   **Maven:** If building the backend manually.
*   **Node.js (LTS) & NPM:** If running the frontend manually.
*   **Docker & Docker Compose:** **Highly Recommended** for easiest setup.

### Backend Setup (Manual)

1.  **Navigate to backend directory:**
    ```bash
    cd project-pulse/backend
    ```
2.  **Build the project:**
    ```bash
    ./mvnw clean install
    ```
3.  **Configure `application.yml`:**
    *   Update `src/main/resources/application.yml` with your PostgreSQL database connection details. Ensure the `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` environment variables or direct values match your database setup.
    *   Set `jwt.secret` to a strong, random string (minimum 32 characters).
    *   Adjust `app.cors.allowed-origins` if your frontend is not on `http://localhost:3000`.

### Frontend Setup (Manual)

1.  **Navigate to frontend directory:**
    ```bash
    cd project-pulse/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:**
    *   Create a `.env` file in the `frontend/` directory if your backend API is not at `http://localhost:8080/api/v1`.
    ```
    REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
    ```
    (Note: If running via Docker Compose, `REACT_APP_API_BASE_URL` will be set by `docker-compose.yml`)
4.  **Build Tailwind CSS:**
    ```bash
    npm run tailwind:build
    ```

### Docker Setup (Recommended)

Ensure Docker Desktop (or Docker Engine and Compose) is installed and running.

1.  **Navigate to the root directory of the project:**
    ```bash
    cd project-pulse/
    ```
2.  **Build and start all services:**
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images (useful if you made code changes).
    *   `-d`: Runs containers in detached mode (in the background).

    This will:
    *   Create a PostgreSQL database container.
    *   Build and run the Spring Boot backend application.
    *   Build and run the React frontend application (using Nginx to serve static files).
    *   The backend will automatically apply `schema.sql` and `data.sql` to initialize the database.

3.  **To stop and remove containers:**
    ```bash
    docker-compose down
    ```
4.  **To remove volumes (database data):**
    ```bash
    docker-compose down -v
    ```

## 5. Running the Application

### Using Docker Compose (Recommended)

After running `docker-compose up --build -d`:

*   **Frontend:** Accessible at `http://localhost:3000`
*   **Backend API:** Accessible at `http://localhost:8080/api/v1`
*   **Swagger UI (API Docs):** Accessible at `http://localhost:8080/swagger-ui.html`
*   **Spring Boot Actuator (Monitoring):** Accessible at `http://localhost:8080/actuator`

### Running Manually (Backend & Frontend Separately)

#### Run Backend

1.  **Navigate to backend directory:** `cd project-pulse/backend`
2.  **Ensure a PostgreSQL database is running locally** and configured according to `application.yml`.
3.  **Run the application:**
    ```bash
    ./mvnw spring-boot:run
    ```
    The backend will start on `http://localhost:8080`.

#### Run Frontend

1.  **Navigate to frontend directory:** `cd project-pulse/frontend`
2.  **Start the development server:**
    ```bash
    npm start
    ```
    The frontend will open in your browser, usually at `http://localhost:3000`.

## 6. Default Credentials

The `backend/src/main/resources/db/data.sql` script creates the following default users:

*   **Admin User:**
    *   **Username:** `admin`
    *   **Password:** `admin`
*   **Regular User 1:**
    *   **Username:** `user1`
    *   **Password:** `password`
*   **Regular User 2:**
    *   **Username:** `user2`
    *   **Password:** `password`

You can use these to log in through the frontend or test the API directly.
**Always change default passwords in production!**

## 7. API Documentation (Swagger UI)

Once the backend is running, you can access the interactive API documentation (powered by Springdoc-openapi) at:
`http://localhost:8080/swagger-ui.html`

This interface allows you to view all available endpoints, their request/response schemas, and even try out API calls directly. Remember to authorize with a JWT token (obtained from `/api/v1/auth/login`) using the "Authorize" button.

## 8. Testing

### Backend Tests

Backend tests are written using JUnit 5, Mockito, and Spring Boot Test. Integration tests leverage Testcontainers for a real PostgreSQL database environment.

1.  **Run all backend tests:**
    ```bash
    cd project-pulse/backend
    ./mvnw test
    ```
2.  **Generate JaCoCo test coverage report:**
    ```bash
    cd project-pulse/backend
    ./mvnw clean install jacoco:report
    ```
    The report will be generated in `target/site/jacoco/index.html`. We aim for 80%+ line coverage and 60%+ branch coverage.

### Frontend Tests

Frontend unit tests are written using Jest and React Testing Library.

1.  **Run frontend tests:**
    ```bash
    cd project-pulse/frontend
    npm test
    ```

### Performance Tests

Performance tests are crucial for production readiness. While not provided as executable scripts, a plan for Apache JMeter is outlined:

*   **Tool:** Apache JMeter.
*   **Scenarios:**
    *   **Login & Browse:** Simulate concurrent users logging in and fetching project lists.
    *   **CRUD Operations:** Simulate users performing various create, read, update, delete actions on projects and tasks.
    *   **Stress Test:** Target specific critical endpoints with high load.
*   **Metrics:** Monitor response times (average, p90, p95, p99), throughput, and error rates.

For a detailed JMeter setup, refer to the [JMeter Performance Test Plan section](#performance-tests-jmeter---description) in the main output.

## 9. Architecture

For a detailed overview of the system's architecture, including layers, modules, and component interactions, please refer to:
[ARCHITECTURE.md](./ARCHITECTURE.md)

## 10. Deployment

For a detailed guide on how to deploy ProjectPulse to various environments (e.g., cloud platforms), please refer to:
[DEPLOYMENT.md](./DEPLOYMENT.md)

## 11. CI/CD Pipeline

For a conceptual outline of a robust CI/CD pipeline (e.g., using Jenkins or GitHub Actions), including build, test, and deployment stages, please refer to:
[CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)

## 12. Additional Features

### Authentication & Authorization (JWT)

*   **JWT-based:** Secure user authentication using JSON Web Tokens.
*   **Spring Security:** Configured to secure API endpoints.
*   **Role-based:** `ADMIN` and `USER` roles define access levels, enforced via `@PreAuthorize` and custom access checkers.

### Logging & Monitoring (Actuator)

*   **SLF4J/Logback:** Standard Spring Boot logging configured for console and file output (`logs/projectpulse.log`).
*   **Spring Boot Actuator:** Provides production-ready features for monitoring and managing the application, accessible at `/actuator`.
    *   Includes endpoints for health, info, metrics (Prometheus format for integration with Grafana/Prometheus stack), loggers, and caches.

### Error Handling

*   **Global Exception Handler:** `@ControllerAdvice` provides a centralized mechanism to handle exceptions and return consistent JSON error responses.
*   **Custom Exceptions:** `ResourceNotFoundException`, `UnauthorizedException`, `TooManyRequestsException` for specific error scenarios.
*   **Validation Errors:** Handled gracefully, returning detailed field error messages.

### Caching

*   **Spring Cache Abstraction with Caffeine:** In-memory caching for frequently accessed data.
*   **`@Cacheable`:** Caches method results (e.g., `getProjectById`, `getUserById`).
*   **`@CachePut`:** Updates cache with method result (e.g., `updateProject`, `updateUser`).
*   **`@CacheEvict`:** Removes entries from cache (e.g., `deleteProject`, `deleteTask` evicts related project/task caches).

### Rate Limiting

*   **Custom Interceptor:** Implemented using Bucket4j for per-IP rate limiting (10 requests per minute by default for `/api/**` endpoints).
*   **`TooManyRequestsException`:** Custom exception returned when rate limit is exceeded.

## 13. Contributing

Feel free to fork this repository, open issues, or submit pull requests.

## 14. License

This project is open-source and available under the MIT License.
```