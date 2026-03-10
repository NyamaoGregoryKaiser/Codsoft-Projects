# Secure Enterprise Web Application

This is a comprehensive, production-ready full-stack web application designed with enterprise-grade security, testing, and deployment features. It features a Node.js/Express/TypeScript backend, a React/TypeScript frontend, PostgreSQL database with Prisma ORM, Redis for caching and rate limiting, and robust security implementations.

## Table of Contents

1.  [Features](#features)
2.  [Project Structure](#project-structure)
3.  [Technology Stack](#technology-stack)
4.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker)](#local-development-setup-docker)
    *   [Backend Setup (Manual)](#backend-setup-manual)
    *   [Frontend Setup (Manual)](#frontend-setup-manual)
5.  [Running Tests](#running-tests)
6.  [API Documentation](#api-documentation)
7.  [Architecture](#architecture)
8.  [Security Considerations](#security-considerations)
9.  [Deployment](#deployment)
10. [CI/CD](#cicd)
11. [Contributing](#contributing)
12. [License](#license)

---

## 1. Features

*   **User Management:** Register, Login, Logout, User Profiles.
*   **Authentication:** JWT (JSON Web Tokens) with Access and Refresh tokens, HttpOnly and Secure cookies.
*   **Authorization:** Role-Based Access Control (RBAC) (User, Admin roles).
*   **Product Management:** Full CRUD operations for products (Admin-only create/update/delete).
*   **Input Validation:** Zod for robust schema validation.
*   **Password Security:** `bcryptjs` for password hashing.
*   **Rate Limiting:** `express-rate-limit` with Redis store to prevent abuse.
*   **Caching:** Redis for API response caching to improve performance.
*   **Logging & Monitoring:** `Winston` for structured logging, `Morgan` for HTTP request logging.
*   **Error Handling:** Centralized error handling middleware.
*   **CORS & Helmet:** Secure default settings for cross-origin requests and HTTP headers.
*   **Database:** PostgreSQL with `Prisma` ORM for type-safe database interactions and migrations.
*   **Frontend:** React with TypeScript for a modern, responsive user interface.
*   **Testing:** Unit, Integration, API, and Performance tests.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **CI/CD:** GitHub Actions workflow for automated testing and deployment.
*   **Documentation:** Comprehensive API documentation with Swagger/OpenAPI.

## 2. Project Structure

```
.
├── backend/                  # Node.js/Express/TypeScript API
│   ├── src/                  # Source code
│   ├── prisma/               # Prisma schema and migrations
│   ├── tests/                # Unit and integration tests
│   ├── .env.example          # Backend environment variables
│   ├── Dockerfile            # Dockerfile for backend
│   └── package.json
├── frontend/                 # React/TypeScript UI
│   ├── public/
│   ├── src/                  # Source code
│   ├── .env.example          # Frontend environment variables
│   ├── Dockerfile            # Dockerfile for frontend (Nginx serves build)
│   ├── nginx.conf            # Nginx config for frontend
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci-cd.yml         # GitHub Actions CI/CD pipeline
├── docs/                     # Project documentation
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   └── SECURITY_CONSIDERATIONS.md
├── k6_performance_test.js    # K6 script for performance testing
├── docker-compose.yml        # Docker Compose for local development
└── README.md                 # This file
```

## 3. Technology Stack

*   **Backend:** Node.js, Express.js, TypeScript, Prisma ORM, `bcryptjs`, `jsonwebtoken`, `winston`, `express-rate-limit`, `redis`.
*   **Frontend:** React, TypeScript, Axios, React Router.
*   **Database:** PostgreSQL.
*   **Caching/Messaging:** Redis.
*   **Containerization:** Docker, Docker Compose.
*   **Testing:** Jest, Supertest, K6.
*   **API Documentation:** Swagger/OpenAPI.
*   **CI/CD:** GitHub Actions.
*   **Linting/Formatting:** ESLint, Prettier.

## 4. Getting Started

### Prerequisites

*   Node.js (v20 or higher)
*   pnpm (recommended for monorepo, `npm install -g pnpm`)
*   Docker & Docker Compose (for simplified local setup)
*   Git

### Local Development Setup (Docker)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Create `.env` files:**
    *   Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
    *   **`backend/.env`**:
        ```dotenv
        NODE_ENV=development
        PORT=5000
        DATABASE_URL="postgresql://user:password@db:5432/secure_app_db?schema=public" # 'db' is the service name in docker-compose
        JWT_SECRET=supersecretjwtkey # CHANGE THIS IN PRODUCTION
        JWT_ACCESS_EXPIRATION_MINUTES=30
        JWT_REFRESH_EXPIRATION_DAYS=7
        JWT_COOKIE_NAME_ACCESS=accessToken
        JWT_COOKIE_NAME_REFRESH=refreshToken
        CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
        REDIS_HOST=redis # 'redis' is the service name in docker-compose
        REDIS_PORT=6379
        RATE_LIMIT_WINDOW_MS=60000
        RATE_LIMIT_MAX_REQUESTS=100
        CACHE_TTL_SECONDS=3600
        # Optional: For email sending (e.g., password reset)
        # EMAIL_SERVICE=gmail
        # EMAIL_USER=your_email@gmail.com
        # EMAIL_PASS=your_email_password
        # EMAIL_FROM=noreply@yourdomain.com
        # RESET_PASSWORD_URL=http://localhost:3000/reset-password
        ```
    *   **`frontend/.env`**:
        ```dotenv
        REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
        ```

3.  **Start Docker Compose services:**
    ```bash
    docker compose up --build -d
    ```
    This will:
    *   Build Docker images for backend and frontend.
    *   Start PostgreSQL, Redis, backend, and frontend containers.
    *   Run Prisma migrations on the backend.
    *   Seed the database with initial admin and user accounts (email: `admin@example.com`, pass: `admin123!`; email: `user@example.com`, pass: `user123!`).

4.  **Access the applications:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api/v1`
    *   API Documentation (Swagger): `http://localhost:5000/api-docs`

### Backend Setup (Manual - without Docker Compose for backend)

If you prefer to run the backend directly on your machine:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Ensure PostgreSQL and Redis are running:**
    *   You can still use `docker compose up -d db redis` from the project root.
    *   Update `backend/.env` with correct `DATABASE_URL` and `REDIS_HOST`/`REDIS_PORT` if they are not `localhost`.

4.  **Run Prisma migrations and seed the database:**
    ```bash
    pnpm prisma migrate dev --name init # Apply initial migrations
    pnpm prisma db seed                 # Seed the database
    ```

5.  **Start the backend in development mode:**
    ```bash
    pnpm dev
    ```
    The backend API will be available at `http://localhost:5000/api/v1`.

### Frontend Setup (Manual - without Docker Compose for frontend)

If you prefer to run the frontend directly on your machine:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Start the frontend development server:**
    ```bash
    pnpm start
    ```
    The frontend will be available at `http://localhost:3000`.

## 5. Running Tests

This project includes unit, integration, and performance tests.

### Backend Tests

Navigate to the `backend` directory.

*   **Unit Tests:**
    ```bash
    pnpm test # Runs unit tests with coverage
    pnpm test:watch # Runs unit tests in watch mode
    ```
    (Aims for 80%+ coverage, but this is an ongoing effort and requires iterative development.)

*   **Integration Tests:**
    ```bash
    pnpm test:integration
    ```
    *Note:* Integration tests require a running PostgreSQL database (or a mocked one setup in `tests/integration/setup.ts`). The `setup.ts` script handles migrations to a dedicated `test_secure_app_db` database and cleans up after each test. Ensure your `DATABASE_URL_TEST` in `backend/.env` is configured for this.

### Frontend Tests

Navigate to the `frontend` directory.

*   **Unit Tests:**
    ```bash
    pnpm test
    ```

### Performance Tests (K6)

1.  **Install K6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Ensure all Docker services are running:** `docker compose up -d`.
3.  **Run the K6 script from the project root:**
    ```bash
    k6 run k6_performance_test.js
    ```

## 6. API Documentation

The backend API is documented using Swagger (OpenAPI).

*   **Access Swagger UI:** Once the backend is running, open your browser to `http://localhost:5000/api-docs`.

For detailed API endpoints, request/response schemas, and authorization requirements, refer to the Swagger UI or the generated `API_DOCUMENTATION.md` file.

## 7. Architecture

Refer to `docs/ARCHITECTURE.md` for a detailed overview of the system architecture, including backend layers, data flow, and technology choices.

## 8. Security Considerations

Refer to `docs/SECURITY_CONSIDERATIONS.md` for a comprehensive overview of security measures implemented in this project, common vulnerabilities addressed, and further recommendations.

## 9. Deployment

Refer to `docs/DEPLOYMENT.md` for guidelines on deploying this application to a production environment. This includes considerations for cloud providers, environment variables, scaling, and monitoring.

## 10. CI/CD

The project includes a basic GitHub Actions workflow (`.github/workflows/ci-cd.yml`) to automate testing and build processes for both backend and frontend.

**Current Workflow:**
*   `backend-ci`: Builds, lints, and runs tests for the backend.
*   `frontend-ci`: Builds, lints, and runs tests for the frontend.

**Future/Extended CI/CD:**
*   Automated Docker image builds and pushes to a container registry (e.g., Docker Hub, AWS ECR).
*   Deployment to a staging or production environment (e.g., ECS, Kubernetes, GKE).
*   Integration with security scanning tools (SAST, DAST).
*   Performance testing as part of the pipeline.

## 11. Contributing

Contributions are welcome! Please follow standard Git flow: fork the repository, create a feature branch, and submit a pull request.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```