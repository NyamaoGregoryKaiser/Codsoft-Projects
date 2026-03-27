# PMS API - Project Management System

This is a comprehensive, production-ready Project Management System (PMS) API built with Node.js, TypeScript, Express, TypeORM, PostgreSQL, and React. It features robust backend functionality, a basic frontend interface, full CRUD operations, authentication, authorization, logging, caching, rate limiting, Dockerization, and CI/CD integration.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Prerequisites](#prerequisites)
5.  [Getting Started](#getting-started)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Running with Docker Compose](#running-with-docker-compose)
6.  [Database Operations](#database-operations)
7.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Performance Tests (K6)](#performance-tests-k6)
8.  [API Documentation](#api-documentation)
9.  [Architecture Documentation](#architecture-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Contributing](#contributing)
12. [License](#license)

## Features

*   **User Management:**
    *   User registration and login (JWT based authentication).
    *   Role-based authorization (Admin, Member).
    *   Admin-only CRUD operations for users.
*   **Project Management:**
    *   CRUD operations for projects.
    *   Projects are linked to their creators.
    *   Authorization checks for project modifications/deletions (creator or admin).
*   **Task Management:**
    *   CRUD operations for tasks within projects.
    *   Tasks can be assigned to users.
    *   Tasks have statuses (To Do, In Progress, Done) and priorities (Low, Medium, High).
    *   Authorization checks for task modifications/deletions (project creator, task creator, or admin).
*   **Middleware:**
    *   Authentication & Authorization.
    *   Centralized Error Handling.
    *   Request Logging.
    *   Caching layer (using `node-cache`).
    *   Rate Limiting.
*   **Database:**
    *   PostgreSQL with TypeORM (ORM).
    *   Schema migrations for version control.
    *   Seed data for initial setup (e.g., admin user).
*   **Development & Operations:**
    *   Docker support for easy setup and deployment.
    *   CI/CD pipeline configuration (GitHub Actions example).
    *   Comprehensive testing suite (Unit, Integration, API).
    *   API documentation (Swagger/OpenAPI).
    *   Detailed README and architecture documentation.
*   **Frontend:**
    *   Basic React app to demonstrate API interaction (Login, Register, List Projects, Create Project).
    *   Uses Tailwind CSS for minimal styling.

## Technology Stack

**Backend:**
*   **Runtime:** Node.js (v20+)
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **ORM:** TypeORM
*   **Database:** PostgreSQL
*   **Authentication:** JSON Web Tokens (JWT), Bcrypt.js
*   **Logging:** Winston
*   **Caching:** `node-cache` (in-memory for demo, easily swappable with Redis)
*   **Rate Limiting:** `express-rate-limit`
*   **API Docs:** Swagger UI Express

**Frontend:**
*   **Framework:** React (v18+)
*   **Language:** TypeScript
*   **State Management:** React Hooks
*   **Styling:** Tailwind CSS
*   **HTTP Client:** Axios
*   **Routing:** React Router DOM

**DevOps & Tools:**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions (configured)
*   **Testing:** Jest, Supertest
*   **Code Quality:** ESLint, Prettier

## Project Structure

```
pms-api/
├── backend/                  # Node.js/Express/TypeORM backend
│   ├── src/                  # Source code
│   │   ├── app.ts            # Express app setup
│   │   ├── server.ts         # Server entry point
│   │   ├── config/           # Environment variables, logger config
│   │   ├── db/               # TypeORM data source, migrations, seeds
│   │   ├── middleware/       # Auth, error, logging, cache, rate limit
│   │   ├── modules/          # Feature-based modules (auth, users, projects, tasks)
│   │   ├── types/            # Custom type definitions
│   │   └── utils/            # Utility functions (API errors, JWT, password)
│   ├── tests/                # Unit, integration, API tests
│   ├── .env.example          # Environment variables example
│   ├── Dockerfile            # Dockerfile for backend app
│   ├── jest.config.ts        # Jest test configuration
│   └── package.json          # Backend dependencies and scripts
├── frontend/                 # React/TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── api.ts            # Axios client
│   │   ├── App.tsx           # Main React component
│   │   ├── components/       # Reusable React components
│   │   └── pages/            # Page-level React components (Auth, Projects)
│   ├── .env.example
│   ├── Dockerfile            # Dockerfile for frontend app
│   ├── nginx/                # Nginx configuration for frontend
│   └── package.json          # Frontend dependencies and scripts
├── .github/                  # GitHub Actions CI/CD workflows
├── docker-compose.yml        # Docker Compose for all services (backend, db, frontend)
├── docs/                     # Project documentation
│   ├── API_DOCUMENTATION.md  # Detailed API endpoints
│   ├── ARCHITECTURE.md       # System architecture overview
│   └── DEPLOYMENT_GUIDE.md   # Step-by-step deployment instructions
└── README.md                 # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: v20.x or higher
*   **npm**: v10.x or higher (comes with Node.js)
*   **Docker & Docker Compose**: Latest versions (Docker Desktop recommended)
*   **Git**: Latest version

## Getting Started

You can run the application either by setting up the backend and frontend separately or by using Docker Compose for a fully containerized environment. Docker Compose is highly recommended for ease of setup.

### Running with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/pms-api.git
    cd pms-api
    ```

2.  **Create `.env` files:**
    Copy the example environment files for both backend and frontend:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    You can customize the values in these `.env` files if needed. For the backend, ensure `DB_HOST` is set to `db` (the service name in `docker-compose.yml`). For the frontend, `VITE_API_BASE_URL` should point to your backend service (e.g., `http://localhost:3000/api/v1`).

3.  **Build and run the services:**
    Navigate to the root of the `pms-api` directory and run:
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build Docker images for both backend and frontend.
    *   Start a PostgreSQL database container (`db`).
    *   Start the backend API container (`backend`).
    *   Run TypeORM migrations and seed the initial admin user.
    *   Start the frontend React app container (`frontend`) served by Nginx.

4.  **Access the application:**
    *   **Frontend:** Open your browser and navigate to `http://localhost`
    *   **Backend API:** `http://localhost:3000/api/v1`
    *   **Swagger API Docs:** `http://localhost:3000/api-docs`

5.  **Stop the services:**
    ```bash
    docker-compose down
    ```

### Backend Setup (Without Docker)

1.  **Navigate to the backend directory:**
    ```bash
    cd pms-api/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file from `.env.example`. **Important:** If running without Docker, ensure `DB_HOST` points to your local PostgreSQL instance (e.g., `localhost`).
    ```bash
    cp .env.example .env
    # Edit .env: DB_HOST=localhost (if running PostgreSQL directly on host)
    ```

4.  **Start a PostgreSQL database:**
    Ensure you have a PostgreSQL server running and accessible. You can use Docker for just the database:
    ```bash
    docker run --name pms-db -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pms_db -p 5432:5432 -d postgres:15-alpine
    ```

5.  **Run database migrations and seed data:**
    ```bash
    npm run migration:run
    npm run seed
    ```
    *The `npm run seed` script creates an admin user based on values in your `.env` file (default: `admin@example.com` / `adminpassword123`).*

6.  **Start the backend server:**
    ```bash
    npm run dev # For development with hot-reloads
    # OR
    npm run build && npm start # For production build
    ```
    The API will be available at `http://localhost:3000`.

### Frontend Setup (Without Docker)

1.  **Navigate to the frontend directory:**
    ```bash
    cd pms-api/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file from `.env.example`. Ensure `VITE_API_BASE_URL` points to your backend API.
    ```bash
    cp .env.example .env
    # If backend is on localhost:3000:
    # VITE_API_BASE_URL=http://localhost:3000/api/v1
    ```

4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port Vite chooses).

## Database Operations

Ensure your database is running before performing these operations.

*   **Generate a new migration:**
    ```bash
    cd backend
    npm run migration:create --name=<MigrationName>
    ```
*   **Run pending migrations:**
    ```bash
    cd backend
    npm run migration:run
    ```
*   **Revert the last migration:**
    ```bash
    cd backend
    npm run migration:revert
    ```
*   **Seed initial data:**
    ```bash
    cd backend
    npm run seed
    ```

## Testing

### Backend Tests

The backend uses Jest for unit, integration, and API tests.

1.  **Navigate to the backend directory:**
    ```bash
    cd pms-api/backend
    ```

2.  **Ensure a test database is available:**
    The `jest.config.ts` and `tests/setup.ts` are configured to connect to a local PostgreSQL database. For CI, a separate `docker-compose.test.yml` is used. For local testing, you can temporarily modify your `.env` to point to a test database or ensure your main Docker-managed `db` is running and accessible (or start a separate test db container on a different port like `5433`).

    **Recommended for local testing:**
    You can use the `docker-compose.test.yml` provided in the root `pms-api` directory to spin up a dedicated test database:
    ```bash
    docker-compose -f docker-compose.test.yml up -d db
    # Wait for the DB to be ready, then:
    # Set DB_PORT=5433 in backend/.env for testing if your main DB is on 5432
    # OR, ensure tests/setup.ts explicitly connects to 5433 if you prefer.
    ```

3.  **Run tests:**
    ```bash
    npm test
    ```
4.  **Run tests with coverage:**
    ```bash
    npm run test:coverage
    ```
    Test coverage reports will be generated in `backend/coverage/`.

### Performance Tests (K6)

Performance tests are written using K6 to simulate user load and measure API response times.

1.  **Install K6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Ensure backend is running:** Start your backend application (e.g., using `docker-compose up --build -d` from the project root).
3.  **Navigate to backend directory:**
    ```bash
    cd pms-api/backend
    ```
4.  **Run the performance test:**
    ```bash
    k6 run -e API_URL=http://localhost:3000/api/v1 -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=adminpassword123 performance-test.js
    ```
    *Adjust `API_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as per your `.env` configuration.*

## API Documentation

The backend API is documented using Swagger/OpenAPI.

*   **Access the API Documentation:** Once the backend server is running, open your browser and navigate to `http://localhost:3000/api-docs`.
*   The `backend/src/docs/swagger.json` file contains the OpenAPI specification. It is manually maintained for this project, but tools like `tsoa` can automate this from code annotations.

## Architecture Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a detailed overview of the system architecture, design decisions, and technology choices.

## Deployment Guide

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for instructions on how to deploy this application to a production environment.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details (or just assume ISC for this template).
```

#### `pms-api/docs/API_DOCUMENTATION.md`
```markdown