# Data Visualization System

This is a comprehensive, full-stack data visualization platform designed to empower users to upload datasets, create interactive charts, and organize them into dynamic dashboards. Built with modern web technologies, it offers a robust backend (Node.js, Express, TypeScript), a scalable database (PostgreSQL, TypeORM), and a responsive frontend (React, Material-UI, Chart.js).

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Prerequisites](#prerequisites)
5.  [Getting Started](#getting-started)
    *   [Environment Setup](#environment-setup)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
6.  [Development](#development)
    *   [Backend Scripts](#backend-scripts)
    *   [Frontend Scripts](#frontend-scripts)
7.  [Database Management](#database-management)
    *   [Migrations](#migrations)
    *   [Seeding Data](#seeding-data)
8.  [API Documentation](#api-documentation)
9.  [Testing](#testing)
    *   [Running Tests](#running-tests)
    *   [Performance Testing (Conceptual)](#performance-testing-conceptual)
10. [CI/CD (Conceptual)](#cicd-conceptual)
11. [Deployment Guide](#deployment-guide)
12. [Additional Features](#additional-features)
    *   [Authentication & Authorization](#authentication--authorization)
    *   [Logging & Monitoring](#logging--monitoring)
    *   [Error Handling](#error-handling)
    *   [Caching](#caching)
    *   [Rate Limiting](#rate-limiting)
13. [Future Enhancements](#future-enhancements)
14. [License](#license)

---

## 1. Features

*   **User Authentication & Authorization:** Secure user registration, login, and role-based access control.
*   **Dataset Management:** Upload, view, update, and delete tabular datasets (stored as JSONB).
*   **Column Metadata Inference:** Automatically detects column names and types from uploaded data.
*   **Visualization Creation:** Create various chart types (Bar, Line, Pie, Table) from datasets with customizable configurations.
*   **Dashboard Management:** Organize multiple visualizations into interactive dashboards.
*   **Responsive UI/UX:** User-friendly interface built with React and Material-UI.
*   **RESTful API:** Clean and well-defined API endpoints for all core functionalities.
*   **Robust Error Handling:** Centralized error handling for consistent responses.
*   **Caching Layer:** Improves API response times for frequently accessed data (e.g., dashboards).
*   **Rate Limiting:** Protects the API from abuse and ensures fair usage.
*   **Comprehensive Testing:** Unit, integration, and API tests for reliability.
*   **Dockerized Environment:** Easy setup and deployment using Docker.
*   **Detailed Documentation:** README, API docs (conceptual), and architectural overview.

## 2. Architecture

The system follows a typical client-server architecture with a clear separation of concerns:

*   **Frontend (Client):** A single-page application (SPA) built with React and TypeScript. It consumes the RESTful API to manage data and renders interactive visualizations using charting libraries.
*   **Backend (Server):** A Node.js application using Express.js and TypeScript. It exposes RESTful API endpoints, handles business logic, interacts with the database, and provides authentication/authorization.
    *   **Layered Structure:**
        *   **Routes:** Define API endpoints and map them to controllers.
        *   **Controllers:** Handle HTTP requests, validate input, and delegate to services.
        *   **Services:** Contain the core business logic and interact with repositories.
        *   **Models (Entities):** TypeORM entities defining the database schema.
        *   **Database:** PostgreSQL for persistent data storage.
        *   **Cache:** Redis for high-speed data retrieval.
*   **Database:** PostgreSQL is used as the primary data store, leveraging its robust JSONB capabilities for flexible dataset storage.
*   **Caching:** Redis is integrated to cache frequently accessed dashboard data, reducing database load and improving response times.

```
+------------------+     +--------------------+     +------------------+
|                  |     |                    |     |                  |
|     Browser      |<--->|   React Frontend   |<--->|   Node.js/TS     |
|                  |     | (Material-UI,      |     |    Backend       |
| (UI/UX, Charts)  |     |   Chart.js)        |     | (Express, TypeORM)|
+------------------+     +--------------------+     +------------------+
                                  ^                         |
                                  |                         |
                                  |                         v
                         (RESTful API Calls)       +------------------+
                                                     |    PostgreSQL    |
                                                     | (User, Dataset,  |
                                                     |  Dashboard, Viz) |
                                                     +------------------+
                                                         ^
                                                         |
                                                         | (Cache Queries)
                                                         v
                                                    +------------------+
                                                    |      Redis       |
                                                    |     (Cache)      |
                                                    +------------------+
```

## 3. Technologies Used

**Backend:**
*   **Node.js:** JavaScript runtime
*   **TypeScript:** Superset of JavaScript for type safety
*   **Express.js:** Web framework
*   **PostgreSQL:** Relational database
*   **TypeORM:** ORM for database interaction
*   **bcryptjs:** Password hashing
*   **jsonwebtoken:** JWT for authentication
*   **winston:** Logging library
*   **redis:** Caching and session management
*   **express-rate-limit:** Rate limiting middleware
*   **helmet, cors, hpp, body-parser:** Security and utility middlewares
*   **jest, supertest, ts-jest:** Testing frameworks

**Frontend:**
*   **React:** JavaScript library for building user interfaces
*   **TypeScript:** For type safety
*   **Material-UI (MUI):** React UI framework for sleek components
*   **Chart.js / react-chartjs-2:** For interactive data visualizations
*   **Axios:** HTTP client
*   **react-router-dom:** Routing
*   **js-cookie:** For managing JWT tokens in cookies
*   **jest, @testing-library/react:** Testing frameworks

**DevOps & Tools:**
*   **Docker & Docker Compose:** Containerization
*   **ESLint & Prettier:** Code quality and formatting
*   **nodemon, ts-node:** Development utilities

## 4. Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Node.js](https://nodejs.org/en/download/) (v18 or higher)
*   [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
*   [Docker](https://www.docker.com/products/docker-desktop) & [Docker Compose](https://docs.docker.com/compose/install/) (recommended for easy setup)
*   [PostgreSQL](https://www.postgresql.org/download/) (if not using Docker for DB)
*   [Redis](https://redis.io/download/) (if not using Docker for Redis)

## 5. Getting Started

You can run the application either directly on your machine or using Docker Compose. Docker Compose is highly recommended for a quick and consistent setup.

### Environment Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/data-viz-system.git
    cd data-viz-system
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the root directory and update the values.
    ```bash
    cp .env.example .env
    ```
    **Important:** Update `DB_PASSWORD` and `JWT_SECRET` to strong, unique values.

### Running with Docker Compose (Recommended)

This is the easiest way to get the entire stack (PostgreSQL, Redis, Backend, Frontend) running.

1.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
    *   This command will:
        *   Build the `backend` and `frontend` Docker images.
        *   Start PostgreSQL and Redis containers.
        *   Run database migrations on the `backend` container.
        *   Start the backend server on `http://localhost:5000`.
        *   Start the frontend development server on `http://localhost:3000`.

2.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api/v1` (Base URL for API endpoints)

3.  **To stop and remove containers:**
    ```bash
    docker-compose down
    # To remove volumes (e.g., database data), use:
    # docker-compose down -v
    ```

### Backend Setup (Manual)

If you prefer to run the backend directly:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Ensure PostgreSQL and Redis are running** on your machine and configured as per your `.env` file.

4.  **Run database migrations:**
    ```bash
    npm run migrate:run
    ```

5.  **Seed initial data (optional, for development):**
    ```bash
    npm run seed:run
    ```

6.  **Start the backend server:**
    ```bash
    npm run dev  # For development with nodemon
    # or
    npm start    # For production build
    ```
    The backend will run on `http://localhost:5000`.

### Frontend Setup (Manual)

If you prefer to run the frontend directly:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

## 6. Development

### Backend Scripts (in `backend/` directory)

*   `npm install`: Install dependencies.
*   `npm start`: Start the compiled Node.js server (production build).
*   `npm run dev`: Start the Node.js server with `nodemon` for automatic restarts on code changes (development).
*   `npm run build`: Compile TypeScript to JavaScript.
*   `npm run test`: Run all Jest tests.
*   `npm run test:watch`: Run Jest tests in watch mode.
*   `npm run lint`: Lint TypeScript files with ESLint.
*   `npm run format`: Format code with Prettier.

### Frontend Scripts (in `frontend/` directory)

*   `npm install`: Install dependencies.
*   `npm start`: Start the React development server.
*   `npm run build`: Build the React app for production.
*   `npm test`: Run all React tests with Jest.
*   `npm run lint`: Lint TypeScript and TSX files with ESLint.
*   `npm run format`: Format code with Prettier.

## 7. Database Management

The backend uses TypeORM for database interactions and migrations.

### Migrations

Migrations are essential for evolving your database schema in a controlled manner.

*   **Create a new migration:**
    ```bash
    npm run typeorm migration:create ./src/db/migrations/YourMigrationName
    # Example: npm run migrate:create --name=AddVisualizationTable
    ```
    This will create a new `.ts` file in `backend/src/db/migrations/`. You'll then add your schema changes (e.g., `createTable`, `addColumn`) in the `up` method and reverse changes in the `down` method.

*   **Run pending migrations:**
    ```bash
    npm run migrate:run
    ```
    This applies all migrations that haven't been run yet.

*   **Revert the last migration:**
    ```bash
    npm run migrate:revert
    ```
    Use with caution, primarily in development.

### Seeding Data

For development and testing, you can populate your database with initial data.

*   **Run seed script:**
    ```bash
    npm run seed:run
    ```
    The `backend/src/db/seeds/run-seeds.ts` script contains logic to create sample users, datasets, dashboards, and visualizations.

## 8. API Documentation

API endpoints are documented conceptually using JSDoc-style comments within the controller and route files, formatted for potential use with Swagger/OpenAPI.

**To generate interactive API documentation (e.g., Swagger UI):**

1.  **Install `swagger-jsdoc` and `swagger-ui-express`** in the backend:
    ```bash
    cd backend
    npm install swagger-jsdoc swagger-ui-express
    ```
2.  **Create a Swagger configuration file** (e.g., `backend/src/config/swagger.ts`):
    ```typescript
    // backend/src/config/swagger.ts
    import swaggerJsdoc from 'swagger-jsdoc';
    import { API_PREFIX, PORT } from './env';

    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Data Viz System API',
          version: '1.0.0',
          description: 'API documentation for the Data Visualization System backend',
        },
        servers: [
          {
            url: `http://localhost:${PORT}${API_PREFIX}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{
          bearerAuth: [],
        }],
      },
      apis: [
        './src/routes/*.ts',        // Path to your API route files
        './src/controllers/*.ts',   // Path to your API controller files
        './src/models/*.ts',        // Path to your TypeORM models (for schema definitions)
      ],
    };

    const specs = swaggerJsdoc(options);
    export default specs;
    ```
3.  **Integrate Swagger UI into `backend/src/app.ts`**:
    ```typescript
    // backend/src/app.ts (add these imports and lines)
    import swaggerUi from 'swagger-ui-express';
    import swaggerSpecs from '@config/swagger'; // Adjust path

    // ... inside app.ts, after setting up routes but before error handler
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
    logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    // ...
    ```
4.  **Restart your backend** and navigate to `http://localhost:5000/api-docs` to view the interactive documentation.

## 9. Testing

The project emphasizes quality through comprehensive testing.

### Running Tests

*   **Backend Tests:**
    Navigate to the `backend/` directory and run:
    ```bash
    npm test
    # For watch mode during development:
    npm run test:watch
    ```
    This will execute unit tests for services, integration tests for controllers (interacting with a test database), and API tests using `supertest`. Coverage reports will be generated in the `coverage/` directory.

*   **Frontend Tests:**
    Navigate to the `frontend/` directory and run:
    ```bash
    npm test
    ```
    This will execute unit tests for React components and utility functions using Jest and React Testing Library.

**Coverage Goal:** Aim for 80%+ coverage for both backend and frontend. The `jest.config.ts` files are configured with thresholds to enforce this.

### Performance Testing (Conceptual)

For a production-ready system, performance testing is crucial. Here's a conceptual approach:

*   **Tools:**
    *   **Artillery.io:** For API load testing (simulating many concurrent users).
    *   **Lighthouse/WebPageTest:** For frontend performance (page load times, TTI, etc.).
    *   **Prometheus/Grafana:** For monitoring backend metrics (CPU, memory, latency) during load tests.

*   **Scenarios:**
    *   **Dashboard Load:** Test loading a dashboard with many complex visualizations under different user loads.
    *   **Data Upload:** Test performance of large dataset uploads.
    *   **Visualization Data Retrieval:** Test fetching processed data for complex charts.
    *   **Concurrent Users:** Simulate many users simultaneously viewing/interacting with dashboards.

*   **Metrics to Monitor:**
    *   **Response Time (Latency):** Average, p95, p99 for critical API endpoints.
    *   **Throughput:** Requests per second (RPS).
    *   **Error Rate:** Percentage of failed requests.
    *   **Resource Utilization:** CPU, memory, network I/O on backend and database servers.
    *   **Database Query Performance:** Slow queries, connection pooling.
    *   **Cache Hit Rate:** Effectiveness of Redis cache.

## 10. CI/CD (Conceptual)

A Continuous Integration/Continuous Deployment (CI/CD) pipeline ensures code quality and automated deployments. Below is a conceptual `ci.yml` for GitHub Actions.

**`.github/workflows/ci.yml`**
```yaml