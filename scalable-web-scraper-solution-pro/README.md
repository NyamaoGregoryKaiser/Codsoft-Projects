```markdown
# Scrapify: Comprehensive Web Scraping Tools System

## Table of Contents
1.  [Introduction](#1-introduction)
2.  [Features](#2-features)
3.  [Architecture](#3-architecture)
4.  [Technology Stack](#4-technology-stack)
5.  [Setup and Installation](#5-setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Setup (using Docker Compose)](#local-setup-using-docker-compose)
    *   [Manual Database Setup (if not using Docker)](#manual-database-setup-if-not-using-docker)
    *   [Running the Application Manually](#running-the-application-manually)
6.  [API Documentation (Swagger UI)](#6-api-documentation-swagger-ui)
7.  [Frontend (Basic Example)](#7-frontend-basic-example)
8.  [Testing](#8-testing)
9.  [CI/CD](#9-cicd)
10. [Deployment Guide](#10-deployment-guide)
11. [Additional Features](#11-additional-features)
12. [Future Enhancements](#12-future-enhancements)
13. [Contributing](#13-contributing)
14. [License](#14-license)

---

## 1. Introduction
Scrapify is an enterprise-grade, full-stack web scraping tools system designed to enable users to define, schedule, execute, and manage web scraping jobs. It provides a robust backend with a RESTful API, a persistent database layer, authentication/authorization, and various quality-of-life features necessary for production environments.

## 2. Features
*   **User Management:** Register, authenticate, and manage users (admin roles).
*   **JWT Authentication:** Secure API access using JSON Web Tokens.
*   **CRUD for Scraping Jobs:** Define, retrieve, update, and delete web scraping configurations.
*   **Customizable Scraping Logic:** Configure target URLs and CSS selectors (or XPath) to extract specific data fields.
*   **Scheduled Scraping:** Schedule jobs using cron expressions for automated execution.
*   **Manual Job Triggering:** Run scraping jobs on demand.
*   **Scraped Data Storage:** Persist extracted data in a structured format.
*   **Job Execution Logging:** Track the status, start/end times, and errors of each job run.
*   **Data Pagination:** Efficiently retrieve large sets of scraped data and job logs.
*   **Error Handling:** Centralized exception handling for consistent API responses.
*   **Logging & Monitoring:** Comprehensive logging with Spring Boot Actuator for health checks.
*   **Caching:** In-memory caching (Caffeine) for frequently accessed data to improve performance.
*   **Rate Limiting:** API rate limiting per IP address to prevent abuse.
*   **Database Migrations:** Flyway for managing database schema evolution.
*   **Containerization:** Docker support for easy deployment and scalability.
*   **Comprehensive Testing:** Unit, integration, and API tests.
*   **API Documentation:** OpenAPI/Swagger UI for interactive API exploration.
*   **Basic Frontend:** A simple HTML/JS client to demonstrate API interaction.

## 3. Architecture
The system follows a layered architecture, common in Spring Boot applications:

```
+-------------------+      +-------------------+
|     Frontend      |<----->|    Spring Boot    |
| (HTML/JS/React)   |      |    (Backend)      |
+-------------------+      +--------+----------+
                                     |
                                     | REST APIs
                                     |
                          +----------V----------+
                          |   Controller Layer  |
                          +----------+----------+
                                     |
                          +----------V----------+
                          |     Service Layer   | (Business Logic, Scraping Orchestration, Scheduler)
                          +----------+----------+
                                     |
                          +----------V----------+
                          |    Repository Layer | (Data Access - Spring Data JPA)
                          +----------+----------+
                                     |
                          +----------V----------+
                          |   Database (PostgreSQL)  |
                          +---------------------+

Additional Components:
- **Security:** Spring Security, JWT for authentication/authorization.
- **Caching:** Spring Cache with Caffeine.
- **Rate Limiting:** Custom HandlerInterceptor.
- **Logging:** SLF44J + Logback.
- **API Docs:** Springdoc OpenAPI.
- **Scheduler:** Spring's `@Scheduled` with `TaskScheduler`.
- **Scraper:** Jsoup for HTML parsing.
- **Migrations:** Flyway.
- **Containerization:** Docker.
```

## 4. Technology Stack
*   **Backend:** Java 17, Spring Boot 3.x
*   **Build Tool:** Maven
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA, Hibernate
*   **Authentication:** Spring Security, JWT (jjwt)
*   **Web Scraping:** Jsoup
*   **Database Migration:** Flyway
*   **Caching:** Caffeine (Spring Cache)
*   **API Documentation:** Springdoc OpenAPI
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers, RestAssured
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Frontend:** HTML, CSS, JavaScript (basic client)

## 5. Setup and Installation

### Prerequisites
*   Java 17 JDK
*   Maven 3.x
*   Docker and Docker Compose (recommended for easy setup)
*   (Optional) PostgreSQL client if managing database manually

### Local Setup (using Docker Compose)
The easiest way to get the application running with its database is using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/scrapify-webscraper.git
    cd scrapify-webscraper
    ```

2.  **Build and run with Docker Compose:**
    ```bash
    docker compose up --build -d
    ```
    This command will:
    *   Build the Spring Boot application's Docker image.
    *   Start a PostgreSQL database container.
    *   Apply Flyway database migrations and seed data to the PostgreSQL database.
    *   Start the Spring Boot application container, linking it to the database.

3.  **Verify containers are running:**
    ```bash
    docker ps
    ```
    You should see `scrapify_db` and `scrapify_app` containers running.

4.  **Access the application:**
    The backend API will be available at `http://localhost:8080`.
    The Swagger UI for API documentation will be at `http://localhost:8080/swagger-ui.html`.
    A very basic frontend client is available at `http://localhost:8080/index.html`.

### Manual Database Setup (if not using Docker)
If you prefer not to use Docker for the database, you'll need a local PostgreSQL instance.

1.  **Install PostgreSQL:**
    Follow instructions for your OS.

2.  **Create a database and user:**
    ```sql
    CREATE USER scrapify_user WITH PASSWORD 'scrapify_pass';
    CREATE DATABASE scrapify_db OWNER scrapify_user;
    GRANT ALL PRIVILEGES ON DATABASE scrapify_db TO scrapify_user;
    ```

3.  **Update `application.yml`:**
    Modify `src/main/resources/application.yml` to reflect your database connection details if they differ from the defaults (e.g., `DB_HOST`, `DB_PORT`). Or, set environment variables directly.

### Running the Application Manually
If not using Docker for the application itself:

1.  **Ensure Java 17 and Maven are installed.**
2.  **Ensure your PostgreSQL database is running and configured as above.**
3.  **Apply Flyway migrations manually (optional, Spring Boot will do it on startup):**
    ```bash
    mvn flyway:migrate
    ```
4.  **Build the project:**
    ```bash
    mvn clean install -DskipTests
    ```
5.  **Run the application:**
    ```bash
    java -jar target/web-scraper-0.0.1-SNAPSHOT.jar
    ```
    Or run from your IDE.

## 6. API Documentation (Swagger UI)
Once the application is running, you can access the interactive API documentation using Swagger UI:
👉 [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Key Endpoints:
*   **Authentication:**
    *   `POST /api/auth/register`: Register a new user.
    *   `POST /api/auth/login`: Authenticate and get a JWT token.
*   **Scraping Jobs (requires JWT in `Authorization: Bearer <token>` header):**
    *   `POST /api/jobs`: Create a new scraping job.
    *   `GET /api/jobs`: Get all jobs for the authenticated user.
    *   `GET /api/jobs/{jobId}`: Get a specific job.
    *   `PUT /api/jobs/{jobId}`: Update a job.
    *   `DELETE /api/jobs/{jobId}`: Delete a job.
    *   `POST /api/jobs/{jobId}/run`: Manually trigger a job.
    *   `GET /api/jobs/{jobId}/data`: Get scraped data for a job (paginated).
    *   `GET /api/jobs/{jobId}/logs`: Get job execution logs (paginated).
*   **User Management (Admin only, requires JWT with ADMIN role):**
    *   `GET /api/admin/users`: Get all users.
    *   `GET /api/admin/users/{id}`: Get user by ID.
    *   `PUT /api/admin/users/{id}/roles`: Update user roles.
    *   `DELETE /api/admin/users/{id}`: Delete a user.

### Default Credentials for Testing:
*   **Admin User:**
    *   Username: `admin`
    *   Password: `adminpass`
*   **Regular User:**
    *   Username: `user`
    *   Password: `userpass`

## 7. Frontend (Basic Example)
A simple HTML/JS frontend is provided in `src/main/resources/static` to demonstrate interaction with the backend API.
Access it at: 👉 [http://localhost:8080/index.html](http://localhost:8080/index.html)

This frontend allows:
*   User registration and login.
*   Displaying the JWT token.
*   Fetching and displaying user's scraping jobs.
*   (Requires manual interaction with developer console for full CRUD demonstration).

## 8. Testing
The project includes a comprehensive test suite:
*   **Unit Tests:** For individual components (services, utilities) using JUnit 5 and Mockito.
*   **Integration Tests:** For repository and controller layers using `@DataJpaTest`, `@WebMvcTest`, and Testcontainers for a real database environment.
*   **API Tests:** Using RestAssured (demonstrated within `WebScraperApplicationTests` and controller tests implicitly)
*   **Test Coverage:** Aim for 80%+ line and branch coverage (enforced by JaCoCo plugin in `pom.xml`).

To run all tests:
```bash
mvn clean install
```
To run tests with coverage report:
```bash
mvn clean verify
# Open target/site/jacoco/index.html for the report
```

## 9. CI/CD
A basic GitHub Actions workflow (`.github/workflows/main.yml`) is configured for CI/CD:
*   **On Push/Pull Request to `main` or `develop` branches:**
    *   Builds the project.
    *   Runs all tests.
    *   Generates JaCoCo test coverage report.
*   **On Push to `main` branch (after successful build and test):**
    *   Builds a Docker image for the application.
    *   Pushes the Docker image to Docker Hub.
    *   (Optional) Triggers a deployment to a production server via SSH.

**To enable Docker Push and Deployment:**
*   You'll need to set up GitHub Secrets in your repository settings:
    *   `DOCKER_USERNAME`
    *   `DOCKER_PASSWORD`
    *   `PROD_SSH_HOST` (e.g., your server IP)
    *   `PROD_SSH_USERNAME`
    *   `PROD_SSH_KEY` (private SSH key for your deployment user)
    *   `DOCKER_IMAGE_REPO` (e.g. `yourusername/scrapify-webscraper`)

## 10. Deployment Guide
The recommended deployment strategy is using Docker and Docker Compose on a Linux server.

1.  **Provision a Linux VM/Server:** Ensure Docker and Docker Compose are installed.
2.  **SSH Access:** Configure SSH access for your deployment user.
3.  **Copy `docker-compose.yml`:** Transfer the `docker-compose.yml` file to your server (e.g., to `/opt/scrapify-webscraper/`).
4.  **Environment Variables:** Create a `.env` file next to `docker-compose.yml` with your production database credentials and JWT secret:
    ```
    DB_NAME=prod_scrapify_db
    DB_USERNAME=prod_scrapify_user
    DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
    JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_AT_LEAST_32_CHARS
    JWT_EXPIRATION=3600000 # 1 hour
    ```
5.  **Run Docker Compose:**
    ```bash
    cd /opt/scrapify-webscraper
    docker compose pull       # Pull the latest image (if using CI/CD)
    docker compose up -d      # Start containers in detached mode
    ```
6.  **Firewall:** Ensure port 8080 (or your configured port) is open on your server's firewall.
7.  **Reverse Proxy (Recommended):** For production, place a reverse proxy (Nginx or Apache) in front of the Spring Boot application. This allows for SSL termination, domain routing, and additional security/performance benefits.
    *   Example Nginx configuration snippet:
        ```nginx
        server {
            listen 80;
            server_name scrapify.yourdomain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl;
            server_name scrapify.yourdomain.com;

            ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
            ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;

            location / {
                proxy_pass http://localhost:8080; # Or the Docker internal IP if not on same host network
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```

## 11. Additional Features
*   **Authentication/Authorization:** Implemented using Spring Security and JWT. Roles (`USER`, `ADMIN`) provide granular access control with `@PreAuthorize`.
*   **Logging and Monitoring:** Utilizes SLF4J with Logback (Spring Boot default). Configured to log at `DEBUG` level for `com.scrapify.webscraper`. Spring Boot Actuator (`/actuator/**`) provides health, metrics, and info endpoints.
*   **Error Handling Middleware:** Global exception handler (`@ControllerAdvice`) provides consistent JSON error responses for `ResourceNotFoundException`, `UserAlreadyExistsException`, `MethodArgumentNotValidException`, and general exceptions.
*   **Caching Layer:** Spring Cache abstraction with Caffeine (in-memory) is used for `UserService` and `ScrapingJobService` to cache frequently accessed user and job data, improving response times and reducing database load.
*   **Rate Limiting:** A custom `HandlerInterceptor` is implemented to limit API requests per IP address (`app.rate-limit.requests-per-minute` in `application.yml`).

## 12. Future Enhancements
*   **Advanced Scraping:**
    *   Integration with headless browsers (Selenium/Playwright) for JavaScript-rendered content.
    *   XPath support in addition to CSS selectors.
    *   Pagination and multi-page scraping logic.
    *   Handling anti-bot measures (proxies, CAPTCHA integration).
    *   Screenshot capture for job debugging.
*   **Scalability & Resilience:**
    *   Distributed caching (Redis) for horizontal scaling.
    *   Message queue (Kafka/RabbitMQ) for asynchronous job execution.
    *   Circuit breakers (Resilience4j) for external service calls.
    *   Centralized logging (ELK stack) and monitoring (Prometheus/Grafana).
*   **User Interface:** A full-fledged Single Page Application (React, Angular, Vue.js) for a richer user experience.
*   **Reporting:** Dashboards and visualization of scraped data.
*   **Alerting:** Notifications (email, Slack) for job failures or anomalies.
*   **Data Export:** Options to export scraped data in various formats (CSV, JSON, Excel).
*   **Proxy Management:** Integration with proxy rotation services.
*   **User Preferences:** Timezone settings for cron schedules.

## 13. Contributing
Feel free to fork the repository, open issues, and submit pull requests.

## 14. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```