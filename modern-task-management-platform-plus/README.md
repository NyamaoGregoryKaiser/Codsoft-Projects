```markdown
# TaskFlow: Comprehensive Task Management System

## Project Overview

TaskFlow is an enterprise-grade, full-stack Task Management System designed to help individuals and teams organize, track, and manage their tasks efficiently. Built with modern technologies, it emphasizes modularity, scalability, security, and a rich user experience.

### Key Features

*   **User Authentication & Authorization:** Secure JWT-based login, registration, and role-based access control (RBAC) for users and administrators.
*   **Task Management:** Full CRUD operations for tasks including title, description, status (Pending, In Progress, Completed, Canceled), priority (Low, Medium, High, Urgent), and due dates.
*   **Project Organization:** Group tasks into projects, associating tasks with specific projects.
*   **Tagging System:** Categorize tasks with multiple customizable tags for better organization and searchability.
*   **User Profiles:** Manage personal information.
*   **API Endpoints:** A comprehensive set of RESTful APIs for all core functionalities.
*   **Robust Error Handling:** Consistent error responses for API consumers.
*   **Logging & Monitoring:** Structured logging for better observability.
*   **Caching Layer:** Backend caching using Caffeine for improved performance.
*   **Rate Limiting:** Protect API from abuse and ensure fair usage.
*   **Database Migrations:** Version-controlled database schema management with Flyway.
*   **Comprehensive Testing:** Unit, Integration, and API tests to ensure quality and reliability.
*   **Docker Support:** Containerized setup for easy development and deployment.
*   **Modern Frontend:** Responsive and intuitive user interface built with React and Material-UI.

### Technology Stack

*   **Backend:** Java 17+, Spring Boot 3, Spring Security, Spring Data JPA, Hibernate, PostgreSQL, Flyway, Lombok, Caffeine, ModelMapper.
*   **Frontend:** React 18 (TypeScript), Axios, React Router DOM, Material-UI, React Hook Form, Day.js.
*   **Database:** PostgreSQL.
*   **Containerization:** Docker, Docker Compose.
*   **CI/CD:** GitHub Actions.
*   **Testing:** JUnit 5, Mockito, Spring Boot Test (Backend); Jest, React Testing Library (Frontend); k6 (Performance).

## Setup and Installation

Follow these steps to get TaskFlow up and running on your local machine.

### Prerequisites

*   **Java 17 or higher** (OpenJDK recommended)
*   **Maven 3.6+**
*   **Node.js 18+ and npm 8+**
*   **Docker and Docker Compose** (Optional, but highly recommended for easy setup)
*   **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/task-flow.git # Replace with your repo URL
cd task-flow
```

### 2. Backend Setup (Spring Boot)

Navigate to the `task-management-backend` directory.

```bash
cd task-management-backend
```

#### Option A: Run with Docker Compose (Recommended)

This method sets up the PostgreSQL database and the Spring Boot application in Docker containers.

1.  **Build the Docker image for the backend:**
    ```bash
    mvn clean install -DskipTests
    docker build -t task-management-backend .
    ```
2.  **Start the services using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Build the frontend image (if not already built).
    *   Start a PostgreSQL container.
    *   Run Flyway migrations.
    *   Start the Spring Boot backend.
    *   Start the React frontend.

3.  **Access the backend:** The backend API will be available at `http://localhost:8080/api`.

#### Option B: Run Locally (Requires local PostgreSQL)

1.  **Install PostgreSQL locally** if you don't have it.
2.  **Create a database:**
    ```sql
    CREATE DATABASE taskdb;
    CREATE USER "user" WITH ENCRYPTED PASSWORD 'password';
    GRANT ALL PRIVILEGES ON DATABASE taskdb TO "user";
    ```
    (Adjust database name, username, and password in `application.yml` if different).
3.  **Update `application.yml`:** Ensure your database connection details in `src/main/resources/application.yml` match your local PostgreSQL setup.
4.  **Build the project:**
    ```bash
    mvn clean install -DskipTests
    ```
5.  **Run the application:**
    ```bash
    mvn spring-boot:run
    ```
    Or run `TaskmanagementApplication.java` from your IDE.

### 3. Frontend Setup (React)

Navigate to the `task-management-frontend` directory.

```bash
cd ../task-management-frontend
```

#### Option A: Run with Docker Compose (Already covered above)

If you used `docker-compose up` from the backend directory, your frontend should already be running. It will be accessible at `http://localhost:3000`.

#### Option B: Run Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Configure API Base URL:** Create a `.env.development` file in `task-management-frontend/` and add:
    ```
    REACT_APP_API_BASE_URL=http://localhost:8080/api
    ```
3.  **Start the React development server:**
    ```bash
    npm start
    ```
    The application will open in your browser at `http://localhost:3000`.

## Default Credentials (for Seed Data)

If using the provided `V2__Seed_Data.sql`, you can log in with:

*   **Admin User:**
    *   **Username:** `admin`
    *   **Email:** `admin@example.com`
    *   **Password:** `password`
*   **Regular User:**
    *   **Username:** `john.doe`
    *   **Email:** `john.doe@example.com`
    *   **Password:** `password`
*   **Another Regular User:**
    *   **Username:** `jane.smith`
    *   **Email:** `jane.smith@example.com`
    *   **Password:** `password`

## Testing

### Backend Tests

Run all backend tests (unit, integration) and generate a JaCoCo code coverage report:

```bash
cd task-management-backend
mvn clean verify
```
The JaCoCo report will be generated in `target/site/jacoco/index.html`.

### Frontend Tests

Run frontend unit tests using Jest and React Testing Library:

```bash
cd task-management-frontend
npm test
```

### Performance Tests (Conceptual)

Refer to the `load_test.js` example in the documentation for setting up and running performance tests using k6.

## API Documentation

For a production setup, Swagger/OpenAPI would be integrated. Here's a summary:

**Base URL:** `/api`

### Authentication (`/api/auth`)

*   **`POST /register`**: Register a new user.
    *   **Request Body:** `RegisterRequest` (username, email, password, firstName, lastName)
    *   **Response:** `AuthResponse` (accessToken, userId, username, email, role)
    *   **Status:** `201 Created`
*   **`POST /login`**: Authenticate a user.
    *   **Request Body:** `AuthRequest` (usernameOrEmail, password)
    *   **Response:** `AuthResponse`
    *   **Status:** `200 OK`

### Users (`/api/users`)

*   **`GET /me`**: Get current authenticated user's profile.
    *   **Auth:** `isAuthenticated()`
    *   **Response:** `UserDTO`
    *   **Status:** `200 OK`
*   **`GET /{id}`**: Get user by ID.
    *   **Auth:** `hasRole('ADMIN')` or self-access
    *   **Response:** `UserDTO`
    *   **Status:** `200 OK`
*   **`GET /`**: Get all users.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Response:** `List<UserDTO>`
    *   **Status:** `200 OK`
*   **`PUT /{id}`**: Update user profile.
    *   **Auth:** `hasRole('ADMIN')` or self-access
    *   **Request Body:** `UserDTO`
    *   **Response:** `UserDTO`
    *   **Status:** `200 OK`
*   **`DELETE /{id}`**: Delete user.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Status:** `204 No Content`
*   **`PATCH /{id}/role?role={newRole}`**: Update user role.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Status:** `200 OK`

### Projects (`/api/projects`)

*   **`POST /`**: Create a new project.
    *   **Auth:** `isAuthenticated()`
    *   **Request Body:** `ProjectDTO`
    *   **Response:** `ProjectDTO`
    *   **Status:** `201 Created`
*   **`GET /{id}`**: Get project by ID.
    *   **Auth:** `hasRole('ADMIN')` or project owner
    *   **Response:** `ProjectDTO`
    *   **Status:** `200 OK`
*   **`GET /?ownerId={uuid}`**: Get all projects (Admin) or projects by `ownerId` (self-access or Admin).
    *   **Auth:** `isAuthenticated()`
    *   **Response:** `List<ProjectDTO>`
    *   **Status:** `200 OK`
*   **`PUT /{id}`**: Update project.
    *   **Auth:** `hasRole('ADMIN')` or project owner
    *   **Request Body:** `ProjectDTO`
    *   **Response:** `ProjectDTO`
    *   **Status:** `200 OK`
*   **`DELETE /{id}`**: Delete project.
    *   **Auth:** `hasRole('ADMIN')` or project owner
    *   **Status:** `204 No Content`

### Tasks (`/api/tasks`)

*   **`POST /`**: Create a new task.
    *   **Auth:** `isAuthenticated()`
    *   **Request Body:** `TaskDTO`
    *   **Response:** `TaskDTO`
    *   **Status:** `201 Created`
*   **`GET /{id}`**: Get task by ID.
    *   **Auth:** `hasRole('ADMIN')` or task assignee/project owner
    *   **Response:** `TaskDTO`
    *   **Status:** `200 OK`
*   **`GET /?assigneeId={uuid}&projectId={uuid}&status={status}`**: Get all tasks (Admin) or tasks for current user with filters.
    *   **Auth:** `isAuthenticated()`
    *   **Response:** `List<TaskDTO>`
    *   **Status:** `200 OK`
*   **`PUT /{id}`**: Update task.
    *   **Auth:** `hasRole('ADMIN')` or task assignee/project owner
    *   **Request Body:** `TaskDTO`
    *   **Response:** `TaskDTO`
    *   **Status:** `200 OK`
*   **`DELETE /{id}`**: Delete task.
    *   **Auth:** `hasRole('ADMIN')` or task assignee/project owner
    *   **Status:** `204 No Content`

### Tags (`/api/tags`)

*   **`POST /`**: Create a new tag.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Request Body:** `TagDTO`
    *   **Response:** `TagDTO`
    *   **Status:** `201 Created`
*   **`GET /{id}`**: Get tag by ID.
    *   **Auth:** `isAuthenticated()`
    *   **Response:** `TagDTO`
    *   **Status:** `200 OK`
*   **`GET /`**: Get all tags.
    *   **Auth:** `isAuthenticated()`
    *   **Response:** `List<TagDTO>`
    *   **Status:** `200 OK`
*   **`PUT /{id}`**: Update tag.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Request Body:** `TagDTO`
    *   **Response:** `TagDTO`
    *   **Status:** `200 OK`
*   **`DELETE /{id}`**: Delete tag.
    *   **Auth:** `hasRole('ADMIN')`
    *   **Status:** `204 No Content`

## Architecture Documentation

### High-Level Architecture

The system follows a typical client-server architecture with a clear separation of concerns:

1.  **Frontend (Client-side):** A React application providing the user interface, responsible for user interaction, making API requests, and displaying data.
2.  **Backend (Server-side):** A Spring Boot RESTful API serving as the application's brain, handling business logic, data persistence, security, and integration with external services.
3.  **Database:** A PostgreSQL relational database for storing all application data.

```
+------------------+     HTTP/HTTPS     +---------------------+     JDBC     +--------------+
|   React Frontend | <------------------> | Spring Boot Backend | <----------> | PostgreSQL   |
| (Web Browser/App)|                      | (REST API, Java 17) |              | (Relational) |
+------------------+                      +----------^----------+              +--------------+
                                                     |
                                                     |
                                            +--------v--------+
                                            |       Services  |
                                            |  (Business Logic)|
                                            +--------^--------+
                                                     |
                                            +--------v--------+
                                            |    Repositories |
                                            |  (Data Access)  |
                                            +-----------------+
```

### Backend Architecture (Spring Boot)

The Spring Boot application employs a layered architecture:

*   **Controllers:** Handle incoming HTTP requests, validate DTOs, call appropriate services, and return HTTP responses. Responsible for mapping URLs to business operations.
*   **Services:** Contain the core business logic. They orchestrate interactions with repositories, apply validation, handle transactions, and often implement caching, logging, and authorization checks.
*   **Repositories:** Abstractions over the database, typically using Spring Data JPA, for performing CRUD operations on entities.
*   **Entities:** JPA (Jakarta Persistence API) annotated plain old Java objects (POJOs) representing the database schema.
*   **DTOs (Data Transfer Objects):** Separate data models for request/response payloads to avoid exposing internal entity structures directly and for input validation.
*   **Security:** Implemented with Spring Security, using JWT for stateless authentication and `@PreAuthorize` annotations for method-level authorization.
*   **Configuration:** Centralized `application.yml` for environment-specific settings, `SecurityConfig` for defining security rules, `CacheConfig` for caching.
*   **Global Exception Handling:** `@ControllerAdvice` for consistent error responses across the API.
*   **Filters:** Custom filters (e.g., `JwtAuthenticationFilter`, `RateLimitFilter`) to intercept requests before they reach controllers for cross-cutting concerns.
*   **Utilities:** `MapperUtil` using ModelMapper for DTO-entity conversions.

### Frontend Architecture (React)

The React application uses a component-based structure:

*   **Pages:** Top-level components representing distinct views/routes (e.g., `LoginPage`, `DashboardPage`).
*   **Components:** Reusable UI elements (e.g., `Header`, `TaskCard`, `LoginForm`). These are further organized into `common`, `auth`, `dashboard`, etc.
*   **Auth Context:** A React Context API implementation (`AuthContext.tsx`) for managing global authentication state (user, token, login/logout functions) across the application.
*   **API Layer:** Dedicated modules (`api/*.ts`) using Axios for making HTTP requests to the backend, centralizing API calls and handling request/response interceptors.
*   **Routing:** `react-router-dom` for navigation, including `PrivateRoute` components to protect authenticated routes.
*   **State Management:** Local component state (useState) and global state via React Context for authentication. For more complex global state, Redux or Zustand could be considered.
*   **Styling:** Material-UI (MUI) for a consistent and responsive design system.
*   **Type Safety:** TypeScript is used throughout for improved code quality and maintainability.

## Deployment Guide

This guide focuses on Docker-based deployment, which is the most robust and consistent method.

### 1. Build Production Images

Ensure you are in the root directory of the project (`task-flow`).

```bash
# Build backend JAR and Docker image
cd task-management-backend
mvn clean install -Pprod -DskipTests # Use -Pprod if you have a production profile, otherwise just install
docker build -t task-management-backend:latest .
cd ..

# Build frontend production bundle and Docker image
cd task-management-frontend
npm install
npm run build
docker build -t task-management-frontend:latest .
cd ..
```
**Note:** For a real production environment, you would use multi-stage Docker builds to reduce image size and separate build time dependencies from runtime. The provided Dockerfiles are simplified for clarity.

### 2. Configure Environment Variables

For production, sensitive information (database credentials, JWT secret) should be passed via environment variables, not hardcoded in `application.yml`.

Update `docker-compose.yml` or your deployment platform's environment configuration:

```yaml
# Example snippet from docker-compose.yml
services:
  backend:
    image: task-management-backend:latest
    environment:
      - DB_HOST=postgres
      - DB_NAME=taskdb
      - DB_USERNAME=user
      - DB_PASSWORD=password
      - JWT_SECRET=YOUR_VERY_LONG_AND_SECURE_PRODUCTION_JWT_SECRET # CHANGE THIS!
      - CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com # Set your production frontend domain
      # ... other production specific settings
```
**Crucially, generate a strong, random `JWT_SECRET` for production.**

### 3. Deploy with Docker Compose (Single Host)

For simple deployments on a single server:

```bash
docker-compose -f docker-compose.yml up -d
```
This will start all services in detached mode.

*   **Backend:** `http://<your-server-ip>:8080/api`
*   **Frontend:** `http://<your-server-ip>:3000` (You'll likely want to configure a reverse proxy like Nginx or Caddy for HTTPS and domain routing).

### 4. Production Considerations

*   **HTTPS:** Always use HTTPS in production. Configure a reverse proxy (Nginx, Caddy) to handle SSL termination and forward requests to your Docker containers.
*   **Domain Names:** Map your domain (`taskflow.com`) to your server's IP and configure your reverse proxy to serve the frontend and route API calls to the backend.
*   **Scalability:** For larger deployments, consider container orchestration platforms like Kubernetes or cloud services (AWS ECS, Google Cloud Run, Azure Container Apps) instead of a single `docker-compose` instance.
*   **Database Management:** Use managed database services (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) for better reliability, backups, and scaling.
*   **Monitoring & Alerting:** Integrate with dedicated monitoring tools (Prometheus, Grafana, ELK Stack, cloud monitoring services) for production metrics and logs.
*   **Security Best Practices:**
    *   Rotate `JWT_SECRET` regularly.
    *   Implement strong password policies.
    *   Regularly update dependencies to patch vulnerabilities.
    *   Perform security audits.
*   **Backup & Recovery:** Establish a robust backup strategy for your database.

### 5. CI/CD Pipeline (GitHub Actions Example)

The `.github/workflows/ci-cd.yml` file provides a basic GitHub Actions workflow.

This workflow typically includes:
1.  **Build:** Compiles backend and frontend.
2.  **Test:** Runs unit and integration tests.
3.  **Code Quality:** (Optional) Static analysis (SonarQube).
4.  **Containerization:** Builds Docker images for backend and frontend.
5.  **Deployment:** Pushes images to a container registry (e.g., Docker Hub, AWS ECR) and triggers deployment to a server/orchestrator.

```yaml
# --- .github/workflows/ci-cd.yml ---
name: TaskFlow CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'

      - name: Set up Node.js for frontend build during maven verify
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'task-management-frontend/package-lock.json'

      - name: Run Backend Tests and Build
        run: |
          # Start a temporary PostgreSQL container for integration tests
          docker run --name test-postgres -e POSTGRES_DB=testdb -e POSTGRES_USER=testuser -e POSTGRES_PASSWORD=testpass -d -p 5432:5432 postgres:15.3
          sleep 10 # Give postgres time to start
          # Build backend and run tests, passing DB connection details
          cd task-management-backend
          mvn -B clean verify \
            -Dspring.datasource.url=jdbc:postgresql://localhost:5432/testdb \
            -Dspring.datasource.username=testuser \
            -Dspring.datasource.password=testpass \
            -Dspring.flyway.enabled=false # Disable flyway as create-drop is used by tests
          cd ..
        env:
          JWT_SECRET: a_very_secret_key_for_testing
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: testdb
          DB_USERNAME: testuser
          DB_PASSWORD: testpass

      - name: Stop and remove test PostgreSQL container
        if: always()
        run: docker rm -f test-postgres

      - name: Upload JaCoCo report
        uses: actions/upload-artifact@v3
        with:
          name: jacoco-report
          path: task-management-backend/target/site/jacoco/jacoco.xml # Or index.html

  build-and-test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'task-management-frontend/package-lock.json'

      - name: Install Frontend Dependencies
        run: npm install
        working-directory: task-management-frontend

      - name: Run Frontend Tests
        run: npm test -- --coverage --watchAll=false
        working-directory: task-management-frontend

      - name: Build Frontend
        run: npm run build
        working-directory: task-management-frontend

      - name: Upload Frontend Build Artifact
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: task-management-frontend/build/

  deploy:
    runs-on: ubuntu-latest
    needs: [build-and-test-backend, build-and-test-frontend]
    if: github.ref == 'refs/heads/main' # Only deploy on push to main branch
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Download Backend JAR
        uses: actions/download-artifact@v3
        with:
          name: task-management-backend-jar
          path: task-management-backend/target # Assuming JAR is built here

      - name: Download Frontend Build
        uses: actions/download-artifact@v3
        with:
          name: frontend-build
          path: task-management-frontend/build

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Backend Docker Image
        run: |
          cd task-management-backend
          docker build -t yourdockerhubusername/task-management-backend:${{ github.sha }} .
          docker push yourdockerhubusername/task-management-backend:${{ github.sha }}
          # Tag with 'latest' and push
          docker tag yourdockerhubusername/task-management-backend:${{ github.sha }} yourdockerhubusername/task-management-backend:latest
          docker push yourdockerhubusername/task-management-backend:latest
        env:
          # Ensure this JWT_SECRET is strong and matches your production environment
          JWT_SECRET: ${{ secrets.PROD_JWT_SECRET }}

      - name: Build and Push Frontend Docker Image
        run: |
          cd task-management-frontend
          docker build -t yourdockerhubusername/task-management-frontend:${{ github.sha }} .
          docker push yourdockerhubusername/task-management-frontend:${{ github.sha }}
          # Tag with 'latest' and push
          docker tag yourdockerhubusername/task-management-frontend:${{ github.sha }} yourdockerhubusername/task-management-frontend:latest
          docker push yourdockerhubusername/task-management-frontend:latest

      - name: Deploy to Server (Example: SSH to update Docker Compose)
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/your/deployment/directory # e.g., /home/ubuntu/taskflow
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker image prune -f # Clean up old images
```