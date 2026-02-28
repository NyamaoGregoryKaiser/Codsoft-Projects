```markdown
# Enterprise-Grade Content Management System (CMS Pro)

This is a comprehensive, production-ready Content Management System (CMS) designed for full-stack web development projects. It features a robust Java Spring Boot backend, a modern React frontend, and a PostgreSQL database, all orchestrated with Docker.

## Table of Contents

1.  [Features](#features)
2.  [Tech Stack](#tech-stack)
3.  [Project Structure](#project-structure)
4.  [Prerequisites](#prerequisites)
5.  [Local Setup & Running](#local-setup--running)
    *   [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
    *   [Running Backend Separately](#running-backend-separately)
    *   [Running Frontend Separately](#running-frontend-separately)
6.  [Database](#database)
7.  [Authentication & Authorization](#authentication--authorization)
8.  [API Endpoints](#api-endpoints)
9.  [Testing](#testing)
10. [CI/CD](#cicd)
11. [Deployment Guide](#deployment-guide)
12. [Architecture](#architecture)
13. [Future Enhancements](#future-enhancements)
14. [Contributing](#contributing)
15. [License](#license)

## 1. Features

*   **Content Management:** Create, Read, Update, Delete (CRUD) for Posts and Pages.
    *   Drafting, Publishing, Archiving content.
    *   Categorization and Tagging (Tags can be easily added as an entity).
    *   Featured Images.
*   **User Management:**
    *   User Registration and Authentication (JWT-based).
    *   Role-Based Access Control (RBAC): `USER`, `EDITOR`, `ADMIN`.
    *   User profile management.
*   **Media Management:** Upload, view, and delete media files (local storage for simplicity, easily extendable to S3).
*   **Configuration & Setup:**
    *   Dockerized services (Backend, Frontend, Database).
    *   Environment variable configuration.
    *   Database migrations with Flyway.
    *   Seed data for initial setup.
*   **Security:**
    *   JWT Authentication.
    *   Password Hashing (BCrypt).
    *   CORS Configuration.
    *   Rate Limiting (IP-based and global).
*   **Performance:**
    *   Caching layer (Caffeine).
    *   Database indexing.
*   **Robustness:**
    *   Global error handling.
    *   Input validation.
    *   Structured logging.
*   **Testing:** Unit, Integration, and basic API tests.
*   **Documentation:** Comprehensive setup, API, architecture, and deployment guides.
*   **UI/UX:** Responsive and intuitive React frontend for content creation and display.

## 2. Tech Stack

*   **Backend:**
    *   Java 17
    *   Spring Boot 3.x
    *   Spring Data JPA (Hibernate)
    *   Spring Security (JWT)
    *   Lombok
    *   Jackson (JSON processing)
    *   `jjwt` (Java JWT library)
    *   Guava RateLimiter (for rate limiting)
    *   Caffeine (local caching)
    *   Flyway (database migrations)
*   **Frontend:**
    *   React 18
    *   Vite (build tool)
    *   Axios (HTTP client)
    *   React Router DOM (routing)
    *   `jwt-decode`
*   **Database:**
    *   PostgreSQL 15
*   **Containerization:**
    *   Docker
    *   Docker Compose
    *   Nginx (for serving frontend and reverse proxy)
*   **Build Tools:**
    *   Apache Maven (Java)
    *   npm (Node.js/React)
*   **CI/CD:**
    *   GitHub Actions (example workflow)
*   **Testing:**
    *   JUnit 5
    *   Mockito
    *   Spring Boot Test
    *   Testcontainers (for integration tests with real DB)
    *   JaCoCo (code coverage)

## 3. Project Structure

```
.
├── backend                 # Spring Boot application
│   ├── pom.xml             # Maven project file
│   └── src                 # Java source code and resources
│       ├── main            # Main application code
│       │   ├── java        # Java packages (com.cms.example.*)
│       │   │   ├── auth          # Authentication (login, register)
│       │   │   ├── config        # Spring configurations (Security, App)
│       │   │   ├── content       # Content (Post/Page) module
│       │   │   ├── category      # Category module
│       │   │   ├── media         # Media upload module
│       │   │   ├── user          # User and Role management
│       │   │   ├── exception     # Global exception handling
│       │   │   ├── util          # JWT Service, Rate Limiting filter
│       │   │   └── cache         # Caching configuration
│       │   └── resources   # Application properties, Flyway migrations
│       └── test            # Unit and Integration Tests
├── frontend                # React application
│   ├── public              # Static assets
│   ├── src                 # React source code
│   │   ├── api             # API service calls
│   │   ├── components      # Reusable UI components
│   │   ├── context         # React Context for global state (Auth)
│   │   ├── pages           # Main application pages
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Entry point
│   ├── .env.*              # Environment variables
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── docker-compose.yml      # Docker Compose orchestration
├── Dockerfile.backend      # Dockerfile for Spring Boot backend
├── Dockerfile.frontend     # Dockerfile for React frontend
├── nginx                   # Nginx configuration for frontend
│   └── default.conf
├── .github                 # GitHub Actions CI/CD workflows
├── README.md               # This file
├── ARCHITECTURE.md         # Architecture overview
└── DEPLOYMENT.md           # Deployment guide
```

## 4. Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**
*   **Docker** and **Docker Compose** (Desktop version recommended for ease of use)
*   **Java 17 JDK** (for running backend directly or for IDEs)
*   **Maven 3.x** (for building backend directly)
*   **Node.js 20.x** and **npm 10.x** (for running frontend directly)

## 5. Local Setup & Running

Clone the repository:
```bash
git clone https://github.com/your-username/cms-pro.git
cd cms-pro
```

### Using Docker Compose (Recommended)

This is the easiest way to get all services (PostgreSQL, Backend, Frontend) up and running.

1.  **Build and Start Services:**
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Builds images from Dockerfiles.
    *   `-d`: Runs containers in detached mode.

2.  **Verify Services:**
    ```bash
    docker-compose ps
    ```
    You should see `cms_db`, `cms_backend`, and `cms_frontend` running.

3.  **Access the Application:**
    *   **Frontend:** Open your browser to `http://localhost`. Nginx in the `frontend` container will serve the React app and proxy API calls to the backend.
    *   **Backend API:** `http://localhost:8080/api/v1` (though frontend accesses it via Nginx proxy).

4.  **Stop Services:**
    ```bash
    docker-compose down
    ```
    This stops and removes containers, networks, and volumes. To keep volumes (database data, uploads), use `docker-compose stop`.

### Running Backend Separately (for Development)

1.  **Start PostgreSQL (via Docker or local install):**
    ```bash
    docker-compose up -d db
    ```
    Ensure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` environment variables match your `application.yml` or default to `localhost:5432` with `cms_db`, `cms_user`, `cms_password`.

2.  **Build and Run Backend:**
    Navigate to the `backend` directory.
    ```bash
    cd backend
    mvn clean install
    java -jar target/cms-backend-0.0.1-SNAPSHOT.jar
    ```
    The backend will start on `http://localhost:8080`.
    You might need to set environment variables for DB connection and JWT secret key if they are not picked up from your shell or `.env` file. For example:
    ```bash
    export DB_HOST=localhost
    export DB_USERNAME=cms_user
    export DB_PASSWORD=cms_password
    export DB_NAME=cms_db
    export JWT_SECRET_KEY=your_secure_jwt_secret_key_here
    java -jar target/cms-backend-0.0.1-SNAPSHOT.jar
    ```

### Running Frontend Separately (for Development)

1.  **Ensure Backend is Running** (either via `docker-compose` or directly).

2.  **Install Dependencies:**
    Navigate to the `frontend` directory.
    ```bash
    cd frontend
    npm install
    ```

3.  **Start Frontend Dev Server:**
    ```bash
    npm run dev
    ```
    The frontend will start on `http://localhost:5173`. It's configured to proxy `/api/v1` and `/uploads` requests to the backend at `http://localhost:8080`.

## 6. Database

*   **PostgreSQL:** The database is managed by a Docker container.
*   **Flyway Migrations:** The backend application uses Flyway to manage database schema changes. Migration scripts are located in `backend/src/main/resources/db/migration`.
    *   `V1__create_initial_tables.sql`: Defines the initial schema.
    *   `V2__add_seed_data.sql`: Populates the database with initial users, categories, and sample content.
*   **Seed Data Credentials:**
    *   **Admin:** `admin@example.com` / `password`
    *   **Editor:** `editor@example.com` / `password`
    *   **User:** `user@example.com` / `password`
    (These passwords are BCrypt hashed in `V2__add_seed_data.sql` and will be matched by Spring Security).

## 7. Authentication & Authorization

The system uses JWT (JSON Web Tokens) for authentication.

*   **Registration:** `/api/v1/auth/register` (POST)
*   **Login:** `/api/v1/auth/authenticate` (POST)
*   Upon successful login, the API returns a JWT token which must be included in subsequent requests in the `Authorization` header as `Bearer <TOKEN>`.
*   **Roles:** `USER`, `EDITOR`, `ADMIN`.
    *   `USER`: Can view public content.
    *   `EDITOR`: Can create, edit, and delete their own content; manage categories; upload media.
    *   `ADMIN`: Has full access to all features, including managing all content, categories, users, and media.

## 8. API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication

*   `POST /auth/register` - Register a new user.
    *   Body: `{ "firstName", "lastName", "email", "password", "role" (optional, defaults to USER) }`
*   `POST /auth/authenticate` - Authenticate a user and get JWT token.
    *   Body: `{ "email", "password" }`
    *   Returns: `{ "token", "refreshToken", "message" }`

### Content (Requires JWT for protected endpoints)

*   `GET /content/public` - Get all *published* content (paginated, public access).
*   `GET /content/public/{slug}` - Get a single *published* content by slug (public access).
*   `GET /content` - Get all content (including drafts/archived, paginated). (Requires `ADMIN` or `EDITOR` role)
*   `GET /content/{id}` - Get content by ID. (Requires `ADMIN` or `EDITOR` role)
*   `POST /content` - Create new content. (Requires `ADMIN` or `EDITOR` role)
    *   Body: `{ "title", "slug", "body", "featuredImage", "status", "type", "categoryId" }`
*   `PUT /content/{id}` - Update existing content. (Requires `ADMIN` or `EDITOR` role, or content author)
*   `DELETE /content/{id}` - Delete content. (Requires `ADMIN` or `EDITOR` role, or content author)

### Categories (Requires JWT for protected endpoints)

*   `GET /categories` - Get all categories (public access).
*   `GET /categories/{id}` - Get category by ID (public access).
*   `POST /categories` - Create new category. (Requires `ADMIN` or `EDITOR` role)
*   `PUT /categories/{id}` - Update category. (Requires `ADMIN` or `EDITOR` role)
*   `DELETE /categories/{id}` - Delete category. (Requires `ADMIN` role)

### Media (Requires JWT for protected endpoints)

*   `POST /media/upload` - Upload a file. (Requires `ADMIN` or `EDITOR` role)
    *   Multipart file upload.
*   `GET /media` - Get all media items. (Requires `ADMIN` or `EDITOR` role)
*   `GET /media/{id}` - Get media item by ID. (Requires `ADMIN` or `EDITOR` role)
*   `DELETE /media/{id}` - Delete media item and its file. (Requires `ADMIN` role)
*   `GET /media/uploads/{filename}` - Serve uploaded files directly (public access).

## 9. Testing

The project includes a comprehensive test suite to ensure quality and reliability.

*   **Unit Tests:** Located in `backend/src/test/java`. These test individual classes (services, utilities) in isolation using Mockito.
*   **Integration Tests (`@DataJpaTest`):** Test repositories interacting with a real PostgreSQL database (using Testcontainers). This verifies the data layer mapping and queries.
*   **API / Controller Tests (`@WebMvcTest`):** Test the REST API endpoints and their interaction with the service layer. These use `MockMvc` to simulate HTTP requests and verify responses, including security checks.
*   **Code Coverage:** Achieved through JaCoCo Maven plugin. Aiming for 80%+ coverage for critical backend logic. The CI/CD pipeline includes a step to generate and upload a JaCoCo report artifact.
    *   To generate report locally: `cd backend && mvn clean verify` (this also runs tests). The report will be in `backend/target/site/jacoco/index.html`.
*   **Performance Tests:** Not automated in the provided CI/CD, but critical for a production system. Tools like Apache JMeter or k6 can be used to simulate load and measure:
    *   **Response Times:** Average, P90, P99 latency for key API calls.
    *   **Throughput:** Requests per second (RPS).
    *   **Error Rates:** Percentage of failed requests.
    *   **Resource Utilization:** CPU, Memory, Network I/O on application and database servers.

## 10. CI/CD

A basic GitHub Actions workflow (`.github/workflows/main.yml`) is provided:

*   **Backend Build & Test:** Builds the Java Spring Boot application, runs all Maven tests (unit and integration), and uploads a JaCoCo code coverage report.
*   **Frontend Build & Lint:** Installs Node.js dependencies, runs linting checks, and builds the React application.
*   **Deployment (Commented Out):** A placeholder for deploying Docker images to a registry (e.g., Docker Hub, AWS ECR). This part requires configuring Docker registry credentials as GitHub Secrets. For a full deployment, you would then trigger deployment to a Kubernetes cluster, ECS, or a VM.

## 11. Deployment Guide

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions, focusing on Docker-based deployments.

## 12. Architecture

Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for a high-level overview of the system's architecture, including diagrams and design considerations.

## 13. Future Enhancements

*   **Frontend Features:**
    *   Full Admin UI for Categories, Users, Media.
    *   Rich Text Editor (e.g., TinyMCE, Quill) for content body.
    *   Advanced Content Filtering and Search.
    *   User profile management.
    *   Frontend routing for individual content pages (`/content/{slug}`).
    *   More robust error pages.
*   **Backend Features:**
    *   Password reset functionality.
    *   Email notification system.
    *   Tags for content.
    *   Comments system.
    *   Scheduled publishing.
    *   Version control for content.
    *   SEO management features (meta tags).
    *   Audit logging.
    *   External media storage (AWS S3, Azure Blob Storage).
    *   Advanced full-text search (Elasticsearch, Lucene).
    *   GraphQL API endpoint.
*   **Operations:**
    *   Implement distributed tracing (e.g., OpenTelemetry).
    *   Centralized logging (e.g., ELK Stack, Grafana Loki).
    *   Advanced monitoring and alerting (e.g., Prometheus, Grafana).
    *   Database replication and high availability.
    *   Load balancing.

## 14. Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 15. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```