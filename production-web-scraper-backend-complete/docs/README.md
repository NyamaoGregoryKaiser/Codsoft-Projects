# Web Scraping Tools System

A comprehensive, production-ready web scraping platform built with Node.js, React.js, PostgreSQL, Redis, BullMQ, and Puppeteer. This system allows users to define scraping targets, schedule jobs, and collect/view scraped data through an intuitive web interface.

## Table of Contents

1.  [Features](#features)
2.  [Technologies Used](#technologies-used)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (Docker Compose)](#local-development-docker-compose)
    *   [Manual Setup (Without Docker)](#manual-setup-without-docker)
5.  [Running the Application](#running-the-application)
6.  [Database Management](#database-management)
7.  [Testing](#testing)
8.  [API Documentation](#api-documentation)
9.  [Architecture Documentation](#architecture-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Additional Features](#additional-features)
12. [Contributing](#contributing)
13. [License](#license)

## 1. Features

*   **Target Management:** Define web scraping targets with URLs, CSS selectors, and scheduling options.
*   **Scraping Engine:** Utilizes Puppeteer for headless browser scraping, capable of handling dynamic content and JavaScript-rendered pages.
*   **Job Scheduling & Processing:** Leverages BullMQ for robust, distributed job queuing and processing, allowing for scalable and fault-tolerant scraping tasks.
*   **Data Storage:** Stores scraped data flexibly using PostgreSQL's JSONB column type.
*   **User Management & Authentication:** Secure authentication with JWT, role-based authorization (Admin/User).
*   **API:** RESTful API with full CRUD operations for targets, jobs, and scraped data.
*   **Caching:** Redis-backed caching for frequently accessed data to improve performance.
*   **Rate Limiting:** Protects the API from abuse.
*   **Logging & Monitoring:** Centralized logging with Winston.
*   **Error Handling:** Robust error handling middleware.
*   **Containerization:** Docker for easy setup and deployment.
*   **CI/CD:** Example GitHub Actions workflow.
*   **Comprehensive Testing:** Unit, Integration, and API tests.
*   **User Interface:** Intuitive React.js frontend for managing the system.

## 2. Technologies Used

*   **Backend:** Node.js, Express.js
*   **Frontend:** React.js, Axios, React Router
*   **Database:** PostgreSQL (via Sequelize ORM)
*   **Queue/Cache:** Redis (via BullMQ and `connect-redis`)
*   **Scraping:** Puppeteer
*   **Authentication:** JSON Web Tokens (JWT), Bcrypt
*   **Testing:** Jest, Supertest
*   **Logging:** Winston
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions

## 3. Project Structure

```
.
├── backend/                  # Node.js/Express.js API and scraping logic
│   ├── src/                  # Source code
│   ├── tests/                # Jest tests
│   ├── .env.example          # Environment variables
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # React.js web interface
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml        # Docker setup for all services
├── .github/                  # GitHub Actions CI/CD workflows
├── docs/                     # Project documentation
└── package.json              # Root (optional, for workspaces)
```

## 4. Setup and Installation

### Prerequisites

*   Node.js (v18+) & npm (v8+)
*   Docker & Docker Compose (recommended)
*   PostgreSQL (if not using Docker)
*   Redis (if not using Docker)

### Local Development (Docker Compose - Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/web-scraping-tools.git
    cd web-scraping-tools
    ```

2.  **Create `.env` files:**
    Copy the example environment files for both backend and frontend:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    Edit `backend/.env` and `frontend/.env` to configure your environment variables. Ensure `REACT_APP_API_BASE_URL` in `frontend/.env` points to your backend: `http://localhost:5000/api`.

3.  **Build and run services:**
    This will build the Docker images, start PostgreSQL, Redis, the backend API, and the frontend web server.
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs containers in detached mode. To see logs, use `docker-compose logs -f`.

4.  **Run Migrations and Seeders (if not handled by Docker Compose command):**
    The `docker-compose.yml` is configured to run migrations and seeders automatically for the `backend` service's initial startup. If you need to run them manually or for specific environments:
    ```bash
    docker exec backend_app npx sequelize-cli db:migrate
    docker exec backend_app npx sequelize-cli db:seed:all
    ```

### Manual Setup (Without Docker)

#### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:**
    Copy `backend/.env.example` to `backend/.env` and configure your PostgreSQL and Redis connections, JWT secret, etc.
    ```bash
    cp .env.example .env
    ```
4.  **Start PostgreSQL and Redis:**
    Ensure your PostgreSQL and Redis servers are running and accessible as configured in `backend/.env`.
5.  **Run Database Migrations and Seeders:**
    ```bash
    npx sequelize-cli db:create # Only if database doesn't exist
    npx sequelize-cli db:migrate
    npx sequelize-cli db:seed:all
    ```
6.  **Start the backend server:**
    ```bash
    npm run dev # For development with nodemon
    # npm start # For production
    ```
    The backend will be running on `http://localhost:5000` (or your specified `PORT`).

#### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:**
    Copy `frontend/.env.example` to `frontend/.env`. Set `REACT_APP_API_BASE_URL` to your backend URL (e.g., `http://localhost:5000/api`).
    ```bash
    cp .env.example .env
    ```
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will be running on `http://localhost:3000` (or a different port if 3000 is taken).

## 5. Running the Application

*   **Access the Frontend:** Open your browser and navigate to `http://localhost:3000`.
*   **Login:**
    *   **Admin:** `admin@example.com` / `adminpassword`
    *   **User:** `user@example.com` / `userpassword`
*   **API Endpoints:** The backend API is available at `http://localhost:5000/api`. Refer to the [API Documentation](#8-api-documentation) for details.

## 6. Database Management

*   **Migrations:**
    *   Generate a new migration: `npx sequelize-cli migration:generate --name your_migration_name`
    *   Run migrations: `npx sequelize-cli db:migrate`
    *   Undo last migration: `npx sequelize-cli db:migrate:undo`
*   **Seeders:**
    *   Generate a new seeder: `npx sequelize-cli seed:generate --name your_seeder_name`
    *   Run all seeders: `npx sequelize-cli db:seed:all`
    *   Undo all seeders: `npx sequelize-cli db:seed:undo:all` (use with caution)
*   **Reset Database (Development Only):**
    ```bash
    # From backend directory (local setup):
    npm run db:reset
    # From project root (Docker setup, ensure containers are running):
    docker exec backend_app npm run db:reset
    ```

## 7. Testing

*   **Backend Tests (Unit, Integration, API):**
    Navigate to the `backend` directory and run:
    ```bash
    npm test
    # Or to run with watch mode:
    npm run test:watch
    ```
    Tests use Jest and Supertest, connecting to a separate test database (`scraping_db_test`).

*   **Frontend Tests:**
    Navigate to the `frontend` directory and run:
    ```bash
    npm test
    ```
    Frontend tests are basic React component tests using React Testing Library.

*   **Performance Tests:**
    (Requires external tools like k6, JMeter, Artillery - not included in this codebase.)
    *   **Recommendation:** Use k6 to write JavaScript-based load test scripts that hit your API endpoints.
    *   Define scenarios for concurrent users, request rates, and duration.
    *   Monitor backend resource usage during tests.

## 8. API Documentation

See [API.md](API.md) for a list of all available API endpoints, request/response formats, and authentication requirements.

## 9. Architecture Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed overview of the system's design, components, and technology choices.

## 10. Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions and considerations on deploying this application to production environments.

## 11. Additional Features

*   **Authentication/Authorization:** JWT-based authentication. Role-based access control (RBAC) implemented with `admin` and `user` roles.
*   **Logging:** Centralized logging with `Winston` for structured logs across the backend.
*   **Error Handling:** Custom `ApiError` class and Express error handling middleware for consistent error responses.
*   **Caching:** Redis-backed caching middleware for GET requests on specific routes (e.g., `/targets`, `/scraped-data`) to reduce database load.
*   **Rate Limiting:** `express-rate-limit` middleware with a Redis store to prevent API abuse.
*   **Scalable Job Processing:** BullMQ for a robust and distributed job queue, enabling independent scaling of workers.

## 12. Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 13. License

This project is licensed under the MIT License.
```