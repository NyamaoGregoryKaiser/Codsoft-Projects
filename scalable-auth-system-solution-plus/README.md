# Enterprise-Grade Authentication & Task Management System

This project is a comprehensive, production-ready full-stack web application demonstrating robust authentication, authorization, and task management features. It is built with Java Spring Boot for the backend and React for the frontend, utilizing PostgreSQL as the database. The system adheres to enterprise-grade standards, including extensive testing, containerization with Docker, CI/CD pipelines, and detailed documentation.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Docker Compose (Recommended)](#docker-compose-recommended)
  - [Manual Setup](#manual-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Usage](#frontend-usage)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Additional Features](#additional-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

**Authentication & Authorization:**
*   User Registration: Secure account creation with password hashing (BCrypt).
*   User Login: JWT-based authentication for secure API access.
*   Refresh Tokens: Persistent sessions and automated access token renewal.
*   Role-Based Access Control (RBAC): `USER` and `ADMIN` roles for fine-grained authorization using Spring Security's `@PreAuthorize`.
*   Password Reset: Secure password recovery flow (token generation, validation).
*   Logout: Invalidation of tokens for secure session termination.

**Core Application (Task Management):**
*   User Profile Management: View and update user details.
*   Task CRUD: Create, Read, Update, Delete tasks.
*   Task Ownership: Users can only manage their own tasks (unless they are an Admin).

**Backend Core:**
*   RESTful API: JSON-based API endpoints.
*   Data Validation: Request payload validation using Jakarta Bean Validation.
*   Global Error Handling: Consistent error responses with `ApiError` format.
*   Database Layer: Spring Data JPA with Hibernate, PostgreSQL.
*   Database Migrations: Flyway for schema management.

**Additional Enterprise Features:**
*   **Logging & Monitoring:** SLF4J with Logback for structured logging to console and files.
*   **Caching Layer:** Caffeine for in-memory caching of frequently accessed data (e.g., user profiles, tasks).
*   **Rate Limiting:** IP-based request throttling using Bucket4j to prevent abuse and ensure service availability.
*   **API Documentation:** OpenAPI 3.0 (Swagger UI) for interactive API exploration.

**Frontend Core:**
*   Modern UI/UX: Responsive design using React and Tailwind CSS.
*   State Management: React Context API for authentication state.
*   Routing: React Router DOM for client-side navigation.
*   HTTP Client: Axios for API interactions.
*   Notifications: React Toastify for user feedback.

**Development & Operations:**
*   **Containerization:** Dockerfiles for backend (Java) and frontend (React/Nginx) for consistent environments.
*   **Orchestration:** Docker Compose for local multi-service development setup.
*   **CI/CD:** GitHub Actions workflow for automated testing, building, and deployment (example).

## Technology Stack

**Backend:**
*   **Language:** Java 17+
*   **Framework:** Spring Boot 3.x
*   **Security:** Spring Security, JJWT (JSON Web Tokens)
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA, Hibernate
*   **Migrations:** Flyway
*   **Caching:** Caffeine
*   **Mapping:** MapStruct (for DTO-Entity conversion)
*   **Logging:** SLF4J, Logback
*   **API Docs:** Springdoc OpenAPI (Swagger UI)
*   **Build Tool:** Maven

**Frontend:**
*   **Language:** JavaScript (ES6+)
*   **Framework:** React 18+
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM
*   **HTTP Client:** Axios
*   **State Management:** React Context API
*   **Notifications:** React Toastify
*   **Build Tool:** npm / Yarn

**Infrastructure & DevOps:**
*   **Containerization:** Docker
*   **Orchestration:** Docker Compose
*   **CI/CD:** GitHub Actions

## Project Structure

```
auth-system/
├── backend/                  # Spring Boot backend application
│   ├── src/main/java/        # Java source code
│   ├── src/main/resources/   # Application configuration (application.yml, logback-spring.xml)
│   ├── src/test/java/        # Backend tests (Unit, Integration with Testcontainers)
│   └── pom.xml               # Maven project file
├── frontend/                 # React frontend application
│   ├── public/               # Public assets
│   ├── src/                  # React components, contexts, services, pages, styles
│   ├── .env.development      # Frontend environment variables for development
│   ├── .env.production       # Frontend environment variables for production
│   ├── package.json          # Node.js project file
│   └── tailwind.config.js   # Tailwind CSS configuration
├── db/                       # Database related scripts
│   ├── migration/            # Flyway migration scripts (V1__initial_schema.sql, V2__seed_data.sql)
│   └── Dockerfile            # Dockerfile for Flyway (if separate migration service is needed)
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml          # Main CI/CD pipeline definition
├── docker-compose.yml        # Docker Compose for local multi-service setup
├── Dockerfile                # Dockerfile for the Spring Boot backend
├── Dockerfile.frontend       # Dockerfile for the React frontend (with Nginx)
├── README.md                 # Project README (this file)
└── docs/                     # Additional documentation
    ├── architecture.md       # High-level architecture overview
    ├── api.md                # API endpoint details and examples
    └── deployment.md         # Guide for deploying to a production environment
```

## Setup & Installation

### Prerequisites

*   **Git:** For cloning the repository.
*   **Java 17+ SDK:** For running the backend manually.
*   **Maven:** For building the backend manually.
*   **Node.js 18+:** For running the frontend manually.
*   **Yarn (or npm):** Package manager for the frontend.
*   **Docker & Docker Compose:** **Highly recommended** for a streamlined setup.
*   **PostgreSQL:** If setting up the database manually.

### Environment Variables

Create a `.env` file in the root directory of the project based on the example below. These variables are used by `docker-compose.yml`.

```ini
# .env (in the root directory)
DB_NAME=auth_db
DB_USER=user
DB_PASSWORD=password
JWT_SECRET_KEY=your_secure_256_bit_base64_encoded_secret_key # IMPORTANT: Generate a strong, random key!
# Example: echo "openssl rand -base64 32" (copy output)
```

**Note on `JWT_SECRET_KEY`**: This key must be a base64-encoded string of at least 32 bytes (256 bits). You can generate one using `openssl rand -base64 32`. Do NOT use the default key in production.

### Docker Compose (Recommended)

The easiest way to get the entire system up and running is with Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/auth-system.git
    cd auth-system
    ```
2.  **Create `.env` file:** Create the `.env` file in the root directory as described above.
3.  **Build and run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the `db` (PostgreSQL), `backend` (Spring Boot), and `frontend` (React/Nginx) Docker images.
    *   Start the services.
    *   Apply database migrations and seed data automatically (via Flyway in the backend).

4.  **Verify services:**
    *   **Backend API:** `http://localhost:8080` (or `http://localhost:8080/api/v1/auth/register`)
    *   **Swagger UI:** `http://localhost:8080/swagger-ui.html`
    *   **Frontend App:** `http://localhost:3000`

### Manual Setup

If you prefer to run services manually without Docker Compose:

#### 1. Database Setup (PostgreSQL)

*   **Install PostgreSQL:** If not already installed, install PostgreSQL.
*   **Create Database & User:**
    ```sql
    CREATE DATABASE auth_db;
    CREATE USER user WITH PASSWORD 'password';
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO user;
    ```
*   **Run Migrations:**
    The backend application automatically runs Flyway migrations on startup. Ensure `db/migration` files are present.

#### 2. Backend Setup (Spring Boot)

1.  **Navigate to backend directory:**
    ```bash
    cd auth-system/backend
    ```
2.  **Configure `application.yml`:**
    Modify `src/main/resources/application.yml` to point to your manually set up PostgreSQL database. Ensure `spring.datasource.url`, `username`, `password` match. Also, set `JWT_SECRET_KEY` in your environment or directly in `application.yml` (not recommended for production).
3.  **Build the project:**
    ```bash
    mvn clean install -DskipTests
    ```
4.  **Run the application:**
    ```bash
    mvn spring-boot:run
    ```
    Alternatively, run the JAR:
    ```bash
    java -jar target/auth-system-0.0.1-SNAPSHOT.jar
    ```
    The backend will start on `http://localhost:8080`.

#### 3. Frontend Setup (React)

1.  **Navigate to frontend directory:**
    ```bash
    cd auth-system/frontend
    ```
2.  **Install dependencies:**
    ```bash
    yarn install # or npm install
    ```
3.  **Configure environment variables:**
    *   For **development**, the `REACT_APP_API_BASE_URL` in `.env.development` should point to your backend (e.g., `http://localhost:8080/api/v1`).
    *   For **production builds**, modify `.env.production` to point to your deployed backend API URL.
4.  **Run the application:**
    ```bash
    yarn start # or npm start
    ```
    The frontend will start on `http://localhost:3000`.

## Running the Application

After following the Docker Compose setup:
*   Open your browser to `http://localhost:3000` for the frontend application.
*   Navigate to `http://localhost:8080/swagger-ui.html` for the backend API documentation.

**Default Seeded Users:**
*   **Admin User:**
    *   Email: `admin@example.com`
    *   Password: `adminpass`
*   **Regular User:**
    *   Email: `user@example.com`
    *   Password: `userpass`

You can register new users from the frontend application as well.

## API Documentation

The backend exposes interactive API documentation via Swagger UI.

*   **Swagger UI:** `http://localhost:8080/swagger-ui.html`
*   **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

See `docs/api.md` for a summary of key endpoints.

## Frontend Usage

1.  **Register:** Create a new user account or use the seeded `admin@example.com`/`adminpass` or `user@example.com`/`userpass`.
2.  **Login:** Log in with your registered credentials.
3.  **Dashboard:** After successful login, you will be redirected to the dashboard.
    *   **User Profile:** Access your profile to view/update your username and email.
    *   **Task Management:** Create, view, update, and delete your tasks.
    *   **Admin Features:** If logged in as an admin, you might see additional options to manage all users/tasks.
4.  **Logout:** Securely log out of your session.

## Testing

The project includes comprehensive testing:

### Backend Tests (Java)
*   **Unit Tests:** For services and utilities, mocking dependencies.
    *   `AuthServiceTest.java`: Covers registration, login, token refresh, password reset logic.
*   **Integration Tests:**
    *   `AuthControllerTest.java`: WebMvc tests for controllers, validating API behavior and error handling.
    *   `UserRepositoryTest.java`: DataJpaTest using **Testcontainers** to spin up a real PostgreSQL database for repository testing. This ensures database interactions are correctly mapped.
*   **Coverage:** Configured with JaCoCo to enforce an 80%+ line coverage minimum.

To run backend tests:
```bash
cd backend
mvn test
```
To run tests and generate a coverage report (report will be in `backend/target/site/jacoco/index.html`):
```bash
cd backend
mvn clean verify
```

### Frontend Tests (React)
*   **Unit/Integration Tests:** Using React Testing Library and Jest to test components and service interactions.
    *   `auth.test.js`: Covers registration, login, profile update, and logout flows, interacting with mocked API calls and context.

To run frontend tests:
```bash
cd frontend
yarn test # or npm test
```
To run tests and generate a coverage report:
```bash
cd frontend
yarn test --coverage # or npm test -- --coverage
```

### API Tests (Postman/cURL)
You can use the Swagger UI (`http://localhost:8080/swagger-ui.html`) to manually test API endpoints.
Alternatively, you can use tools like Postman or cURL. See `docs/api.md` for example requests.

### Performance Tests
While not explicitly implemented as code in this response (due to scope), a production-ready system would typically involve:
*   **Load Testing:** Tools like Apache JMeter, K6, or Locust to simulate high user traffic.
*   **Stress Testing:** Pushing the system beyond its normal operating limits to identify breaking points.
*   **Benchmarking:** Measuring response times and throughput under controlled conditions.

Consider integrating these into your CI/CD for automated performance regression checks.

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/main.yml`) that demonstrates a basic CI/CD pipeline:

1.  **`backend-test-and-build` job:**
    *   Checks out code.
    *   Sets up Java 17.
    *   Sets up a **PostgreSQL Testcontainer** for integration tests.
    *   Runs all backend unit and integration tests (including JaCoCo coverage check).
    *   Builds the backend Docker image.
2.  **`frontend-test-and-build` job:**
    *   Checks out code.
    *   Sets up Node.js 18.
    *   Installs frontend dependencies.
    *   Runs all frontend tests.
    *   Builds the frontend Docker image.
3.  **`deploy` job:**
    *   **Conditional:** Runs only on pushes to the `main` branch.
    *   Depends on successful completion of `backend-test-and-build` and `frontend-test-and-build` jobs.
    *   Logs in to Docker Hub.
    *   Tags and pushes the built Docker images to Docker Hub.
    *   **Example Deployment Step:** Includes a placeholder for SSHing into a server and pulling/restarting Docker containers. This would be replaced by actual deployment scripts for cloud platforms (Kubernetes, ECS, etc.).

**To enable CI/CD:**
1.  Fork this repository to your GitHub account.
2.  Go to your repository's "Settings" -> "Secrets and variables" -> "Actions".
3.  Add the following repository secrets:
    *   `JWT_SECRET_KEY`: A strong, randomly generated 256-bit base64-encoded key for JWT signing.
    *   `DOCKER_USERNAME`: Your Docker Hub username.
    *   `DOCKER_PASSWORD`: Your Docker Hub personal access token or password.
    *   `DEPLOY_HOST`: IP address or hostname of your deployment server.
    *   `DEPLOY_USER`: SSH username for your deployment server.
    *   `DEPLOY_SSH_KEY`: Your private SSH key (ensure it's formatted correctly for GitHub Secrets).

## Additional Features

*   **Authentication/Authorization:** Detailed in the [Features](#features) section. JWTs, refresh tokens, RBAC are fully implemented.
*   **Logging and Monitoring:** Implemented with SLF4J and Logback, configured for console output, info files, and error files. Backend includes Spring Boot Actuator (`/actuator`) for basic health checks and monitoring.
*   **Error Handling Middleware:** A global `@ControllerAdvice` (`GlobalExceptionHandler`) catches various exceptions and returns consistent `ApiError` JSON responses.
*   **Caching Layer:** Uses Spring Cache abstraction with Caffeine (an in-memory caching library) to cache `User` and `Task` data, reducing database load for frequent reads.
*   **Rate Limiting:** An IP-based rate limiting filter (`RateLimitFilter`) is implemented using the Bucket4j library, protecting API endpoints from abuse.

## Deployment

Refer to `docs/deployment.md` for a more detailed guide on deploying this application to a production environment. This includes considerations for cloud providers, environment variables, and scalability.

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass and code coverage is maintained.
6.  Commit your changes (`git commit -m 'Add new feature'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.