# Enterprise E-commerce Solution System

This is a comprehensive, production-ready E-commerce solution system built with a JavaScript full-stack approach (Node.js/Express.js backend, React.js frontend). It demonstrates best practices in architecture, development, testing, and deployment for an enterprise-grade application.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
5.  [Running Tests](#running-tests)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (k6)](#performance-tests-k6)
6.  [Documentation](#documentation)
    *   [API Documentation](#api-documentation)
    *   [Architecture Overview](#architecture-overview)
    *   [Deployment Guide](#deployment-guide)
7.  [CI/CD](#cicd)
8.  [Code Structure and Quality](#code-structure-and-quality)
9.  [Contributing](#contributing)
10. [License](#license)

## 1. Features

This system includes a wide range of features essential for a modern e-commerce platform:

*   **User Management**: Registration, Login, User Profiles.
*   **Authentication & Authorization**: JWT-based authentication, Role-Based Access Control (RBAC) for `user` and `admin` roles.
*   **Product Management**: CRUD operations for products, product listing with filters, search, and pagination.
*   **Category Management**: Products can be categorized.
*   **Shopping Cart**: Add, update, remove items (client-side for now, backend integration outlined).
*   **Order Management**: Place orders (conceptual), view user orders, admin view all orders and update status.
*   **API**: RESTful API with full CRUD operations.
*   **Error Handling**: Centralized error handling middleware.
*   **Logging & Monitoring**: Winston-based logging, structured logs.
*   **Caching**: Redis-based caching middleware for product listings.
*   **Rate Limiting**: Protects API endpoints from abuse.
*   **Data Validation**: Joi-based request body/query validation.
*   **Responsive UI**: Basic React frontend with Tailwind CSS.

## 2. Technology Stack

### Backend
*   **Runtime**: Node.js (v18+)
*   **Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM/Query Builder**: Knex.js
*   **Authentication**: JSON Web Tokens (JWT), Bcrypt.js
*   **Validation**: Joi
*   **Logging**: Winston
*   **Caching**: ioredis (Redis client)
*   **Rate Limiting**: express-rate-limit
*   **Security**: Helmet, CORS
*   **Environment**: Dotenv
*   **Testing**: Jest, Supertest

### Frontend
*   **Framework**: React.js (v18+)
*   **Routing**: React Router DOM
*   **State Management**: React Context API
*   **API Client**: Axios
*   **Styling**: Tailwind CSS
*   **Authentication Storage**: JS-Cookie
*   **Testing**: Jest, React Testing Library

### Infrastructure & DevOps
*   **Containerization**: Docker
*   **Orchestration**: Docker Compose (for local development)
*   **CI/CD**: GitHub Actions

## 3. Project Structure

The repository is organized into `backend` and `frontend` directories, each with its own specific structure, along with shared `docs` and `.` files.

```
ecommerce-system/
├── .github/                      # GitHub Actions workflows
├── backend/                      # Node.js Express API
│   ├── src/                      # Source code
│   │   ├── config/               # Environment variables, DB config
│   │   ├── controllers/          # Request handlers
│   │   ├── database/             # Knex migrations and seeds
│   │   ├── middleware/           # Express middlewares (auth, error, cache, validation)
│   │   ├── models/               # Data access layer (conceptual)
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── utils/                # Utility functions (logger, JWT, validation schemas)
│   │   ├── app.js                # Express app setup
│   │   └── server.js             # Server entry point
│   ├── tests/                    # Unit, Integration, API tests
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── frontend/                     # React.js application
│   ├── public/
│   ├── src/
│   │   ├── api/                  # Axios instances and API calls
│   │   ├── assets/
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/             # React Context for global state (Auth, Cart)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route-specific components
│   │   ├── routes/               # React Router setup
│   │   ├── utils/
│   │   ├── index.css
│   │   ├── App.js
│   │   └── index.js
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── README.md
├── docs/                         # Comprehensive documentation
│   ├── API.md
│   ├── Architecture.md
│   └── Deployment.md
├── docker-compose.yml            # Docker setup for local development
└── README.md                     # This overall project README
```

## 4. Setup Instructions

### Prerequisites
*   Git
*   Docker & Docker Compose (recommended for easy setup)
*   Node.js (v18 or higher) & npm (if not using Docker)
*   PostgreSQL (if not using Docker)
*   Redis (if not using Docker)

### Local Development with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecommerce-system.git
    cd ecommerce-system
    ```

2.  **Create environment files:**
    *   Create `backend/.env` from `backend/.env.example`.
        ```bash
        cp backend/.env.example backend/.env
        ```
        **Important:** Update `JWT_SECRET`, `ADMIN_PASSWORD`, and ensure `CORS_ORIGIN` matches your frontend URL (e.g., `http://localhost:3000`). For development, `RUN_SEEDS=true` is recommended for initial data.
    *   Create `frontend/.env` from `frontend/.env.example`.
        ```bash
        cp frontend/.env.example frontend/.env
        ```
        Ensure `REACT_APP_API_BASE_URL` points to your backend (e.g., `http://localhost:5000/api/v1`).

3.  **Start Docker Compose services:**
    This will build the images, start PostgreSQL, Redis, and run both backend and frontend applications.
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs containers in detached mode. To see logs, use `docker-compose logs -f`.

4.  **Access the applications:**
    *   **Backend API**: `http://localhost:5000/api/v1`
    *   **Frontend App**: `http://localhost:3000`

    The backend `server.js` is configured to run database migrations and seeds automatically on startup (if `RUN_SEEDS=true` in `backend/.env`).

5.  **Stop Docker Compose services:**
    ```bash
    docker-compose down
    ```
    This will stop and remove containers, networks, and volumes. To keep volumes (e.g., database data), omit `--volumes`.

### Manual Setup (Backend)

1.  **Navigate to the backend directory:**
    ```bash
    cd ecommerce-system/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up PostgreSQL and Redis:**
    Ensure you have a PostgreSQL database and Redis instance running and accessible. Update `backend/.env` with the correct `DATABASE_URL` and `REDIS_URL`.

4.  **Run database migrations and seeds:**
    ```bash
    npm run migrate:latest
    npm run seed:run
    ```

5.  **Start the backend server:**
    ```bash
    npm run dev  # For development with hot-reloading
    # or
    npm start    # For production build
    ```

### Manual Setup (Frontend)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ecommerce-system/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The app will typically open in your browser at `http://localhost:3000`.

## 5. Running Tests

### Backend Tests

Navigate to the `backend` directory and run:

```bash
cd backend
npm test
```
This command runs unit, integration, and API tests using Jest, aiming for 80%+ code coverage. A temporary test database (defined by `TEST_DATABASE_URL` in `backend/knexfile.js`) will be used.

### Frontend Tests

Navigate to the `frontend` directory and run:

```bash
cd frontend
npm test
```
This command runs unit and component tests using Jest and React Testing Library.

### Performance Tests (k6)

Navigate to the root `ecommerce-system` directory.
Ensure your backend is running (e.g., via Docker Compose).

```bash
# Install k6 if you haven't already: https://k6.io/docs/get-started/installation/
# For example, on macOS: brew install k6

# Set the API base URL (adjust if your backend is not on localhost:5000)
export API_BASE_URL=http://localhost:5000/api/v1

# Run the k6 load test
k6 run performance/load-test.js
```
The `performance/load-test.js` script simulates user traffic including registration, login, browsing products, and viewing product details.

## 6. Documentation

Comprehensive documentation is provided in the `docs/` directory:

### API Documentation
*   [`docs/API.md`](./docs/API.md): Describes the RESTful API endpoints, request/response formats, and authentication requirements. This is a conceptual representation in Markdown, but could easily be converted to an OpenAPI (Swagger) YAML file.

### Architecture Overview
*   [`docs/Architecture.md`](./docs/Architecture.md): Provides an overview of the system's architecture, including backend structure (MVC-like with services), frontend component organization, data flow, and interactions between services.

### Deployment Guide
*   [`docs/Deployment.md`](./docs/Deployment.md): Outlines the steps and considerations for deploying this e-commerce system to a production environment (e.g., using Docker in a cloud environment like AWS, Azure, Google Cloud).

## 7. CI/CD

A basic CI/CD pipeline is configured using GitHub Actions:
*   `.github/workflows/main.yml`: Defines workflows for Continuous Integration (CI) on `main` and `develop` branches and pull requests.
    *   **Backend CI**: Installs dependencies, starts a temporary PostgreSQL container, runs migrations, and executes all backend tests (unit, integration, API).
    *   **Frontend CI**: Installs dependencies, runs frontend tests, and builds the React application.
    *   **Continuous Deployment (CD)**: Conceptual steps for deploying the backend (e.g., to Docker Swarm/Kubernetes) and frontend (e.g., to S3/CloudFront) are commented out, illustrating where these steps would fit.

## 8. Code Structure and Quality

*   **Modularity**: The codebase is organized into distinct modules (auth, user, product, cart, order) with clear separation of concerns (controllers, services, routes, middleware).
*   **Validation**: All incoming API requests are validated using Joi schemas.
*   **Error Handling**: A global error handling middleware ensures consistent error responses.
*   **Logging**: Centralized Winston logger for structured and categorized logging.
*   **Authentication**: Secure JWT-based authentication with refresh token mechanism.
*   **Configuration**: Environment variables are used for sensitive data and dynamic settings.
*   **Database Migrations**: Knex.js migrations manage schema changes version-controlled.
*   **Testing**: Dedicated `tests` directories for both backend and frontend to ensure reliability and maintainability.

## 9. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write comprehensive tests for your changes.
5.  Ensure all tests pass (`npm test` in both `backend` and `frontend`).
6.  Commit your changes (`git commit -m 'feat: Add new feature'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Open a Pull Request.

## 10. License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details (not explicitly created here, but should exist in a real project).