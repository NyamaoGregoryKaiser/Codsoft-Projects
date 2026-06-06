# Enterprise-Grade Mobile App Backend System

This repository provides a comprehensive, production-ready backend system for a mobile application, built with Node.js, Express, PostgreSQL, Prisma ORM, and Redis. It's designed with scalability, security, and maintainability in mind, incorporating various enterprise-grade features.

## Table of Contents

1.  [Application Overview](#application-overview)
2.  [Features](#features)
3.  [Technology Stack](#technology-stack)
4.  [Project Structure](#project-structure)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Environment Variables](#environment-variables)
    *   [Database Setup](#database-setup)
6.  [Running the Application](#running-the-application)
7.  [API Documentation](#api-documentation)
8.  [Testing](#testing)
    *   [Unit Tests](#unit-tests)
    *   [Integration Tests](#integration-tests)
    *   [API Tests](#api-tests)
    *   [Performance Tests (K6)](#performance-tests-k6)
9.  [Architecture Documentation](#architecture-documentation)
    *   [Core Architecture](#core-architecture)
    *   [Module Structure](#module-structure)
    *   [Data Flow](#data-flow)
    *   [Error Handling](#error-handling)
    *   [Authentication & Authorization](#authentication--authorization)
    *   [Caching](#caching)
    *   [Logging](#logging)
    *   [Rate Limiting](#rate-limiting)
10. [Deployment Guide](#deployment-guide)
    *   [Docker Deployment](#docker-deployment)
    *   [CI/CD with GitHub Actions](#cicd-with-github-actions)
11. [Contribution](#contribution)
12. [License](#license)

---

## 1. Application Overview

This backend system powers a "Project Management" mobile application. It allows users to:
*   Register and log in securely.
*   Manage their user profiles.
*   Create, view, update, and delete projects.
*   Create, view, update, and delete tasks within projects.
*   Assign tasks to users.
*   Track task status and due dates.

The system emphasizes a robust, scalable architecture suitable for production environments.

## 2. Features

*   **API Endpoints**: Full CRUD operations for Users, Projects, and Tasks.
*   **Authentication**: JWT-based authentication for secure API access, with refresh token mechanism.
*   **Authorization**: Role-based access control (User, Admin).
*   **Database Layer**: PostgreSQL with Prisma ORM for type-safe database interactions, migrations, and seeding.
*   **Data Validation**: Joi for robust request payload validation.
*   **Error Handling**: Centralized, custom error handling middleware.
*   **Logging**: Winston for structured logging (console & file).
*   **Caching Layer**: Redis for speeding up frequently accessed data.
*   **Rate Limiting**: Protects against brute-force attacks and abuse.
*   **Security**: Helmet for common security headers, CORS for frontend integration.
*   **Configuration**: Environment-based configuration using `dotenv`.
*   **Testing**: Comprehensive suite including Unit, Integration, API, and Performance tests.
*   **Documentation**: OpenAPI (Swagger) for API docs, detailed README.
*   **Containerization**: Docker and Docker Compose for easy setup and deployment.
*   **CI/CD**: GitHub Actions workflow for automated testing and build.

## 3. Technology Stack

*   **Runtime**: Node.js
*   **Web Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Caching**: Redis
*   **Authentication**: JSON Web Tokens (JWT), `bcrypt` for password hashing
*   **Validation**: Joi
*   **Logging**: Winston
*   **Testing**: Jest, Supertest, K6
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions

## 4. Project Structure

The project follows a modular, feature-based architecture. See the project-root diagram above for a detailed breakdown.

## 5. Setup and Installation

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: v18.x or higher (LTS recommended)
*   **npm** (comes with Node.js) or **yarn**
*   **Docker** & **Docker Compose**: For running the database, Redis, and optionally the application in containers.
*   **Git**: For cloning the repository.

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mobile-app-backend.git
    cd mobile-app-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Set up environment variables:**
    *   Copy the `.env.example` file to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and fill in the required values. See the "Environment Variables" section below.

4.  **Start Docker containers (PostgreSQL and Redis):**
    ```bash
    docker-compose up -d postgres redis
    ```
    This will start PostgreSQL on `5432` and Redis on `6379`.

### Environment Variables

Create a `.env` file in the project root based on `.env.example` and fill in the following:

```env
# Application
PORT=3000
NODE_ENV=development # development, test, production

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
# Example: postgresql://admin:password@localhost:5432/project_manager_db?schema=public

# JWT Authentication
JWT_SECRET="supersecretjwtkey"
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100
```
**Important:** For `DATABASE_URL`, ensure the `user`, `password`, `localhost:5432`, and `project_manager_db` match the settings in `docker-compose.yml` if you're using Docker for your database.

### Database Setup

1.  **Run Prisma Migrations:**
    This applies the database schema defined in `prisma/schema.prisma` to your PostgreSQL database.
    ```bash
    npx prisma migrate dev --name init
    ```
    (You can replace `init` with a more descriptive name for your first migration.)

2.  **Seed the Database (Optional but Recommended):**
    This populates your database with initial data (e.g., an admin user, sample projects/tasks).
    ```bash
    npx prisma db seed
    ```

## 6. Running the Application

1.  **Start the application:**
    ```bash
    npm run dev
    # or yarn dev
    ```
    The application will start on the port defined in your `.env` file (default: `3000`).

2.  **Access API Documentation:**
    Once the server is running, open your browser and navigate to:
    `http://localhost:3000/api-docs`

## 7. API Documentation

The API is documented using OpenAPI (Swagger).
*   The API specification is located in `swagger.yaml`.
*   When the server is running, you can access the interactive Swagger UI at `http://localhost:3000/api-docs`.

This documentation provides details on all available endpoints, request/response schemas, authentication methods, and example usage.

## 8. Testing

The project includes a comprehensive suite of tests using Jest and Supertest, along with performance tests using K6.

### Running All Tests

```bash
npm test
# or yarn test
```

### Unit Tests

Focus on individual functions, classes, and middleware in isolation, mocking external dependencies.
*   **Location**: `tests/unit/`
*   **Command**: `npm test -- tests/unit`

### Integration Tests

Verify interactions between different modules and the database (using a test database or carefully mocked database client).
*   **Location**: `tests/integration/`
*   **Command**: `npm test -- tests/integration`

### API Tests

Perform end-to-end tests against the actual API endpoints, simulating HTTP requests.
*   **Location**: `tests/api/`
*   **Command**: `npm test -- tests/api`

### Performance Tests (K6)

A basic performance test script is provided using k6.
1.  **Install k6**: Follow instructions at [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Run the script**:
    ```bash
    k6 run benchmark/k6_script.js
    ```
    This script will simulate a basic load on the `/v1/projects` endpoint. Modify `k6_script.js` to suit your specific load testing needs.

## 9. Architecture Documentation

### Core Architecture

The backend follows a layered, modular architecture:

1.  **Presentation Layer (Routes & Controllers)**:
    *   `src/routes/`: Central entry point for API routes.
    *   `src/modules/*/route.js`: Defines API endpoints and links them to controllers.
    *   `src/modules/*/controller.js`: Handles incoming HTTP requests, performs input validation (using Joi), calls service methods, and sends HTTP responses.

2.  **Business Logic Layer (Services)**:
    *   `src/modules/*/service.js`: Contains the core business logic. Interacts with the database (via Prisma) and other services. This layer is decoupled from HTTP concerns.

3.  **Data Access Layer (Prisma ORM)**:
    *   `src/database/prisma.js`: Singleton instance of the Prisma client.
    *   `prisma/schema.prisma`: Defines the database schema, models, and relationships. Prisma generates the client based on this schema. Services interact with Prisma client to perform CRUD operations.

4.  **Middleware Layer**:
    *   `src/middleware/`: Global Express middleware for tasks like authentication, error handling, caching, rate limiting, and security headers.

5.  **Utilities Layer**:
    *   `src/utils/`: Common helper functions like logging, custom error classes, and async wrappers.

### Module Structure

Each feature (e.g., `auth`, `users`, `projects`, `tasks`) resides in its own module under `src/modules/`. This promotes separation of concerns and maintainability.

```
src/modules/{feature}/
├── {feature}.controller.js   # Request handling, validation, response
├── {feature}.route.js        # API endpoint definitions
├── {feature}.service.js      # Business logic, database interactions
└── {feature}.validation.js   # Joi schemas for input validation
```

### Data Flow

1.  **Request Initiation**: A client (mobile app) sends an HTTP request to an API endpoint.
2.  **Middleware Processing**: The request passes through global middleware (e.g., rate limiting, authentication, CORS, security headers).
3.  **Routing**: The request is matched to a specific route handler defined in `src/modules/*/route.js`.
4.  **Controller Action**: The corresponding controller function (`src/modules/*/controller.js`) receives the request.
    *   It validates the request payload using Joi.
    *   It calls the appropriate service method (`src/modules/*/service.js`) to perform business logic.
5.  **Service Logic**: The service method executes business rules, interacts with the Prisma client (`src/database/prisma.js`) for database operations, and potentially interacts with Redis (`src/utils/redis.js`) for caching.
6.  **Database Interaction**: Prisma translates service calls into SQL queries, executes them against PostgreSQL, and returns results.
7.  **Response Generation**: The service returns data to the controller. The controller formats the data and sends an HTTP response back to the client.
8.  **Error Handling**: If any error occurs at any stage, the `error.middleware.js` intercepts it, logs it, and sends a standardized error response to the client.

### Error Handling

*   **Custom Error Class**: `src/utils/ApiError.js` extends `Error` to include `statusCode` and `isOperational` flags.
*   **`catchAsync` Wrapper**: `src/utils/catchAsync.js` wraps async controller/middleware functions to catch promises rejections and pass them to the Express error handler.
*   **Centralized Middleware**: `src/middleware/error.middleware.js` is the final error handler. It catches all errors (including `ApiError` instances and unexpected errors), logs them, and sends a consistent JSON error response to the client based on the `NODE_ENV`.

### Authentication & Authorization

*   **Authentication**: JWT (JSON Web Tokens) is used for stateless authentication.
    *   Users register/log in via `/v1/auth` endpoints.
    *   Upon successful login, an access token (short-lived) and a refresh token (long-lived) are issued.
    *   Access tokens are sent in the `Authorization` header (`Bearer <token>`) for protected routes.
    *   The `auth.middleware.js` verifies the JWT and populates `req.user` with user information.
*   **Authorization**: Role-based access control (RBAC).
    *   Users have roles (e.g., `user`, `admin`).
    *   Specific routes or controller actions are protected by checking `req.user.role` against required roles using the `authorize` function in `auth.middleware.js`.

### Caching

*   **Redis**: Used as an in-memory data store for caching frequently accessed data.
*   **`cache.middleware.js`**:
    *   Intercepts requests to specified GET endpoints.
    *   Checks if data exists in Redis cache; if so, returns cached data immediately.
    *   If not in cache, the request proceeds to the controller.
    *   After the controller sends a successful response, the middleware caches the response body in Redis for future requests.
    *   Cache invalidation is handled by modifying or deleting resources (e.g., when a project is updated, related project lists in cache should be cleared).

### Logging

*   **Winston**: `src/utils/logger.js` is configured to log messages.
*   **Console Logging**: For development environments.
*   **File Logging**: For production, logs are written to files (e.g., `error.log`, `combined.log`).
*   **Log Levels**: Supports `info`, `warn`, `error`, `debug`, etc.

### Rate Limiting

*   **`express-rate-limit`**: `src/middleware/rateLimit.middleware.js` is configured to limit the number of requests a single IP can make within a specified time window. This prevents abuse and brute-force attacks.

## 10. Deployment Guide

### Docker Deployment

The application is fully containerized using Docker.

1.  **Build the Docker Image:**
    ```bash
    docker build -t mobile-app-backend .
    ```

2.  **Run with Docker Compose (Production-like setup):**
    For a more production-oriented setup, you would typically run PostgreSQL and Redis as separate services (e.g., using managed cloud services or separate Docker containers).
    The provided `docker-compose.yml` is primarily for local development. To run all services including the app via `docker-compose`:

    ```bash
    docker-compose up -d
    ```
    This will bring up the `postgres`, `redis`, and `app` containers. Ensure your `.env` file has the correct `DATABASE_URL` and `REDIS_URL` pointing to the Docker service names (e.g., `postgresql://admin:password@postgres:5432/project_manager_db?schema=public` and `redis://redis:6379`).

3.  **Manual Docker Run (App only):**
    If your database and Redis are external, you can run just the application container:

    ```bash
    docker run -p 3000:3000 --env-file ./.env mobile-app-backend
    ```
    Make sure your `.env` file contains the correct `DATABASE_URL` and `REDIS_URL` for your external services.

### CI/CD with GitHub Actions

The `.github/workflows/ci.yml` file configures a basic CI/CD pipeline using GitHub Actions.

*   **Triggers**: The workflow runs on pushes to the `main` branch and on pull requests.
*   **Steps**:
    1.  **Checkout Code**: Clones the repository.
    2.  **Setup Node.js**: Installs the specified Node.js version.
    3.  **Install Dependencies**: Installs project dependencies.
    4.  **Lint Code**: Runs ESLint for code quality checks (if configured - not in this basic example).
    5.  **Run Tests**: Executes all Jest tests (`npm test`).
    6.  **(Optional) Docker Build**: Builds the Docker image (commented out by default, uncomment to enable).
    7.  **(Optional) Docker Push**: Pushes the Docker image to a registry (e.g., Docker Hub, AWS ECR - requires credentials).

To enable Docker build and push, you would need to:
*   Uncomment the relevant sections in `ci.yml`.
*   Configure Docker registry credentials as GitHub Secrets (e.g., `DOCKER_USERNAME`, `DOCKER_PASSWORD`).

## 11. Contribution

Feel free to fork this repository, submit pull requests, or open issues for suggestions and bug reports.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details (not included in this response, but implied).
---