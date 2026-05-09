# Enterprise-Grade Mobile App Backend System

This project delivers a comprehensive, production-ready backend system for a mobile application, built with TypeScript, Node.js, Express, and PostgreSQL. It incorporates modern development practices, robust security features, and a scalable architecture.

## Table of Contents
1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Local Development (Manual)](#local-development-manual)
5.  [Running the Application](#running-the-application)
6.  [Database Management](#database-management)
7.  [Testing](#testing)
8.  [API Documentation](#api-documentation)
9.  [Architecture](#architecture)
10. [Deployment](#deployment)
11. [CI/CD](#ci/cd)
12. [Additional Features](#additional-features)
13. [Contributing](#contributing)
14. [License](#license)

## 1. Features

*   **Core API:** RESTful API with full CRUD operations for Users, Products, and Orders.
*   **Authentication & Authorization:** JWT-based access tokens, refresh tokens, and role-based access control (RBAC) for `USER` and `ADMIN` roles.
*   **Database:** PostgreSQL with Prisma ORM for type-safe database interactions, migrations, and seeding.
*   **Data Validation:** Request payload validation using `zod`.
*   **Error Handling:** Centralized API error handling middleware for consistent responses.
*   **Logging:** Structured logging with `Winston` for better observability.
*   **Caching:** API response caching using `Redis` to improve performance for frequently accessed data.
*   **Rate Limiting:** Protects API endpoints from abuse and brute-force attacks.
*   **Security:** `Helmet` for setting various security HTTP headers, `hpp` for preventing HTTP parameter pollution, `cors` for cross-origin resource sharing, password hashing (`bcryptjs`).
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **Testing:** Comprehensive suite including Unit, Integration, and API tests with `Jest` and `Supertest`.
*   **API Documentation:** Interactive API documentation using `Swagger UI Express`.
*   **CI/CD:** Basic GitHub Actions workflow for automated testing and deployment.
*   **Configuration:** Environment-specific configurations using `.env` files.
*   **Frontend (Minimal):** A simple React application demonstrating API consumption.

## 2. Technology Stack

**Backend:**
*   **Runtime:** Node.js (v20+)
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **Caching:** Redis
*   **Authentication:** JSON Web Tokens (JWT), `bcryptjs`
*   **Validation:** Zod
*   **Logging:** Winston
*   **Testing:** Jest, Supertest
*   **API Docs:** Swagger UI Express, YAML.js
*   **Security:** Helmet, HPP, CORS, Express-rate-limit
*   **Utilities:** Lodash, HTTP Status Codes

**Containerization:**
*   Docker
*   Docker Compose

**Frontend (Example):**
*   React (Create React App)

## 3. Project Structure

The project is divided into `backend` and `frontend` directories, with `docs` for standalone documentation.

```
.
├── backend                 # Node.js/Express/TypeScript Backend
│   ├── src                 # Source code
│   │   ├── config          # Environment config, DB client, logger, Swagger
│   │   ├── middleware      # Auth, error handling, validation, caching, rate limiting
│   │   ├── modules         # Feature-specific modules (auth, users, products, orders)
│   │   │   ├── [module_name]
│   │   │   │   ├── [module_name].controller.ts
│   │   │   │   ├── [module_name].routes.ts
│   │   │   │   ├── [module_name].service.ts
│   │   │   │   └── [module_name].validation.ts
│   │   ├── utils           # Utility functions (JWT, password hashing)
│   │   ├── app.ts          # Express application setup
│   │   ├── server.ts       # Server entry point
│   │   └── types.ts        # Global TypeScript types
│   ├── prisma              # Prisma schema, migrations, seed script
│   ├── tests               # Unit and Integration tests
│   ├── .env.example        # Environment variables template
│   ├── Dockerfile          # Docker build instructions
│   ├── docker-compose.yml  # Docker Compose setup
│   ├── package.json        # Backend dependencies and scripts
│   ├── tsconfig.json       # TypeScript configuration
│   └── jest.config.ts      # Jest test runner configuration
├── frontend                # Minimal React Frontend (demonstrates API consumption)
│   ├── src                 # React source code
│   ├── .env                # Frontend environment variables
│   ├── package.json        # Frontend dependencies
│   └── README.md           # Frontend specific README
└── docs                    # Project documentation
    ├── architecture.md
    ├── api.yaml            # OpenAPI 3.0 specification
    ├── deployment.md
    └── performance_testing.md
├── .github
│   └── workflows
│       └── ci-cd.yml       # GitHub Actions CI/CD workflow
└── README.md               # Main project README (this file)
```

## 4. Setup Instructions

### Prerequisites
*   [Node.js](https://nodejs.org/en/download/) (v20 or higher)
*   [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
*   [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
*   [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

### Local Development with Docker Compose (Recommended)

This method sets up PostgreSQL and Redis in Docker containers, along with the backend service.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mobile-app-backend.git
    cd mobile-app-backend
    ```

2.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

3.  **Create `.env` file:**
    Copy the `.env.example` file and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
    Ensure `DATABASE_URL` and `REDIS_URL` in your `.env` file match the `docker-compose.yml` service names (e.g., `db` for PostgreSQL, `redis` for Redis).
    Example for `.env`:
    ```dotenv
    NODE_ENV=development
    PORT=3000
    DATABASE_URL=postgresql://user:password@db:5432/mydb?schema=public
    JWT_SECRET=supersecretjwtkey
    JWT_ACCESS_EXPIRATION_MINUTES=30
    JWT_REFRESH_EXPIRATION_DAYS=7
    REDIS_URL=redis://redis:6379
    CACHE_TTL_SECONDS=3600
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX_REQUESTS=100
    LOG_LEVEL=debug
    ```

4.  **Build and run services with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Build the backend Docker image.
    *   Start PostgreSQL and Redis containers.
    *   Wait for DB and Redis to be healthy.
    *   Run Prisma migrations.
    *   Seed the database with initial data.
    *   Start the backend application in development mode (with `nodemon` for hot-reloading).

    You can access the backend at `http://localhost:3000`.
    The API documentation will be available at `http://localhost:3000/api-docs`.

5.  **Stop services:**
    ```bash
    docker-compose down
    ```

### Local Development (Manual - without Docker for DB/Redis)

If you prefer to run PostgreSQL and Redis directly on your machine or have them as separate services, follow these steps.

1.  **Install dependencies:**
    ```bash
    cd backend
    npm install
    ```

2.  **Set up PostgreSQL and Redis:**
    *   Ensure you have a PostgreSQL server running (e.g., on `localhost:5432`).
    *   Ensure you have a Redis server running (e.g., on `localhost:6379`).

3.  **Create `.env` file:**
    Copy `.env.example` to `.env`. Adjust `DATABASE_URL` and `REDIS_URL` to point to your locally running instances.
    Example for `.env`:
    ```dotenv
    DATABASE_URL="postgresql://your_user:your_password@localhost:5432/your_db_name?schema=public"
    REDIS_URL="redis://localhost:6379"
    # ... other variables ...
    ```

4.  **Run Prisma migrations:**
    ```bash
    npm run prisma:migrate # This will apply migrations to your local DB
    npm run prisma:seed    # Seed the database with initial data
    ```

5.  **Start the backend in development mode:**
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:3000`.

## 5. Running the Application

Once the setup is complete, the backend server will be running on `http://localhost:3000`.

*   **Development Mode:** Use `npm run dev` (with `nodemon` for live reloading).
*   **Production Build:**
    ```bash
    npm run build # Compiles TypeScript to JavaScript in `dist` folder
    npm start     # Runs the compiled JavaScript application
    ```

## 6. Database Management

*   **Prisma Schema:** `backend/prisma/schema.prisma` defines your database models.
*   **Generate Prisma Client:**
    ```bash
    npm run prisma:generate
    ```
    This creates `@prisma/client` code based on your schema. It's often run automatically after `npm install` or `prisma migrate`.
*   **Create Migrations:** When you change `schema.prisma`:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```
    This will create a new migration file in `backend/prisma/migrations`.
*   **Apply Migrations:**
    ```bash
    npx prisma migrate deploy
    ```
    This applies all pending migrations to the database. It's used in production environments.
*   **Seed Database:**
    ```bash
    npm run prisma:seed
    ```
    This runs the `backend/prisma/seed.ts` script to populate your database with initial data.

## 7. Testing

The project uses `Jest` for unit and integration testing.

*   **Run all tests:**
    ```bash
    cd backend
    npm test
    ```
*   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```
*   **Generate test coverage report:**
    ```bash
    npm run test:coverage
    ```
    A `coverage` directory will be created with detailed reports.

*   **Test Environment Setup (`backend/tests/setup.ts`):**
    This script ensures a clean test database and Redis instance before and after tests. It connects to a separate test database (`DATABASE_URL_TEST`) and clears Redis cache to maintain test isolation.

## 8. API Documentation

Interactive API documentation is available via Swagger UI.

*   **Access:** Once the backend server is running, navigate to `http://localhost:3000/api-docs` in your browser.
*   **Specification:** The OpenAPI (Swagger) specification is defined in `docs/api.yaml`. Any changes to this file will be reflected in the Swagger UI.

## 9. Architecture

Detailed architectural overview can be found in `docs/architecture.md`.

## 10. Deployment

A basic deployment guide for Docker is provided in `docs/deployment.md`. This typically involves building your Docker images, pushing them to a registry, and deploying them to a cloud provider or your server infrastructure.

## 11. CI/CD

A basic GitHub Actions workflow is configured in `.github/workflows/ci-cd.yml`. This workflow:
*   Triggers on pushes to `main` and pull requests.
*   Installs dependencies.
*   Runs tests.
*   Builds the Docker image.
*   (Placeholder for deployment steps: e.g., push to Docker Hub, deploy to a cloud service).

## 12. Additional Features

*   **Authentication/Authorization:** JWT-based with access and refresh tokens, `User` and `Admin` roles.
*   **Logging:** Centralized Winston logger with environment-specific levels.
*   **Error Handling:** Custom `ApiError` class and middleware for structured error responses.
*   **Caching:** Redis-based API response caching implemented as middleware.
*   **Rate Limiting:** Global rate limiting using `express-rate-limit`.
*   **Security Headers:** `Helmet` middleware protects against common web vulnerabilities.
*   **HTTP Parameter Pollution:** `hpp` middleware prevents parameter pollution attacks.

## 13. Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 14. License

This project is licensed under the MIT License.