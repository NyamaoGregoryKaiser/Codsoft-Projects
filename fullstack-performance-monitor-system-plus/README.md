# AppInsight: Comprehensive Performance Monitoring System

AppInsight is a full-stack web application designed to help developers and teams monitor the performance of their web applications (both frontend and backend). It provides a centralized dashboard to ingest, store, and visualize key performance metrics, allowing for proactive identification and resolution of performance bottlenecks.

## Features

**Core Application:**
*   User registration and authentication (JWT).
*   Project management (Create, View, Update, Delete projects).
*   Unique API key generation per project for secure metric ingestion.
*   Metric ingestion endpoint for collecting performance data (LCP, FID, CLS, API Response Times, Errors, Custom metrics).
*   Dashboard for an overview of all projects.
*   Detailed project view with summary metrics, time-series charts, and recent error logs.

**Backend (Node.js/Express.js/TypeScript):**
*   Robust RESTful API.
*   Prisma ORM for PostgreSQL database interactions.
*   Centralized error handling middleware.
*   Request logging with Winston.
*   JWT-based authentication and API key validation.
*   Rate limiting using Redis.
*   Caching of aggregated metrics using Redis to improve dashboard load times.
*   Health check endpoint.

**Frontend (React/TypeScript):**
*   Modern, responsive UI with Tailwind CSS.
*   React Query for efficient data fetching and caching.
*   Recharts for dynamic and interactive data visualizations.
*   Context API (or Zustand for global state) for authentication and toast notifications.

**Database Layer (PostgreSQL):**
*   Relational schema for Users, Projects, and Metrics.
*   Prisma migrations for schema management.
*   Seed data for quick setup and testing.
*   Optimized indexes for time-series and project-based queries.

**Configuration & Setup:**
*   `package.json` with all dependencies.
*   Environment variable management (`dotenv`).
*   Dockerized setup with `Dockerfile`s and `docker-compose.yml` for easy local development and deployment.
*   CI/CD pipeline configuration (conceptual GitHub Actions).

**Testing & Quality:**
*   Unit tests (Jest) for backend services and frontend components/hooks.
*   Integration tests (Jest, Supertest) for backend API endpoints and database interactions.
*   E2E tests (Cypress) for full user flows (registration, login, project CRUD).
*   Performance tests (Jest/Supertest) for API ingestion endpoint load simulation.

**Documentation:**
*   Comprehensive `README.md`.
*   Detailed `API.md` for all backend endpoints.
*   `ARCHITECTURE.md` explaining the system design.
*   `DEPLOYMENT.md` for deploying with Docker Compose.

## Technology Stack

*   **Backend:** Node.js, Express.js, TypeScript, Prisma, PostgreSQL, Redis, Winston, JWT, bcrypt, express-rate-limit, ioredis.
*   **Frontend:** React, TypeScript, React Router DOM, Axios, React Query, Recharts, Tailwind CSS.
*   **Containerization:** Docker, Docker Compose.
*   **Testing:** Jest, Supertest, React Testing Library, Cypress.
*   **CI/CD:** GitHub Actions.

## Getting Started

Follow these steps to set up and run AppInsight locally.

### Prerequisites

*   Docker Desktop (includes Docker Engine and Docker Compose)
*   Node.js (LTS recommended) and npm (for running scripts outside Docker if preferred)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/appinsight.git
cd appinsight
```

### 2. Configure Environment Variables

Create `.env` files based on the examples provided for both `backend` and `frontend` directories.

#### `backend/.env`

Create `backend/.env` with the following content:
```ini
DATABASE_URL="postgresql://user:password@db:5432/appinsight_db?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="supersecretjwtkey" # !!! CHANGE THIS IN PRODUCTION !!!
PORT=5000
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY_HEADER="X-AppInsight-Api-Key"
LOG_LEVEL=debug
```

#### `frontend/.env`

Create `frontend/.env` with the following content:
```ini
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 3. Build and Run with Docker Compose

From the root `appinsight` directory:

```bash
docker compose up --build -d
```
*   `--build`: Builds (or rebuilds) images before starting containers.
*   `-d`: Runs containers in detached mode (in the background).

This command will:
1.  Build the backend and frontend Docker images.
2.  Start a PostgreSQL database container.
3.  Start a Redis cache container.
4.  Run Prisma migrations and seed data in the backend container.
5.  Start the backend API server (on port 5000).
6.  Start the frontend React application (on port 3000).

**Note:** The `command` in `docker-compose.yml` for the `backend` service handles running `prisma migrate deploy` and `prisma db seed` automatically on startup, ensuring the database is ready.

### 4. Access the Application

Once all services are up and running (it might take a minute for the database and backend to initialize):

*   **Frontend:** Open your browser and navigate to `http://localhost:3000`
*   **Backend API:** The API will be accessible at `http://localhost:5000/api`

### 5. Seed Data for Demo

The `prisma db seed` command, included in the `docker-compose.yml` backend startup, will automatically create:
*   An `admin@example.com` user with password `adminpassword123`.
*   A `demo@example.com` user with password `demopassword123`.
*   A "Demo Web App" project for the `demo@example.com` user with a generated API key.
*   Some dummy metrics for the demo project.

You can log in with `demo@example.com` / `demopassword123` to explore.

## Running Tests

### Backend Tests

Navigate to the `backend` directory and run:

```bash
cd backend
npm install # if you haven't installed dependencies on host
npm test
# For coverage:
npm run test:coverage
```
*Note: Backend tests require a separate test database connection. Ensure your `backend/.env.test` (or `backend/.env` if you're comfortable) has `DATABASE_URL` pointing to a test database (e.g., `postgresql://testuser:testpassword@localhost:5433/testdb`). The `backend/tests/setup.ts` script handles running migrations on this test DB and clearing it before each test.*

### Frontend Tests

Navigate to the `frontend` directory and run:

```bash
cd frontend
npm install # if you haven't installed dependencies on host
npm test
# For coverage:
npm run test:coverage
```

### E2E Tests (Cypress)

Make sure your Docker services are running (`docker compose up -d`).
Navigate to the `frontend` directory and run:

```bash
cd frontend
npm run e2e # This will open the Cypress Test Runner
```
Select the E2E tests to run.

### Performance Tests (Backend - Simulated Load)

Make sure your Docker services are running (`docker compose up -d`).
Navigate to the `backend` directory and run:

```bash
cd backend
jest tests/performance/metric.ingest.perf.test.ts
```
This will run a basic load test on the metric ingestion endpoint.

## Project Structure

```
appinsight/
├── backend/                  # Node.js (Express.js, TypeScript) API
│   ├── src/                  # Source code for the backend
│   │   ├── api/              # API routes, controllers, services (auth, projects, metrics)
│   │   ├── config/           # Configuration files
│   │   ├── database/         # Prisma client, Redis client setup
│   │   ├── middleware/       # Express middleware (auth, error, logger, rate-limit, health)
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions (logger)
│   │   ├── types/            # TypeScript declaration files
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server entry point
│   ├── prisma/               # Prisma schema, migrations, seed script
│   ├── tests/                # Jest tests (unit, integration, api, performance)
│   ├── .env.example          # Example environment variables
│   ├── Dockerfile            # Dockerfile for backend service
│   ├── package.json          # Backend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── frontend/                 # React (TypeScript) SPA
│   ├── public/               # Public assets
│   ├── src/                  # Source code for the frontend
│   │   ├── api/              # Axios API client
│   │   ├── assets/           # Images, icons
│   │   ├── components/       # Reusable UI components (common, layout, charts, project)
│   │   ├── contexts/         # React Contexts (Auth, Toast)
│   │   ├── hooks/            # Custom React Hooks (useAuth, useProjects, useMetrics)
│   │   ├── pages/            # Application pages (Login, Register, Dashboard, Project details)
│   │   ├── styles/           # Tailwind CSS directives
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # React entry point
│   ├── tests/                # Jest tests (unit, hooks, pages)
│   ├── cypress/              # Cypress E2E tests
│   ├── .env.example          # Example environment variables
│   ├── Dockerfile            # Dockerfile for frontend service (Nginx)
│   ├── package.json          # Frontend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── docker-compose.yml        # Orchestrates all Docker services
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml          # CI/CD pipeline definition
├── docs/                     # Comprehensive project documentation
│   ├── architecture.md       # High-level system architecture
│   ├── api.md                # Detailed API endpoint documentation
│   └── deployment.md         # Guide for deployment to a production environment
└── README.md                 # Project overview and setup instructions (this file)
```

## Documentation

*   **[Architecture Documentation](docs/architecture.md)**
*   **[API Documentation](docs/api.md)**
*   **[Deployment Guide](docs/deployment.md)**

## Contributing

Contributions are welcome! Please follow standard GitHub flow: fork the repository, create a branch, commit your changes, and open a pull request.

## License

This project is open-source and available under the [ISC License](LICENSE).
```