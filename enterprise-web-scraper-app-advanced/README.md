# Web Scraping Automation Platform

A comprehensive, production-ready web scraping system built with Spring Boot, PostgreSQL, Spring Security (JWT), Jsoup, and Thymeleaf. This platform allows users to define web scrapers, schedule them, execute them on-demand, and view extracted data through a web interface and a REST API.

## Table of Contents
1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Prerequisites](#prerequisites)
5.  [Getting Started](#getting-started)
    *   [Local Development](#local-development)
    *   [Docker Compose](#docker-compose)
6.  [Database](#database)
7.  [Authentication & Authorization](#authentication--authorization)
8.  [API Endpoints](#api-endpoints)
9.  [Web UI](#web-ui)
10. [Configuration](#configuration)
11. [Testing](#testing)
12. [CI/CD](#cicd)
13. [Logging & Monitoring](#logging--monitoring)
14. [Caching](#caching)
15. [Rate Limiting](#rate-limiting)
16. [Contributing](#contributing)
17. [License](#license)

## 1. Features

*   **Scraper Definition:** Define target URLs, CSS selectors for item identification, and a JSON map for extracting specific fields.
*   **Scheduled & On-demand Scraping:** Configure scrapers to run at regular intervals or trigger them manually via UI/API.
*   **Data Storage:** Persist scraped data in a PostgreSQL database with JSONB support for flexible schemas.
*   **Task Management:** Track the status and history of scraping tasks.
*   **User Management & Authentication:** Secure access to the platform using JWT-based authentication and role-based authorization (USER, ADMIN).
*   **REST API:** Full CRUD operations for scraper definitions, scraping tasks, and scraped data.
*   **Web UI:** A basic Thymeleaf-based frontend for simplified management and visualization.
*   **Error Handling:** Centralized exception handling for consistent API responses.
*   **Logging:** Structured logging (console, file, JSON) with Logback for observability.
*   **Caching:** Ehcache integration for improving performance of frequently accessed data (e.g., scraper definitions).
*   **Rate Limiting:** In-memory IP-based rate limiting for API endpoints to prevent abuse.
*   **Robustness:** Uses `PreDestroy` for clean shutdown of scraper executor service.

## 2. Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed overview.

## 3. Technologies Used

*   **Backend:** Java 17, Spring Boot 3.2.x
*   **Web Framework:** Spring Web MVC
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA, Hibernate
*   **Migrations:** Flyway
*   **Security:** Spring Security, JWT (jjwt)
*   **HTML Parsing:** Jsoup
*   **Frontend (Basic):** Thymeleaf, HTML, CSS, JavaScript
*   **Build Tool:** Maven
*   **Containerization:** Docker, Docker Compose
*   **API Documentation:** Springdoc-openapi (Swagger UI)
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers, JaCoCo
*   **Caching:** Ehcache
*   **Logging:** SLF4J + Logback

## 4. Prerequisites

Before you begin, ensure you have the following installed:

*   **Java 17 JDK** or higher
*   **Maven 3.x** or higher
*   **Docker Desktop** (if using Docker Compose)
*   **Git**

## 5. Getting Started

You can run the application either locally (requires local PostgreSQL) or using Docker Compose.

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/web-scraping-tools.git
    cd web-scraping-tools
    ```

2.  **Set up PostgreSQL:**
    *   Install PostgreSQL (e.g., via `apt install postgresql` on Debian/Ubuntu, Homebrew on macOS, or Docker).
    *   Create a database and a user with access:
        ```sql
        CREATE DATABASE webscraping;
        CREATE USER "user" WITH ENCRYPTED PASSWORD 'password';
        GRANT ALL PRIVILEGES ON DATABASE webscraping TO "user";
        ```
    *   Alternatively, you can start a PostgreSQL container quickly:
        ```bash
        docker run --name local-postgres -e POSTGRES_DB=webscraping -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
        ```

3.  **Configure `application.yml`:**
    *   Open `src/main/resources/application.yml`.
    *   Ensure the `spring.datasource` properties match your local PostgreSQL setup.
    *   Set a strong `JWT_SECRET_KEY` environment variable or directly in `application.yml` (e.g., `JWT_SECRET_KEY=YourSuperSecretKeyThatIsLongEnoughAndRandomlyGenerated`).

4.  **Run Flyway Migrations:**
    Flyway will automatically run migrations on startup.

5.  **Build and Run the application:**
    ```bash
    mvn clean install
    java -jar target/web-scraping-tools-0.0.1-SNAPSHOT.jar
    ```
    The application will start on `http://localhost:8080`.

### Docker Compose

This is the recommended way to run the application for development and testing, as it includes both the application and a PostgreSQL database.

1.  **Build the Docker image:**
    ```bash
    mvn clean install -DskipTests # Build the JAR first
    docker-compose build
    ```

2.  **Start the services:**
    ```bash
    docker-compose up -d
    ```
    This will start the Spring Boot application (exposed on port 8080) and a PostgreSQL database (exposed on port 5432).

3.  **Verify services:**
    ```bash
    docker-compose ps
    ```
    You should see both `app` and `postgres` services running.

4.  **Access the application:**
    *   Web UI: `http://localhost:8080`
    *   Swagger UI: `http://localhost:8080/swagger-ui.html`

## 6. Database

*   **Type:** PostgreSQL
*   **ORM:** Spring Data JPA with Hibernate
*   **Migration Tool:** Flyway
    *   Schema definitions are in `src/main/resources/db/migration/V1__Initial_Schema.sql`.
    *   Seed data (admin user, regular user, example scrapers) is in `src/main/resources/db/migration/V2__Seed_Data.sql`.
    *   Flyway runs automatically on application startup.
*   **Query Optimization:** Basic indexing has been applied to frequently queried columns. Further optimizations (e.g., GIN indexes for JSONB, custom queries) can be added based on specific access patterns.

## 7. Authentication & Authorization

*   **Mechanism:** JWT (JSON Web Tokens) with Spring Security.
*   **Endpoints:**
    *   `/api/auth/register`: Register a new user (`POST`).
    *   `/api/auth/authenticate`: Authenticate existing user, get JWT token (`POST`).
*   **Roles:** `USER` and `ADMIN`.
*   **Access Control:** Method-level security (`@PreAuthorize`) and URL-based security configured in `SecurityConfig`.
*   **Default Users (from `V2__Seed_Data.sql`):**
    *   **Admin:** `username: admin`, `password: adminpass`
    *   **User:** `username: user`, `password: userpass`

## 8. API Endpoints

The API is documented using Springdoc-openapi, accessible via Swagger UI at `http://localhost:8080/swagger-ui.html`.

**Base URL:** `http://localhost:8080/api`

### Authentication
*   `POST /api/auth/register` - Register a new user. Request: `{ "username": "newuser", "password": "securepassword" }`
*   `POST /api/auth/authenticate` - Authenticate and get JWT. Request: `{ "username": "admin", "password": "adminpass" }`

### Scrapers (`/api/scrapers`) - Requires Authentication
*   `GET /api/scrapers` - Get all scraper definitions (paginated).
*   `GET /api/scrapers/{id}` - Get a single scraper definition by ID.
*   `POST /api/scrapers` - Create a new scraper definition. Request: `ScraperCreateRequest` (see `API.md`).
*   `PUT /api/scrapers/{id}` - Update an existing scraper definition. Request: `ScraperUpdateRequest`.
*   `DELETE /api/scrapers/{id}` - Delete a scraper definition.
*   `POST /api/scrapers/{id}/run` - Manually trigger a scraping task for a given scraper.

### Scraping Tasks (`/api/tasks`) - Requires Authentication
*   `GET /api/tasks` - Get all scraping tasks (paginated). Can filter by `scraperDefinitionId`.
*   `GET /api/tasks/{id}` - Get a single scraping task by ID.

### Scraped Data (`/api/data`) - Requires Authentication
*   `GET /api/data` - Get all scraped data items (paginated). Can filter by `taskId` or `scraperDefinitionId`.
*   `GET /api/data/{id}` - Get a single scraped data item by ID.

## 9. Web UI

The application provides a basic web UI using Thymeleaf.
*   **Login Page:** `/login`
*   **Scrapers List/Management:** `/scrapers` (requires login)
*   **Scraper Detail & Edit:** `/scrapers/{id}` (requires login)

This UI allows you to:
*   View all configured scrapers.
*   Create new scrapers (including field definitions as JSON).
*   Edit existing scraper details.
*   Delete scrapers.
*   Manually trigger scraping tasks.
*   View recent scraped data for a scraper.

## 10. Configuration

All application configuration is managed via `src/main/resources/application.yml`. Key configurable aspects include:

*   **Database connection:** `spring.datasource.*`
*   **JWT Secret Key:** `application.security.jwt.secret-key` (environment variable `JWT_SECRET_KEY` is recommended).
*   **JWT Expiration:** `application.security.jwt.expiration` (in milliseconds).
*   **Scraping Scheduler Interval:** `app.scraping.scheduler.interval-ms` (default 60000ms/1 minute).
*   **Logging:** Configured in `logback-spring.xml` for console, file, and structured JSON logs.
*   **Caching:** Configured in `ehcache.xml` for `scraperDefinitions` cache.

Environment variables can override `application.yml` properties.

## 11. Testing

The project includes various types of tests to ensure quality and reliability:

*   **Unit Tests:** Focus on individual components (e.g., `HtmlParserServiceTest`, `UserServiceTest`).
*   **Integration Tests:** Test the interaction between multiple components (e.g., `ScraperIntegrationTest` covers API endpoints, database interactions, and service logic using `MockMvc` and `Testcontainers`).
*   **API Tests:** Covered by the `MockMvc` tests within integration tests, verifying API contract (status codes, JSON structure).
*   **Coverage:** Configured with JaCoCo for code coverage reporting (integrated into CI/CD).
*   **Testcontainers:** Used for spinning up a real PostgreSQL database for integration tests, ensuring tests run against an environment similar to production.

To run all tests:
```bash
mvn test
```

## 12. CI/CD

A GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is provided for Continuous Integration and Continuous Deployment:

*   **Build & Test:** On every push and pull request to `main`.
    *   Builds the project with Maven.
    *   Runs unit and integration tests.
    *   Generates JaCoCo code coverage report and uploads to Codecov.
    *   Archives the build JAR artifact.
*   **Docker Build & Push:** On push to `main`.
    *   Builds a Docker image for the application.
    *   Tags it with `latest` and a timestamp.
    *   Pushes the image to Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` as GitHub Secrets).
*   **Deploy to Server:** On push to `main`.
    *   Connects to a remote server via SSH.
    *   Pulls the latest Docker image.
    *   Stops and removes the old container, then runs a new one.
    *   Requires `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` as GitHub Secrets.

**GitHub Secrets Configuration:**
*   `DOCKER_USERNAME`: Your Docker Hub username.
*   `DOCKER_PASSWORD`: Your Docker Hub Access Token (recommended over password).
*   `JWT_SECRET_KEY`: A strong, random key for JWT signing.
*   `SSH_HOST`: IP address or hostname of your deployment server.
*   `SSH_USER`: SSH username for your deployment server.
*   `SSH_PRIVATE_KEY`: Private SSH key for authentication to the deployment server.

## 13. Logging & Monitoring

*   **Logging Framework:** SLF4J with Logback.
*   **Configuration:** `src/main/resources/logback-spring.xml`.
*   **Appenders:** Console, rolling file (`.log`), and structured JSON rolling file (`-json.log`). The JSON logs are ideal for ingestion into log aggregation systems like ELK (Elasticsearch, Logstash, Kibana) or Splunk.
*   **Spring Boot Actuator:** Provides production-ready features like health checks (`/actuator/health`), metrics (`/actuator/metrics`), and more. Can be monitored with tools like Prometheus.

## 14. Caching

*   **Framework:** Spring's caching abstraction with Ehcache as the underlying provider.
*   **Configuration:** `src/main/resources/ehcache.xml` defines cache regions (e.g., `scraperDefinitions`) and their policies (TTL, heap/off-heap limits).
*   **Usage:** `@Cacheable`, `@CachePut`, `@CacheEvict` annotations are used on service methods (e.g., `ScraperDefinitionService`).

## 15. Rate Limiting

*   **Implementation:** A custom Spring MVC `HandlerInterceptor` (`RateLimitInterceptor`).
*   **Mechanism:** In-memory, IP-based rate limiting. Limits API access to `MAX_REQUESTS` (default 5) within a `TIME_WINDOW_SECONDS` (default 10) per client IP address.
*   **Configuration:** Applied to all `/api/**` endpoints via `WebConfig`.

## 16. Contributing

Feel free to fork the repository, open issues, and submit pull requests.

## 17. License

This project is open-source and available under the [MIT License](LICENSE).
```