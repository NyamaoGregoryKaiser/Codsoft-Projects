# Product Management System

This project is a comprehensive, production-ready DevOps automation system for a Product Management application. It showcases a full-stack JavaScript application with robust backend services, a responsive frontend, a persistent database layer, integrated testing, Dockerization, and a CI/CD pipeline.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Local Development Setup](#local-development-setup)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Database Setup](#database-setup)
    *   [Running with Docker Compose](#running-with-docker-compose)
5.  [API Documentation](#api-documentation)
6.  [Testing](#testing)
7.  [CI/CD Pipeline](#cicd-pipeline)
8.  [Deployment Guide](#deployment-guide)
9.  [Project Structure](#project-structure)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

**Core Application:**

*   **User Management:** Register, Login, Fetch User Profile.
*   **Product Management:** Create, Read (all, by ID), Update, Delete products.
*   **Authentication & Authorization:** JWT-based for secure API access.
*   **Role-Based Access Control (RBAC):** Users can only manage their own products (implied by `userId` in product model). Admins could be added for global product management.

**DevOps & Enterprise Features:**

*   **Comprehensive Configuration:** Environment variables, Docker, `package.json`.
*   **Database Management:** PostgreSQL with Sequelize ORM, migrations, and seeders.
*   **Robust Error Handling:** Centralized middleware for API errors.
*   **Logging:** Centralized structured logging with Winston.
*   **Caching Layer:** Redis integration for API response caching.
*   **Rate Limiting:** Protects API from abuse.
*   **Unit & Integration Tests:** High coverage for both backend and frontend.
*   **Dockerization:** Containerized services for consistency across environments.
*   **CI/CD Pipeline:** Automated build, test, and deployment using GitHub Actions.
*   **Detailed Documentation:** README, API docs, architecture, deployment guide.

---

## 2. Architecture

The system follows a typical microservices-oriented architecture with a clear separation of concerns:

*   **Frontend (React.js):** A single-page application (SPA) providing the user interface. It communicates with the backend API.
*   **Backend (Node.js/Express):** A RESTful API server handling business logic, data processing, authentication, and communication with the database and cache.
*   **Database (PostgreSQL):** The primary data store for users and products.
*   **Cache (Redis):** An in-memory data store used for speeding up read operations by caching frequently accessed data.

```mermaid
graph TD
    User --> |HTTP/HTTPS| Frontend(React App)
    Frontend --> |API Requests| LoadBalancer((Load Balancer))
    LoadBalancer --> Backend(Node.js/Express API)
    Backend --> |SQL Queries| Database(PostgreSQL)
    Backend --> |Cache Operations| Cache(Redis)
    CI_CD[CI/CD Pipeline] --> |Build, Test, Deploy| DockerRegistry[Docker Registry]
    DockerRegistry --> |Pull Images| DeploymentTarget[Deployment Target (e.g., VM, K8s)]
```

---

## 3. Technology Stack

**Backend:**

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database ORM:** Sequelize (for PostgreSQL)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Hashing:** bcrypt.js
*   **Validation:** Joi (or similar, not explicitly implemented here for brevity, but recommended)
*   **Logging:** Winston
*   **Caching:** Redis (via `node-cache-manager-redis-store`)
*   **Rate Limiting:** `express-rate-limit`
*   **Testing:** Jest, Supertest
*   **Code Quality:** ESLint

**Frontend:**

*   **Library:** React.js
*   **State Management:** React Context API
*   **Routing:** React Router DOM
*   **API Client:** Axios
*   **Styling:** Pure CSS (or Tailwind/styled-components, etc. for production)
*   **Testing:** Jest, React Testing Library
*   **Build Tool:** Create React App (CRA)

**Database:**

*   **Database System:** PostgreSQL
*   **Migration Tool:** Sequelize CLI

**DevOps:**

*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Linting:** ESLint
*   **Code Coverage:** c8 / Istanbul

---

## 4. Local Development Setup

### Prerequisites

Make sure you have the following installed:

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/en/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
*   [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/)

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Create a `.env` file in the `backend` directory by copying `.env.example` and fill in your database and JWT secrets:
    ```bash
    cp .env.example .env
    ```
4.  Start the PostgreSQL and Redis containers (if not using `docker-compose up` for the whole stack):
    ```bash
    docker-compose -f ../docker-compose.yml up db redis -d
    ```
5.  Run database migrations:
    ```bash
    npx sequelize-cli db:migrate
    ```
6.  Seed the database with initial data:
    ```bash
    npx sequelize-cli db:seed:all
    ```
7.  Start the backend server:
    ```bash
    npm start
    # or npm run dev (if you set up a dev script with nodemon)
    ```
    The backend will be available at `http://localhost:5000` (or your `BACKEND_PORT`).

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Create a `.env` file in the `frontend` directory. Make sure `REACT_APP_API_BASE_URL` points to your backend:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to ensure `REACT_APP_API_BASE_URL=http://localhost:5000/api/v1` (or your backend port).
4.  Start the frontend development server:
    ```bash
    npm start
    ```
    The frontend will be available at `http://localhost:3000` (or your `FRONTEND_PORT`).

### Running with Docker Compose (Recommended for Integrated Setup)

1.  Go to the project root directory:
    ```bash
    cd product-management-system
    ```
2.  Create a `.env` file in the project root by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    *Make sure to update `JWT_SECRET` and other sensitive variables.*
3.  Build and start all services using Docker Compose:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images even if they exist. Useful for local changes.
    *   `-d`: Runs containers in detached mode (in the background).
4.  Once started, the services will be accessible at:
    *   **Frontend:** `http://localhost:3000` (or your `FRONTEND_PORT`)
    *   **Backend API:** `http://localhost:5000/api/v1` (or your `BACKEND_PORT`)
    *   **PostgreSQL:** `localhost:5432` (accessible from host machine if `DB_PORT` is mapped)
    *   **Redis:** `localhost:6379` (accessible from host machine if `REDIS_PORT` is mapped)

5.  To stop and remove containers, networks, and volumes:
    ```bash
    docker-compose down -v
    ```
    *   `-v`: Removes named volumes declared in the `volumes` section of the `docker-compose.yml` file. This is useful for a clean slate, but will delete your database data.

---

## 5. API Documentation

The backend exposes a RESTful API with versioning (`/api/v1`).

**Base URL:** `http://localhost:5000/api/v1`

### Authentication Endpoints (`/api/v1/auth`)

*   **`POST /register`**
    *   **Description:** Register a new user.
    *   **Body:**
        ```json
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
            "message": "User registered successfully",
            "userId": "uuid-of-new-user"
        }
        ```
*   **`POST /login`**
    *   **Description:** Authenticate a user and get a JWT token.
    *   **Body:**
        ```json
        {
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "userId": "uuid-of-user"
        }
        ```

### User Endpoints (`/api/v1/users`) - *Requires Authentication*

*   **`GET /profile`**
    *   **Description:** Get the profile of the authenticated user.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Response (200 OK):**
        ```json
        {
            "id": "uuid",
            "username": "testuser",
            "email": "test@example.com",
            "createdAt": "...",
            "updatedAt": "..."
        }
        ```

### Product Endpoints (`/api/v1/products`) - *Requires Authentication*

*   **`POST /`**
    *   **Description:** Create a new product.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Body:**
        ```json
        {
            "name": "Laptop Pro",
            "description": "Powerful laptop for professionals",
            "price": 1200.00,
            "stock": 50
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
            "message": "Product created successfully",
            "product": {
                "id": "uuid",
                "name": "Laptop Pro",
                ...
            }
        }
        ```
*   **`GET /`**
    *   **Description:** Get all products belonging to the authenticated user.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Response (200 OK):**
        ```json
        [
            { "id": "uuid1", "name": "Laptop Pro", ... },
            { "id": "uuid2", "name": "Gaming Mouse", ... }
        ]
        ```
*   **`GET /:id`**
    *   **Description:** Get a single product by ID.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Response (200 OK):**
        ```json
        { "id": "uuid", "name": "Laptop Pro", ... }
        ```
*   **`PUT /:id`**
    *   **Description:** Update an existing product.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Body:**
        ```json
        {
            "name": "Laptop Pro Max",
            "price": 1350.00
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "message": "Product updated successfully",
            "product": {
                "id": "uuid",
                "name": "Laptop Pro Max",
                ...
            }
        }
        ```
*   **`DELETE /:id`**
    *   **Description:** Delete a product.
    *   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
    *   **Response (204 No Content):** (No body content)

---

## 6. Testing

The project includes comprehensive tests for both backend and frontend components.

### Backend Tests

1.  Navigate to the `backend` directory.
2.  Run all tests (unit and integration):
    ```bash
    npm test
    ```
3.  To run tests with coverage report:
    ```bash
    npm test -- --coverage
    ```
    *   **Coverage Target:** The goal is to maintain 80%+ test coverage. Check the `coverage/lcov-report/index.html` file after running coverage for a detailed report.

### Frontend Tests

1.  Navigate to the `frontend` directory.
2.  Run all tests:
    ```bash
    npm test
    ```
    This will open an interactive test runner. Press `a` to run all tests.
3.  To run tests with coverage report:
    ```bash
    npm test -- --coverage --watchAll=false
    ```
    *   **Coverage Target:** Aim for good coverage on key components and utility functions. Check the `coverage/lcov-report/index.html` file after running coverage.

---

## 7. CI/CD Pipeline

A GitHub Actions workflow (`.github/workflows/main.yml`) is configured to automate the following steps:

1.  **Trigger:** On `push` to `main` branch and `pull_request` to `main`.
2.  **Linting:** Runs ESLint on both backend and frontend code.
3.  **Backend Tests:** Installs backend dependencies, runs unit and integration tests, and collects coverage.
4.  **Frontend Tests:** Installs frontend dependencies, runs tests, and collects coverage.
5.  **Build Docker Images:**
    *   Builds the `backend` Docker image.
    *   Builds the `frontend` Docker image.
6.  **Push Docker Images:**
    *   Logs into Docker Hub.
    *   Tags and pushes `backend` image to Docker Hub.
    *   Tags and pushes `frontend` image to Docker Hub.

**Note:** For actual deployment to a cloud provider (e.g., AWS EKS, GCP GKE, Azure AKS, or a simple VM), additional steps would be added to the CI/CD pipeline, such as:
*   Deploying to Kubernetes using Helm charts or `kubectl`.
*   Deploying to a VM using `ssh` and `docker-compose`.
*   Updating a serverless function (if applicable).

---

## 8. Deployment Guide

This guide outlines a basic production deployment strategy using Docker Compose on a single Linux VM. For higher availability and scalability, consider Kubernetes.

### Prerequisites for Deployment Host

*   A Linux server (e.g., AWS EC2, DigitalOcean Droplet, etc.)
*   Docker installed on the server.
*   Docker Compose installed on the server.
*   `git` installed.
*   `nginx` (optional, for reverse proxy and SSL).

### Steps to Deploy

1.  **SSH into your server:**
    ```bash
    ssh user@your_server_ip
    ```

2.  **Install Docker and Docker Compose** (if not already installed). Refer to Docker's official documentation for your specific Linux distribution.

3.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/product-management-system.git
    cd product-management-system
    ```

4.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the root directory and fill in production-ready values. **Ensure `JWT_SECRET` is strong and unique, and database credentials are secure.**
    ```bash
    cp .env.example .env
    # Edit .env with production values
    nano .env
    ```
    *   For `REACT_APP_API_BASE_URL` in the frontend Dockerfile, it's best to set it to your public API endpoint if you're using Nginx or a load balancer. If frontend and backend are on the same server behind Nginx, you might point it to `http://your_server_ip:5000/api/v1` or even `http://yourdomain.com/api/v1` if Nginx is configured to proxy.

5.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose pull # Pull latest images pushed by CI/CD
    docker-compose up --build -d
    ```
    The `command` in `docker-compose.yml` for the backend will automatically run migrations and seeds on first start. Ensure `db:migrate` and `db:seed:all` are appropriate for your production environment. For continuous deployments, you might want to separate the migration step.

6.  **(Optional) Set up Nginx for Reverse Proxy and SSL:**
    For production, you should use Nginx (or similar) as a reverse proxy to:
    *   Serve the frontend on standard HTTP/HTTPS ports (80/443).
    *   Proxy requests to the backend API (`/api/v1`) to the backend container.
    *   Handle SSL termination with Certbot.

    *Example Nginx configuration (e.g., `/etc/nginx/sites-available/yourdomain.com`):*
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

        # Frontend (React app)
        location / {
            proxy_pass http://localhost:3000; # Or whichever port frontend is exposed on host
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/v1/ {
            proxy_pass http://localhost:5000/api/v1/; # Or whichever port backend is exposed on host
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            # Add rate limiting headers for downstream consumption if necessary
            # For example, to pass the client's actual IP to express-rate-limit
            # in backend, use 'X-Forwarded-For'.
        }
    }
    ```
    After configuring Nginx, enable it and restart:
    ```bash
    sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
    sudo nginx -t # Test configuration
    sudo systemctl restart nginx
    ```
    Use [Certbot](https://certbot.eff.org/) to easily obtain and renew SSL certificates.

7.  **Monitor Logs:**
    ```bash
    docker-compose logs -f
    ```

---

## 9. Project Structure

```
.
├── backend/                  # Node.js Express API
│   ├── src/                  # Source code for the backend
│   │   ├── config/           # Environment and database configurations
│   │   ├── middleware/       # Custom Express middleware (auth, error handling, rate limiting)
│   │   ├── models/           # Sequelize model definitions
│   │   ├── controllers/      # Request handlers, orchestrates services
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Utility functions (logger, cache, JWT helpers)
│   │   ├── routes/           # API route definitions
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Entry point for the backend server
│   ├── tests/                # Backend unit and integration tests
│   ├── .env.example          # Example environment variables
│   ├── Dockerfile            # Dockerfile for backend service
│   ├── package.json          # Node.js dependencies and scripts
│   └── README.md             # Backend specific README
├── frontend/                 # React SPA
│   ├── public/               # Static assets
│   ├── src/                  # Source code for the frontend
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components/views
│   │   ├── services/         # API interaction logic
│   │   ├── context/          # React Context for global state (e.g., Auth)
│   │   ├── App.js            # Main application component
│   │   └── index.js          # Entry point for the React app
│   ├── tests/                # Frontend component tests
│   ├── .env.example          # Example environment variables
│   ├── Dockerfile            # Dockerfile for frontend service
│   ├── package.json          # React dependencies and scripts
│   └── README.md             # Frontend specific README
├── database/                 # Database specific configurations and scripts
│   ├── config/               # Sequelize configuration
│   ├── migrations/           # Database migration scripts
│   └── seeders/              # Database seed data scripts
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml          # Main CI/CD workflow
├── .env.example              # Example environment variables for docker-compose
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Docker Compose configuration for multi-service setup
└── README.md                 # Project root README
```

---

## 10. Future Enhancements

*   **Advanced Authentication:** Implement refresh tokens, password reset functionality, 2FA.
*   **Role-Based Access Control (RBAC):** Extend `User` model with roles (e.g., Admin, Editor, Viewer) and implement middleware for role-based authorization.
*   **Input Validation:** Use a library like Joi or Yup for robust request body validation in the backend.
*   **Pagination & Filtering:** Implement server-side pagination, sorting, and filtering for product listings.
*   **Search Functionality:** Add full-text search capabilities to products.
*   **Image Uploads:** Integrate cloud storage (S3, Cloudinary) for product images.
*   **Monitoring & Alerting:** Integrate with Prometheus/Grafana or other APM tools.
*   **Log Management:** Ship logs to a centralized log management system (ELK stack, Splunk, DataDog).
*   **API Gateway:** For more complex microservice architectures, an API Gateway (e.g., Kong, AWS API Gateway) would manage routing, authentication, rate limiting etc.
*   **Kubernetes Deployment:** Evolve Docker Compose deployment to Kubernetes for better scalability, self-healing, and service discovery.
*   **Performance Testing:** Integrate tools like k6 or JMeter into CI/CD for automated load and stress testing.
*   **Security Scanning:** Add SAST/DAST tools (e.g., Snyk, SonarQube) to the CI/CD pipeline.
*   **Frontend UI Framework:** Integrate a UI library like Material-UI, Ant Design, or Chakra UI for a more polished user experience.
*   **Internationalization (i18n):** Support multiple languages for the frontend.

---

## 11. License

This project is open-source and available under the [MIT License](LICENSE). (Note: `LICENSE` file is not generated here but would typically be present).

---
```

```