# Enterprise-Grade Content Management System (CMS)

This project provides a comprehensive, production-ready full-stack Content Management System (CMS) built with modern web technologies. It's designed for scalability, maintainability, and security, fulfilling requirements for enterprise-level applications.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (without Docker)](#local-development-without-docker)
    *   [Local Development (with Docker Compose)](#local-development-with-docker-compose)
    *   [Database Migrations and Seeding](#database-migrations-and-seeding)
5.  [Running Tests](#running-tests)
6.  [API Documentation](#api-documentation)
7.  [Architecture](#architecture)
8.  [Deployment Guide](#deployment-guide)
9.  [Contribution](#contribution)
10. [License](#license)

## 1. Features

*   **Content Management:** Full CRUD operations for Posts/Articles, Categories, and Tags.
*   **User Management:** Register, Login, User roles (Admin, Editor, Viewer).
*   **Authentication & Authorization:** JWT-based authentication with Role-Based Access Control (RBAC).
*   **Database Layer:** PostgreSQL with TypeORM for robust data modeling and migrations.
*   **API Endpoints:** RESTful API with data validation.
*   **Error Handling:** Centralized error handling middleware with custom exceptions.
*   **Logging:** Structured logging using Winston for better observability.
*   **Caching:** Redis integration for API response caching to improve performance.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Frontend:** Responsive UI built with React.js, TypeScript, and TailwindCSS.
*   **Dockerization:** Containerized backend, frontend, database, and Redis services.
*   **CI/CD:** Example GitHub Actions workflow for automated testing and deployment.
*   **Testing:** Comprehensive unit, integration, and API tests.
*   **Documentation:** Detailed README, API docs, Architecture overview, and Deployment guide.

## 2. Technology Stack

### Backend
*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Authentication:** JSON Web Tokens (JWT), bcryptjs
*   **Validation:** class-validator, class-transformer
*   **Logging:** Winston, winston-daily-rotate-file
*   **Caching:** Redis (via `ioredis`)
*   **Rate Limiting:** express-rate-limit
*   **Security:** Helmet, CORS
*   **Testing:** Jest, Supertest

### Frontend
*   **Language:** TypeScript
*   **Framework:** React.js
*   **Routing:** React Router DOM
*   **State Management:** React Context API (simple for this scale)
*   **Styling:** TailwindCSS
*   **Form Management:** Formik, Yup
*   **HTTP Client:** Axios
*   **Testing:** Jest, React Testing Library, user-event

### DevOps
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions

## 3. Project Structure

```
cms-project/
├── backend/                  # Node.js Express API
│   ├── src/                  # Source code for the backend
│   │   ├── config/           # Environment variables, logger, Redis config
│   │   ├── database/         # TypeORM migrations and seeders
│   │   ├── entities/         # Database entities (User, Role, Content, Category, Tag, Media)
│   │   ├── middlewares/      # Express middleware (auth, error, logging, caching, rate limiting)
│   │   ├── modules/          # Feature-specific modules (auth, users, roles, content, categories, tags)
│   │   ├── types/            # Custom TypeScript type definitions
│   │   ├── utils/            # Utility functions (auth, validation)
│   │   ├── app.ts            # Express application setup
│   │   ├── server.ts         # Server entry point, DB connection
│   │   └── data-source.ts    # TypeORM data source configuration
│   ├── tests/                # Backend unit and integration tests
│   ├── .env.example          # Example environment variables
│   ├── package.json          # Backend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration for backend
│   └── Dockerfile            # Dockerfile for backend service
├── frontend/                 # React.js application
│   ├── public/               # Static assets
│   ├── src/                  # Source code for the frontend
│   │   ├── api/              # Axios instance and API service calls
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # Generic UI elements (Button, Input)
│   │   ├── contexts/         # React Context for global state (e.g., AuthContext)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Layout components for different page structures
│   │   ├── pages/            # Page-level components (Login, Dashboard, Content Management)
│   │   ├── styles/           # TailwindCSS configuration and global styles
│   │   ├── types/            # Custom TypeScript type definitions for frontend
│   │   ├── App.tsx           # Main application component, routing setup
│   │   ├── index.css         # TailwindCSS output
│   │   └── main.tsx          # React app entry point
│   ├── tests/                # Frontend unit tests
│   ├── .env.example          # Example environment variables for frontend build
│   ├── package.json          # Frontend dependencies and scripts
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── tsconfig.json         # TypeScript configuration for frontend
│   └── Dockerfile            # Dockerfile for frontend service (Nginx)
├── docker-compose.yml        # Docker Compose file to orchestrate services
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml          # CI/CD pipeline definition
├── .gitignore                # Git ignore rules
├── README.md                 # Project README (this file)
├── ARCHITECTURE.md           # High-level architecture overview
├── API_DOCS.md               # API endpoint documentation
└── DEPLOYMENT.md             # Guide for deploying the application
```

## 4. Setup and Installation

### Prerequisites

*   **Node.js:** v20.x or higher
*   **npm:** v9.x or higher
*   **Docker & Docker Compose:** Latest versions (for containerized setup)
*   **PostgreSQL:** (Optional, if not using Docker for DB)
*   **Redis:** (Optional, if not using Docker for Redis)

### Local Development (without Docker)

If you prefer to run the backend and frontend directly on your host machine and manage PostgreSQL/Redis separately, follow these steps:

#### 4.1. Backend Setup

1.  **Navigate to backend directory:**
    ```bash
    cd cms-project/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:** Copy `backend/.env.example` to `backend/.env` and update database credentials, JWT secrets, and Redis connection if they differ from defaults. Ensure `DB_HOST` is `localhost` if running Postgres locally.
    ```bash
    cp .env.example .env
    ```
4.  **Database:** Ensure a PostgreSQL database is running and accessible (e.g., `postgres` image via Docker, or local install). Update `.env` with correct credentials.
5.  **Redis:** Ensure a Redis instance is running and accessible. Update `.env` with correct host/port.
6.  **Run Migrations:**
    ```bash
    npm run migration:run
    ```
7.  **Seed Database (Optional, for initial data):**
    ```bash
    npm run seed:run
    ```
8.  **Start Backend:**
    ```bash
    npm run dev # For development with hot-reloading
    # or
    npm run build && npm start # For production build
    ```
    The backend API will be available at `http://localhost:5000`.

#### 4.2. Frontend Setup

1.  **Navigate to frontend directory:**
    ```bash
    cd cms-project/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:** Copy `frontend/.env.example` to `frontend/.env` and ensure `REACT_APP_API_BASE_URL` points to your backend (e.g., `http://localhost:5000/api`).
    ```bash
    cp .env.example .env
    ```
4.  **Start Frontend:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`.

### Local Development (with Docker Compose) - **Recommended**

This is the easiest way to get all services (backend, frontend, PostgreSQL, Redis) running with minimal host setup.

1.  **Navigate to the root project directory:**
    ```bash
    cd cms-project
    ```
2.  **Create `.env` file:** Copy `backend/.env.example` to `cms-project/.env` (in the root directory). Docker Compose will automatically pick up these variables.
    ```bash
    cp backend/.env.example ./.env
    # Adjust FRONTEND_URL if needed (e.g., http://localhost:3000)
    # Ensure DB_HOST=db and REDIS_HOST=redis as per docker-compose.yml
    # Add REACT_APP_API_BASE_URL=http://localhost:5000/api for the frontend
    ```
    Example `.env` content for the root:
    ```ini
    # .env for docker-compose
    NODE_ENV=development
    PORT=5000
    FRONTEND_URL=http://localhost:3000

    DB_HOST=db
    DB_PORT=5432
    DB_USERNAME=cmsuser
    DB_PASSWORD=cmspassword
    DB_DATABASE=cms_db

    JWT_SECRET=supersecretjwtkey
    JWT_EXPIRES_IN=1h
    JWT_REFRESH_SECRET=anothersupersecretjwtkey
    JWT_REFRESH_EXPIRES_IN=7d

    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_TTL_SECONDS=3600

    LOG_LEVEL=info

    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```

3.  **Build and Start Services:**
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Rebuilds images (useful after code changes). Remove on subsequent runs if no Dockerfile/code changes.
    *   `-d`: Runs containers in detached mode (in the background).

4.  **Verify Services:**
    ```bash
    docker compose ps
    ```
    You should see `cms_db`, `cms_redis`, `cms_backend`, and `cms_frontend` running.

5.  **Access:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api`

### Database Migrations and Seeding (for Docker Compose)

After `docker compose up -d`, the database container will be running. You need to run migrations and seeding from the `backend` service.

1.  **Run Migrations:**
    ```bash
    docker compose exec backend npm run migration:run
    ```
2.  **Seed Database (Optional):**
    ```bash
    docker compose exec backend npm run seed:run
    ```
    This will create default roles (`admin`, `editor`, `viewer`), users (`admin@example.com`/`AdminPass123!`, `editor@example.com`/`EditorPass123!`), categories, and some sample content.

## 5. Running Tests

### Backend Tests

1.  **Navigate to backend directory:**
    ```bash
    cd cms-project/backend
    ```
2.  **Run all tests (unit & integration) with coverage:**
    ```bash
    npm test -- --coverage
    ```
    Jest is configured to connect to the PostgreSQL database specified in `backend/.env` (or Docker `db` service) for integration tests, and uses a `setupTests.ts` to clear data between tests.

### Frontend Tests

1.  **Navigate to frontend directory:**
    ```bash
    cd cms-project/frontend
    ```
2.  **Run all unit tests with coverage:**
    ```bash
    npm test -- --coverage
    ```

## 6. API Documentation

See [API_DOCS.md](API_DOCS.md) for detailed information on all available API endpoints, request/response formats, and authentication requirements.

## 7. Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for a high-level overview of the system's architecture, including diagrams and design considerations.

## 8. Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying this CMS to a production environment, including considerations for cloud platforms and continuous delivery.

## 9. Contribution

Contributions are welcome! Please follow the standard GitHub flow: fork the repository, create a feature branch, commit your changes, and open a pull request.

## 10. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```

#### **5.2 `ARCHITECTURE.md`**

```markdown