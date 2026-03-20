# Enterprise-Grade Authentication System

This project is a comprehensive, production-ready full-stack authentication system built with TypeScript, Node.js (Express), React, and PostgreSQL. It includes a robust set of features for user management, security, and developer experience.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Setup & Installation](#setup--installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (without Docker)](#local-development-without-docker)
    *   [Local Development (with Docker Compose)](#local-development-with-docker-compose)
    *   [Database Migrations](#database-migrations)
    *   [Running Tests](#running-tests)
    *   [Running Performance Tests](#running-performance-tests)
5.  [API Documentation](#api-documentation)
6.  [Deployment Guide](#deployment-guide)
7.  [CI/CD Configuration](#cicd-configuration)
8.  [Additional Features Explained](#additional-features-explained)
9.  [Project Structure](#project-structure)
10. [Future Enhancements](#future-enhancements)
11. [Contributing](#contributing)
12. [License](#license)

---

## 1. Features

### Core Authentication
*   User Registration (Email & Password)
*   User Login (Email & Password)
*   JWT-based Access Tokens for API Authorization
*   Refresh Token mechanism (with rotation and revocation) for extended sessions
*   Secure Password Hashing (bcryptjs)
*   Forgot Password & Reset Password flow (placeholder for email sending)
*   Role-Based Access Control (RBAC) - `user` and `admin` roles
*   Logout functionality

### Security
*   Password Hashing (bcryptjs)
*   JWT & Refresh Token security best practices
*   CORS Configuration
*   Helmet for HTTP header security
*   HPP for HTTP Parameter Pollution protection
*   Compression for faster payload transfer
*   Rate Limiting for API endpoints (protects against brute-force and DoS)
*   HTTP-only cookies for Refresh Tokens

### Data Management
*   PostgreSQL Database
*   TypeORM as ORM (Object-Relational Mapper)
*   Database Migrations for schema evolution
*   Clear schema definitions for User and RefreshToken entities

### Developer Experience & Operations
*   Comprehensive Logging (Winston)
*   Centralized Error Handling Middleware
*   Request Validation (class-validator, class-transformer)
*   Docker & Docker Compose setup for easy local environment
*   CI/CD pipeline configuration (GitHub Actions)
*   Unit, Integration, and API Tests (Jest, Supertest, React Testing Library)
*   Performance Tests (K6)
*   Detailed Documentation (README, API, Architecture, Deployment)

### Frontend (React)
*   User-friendly Login & Registration UI
*   Protected Routes based on authentication status and user roles
*   Authentication Context/Hooks for global state management
*   API Integration with Axios, including interceptors for token refreshing
*   Basic Dashboard and Profile views

## 2. Architecture

The system follows a layered, client-server architecture:

*   **Client (Frontend):** A React application that provides the user interface. It interacts with the backend API to perform authentication and access protected resources.
*   **Server (Backend):** A Node.js (Express) application written in TypeScript. It handles API requests, business logic, authentication, authorization, and interacts with the database.
*   **Database:** PostgreSQL stores user information and refresh tokens.

### Key Architectural Decisions:
*   **Separation of Concerns:** Clearly defined layers for controllers, services, entities, and middleware.
*   **Stateless Access Tokens:** JWTs for access tokens ensure scalability and reduce server load.
*   **Stateful Refresh Tokens:** Refresh tokens are stored in the database, allowing for revocation and improved security.
*   **HTTP-only Cookies:** Refresh tokens are sent via HTTP-only cookies to mitigate XSS attacks.
*   **Environment-based Configuration:** Utilizes `.env` files for flexible configuration.
*   **Containerization:** Docker for consistent development and deployment environments.

[See `docs/architecture.md` for a more detailed architecture overview.]

## 3. Technology Stack

### Backend
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **ORM:** TypeORM
*   **Database:** PostgreSQL
*   **Auth:** JSON Web Tokens (JWT), bcryptjs
*   **Validation:** class-validator, class-transformer
*   **Logging:** Winston
*   **Security:** Helmet, HPP, express-rate-limit
*   **Testing:** Jest, Supertest

### Frontend
*   **Framework:** React
*   **Language:** TypeScript
*   **State Management:** React Context API, Custom Hooks
*   **Styling:** Pure CSS (modular components)
*   **API Client:** Axios
*   **Routing:** React Router DOM
*   **Testing:** React Testing Library, Jest

### DevOps & Tools
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Performance Testing:** K6
*   **Version Control:** Git

## 4. Setup & Installation

### Prerequisites

*   Node.js (v18+) & npm (or yarn)
*   Docker & Docker Compose (optional, but recommended for easy setup)
*   Git

### Local Development (without Docker)

#### Backend
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/authentication-system.git
    cd authentication-system/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:**
    Copy `backend/.env.example` to `backend/.env` and fill in the values.
    ```bash
    cp .env.example .env
    ```
    *   **Note:** You'll need a running PostgreSQL instance. You can set it up manually or use Docker Compose just for the database (see `docker-compose.yml` for `database` service).
4.  **Run migrations:**
    ```bash
    npm run migrate
    ```
5.  **Start the backend server in development mode:**
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:5000` (or your specified `PORT`).

#### Frontend
1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env.local` file:**
    Copy `frontend/.env.local.example` to `frontend/.env.local` and fill in the values.
    ```bash
    cp .env.local.example .env.local
    ```
    Ensure `REACT_APP_API_BASE_URL` points to your backend.
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The app will open in your browser at `http://localhost:3000`.

### Local Development (with Docker Compose)

This is the recommended way to set up the entire environment quickly.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/authentication-system.git
    cd authentication-system
    ```
2.  **Create `.env` files:**
    *   Copy `backend/.env.example` to `backend/.env`.
    *   Copy `frontend/.env.local.example` to `frontend/.env.local`.
    *   **Important:** In `backend/.env`, set `DB_HOST=database` (this is the service name in `docker-compose.yml`).
    *   **Important:** In `frontend/.env.local`, set `REACT_APP_API_BASE_URL=http://localhost:3000/api/v1` (Frontend Nginx will proxy to backend).
3.  **Build and start services:**
    ```bash
    docker-compose -f docker/docker-compose.yml up --build
    ```
    *   This will build the Docker images for backend and frontend, start PostgreSQL, and run the applications.
    *   The frontend will be accessible at `http://localhost:3000`.
    *   The backend API will be proxied via the frontend's Nginx on `http://localhost:3000/api/v1`.
4.  **Run migrations inside the backend container:**
    In a separate terminal:
    ```bash
    docker exec -it auth_backend npm run migrate
    ```
    *(Note: `auth_backend` is the `container_name` from `docker-compose.yml`)*

### Database Migrations

After setting up the backend (either locally or with Docker):

*   **Run all pending migrations:**
    ```bash
    cd backend
    npm run migrate
    ```
*   **Create a new migration (if schema changes):**
    ```bash
    cd backend
    npm run migration:create -- --name=YourMigrationName
    ```
    Then edit the generated file in `src/migrations/`.
*   **Revert the last migration:**
    ```bash
    cd backend
    npm run migrate:revert
    ```

### Running Tests

#### Backend Tests
```bash
cd backend
npm test
# For watch mode:
# npm run test:watch
```
This will run unit and integration tests using Jest and ts-jest, reporting coverage.

#### Frontend Tests
```bash
cd frontend
npm test
```
This will run component tests using React Testing Library and Jest.

### Running Performance Tests

You need `k6` installed on your machine.
1.  **Install k6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Start your backend and frontend (if not already running via Docker Compose).**
3.  **Run the test:**
    ```bash
    cd performance-tests
    k6 run load-test.js
    ```
    You can adjust `BASE_URL` in `load-test.js` if your setup differs.

## 5. API Documentation

The API endpoints are documented in `docs/api.md`. It provides a simplified OpenAPI-like specification.

[Link to `docs/api.md`](docs/api.md)

## 6. Deployment Guide

A high-level guide for deploying this application to a production environment.

[Link to `docs/deployment.md`](docs/deployment.md)

## 7. CI/CD Configuration

The project includes a basic CI/CD pipeline using GitHub Actions.
It performs linting, building, and testing for both backend and frontend on push events to `main` and pull requests.

[Link to `.github/workflows/ci.yml`](.github/workflows/ci.yml)

## 8. Additional Features Explained

*   **Authentication/Authorization:**
    *   **JWT Access Tokens:** Short-lived tokens sent in `Authorization: Bearer <token>` header for stateless authentication of API requests.
    *   **Refresh Tokens:** Long-lived tokens used to obtain new access tokens without requiring re-login. Stored in secure HTTP-only cookies and in the database for server-side revocation.
    *   **Token Rotation:** Each time a refresh token is used, a new one is issued, and the old one is immediately revoked. This enhances security against token reuse.
    *   **Role-Based Access Control (RBAC):** Middleware (`authorize`) checks the user's role (extracted from the JWT payload) against a list of allowed roles for a given route.
*   **Logging and Monitoring:**
    *   **Winston:** Configured for structured logging, supporting different log levels (`debug`, `info`, `warn`, `error`). Logs are sent to the console by default but can be extended to file transports, external log management systems, etc.
    *   **Morgan:** HTTP request logging for development (`dev` format) and production (`combined` format).
*   **Error Handling Middleware:**
    *   A centralized `errorHandler` captures all errors, logs them, and sends a consistent JSON error response to the client.
    *   Distinguishes between operational errors (e.g., `BadRequestError`, `NotFoundError`) and programming errors (unhandled exceptions).
*   **Caching Layer:** (Conceptual) While a full Redis caching layer isn't implemented for this core auth system, the `express-rate-limit` package internally uses a memory store (or can be configured for Redis/Memcached) for IP-based rate limiting, which is a form of caching. For application-level data caching (e.g., user profiles), Redis would be integrated into the `services` layer.
*   **Rate Limiting:**
    *   `express-rate-limit` middleware is used to prevent brute-force attacks and abuse.
    *   `apiRateLimiter` applies a general limit to all API endpoints.
    *   `authRateLimiter` applies a stricter limit to sensitive authentication endpoints (`/login`, `/register`, `/forgot-password`, `/refresh-token`).

## 9. Project Structure

Refer to the high-level project structure described at the beginning of this document. Each folder is designed to hold specific types of code, promoting modularity and maintainability.

## 10. Future Enhancements

*   **Email Verification:** Implement sending actual verification emails.
*   **Multi-Factor Authentication (MFA):** Integrate with OTP or authenticator apps.
*   **Social Logins:** Add support for Google, Facebook, etc.
*   **Audit Logging:** Track significant user actions (login, password change, etc.) in a dedicated audit log.
*   **Input Sanitization:** Add a middleware for sanitizing request bodies, query params, etc., to prevent injection attacks (e.g., `express-mongo-sanitize` for Mongo, or custom for SQL).
*   **Admin Panel:** Develop a more comprehensive admin UI for managing users and roles.
*   **Frontend UI/UX:** Enhance styling, add animations, and improve user feedback.
*   **WebSockets:** For real-time notifications (e.g., "new login detected").
*   **Database Seeding:** Scripts to populate the database with initial users/data for development/testing.

## 11. Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test` in both backend/frontend).
6.  Commit your changes (`git commit -m 'feat: Add new feature'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Open a Pull Request.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details (not included in this response, but would be in a real project).