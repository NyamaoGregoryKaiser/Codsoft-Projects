# Web Scraping Tools System

A comprehensive, production-ready web scraping tools system built with a Node.js/Express.js backend, React.js frontend, and PostgreSQL database. This full-stack application allows users to define, schedule, execute, and manage web scraping jobs, view results, and more.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Architecture](#architecture)
4.  [Setup and Local Development](#setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Running with Docker Compose](#running-with-docker-compose)
5.  [Database](#database)
6.  [Testing](#testing)
7.  [CI/CD](#cicd)
8.  [Documentation](#documentation)
9.  [Additional Features](#additional-features)
10. [Code Structure](#code-structure)
11. [Contribution](#contribution)
12. [License](#license)

## 1. Features

*   **User Authentication & Authorization:** Secure user registration, login (JWT), and role-based access control (User, Admin).
*   **Scraping Job Management:**
    *   Create, Read, Update, Delete (CRUD) scraping jobs.
    *   Define target URLs and multiple CSS selectors for data extraction.
    *   Schedule jobs using cron expressions.
    *   Manually trigger jobs.
*   **Scraping Execution:**
    *   Backend-driven scraping using Puppeteer (headless Chrome).
    *   Automatic execution based on schedule.
    *   Error handling during scraping, capturing failures.
*   **Data Storage:** Persist job definitions and scraped results in PostgreSQL.
*   **Result Viewing:** Browse historical scraping results for each job.
*   **API Endpoints:** Full RESTful API for all functionalities.
*   **Robust Error Handling:** Centralized error handling middleware.
*   **Logging:** Comprehensive logging using Winston.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Caching:** In-memory caching for performance optimization (e.g., user data).
*   **Docker Support:** Containerized setup for easy deployment.
*   **Testing:** Unit, integration, and API tests with Jest and Supertest.
*   **Comprehensive Documentation:** README, API, Architecture, Deployment guides.

## 2. Technology Stack

*   **Backend:**
    *   Node.js (v18+)
    *   Express.js
    *   Prisma ORM
    *   PostgreSQL
    *   Puppeteer
    *   JSON Web Tokens (JWT)
    *   Bcrypt
    *   `node-cron`
    *   `winston` (Logging)
    *   `joi` (Validation)
    *   `express-rate-limit`
    *   `node-cache` (Caching)
*   **Frontend:**
    *   React.js (v18+)
    *   React Router DOM
    *   Axios
    *   Basic CSS (or TailwindCSS for real projects)
*   **DevOps:**
    *   Docker, Docker Compose
    *   GitHub Actions (CI/CD)
*   **Testing:**
    *   Jest
    *   Supertest
    *   React Testing Library

## 3. Architecture

Refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the system's design, components, data flow, and security considerations.

## 4. Setup and Local Development

You can run the application either by setting up backend and frontend separately or using Docker Compose. Docker Compose is recommended for the quickest setup.

### Prerequisites

*   Node.js (v18+) and npm (or yarn)
*   Git
*   PostgreSQL (optional, if not using Docker Compose)
*   Docker and Docker Compose (recommended)

### Backend Setup (Without Docker)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd web-scraper-system/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Environment Variables:** Create a `.env` file in the `backend/` directory:
    ```env
    # Application Configuration
    PORT=5000
    NODE_ENV=development

    # Database Configuration (replace with your local PostgreSQL connection string)
    # Ensure the database `webscraperdb` exists
    DATABASE_URL="postgresql://user:password@localhost:5432/webscraperdb?schema=public"

    # JWT Configuration
    JWT_SECRET="your_jwt_secret_key_very_strong_and_long_random_string" # **CHANGE THIS!**
    JWT_EXPIRATION_TIME="1h"

    # Admin User Seed Data (for initial setup)
    ADMIN_EMAIL="admin@example.com"
    ADMIN_PASSWORD="adminpassword" # **CHANGE THIS IN PRODUCTION!**
    ```
4.  **Database Migrations & Seeding:**
    Ensure your PostgreSQL database is running and accessible.
    ```bash
    npx prisma migrate deploy # Applies all pending migrations
    npx prisma db seed        # Seeds initial data (e.g., admin user)
    ```
5.  **Start the Backend:**
    ```bash
    npm start
    # Or for development with hot-reloads:
    npm run dev
    ```
    The backend will run on `http://localhost:5000`.

### Frontend Setup (Without Docker)

1.  **Navigate to the frontend directory:**
    ```bash
    cd web-scraper-system/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Environment Variables:** Create a `.env` file in the `frontend/` directory:
    ```env
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
4.  **Start the Frontend:**
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

### Running with Docker Compose (Recommended)

This method sets up the backend, frontend, and PostgreSQL database with a single command.

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd web-scraper-system
    ```
2.  **Create `.env` files:**
    *   **`backend/.env`**:
        ```env
        # Application Configuration
        PORT=5000
        NODE_ENV=development

        # Database Configuration (points to the 'db' service in docker-compose.yml)
        DATABASE_URL="postgresql://user:password@db:5432/webscraperdb?schema=public"

        # JWT Configuration
        JWT_SECRET="your_jwt_secret_key_very_strong_and_long_random_string"
        JWT_EXPIRATION_TIME="1h"

        # Admin User Seed Data (for initial setup)
        ADMIN_EMAIL="admin@example.com"
        ADMIN_PASSWORD="adminpassword"
        ```
    *   **`frontend/.env`**:
        ```env
        REACT_APP_API_BASE_URL=http://localhost:5000/api
        ```
3.  **Build and Run Services:** From the project root (`web-scraper-system/`):
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Build Docker images for backend and frontend.
    *   Start PostgreSQL database.
    *   Run backend (which automatically applies migrations and seeds data).
    *   Run frontend.

4.  **Access the applications:**
    *   **Backend API:** `http://localhost:5000/api`
    *   **Frontend UI:** `http://localhost:3000`

5.  **Stop Services:**
    ```bash
    docker-compose down
    ```
    To remove volumes (database data), use:
    ```bash
    docker-compose down -v
    ```

## 5. Database

*   **PostgreSQL:** The chosen relational database.
*   **Prisma ORM:** Used for type-safe database access, schema definition, and migrations.
*   **Schema:** Defined in `backend/prisma/schema.prisma`.
*   **Migrations:** Managed via `npx prisma migrate`. The `docker-compose.yml` setup automatically applies migrations on backend startup.
*   **Seeding:** `backend/prisma/seed.ts` provides initial data, including an admin user.

## 6. Testing

The project includes unit, integration, and API tests.

*   **Backend Tests:**
    *   Run all backend tests:
        ```bash
        cd backend
        npm test
        ```
    *   Run tests with coverage report:
        ```bash
        npm test -- --coverage
        ```
        (Aims for 80%+ coverage on core logic)

*   **Frontend Tests:**
    *   Basic unit tests for components using React Testing Library.
    *   Run frontend tests:
        ```bash
        cd frontend
        npm test
        ```

## 7. CI/CD

A basic GitHub Actions workflow is configured for Continuous Integration.

*   **`.github/workflows/main.yml`**:
    *   Triggers on `push` and `pull_request` events to `main` branch.
    *   Installs dependencies for both backend and frontend.
    *   Runs backend tests.
    *   Lints both backend and frontend code.
    *   Builds the frontend application.
    *   *(Extend for Docker image builds, pushes to registry, and deployments in a real-world scenario).*

## 8. Documentation

*   **`README.md` (You are here):** Project overview, setup, usage.
*   **`ARCHITECTURE.md`:** Detailed system architecture, component breakdown, data flow, security.
*   **`API_DOCUMENTATION.md`:** Comprehensive API endpoint reference, request/response formats.
*   **`DEPLOYMENT.md`:** Guide for deploying the system, focusing on Docker Compose and production considerations.

## 9. Additional Features Implemented

*   **Authentication/Authorization:** JWT-based auth, `User` and `Admin` roles.
*   **Logging:** `winston` integrated for structured logging.
*   **Error Handling:** Centralized middleware for consistent API error responses.
*   **Caching Layer:** Simple in-memory caching (`node-cache`) for user data (demonstrative).
*   **Rate Limiting:** `express-rate-limit` applied to API routes.
*   **Input Validation:** `joi` schemas for robust request body validation.
*   **Scheduled Jobs:** `node-cron` for scheduling scraping tasks.

## 10. Code Structure

```
.
├── backend/
│   ├── src/
│   │   ├── api/             # API controllers and routes
│   │   ├── auth/            # Authentication logic and middleware
│   │   ├── config/          # Environment and application configuration
│   │   ├── database/        # Prisma client setup
│   │   ├── lib/             # Utility functions (e.g., helpers, validation schemas)
│   │   ├── middleware/      # Custom Express middleware (logging, errors, rate limit, cache)
│   │   ├── models/          # Prisma generated types and client
│   │   ├── scraper/         # Core scraping logic (Puppeteer, worker, scheduler)
│   │   ├── services/        # Business logic, interact with DB and scraper
│   │   ├── tests/           # Unit, integration, and API tests
│   │   └── app.ts           # Main Express application entry point
│   ├── prisma/              # Prisma schema, migrations, seed script
│   ├── .env                 # Backend environment variables
│   ├── package.json         # Backend dependencies and scripts
│   └── tsconfig.json        # TypeScript configuration
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── api/             # Frontend API client
│   │   ├── assets/          # Images, icons
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React Context for auth state
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page-level components (Login, Dashboard, JobDetails)
│   │   ├── App.js           # Main App component
│   │   ├── index.js         # Entry point for React app
│   │   └── index.css        # Global styles
│   ├── .env                 # Frontend environment variables
│   ├── package.json         # Frontend dependencies and scripts
│   └── jsconfig.json        # JavaScript configuration (or tsconfig.json for TypeScript)
├── docker-compose.yml       # Orchestrates all services
├── .github/                 # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml
├── ARCHITECTURE.md          # System architecture documentation
├── API_DOCUMENTATION.md     # API reference
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # Project README (this file)
```

## 11. Contribution

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test`).
6.  Ensure linting passes (`npm run lint`).
7.  Commit your changes (`git commit -m 'Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature-name`).
9.  Open a Pull Request.

## 12. License

This project is licensed under the MIT License. See the LICENSE file for details.
*(Note: A `LICENSE` file would be included in a real project).*