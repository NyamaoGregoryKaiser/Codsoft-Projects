# DB Health Monitor & Optimizer

A comprehensive, production-ready system for monitoring, analyzing, and optimizing PostgreSQL database performance. This full-stack application provides a dashboard to track key metrics, identifies potential bottlenecks, and generates actionable recommendations to improve database health and efficiency.

## Table of Contents

1.  [Features](#features)
2.  [Core Technologies](#core-technologies)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
    *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
    *   [Running Locally (Backend & Frontend Separately)](#running-locally-backend--frontend-separately)
5.  [Database Management](#database-management)
    *   [Migrations](#migrations)
    *   [Seeds](#seeds)
6.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (k6)](#performance-tests-k6)
7.  [API Documentation](#api-documentation)
8.  [Architecture](#architecture)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

*   **Secure Database Connection Management:** Add, update, and delete connection details for target PostgreSQL databases. Passwords are encrypted at rest.
*   **Automated Monitoring:** Scheduled background jobs collect metrics from target databases (connection stats, slow queries, index usage, table sizes, database size).
*   **Intelligent Analysis Engine:** Processes collected metrics to identify performance issues and anti-patterns.
*   **Actionable Recommendations:** Generates prioritized suggestions (e.g., create missing indexes, drop unused indexes, optimize slow queries, address high idle connections).
*   **Interactive Dashboard:** Visualize current database health and historical performance trends.
*   **User Authentication & Authorization:** Secure JWT-based authentication for user login and access control.
*   **Caching Layer:** Redis used for API response caching to improve dashboard load times.
*   **Background Job Queue:** `BullMQ` with Redis for reliable and scalable scheduling of monitoring tasks.
*   **Robust Logging & Error Handling:** Centralized logging with Winston and custom error handling middleware.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Containerization:** Dockerized backend and frontend for easy setup and deployment.
*   **CI/CD Integration:** Basic GitHub Actions workflow for automated testing.

## 2. Core Technologies

*   **Backend:** Node.js, Express, PostgreSQL (for system data), Knex.js, BullMQ, Redis, Bcrypt, JSON Web Tokens, Winston, Joi.
*   **Frontend:** React, React Router, Axios, Chart.js.
*   **Monitored DB:** PostgreSQL (focus for this implementation).
*   **Tooling:** Docker, Jest, Supertest, k6.

## 3. Project Structure

```
.
├── backend                 # Node.js Express API
│   ├── src
│   │   ├── config          # Environment configuration, logger
│   │   ├── db              # Knex migrations, seeds, DB connection
│   │   ├── middleware      # Auth, error handling, rate limiting
│   │   ├── models          # Knex models for DB entities
│   │   ├── services        # Business logic, DB interactions, external DB monitoring
│   │   ├── jobs            # BullMQ queue and worker definitions
│   │   ├── controllers     # Request handling, orchestrates services
│   │   ├── routes          # API endpoints
│   │   ├── utils           # JWT, bcrypt, encryption, validation, custom errors
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── tests               # Unit, Integration, API tests
│   ├── package.json
│   ├── knexfile.js
│   ├── Dockerfile
│   └── .env.example
├── frontend                # React Single Page Application
│   ├── public
│   ├── src
│   │   ├── api             # API service layer (Axios)
│   │   ├── assets
│   │   ├── components      # Reusable UI components
│   │   ├── contexts        # React Context for global state (e.g., Auth)
│   │   ├── hooks           # Custom React hooks
│   │   ├── pages           # Page-level components
│   │   ├── styles
│   │   ├── App.js          # Main React application
│   │   └── index.js        # React entry point
│   ├── package.json
│   ├── Dockerfile
│   └── nginx               # Nginx configuration for production serving
├── .github                 # CI/CD workflows
│   └── workflows
│       └── main.yml
├── docker-compose.yml      # Docker orchestration
├── README.md               # This file
├── ARCHITECTURE.md         # Detailed architecture documentation
├── API_DOCS.md             # API endpoint documentation
├── DEPLOYMENT.md           # Deployment instructions
├── performance-test.js     # k6 performance test script
└── .gitignore
```

## 4. Setup and Installation

### Prerequisites

*   Node.js (v18 or higher) & npm
*   Docker & Docker Compose (recommended)
*   PostgreSQL (if running backend locally and not using Docker for its DB)
*   Redis (if running backend locally and not using Docker for Redis)

### Environment Variables

Create a `.env` file in the `backend/` directory by copying `backend/.env.example` and filling in the values.
**Important:** For `ENCRYPTION_KEY`, generate a truly random 32-byte (64 hex character) string in production. The example provided is for demonstration only.

```ini
# backend/.env
NODE_ENV=development
PORT=5000

# Database for the DB Health Monitor System (Backend's own DB)
DB_CLIENT=pg
DB_HOST=localhost # Use 'db_health_monitor_pg' if running with Docker Compose
DB_PORT=5432 # Use '5433' if running with Docker Compose to avoid conflicts
DB_USER=dbmonitor_user
DB_PASSWORD=dbmonitor_password
DB_NAME=dbmonitor_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here # CHANGE THIS IN PRODUCTION
JWT_EXPIRES_IN=1h

# Redis Configuration (for caching and BullMQ)
REDIS_HOST=localhost # Use 'redis' if running with Docker Compose
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Interval (in milliseconds)
MONITORING_INTERVAL_MS=300000 # 5 minutes

# Encryption Key (MUST BE 32 bytes / 64 hex chars for AES-256-CBC)
# Generate a secure key for production. This is an example.
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```
For the frontend, `REACT_APP_API_BASE_URL` in `frontend/.env.local` (or similar) should point to your backend. If using Docker Compose, it's set in `docker-compose.yml`.

### Running with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/db-health-monitor.git
    cd db-health-monitor
    ```
2.  **Create `.env` file:** Copy `backend/.env.example` to `backend/.env` and configure it.
3.  **Build and run the services:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build backend and frontend Docker images.
    *   Start a PostgreSQL database (`db_health_monitor_pg`).
    *   Start a Redis instance (`db_health_monitor_redis`).
    *   Start the backend service (`db_health_monitor_backend`).
    *   Run database migrations and seed initial data for the backend's database.
    *   Start the frontend service (`db_health_monitor_frontend`) served by Nginx.
4.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api`

    An initial admin user will be created:
    *   **Username:** `admin`
    *   **Password:** `adminpassword`

### Running Locally (Backend & Frontend Separately)

#### Backend Setup

1.  **Navigate to the `backend` directory:**
    ```bash
    cd db-health-monitor/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up PostgreSQL and Redis:**
    *   Ensure a PostgreSQL database is running (e.g., on `localhost:5432`) with the credentials specified in your `backend/.env` file.
    *   Ensure a Redis instance is running (e.g., on `localhost:6379`).
4.  **Run Migrations and Seeds:**
    ```bash
    npm run migrate:latest
    npm run seed:run
    ```
5.  **Start the backend server:**
    ```bash
    npm run dev # for development with nodemon
    # or
    npm start # for production build
    ```
    The backend API will be available at `http://localhost:5000/api`.

#### Frontend Setup

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd db-health-monitor/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API Base URL:**
    Create a `.env.local` file in the `frontend` directory:
    ```ini
    # frontend/.env.local
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend application will be available at `http://localhost:3000`.

## 5. Database Management (for the system's own database)

### Migrations

*   **Create a new migration:**
    ```bash
    cd backend
    npm run migrate:make <migration_name>
    ```
*   **Run all pending migrations:**
    ```bash
    cd backend
    npm run migrate:latest
    ```
*   **Rollback the last batch of migrations:**
    ```bash
    cd backend
    npm run migrate:rollback
    ```

### Seeds

*   **Create a new seed file:**
    ```bash
    cd backend
    npm run seed:make <seed_name>
    ```
*   **Run all seed files:**
    ```bash
    cd backend
    npm run seed:run
    ```
    *(Note: Seeding usually deletes existing data before inserting new, use with caution in production.)*

## 6. Testing

All tests are configured to run against an in-memory SQLite database for speed and isolation for the backend, and mocked API calls for the frontend.

### Backend Tests

Run all backend tests:
```bash
cd backend
npm test
```
This command runs unit, integration, and API tests.
*   `npm run test:unit`
*   `npm run test:integration`
*   `npm run test:api`

Coverage reports are generated (aiming for 80%+).

### Frontend Tests

Run frontend unit tests with coverage:
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Performance Tests (k6)

1.  **Install k6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Ensure backend is running.**
3.  **Run the performance test:**
    ```bash
    k6 run performance-test.js
    ```
    This script simulates user registration, login, and dashboard/connection data retrieval under load. It generates an HTML report (`result.html`) and prints a summary to the console.

## 7. API Documentation

Detailed API endpoints, request/response formats, and authentication requirements can be found in [API_DOCS.md](API_DOCS.md).

## 8. Architecture

A high-level overview of the system's architecture, including diagrams and component descriptions, is available in [ARCHITECTURE.md](ARCHITECTURE.md).

## 9. Deployment Guide

Instructions and considerations for deploying the application to production environments (e.g., using Docker Swarm, Kubernetes, or a VM) are provided in [DEPLOYMENT.md](DEPLOYMENT.md).

## 10. Future Enhancements

*   **Support for other Databases:** Extend `monitoring.service` and `analyzer.service` to support MySQL, SQL Server, MongoDB, etc.
*   **Advanced Analytics:** Implement more sophisticated anomaly detection, predictive analysis, and trend forecasting.
*   **User Roles & Permissions:** More granular role-based access control.
*   **Alerting & Notifications:** Integrate with email, Slack, PagerDuty for critical alerts.
*   **Query Explanations:** Integrate with `EXPLAIN ANALYZE` to show query plans directly.
*   **Schema Change Tracking:** Monitor DDL changes in target databases.
*   **Auto-remediation:** (With extreme caution) automatically apply minor recommendations (e.g., drop unused indexes).
*   **Terraform/Ansible:** Infrastructure as Code for cloud deployments.
*   **Frontend UI/UX Polish:** More interactive charts, better responsiveness, enhanced user flows.

## 11. License

This project is licensed under the ISC License. See the `LICENSE` file for details (not included in this response for brevity but would be in a real project).