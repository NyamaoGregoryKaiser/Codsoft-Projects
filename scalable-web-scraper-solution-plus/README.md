```markdown
# Scraper Hub - Enterprise-Grade Web Scraping Tools System

## Table of Contents
1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Technologies Used](#4-technologies-used)
5. [Getting Started](#5-getting-started)
   - [Prerequisites](#prerequisites)
   - [Setup with Docker Compose](#setup-with-docker-compose)
   - [Manual Setup (Backend)](#manual-setup-backend)
   - [Manual Setup (Frontend)](#manual-setup-frontend)
6. [Database Layer](#6-database-layer)
7. [API Documentation](#7-api-documentation)
8. [Testing](#8-testing)
9. [Deployment Guide](#9-deployment-guide)
10. [CI/CD](#10-cicd)
11. [Additional Features](#11-additional-features)
12. [Future Enhancements](#12-future-enhancements)
13. [Contributing](#13-contributing)
14. [License](#14-license)

---

## 1. Introduction
Scraper Hub is a comprehensive, production-ready full-stack web scraping platform designed for efficient and scalable data extraction. It provides a user-friendly interface to define, schedule, and monitor scraping jobs, alongside a robust backend to execute these tasks, store results, and manage user access. Built with a focus on reliability, security, and performance, Scraper Hub is suitable for enterprise-level data collection needs.

## 2. Features
*   **User Management & Authentication:** Secure user registration, login, and profile management with JWT-based authentication.
*   **CRUD for Scraping Jobs:** Create, Read, Update, and Delete scraping configurations (target URLs, CSS selectors, description).
*   **Flexible Scraping Engine:** Supports both static HTML parsing (Cheerio/Axios) and dynamic, JavaScript-rendered content (Puppeteer).
*   **Scheduled Scraping:** Define cron-based schedules for automated, recurring scraping tasks.
*   **Manual Job Execution:** Trigger scraping jobs on demand.
*   **Scraping Results Storage:** Persistent storage of scraped data in a structured format (JSONB).
*   **Role-Based Authorization:** Differentiate access levels (e.g., `user`, `admin`).
*   **Error Handling:** Centralized middleware for consistent error responses.
*   **Logging & Monitoring:** Comprehensive logging using Winston for traceability and debugging.
*   **Rate Limiting:** Protects API from abuse and ensures fair usage.
*   **Dockerized Deployment:** Easy setup and deployment using Docker and Docker Compose.
*   **CI/CD Integration:** GitHub Actions workflow for automated testing and quality assurance.
*   **Comprehensive Testing:** Unit, integration, and API tests with high coverage.
*   **Intuitive UI/UX:** React-based frontend for an engaging and responsive user experience.

## 3. Architecture

The system follows a typical microservices-oriented approach, separating concerns into a frontend, backend, and database layer, orchestrated using Docker.

```mermaid
graph TD
    User[Web Browser] --requests--> Frontend[React.js Frontend (Port 3000)]
    Frontend --API Calls--> Backend[Node.js/Express Backend (Port 5000)]

    subgraph Backend Services
        Backend --Authenticates--> AuthN[Authentication Service (JWT)]
        Backend --Manages Users--> UserMgmt[User Management Service]
        Backend --Manages Jobs--> JobMgmt[Scraping Job Service]
        Backend --Stores Results--> ResultMgmt[Scraping Result Service]
        Backend --Schedules Tasks--> Scheduler[Scheduler Service (node-cron)]
        Backend --Performs Scrapes--> ScrapingEngine[Scraping Engine (Puppeteer/Cheerio)]
        Backend --Logs Events--> Logger[Winston Logger]
        Backend --Handles Errors--> ErrorHandler[Error Middleware]
        Backend --Limits Requests--> RateLimiter[Rate Limiting Middleware]
    end

    Backend --Reads/Writes Data--> DB[PostgreSQL Database (Port 5432)]

    subgraph Deployment
        DB --- DockerCompose[Docker Compose]
        Backend --- DockerCompose
        Frontend --- DockerCompose
    end

    subgraph Development & CI/CD
        Code[Source Code] --> Git[Git Repository]
        Git --Triggers--> GHA[GitHub Actions]
        GHA --Tests--> BackendTests[Backend Tests (Jest/Supertest)]
        GHA --Tests--> FrontendTests[Frontend Tests (Jest/RTL)]
        GHA --Builds Images--> DockerBuild[Docker Build]
    end
```

## 4. Technologies Used

**Backend (Node.js/Express):**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database ORM:** Sequelize
*   **Database:** PostgreSQL
*   **Scraping:** Puppeteer (headless browser), Cheerio & Axios (static HTML)
*   **Authentication:** JWT (jsonwebtoken), bcryptjs
*   **Scheduling:** node-cron
*   **Logging:** Winston
*   **Security:** Helmet, CORS, express-rate-limit
*   **Development:** Nodemon, Dotenv

**Frontend (React.js):**
*   **Framework:** React.js
*   **Routing:** React Router DOM
*   **API Client:** Axios
*   **State Management:** React Context API
*   **Styling:** Pure CSS (for simplicity, extendable with Sass/Tailwind/Styled-components)
*   **Testing:** Jest, React Testing Library

**DevOps & Tools:**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Database Management:** Sequelize CLI
*   **Code Quality:** ESLint

## 5. Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   Docker Desktop (or Docker Engine and Docker Compose)

### Setup with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/scraper-hub.git
    cd scraper-hub
    ```

2.  **Create environment files:**
    Copy the example environment variables and fill them in:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    **Edit `backend/.env`**:
    Ensure `DB_HOST` is `db` (the service name in `docker-compose.yml`) and `DATABASE_URL` uses `db` as host.
    Example:
    ```
    DB_NAME=scraperhub_db
    DB_USER=scraperhub_user
    DB_PASS=scraperhub_password
    DB_HOST=db
    DB_PORT=5432
    DATABASE_URL="postgres://scraperhub_user:scraperhub_password@db:5432/scraperhub_db"
    JWT_SECRET=your_super_secret_jwt_key
    ```
    **Edit `frontend/.env`**:
    Ensure `REACT_APP_API_BASE_URL` points to the backend service:
    ```
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
    *(When running in Docker, frontend container can access backend via `http://backend:5000/api`, but for local browser access via `localhost:3000`, the frontend needs to hit `http://localhost:5000/api`)*

3.  **Build and run the services:**
    From the root `scraper-hub` directory:
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build Docker images for backend and frontend.
    *   Start a PostgreSQL container (`db`).
    *   Start the Node.js backend container (`backend`). The backend will automatically run database migrations and seed initial data (`admin@example.com`/`adminpassword`, `user@example.com`/`userpassword`).
    *   Start the React frontend container (`frontend`).

4.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api`

5.  **Stop the services:**
    ```bash
    docker-compose down
    ```

### Manual Setup (Backend)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file based on `.env.example`. Ensure `DB_HOST` points to your local PostgreSQL instance (e.g., `localhost`).

4.  **Set up PostgreSQL database:**
    Create a database and a user as specified in your `.env` file.
    Example PostgreSQL commands:
    ```sql
    CREATE USER scraperhub_user WITH PASSWORD 'scraperhub_password';
    CREATE DATABASE scraperhub_db OWNER scraperhub_user;
    ```

5.  **Run migrations and seed data:**
    ```bash
    npx sequelize-cli db:migrate
    npx sequelize-cli db:seed:all
    ```

6.  **Start the backend server:**
    ```bash
    npm run dev # For development with nodemon
    # or
    npm start # For production
    ```
    The backend will be running on `http://localhost:5000`.

### Manual Setup (Frontend)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file based on `.env.example`. Ensure `REACT_APP_API_BASE_URL` points to your backend's URL (e.g., `http://localhost:5000/api`).

4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will be running on `http://localhost:3000`.

## 6. Database Layer

*   **Database:** PostgreSQL
*   **ORM:** Sequelize
*   **Models:**
    *   `User`: Stores user information (username, email, hashed password, role).
    *   `ScrapingJob`: Defines the configuration for a scraping task (name, target URL, CSS selectors, schedule, JS rendering preference, etc.). Linked to `User`.
    *   `ScrapingResult`: Stores the actual data scraped by a `ScrapingJob`, including the extracted JSON data and metadata. Linked to `ScrapingJob`.
*   **Migrations:** Managed using `sequelize-cli` to evolve the database schema.
    *   `npm run db:migrate`: Apply pending migrations.
    *   `npm run db:migrate:undo`: Revert the last migration.
*   **Seed Data:** Initial data (e.g., admin user) is populated using seeders.
    *   `npm run db:seed`: Run all seeders.

## 7. API Documentation

The API endpoints are built following RESTful principles. All protected routes require a JWT in the `Authorization: Bearer <token>` header.

Base URL: `http://localhost:5000/api`

### Authentication (`/api/auth`)
*   `POST /register`: Register a new user.
    *   **Body:** `{ username, email, password }`
    *   **Response:** `{ id, username, email, role, token }` (201 Created)
*   `POST /login`: Authenticate user and get a JWT.
    *   **Body:** `{ email, password }`
    *   **Response:** `{ id, username, email, role, token }` (200 OK)
*   `GET /me` (Private): Get current user's profile.
    *   **Response:** `{ id, username, email, role, createdAt, updatedAt }` (200 OK)

### Users (`/api/users`) - Admin Only
*   `GET /`: Get all users.
    *   **Response:** `[{ id, username, email, role, ... }]` (200 OK)
*   `GET /:id`: Get user by ID.
    *   **Response:** `{ id, username, email, role, ... }` (200 OK)
*   `PUT /:id`: Update user by ID.
    *   **Body:** `{ username, email, password, role }` (partial update)
    *   **Response:** `{ updatedUserObject }` (200 OK)
*   `DELETE /:id`: Delete user by ID.
    *   **Response:** `{ message: 'User removed' }` (200 OK)

### Scraping Jobs (`/api/scraping-jobs`) - Private
*   `POST /`: Create a new scraping job.
    *   **Body:** `{ name, description, startUrl, cssSelectors: [{name, selector}], schedule, proxyEnabled, jsRendering }`
    *   **Response:** `{ scrapingJobObject }` (201 Created)
*   `GET /`: Get all scraping jobs for the authenticated user.
    *   **Response:** `[{ scrapingJobObject }, ...]` (200 OK)
*   `GET /:id`: Get a specific scraping job by ID.
    *   **Response:** `{ scrapingJobObject }` (200 OK)
*   `PUT /:id`: Update a scraping job.
    *   **Body:** `{ name, description, startUrl, cssSelectors, schedule, proxyEnabled, jsRendering, status }` (partial update)
    *   **Response:** `{ updatedScrapingJobObject }` (200 OK)
*   `DELETE /:id`: Delete a scraping job.
    *   **Response:** `{ message: 'Scraping job removed' }` (200 OK)
*   `POST /:id/run`: Manually trigger a scraping job run.
    *   **Response:** `{ message: 'Scraping job initiated successfully', result: scrapingResultObject }` (200 OK)
*   `GET /:id/results`: Get all results for a specific scraping job.
    *   **Response:** `[{ scrapingResultObject }, ...]` (200 OK)

### Scraping Results (`/api/scraping-results`) - Private
*   `GET /`: Get all scraping results for the authenticated user's jobs.
    *   **Query Params:** `jobId` (optional, to filter results by a specific job)
    *   **Response:** `[{ scrapingResultObject }, ...]` (200 OK)
*   `GET /:id`: Get a specific scraping result by ID.
    *   **Response:** `{ scrapingResultObject }` (200 OK)

## 8. Testing

The project is committed to high code quality and reliability through comprehensive testing.

*   **Backend (Node.js):**
    *   **Unit Tests:** Using Jest for individual functions, services, and controllers, mocking external dependencies (e.g., database, external APIs). Located in `backend/tests/unit/`.
    *   **Integration Tests:** Using Jest and Supertest to test API endpoints, ensuring proper interaction with the database and other services. A dedicated test database (`scraperhub_db_test`) is used. Located in `backend/tests/integration/`.
    *   **Coverage:** Aiming for 80%+ code coverage for backend logic. You can check coverage with `npm test --prefix ./backend -- --coverage`.

*   **Frontend (React.js):**
    *   **Component Tests:** Using Jest and React Testing Library to ensure UI components render correctly, respond to user interactions, and display data as expected. Located in `frontend/src/tests/`.
    *   **Coverage:** Configured to monitor basic coverage.

**How to Run Tests:**
*   **Backend:**
    ```bash
    cd backend
    npm test
    # or with coverage
    npm run test:coverage
    ```
*   **Frontend:**
    ```bash
    cd frontend
    npm test
    ```
    *(Note: For integration tests, ensure your PostgreSQL test database is running and configured correctly, or use the provided `docker-compose.test.yml` for CI/CD environments).*

## 9. Deployment Guide

This project is containerized with Docker, making deployment to various cloud platforms straightforward.

1.  **Build Docker Images:**
    Ensure `docker-compose.yml` and respective `Dockerfile`s are configured.
    ```bash
    docker-compose build
    ```
    This builds images for `db`, `backend`, and `frontend`.

2.  **Environment Variables:**
    Ensure `.env` files for both backend and frontend are configured for your production environment (e.g., actual database credentials, strong JWT secret, production API URLs).

3.  **Cloud Hosting Options:**
    *   **Docker Compose on a Single VM:** For simpler deployments, you can deploy the `docker-compose.yml` directly onto a cloud VM (e.g., AWS EC2, DigitalOcean Droplet).
        *   Install Docker and Docker Compose on the VM.
        *   Copy the project to the VM.
        *   Run `docker-compose up -d`.
    *   **Kubernetes (EKS, GKE, AKS):** For highly scalable and resilient deployments, each service (backend, frontend, db) can be deployed as separate Kubernetes deployments, services, and ingresses.
        *   You would need to create `Dockerfile`s for each service (already provided).
        *   Push images to a container registry (e.g., Docker Hub, ECR, GCR).
        *   Write Kubernetes YAML manifests (Deployment, Service, Ingress, PersistentVolumeClaim for DB).
        *   Use `kubectl` to apply the manifests.
    *   **Platform-as-a-Service (PaaS):** Platforms like AWS Elastic Beanstalk, Google Cloud Run, Heroku can simplify deployment of web services.
        *   Backend: Can be deployed as a Node.js application.
        *   Frontend: Can be deployed as a static site (S3 + CloudFront, Netlify, Vercel).
        *   Database: Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL).

4.  **Database Migrations in Production:**
    While `server.js` includes `sequelize.sync({ alter: true })` for development convenience, in production, it's safer to explicitly run migrations as a separate step.
    This can be done as part of your CI/CD pipeline or as a pre-deployment step:
    ```bash
    docker-compose run --rm backend npm run db:migrate
    ```
    Or if deploying directly to a PaaS, ensure your deployment script includes this command.

5.  **Monitoring:**
    Integrate with cloud monitoring solutions (e.g., AWS CloudWatch, Google Cloud Monitoring) for logs, metrics (CPU, memory, network), and alerts. Our backend already uses Winston for structured logging, which can be easily forwarded to such services.

## 10. CI/CD

The project includes a basic CI/CD pipeline using GitHub Actions, defined in `.github/workflows/ci.yml`.

*   **Triggers:** The workflow runs on `push` to `main` and `develop` branches, and on `pull_request` to these branches.
*   **Jobs:**
    *   `backend-test`:
        *   Checks out code.
        *   Sets up Node.js.
        *   Installs backend dependencies.
        *   Runs ESLint for code quality checks.
        *   Starts a temporary PostgreSQL container using `docker-compose.test.yml` for integration tests.
        *   Executes backend unit and integration tests (Jest, Supertest) with coverage.
        *   Shuts down the test PostgreSQL container.
    *   `frontend-test`:
        *   Checks out code.
        *   Sets up Node.js.
        *   Installs frontend dependencies.
        *   Runs ESLint for code quality.
        *   Executes frontend component tests (Jest, React Testing Library).
    *   `deploy` (Placeholder): This job would typically handle building Docker images, pushing them to a container registry, and deploying the application to a production environment upon successful completion of all tests on the `main` branch.

## 11. Additional Features

*   **Authentication/Authorization:** JWT-based authentication for securing API endpoints. Role-based authorization (`user`, `admin`) to restrict access to sensitive operations.
*   **Logging & Monitoring:** Structured logging with Winston. Logs are written to console and files (`logs/error.log`, `logs/combined.log`).
*   **Error Handling Middleware:** Centralized middleware for catching and formatting API errors, providing consistent responses and preventing sensitive information leakage in production.
*   **Rate Limiting:** Implemented using `express-rate-limit` to protect the API from excessive requests and potential DDoS attacks. Configurable via environment variables.
*   **Caching Layer (Concept):** While not fully implemented for this initial version due to complexity and line count, a caching layer (e.g., using Redis) could be integrated to:
    *   Cache frequently accessed scraping job configurations.
    *   Cache popular scraping results for faster retrieval.
    *   Store session data or rate-limit counts.
    *   This would typically involve a `Redis` service in `docker-compose.yml` and integration into services/controllers.

## 12. Future Enhancements

*   **Advanced Scraping Features:**
    *   Pagination and infinite scroll handling.
    *   Form submission and navigation.
    *   Image/file downloads.
    *   Anti-bot countermeasures (CAPTCHA solving integration, user-agent rotation, proxy rotation).
    *   Dynamic selector generation/recording (UI for users to click and select elements).
*   **Notifications:** Email/webhook notifications on job completion or failure.
*   **Data Export:** Options to export scraped data in various formats (CSV, Excel, JSON).
*   **Data Visualization:** Basic charts and graphs for scraped data and job performance metrics.
*   **Proxy Management:** A dedicated module for managing and rotating a pool of proxies.
*   **Dashboard Enhancements:** Real-time job status updates, analytics on scraping activity.
*   **Webhooks:** Allow users to specify a webhook URL to receive results automatically.
*   **Multi-tenancy:** Further isolation of user data for a true SaaS model.
*   **GraphQL API:** Provide a flexible API interface alongside REST.

## 13. Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure tests pass.
4.  Commit your changes (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Create a new Pull Request.

## 14. License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
```