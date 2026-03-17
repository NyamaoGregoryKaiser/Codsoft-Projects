# Enterprise Content Management System (CMS)

This project is a comprehensive, production-ready Content Management System built with a modern full-stack architecture. It features a robust backend using Node.js, Express, and TypeScript, a PostgreSQL database managed by TypeORM, and a dynamic frontend built with React, TypeScript, and Tailwind CSS. The system emphasizes security, performance, scalability, and maintainability, incorporating best practices for enterprise-grade applications.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Project Structure](#project-structure)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Docker Compose Setup](#docker-compose-setup)
6.  [Database Management](#database-management)
    *   [Migrations](#migrations)
    *   [Seeding](#seeding)
7.  [Running Tests](#running-tests)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [API Testing](#api-testing)
    *   [Performance Testing](#performance-testing)
8.  [API Documentation](#api-documentation)
9.  [Deployment Guide](#deployment-guide)
10. [Additional Features](#additional-features)
11. [License](#license)

---

## 1. Features

**Core CMS Functionality:**
*   **Content Management (Posts/Articles):** Create, Read, Update, Delete (CRUD) operations for rich text content.
*   **Category Management:** Organize content into logical categories.
*   **Media Management:** Placeholder for image/media URLs (can be extended with actual file uploads to S3/Cloudinary).

**User Management & Security:**
*   **User Authentication:** JWT (JSON Web Token) based login/registration.
*   **Role-Based Access Control (RBAC):**
    *   `ADMIN`: Full control over users, content, and categories.
    *   `EDITOR`: Can create, edit, publish/draft, and delete their own content, and manage categories.
    *   `VIEWER`: Can view all published content.
*   **Password Hashing:** Secure password storage using `bcryptjs`.

**Backend Enhancements:**
*   **RESTful API:** Clean and consistent API endpoints.
*   **Input Validation:** Robust request body validation using `class-validator`.
*   **Error Handling:** Centralized error handling middleware with custom error classes.
*   **Logging:** Structured logging using Winston for monitoring and debugging.
*   **Rate Limiting:** Protects against abuse and brute-force attacks.
*   **Security Headers:** `helmet`, `cors`, `xss-clean`, `hpp` to mitigate common web vulnerabilities.

**Frontend Experience:**
*   **Responsive UI:** Built with React and Tailwind CSS for a modern, mobile-friendly interface.
*   **Intuitive Dashboard:** Role-specific dashboards for easy navigation.
*   **State Management:** Redux Toolkit for predictable and scalable client-side state.
*   **Protected Routes:** Ensures users can only access authorized parts of the application.

---

## 2. Architecture

The project follows a **Monorepo** structure, separating the backend and frontend into distinct folders while residing in a single repository. This approach simplifies development, versioning, and deployment of related services.

**High-Level Diagram:**

```
+------------------+       +---------------------+       +-------------------+
|                  |       |                     |       |                   |
|   Client (Browser)  | <-----> |   Nginx (Frontend)    | <-----> |   Backend API (Node.js)   | <-----> |   PostgreSQL Database   |
| (React App)      |       |  (Static File Server) |       | (Express, TypeScript) |       | (TypeORM)               |
+------------------+       +---------------------+       +-------------------+
        ^                            ^                              ^
        |                            |                              |
        |      HTTP Requests         |       API Calls (HTTP/S)     |      Database Queries (SQL)
        +----------------------------+------------------------------+
```

**Backend Architecture:**
The backend uses a layered architecture:
*   **Controllers:** Handle incoming HTTP requests, delegate to services, and send back responses.
*   **Services:** Contain the core business logic and interact with repositories.
*   **Repositories:** Abstract database operations, providing an interface to entities.
*   **Entities:** TypeORM models representing database tables.
*   **Middlewares:** Handle concerns like authentication, authorization, error handling, logging, and security.

**Frontend Architecture:**
The frontend is a Single-Page Application (SPA) using React:
*   **Components:** Reusable UI elements.
*   **Pages:** Top-level components representing distinct views/routes.
*   **Redux Store:** Manages global application state (e.g., authentication).
*   **API Clients:** Axios-based services to interact with the backend API.
*   **Contexts/Hooks:** Manage component-specific or cross-cutting concerns.

---

## 3. Technology Stack

**Backend:**
*   **Runtime:** Node.js 18+
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **ORM:** TypeORM
*   **Database:** PostgreSQL
*   **Authentication:** JSON Web Tokens (JWT)
*   **Password Hashing:** `bcryptjs`
*   **Validation:** `class-validator`
*   **Logging:** Winston
*   **Security:** `helmet`, `cors`, `xss-clean`, `hpp`, `express-rate-limit`
*   **Testing:** Jest, Supertest

**Frontend:**
*   **Framework:** React 18+
*   **Language:** TypeScript
*   **State Management:** Redux Toolkit
*   **Routing:** React Router DOM v6
*   **Styling:** Tailwind CSS
*   **API Client:** Axios
*   **Testing:** Jest, React Testing Library

**DevOps & Tools:**
*   **Containerization:** Docker, Docker Compose
*   **Version Control:** Git
*   **CI/CD:** GitHub Actions (configured, but requires environment-specific secrets for full deployment)

---

## 4. Project Structure

```
cms-system/
├── backend/                  # Node.js + Express + TypeORM API
│   ├── src/                  # Backend source code
│   │   ├── config/           # Configuration files (DB, JWT, Logger)
│   │   ├── controllers/      # Request handlers
│   │   ├── entities/         # TypeORM database models
│   │   ├── middlewares/      # Express middlewares (Auth, Error, Logger, Rate Limiting)
│   │   ├── migrations/       # TypeORM database migrations
│   │   ├── repositories/     # Custom TypeORM repositories
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Helper functions (JWT, Validation DTOs)
│   │   ├── routes/           # API route definitions
│   │   ├── app.ts            # Express application setup
│   │   ├── data-source.ts    # TypeORM database connection setup
│   │   └── server.ts         # Backend application entry point
│   ├── tests/                # Unit and Integration tests for backend
│   ├── .env.example          # Environment variables example
│   ├── ormconfig.ts          # TypeORM CLI configuration
│   ├── package.json          # Backend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration for backend
│   └── Dockerfile            # Dockerfile for backend service
├── frontend/                 # React + TypeScript + Tailwind CSS SPA
│   ├── public/               # Public assets
│   ├── src/                  # Frontend source code
│   │   ├── api/              # Axios API client instances and service calls
│   │   ├── assets/           # Static assets (images, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Contexts (e.g., AuthContext)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page-level components (views for routes)
│   │   ├── store/            # Redux Toolkit store and slices
│   │   ├── types/            # Global TypeScript type definitions
│   │   ├── App.tsx           # Main application component
│   │   ├── index.css         # Tailwind CSS imports and global styles
│   │   └── index.tsx         # React application entry point
│   ├── tests/                # Frontend tests (React Testing Library)
│   ├── .env.example          # Frontend environment variables example
│   ├── package.json          # Frontend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration for frontend
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── Dockerfile            # Dockerfile for frontend service
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml          # CI/CD pipeline definition
├── docker-compose.yml        # Docker Compose file for local development/deployment
├── README.md                 # Project README (this file)
└── LICENSE                   # Project license
```

---

## 5. Setup and Installation

### Prerequisites

*   Node.js (v18 or higher) & npm (or yarn)
*   Docker & Docker Compose
*   PostgreSQL (if running database directly, not via Docker Compose)

### Local Development Setup (without Docker Compose)

**1. Clone the repository:**

```bash
git clone https://github.com/your-username/cms-system.git
cd cms-system
```

**2. Database Setup:**

*   Ensure you have a PostgreSQL server running (e.g., via `brew install postgresql` on macOS, or `sudo apt-get install postgresql` on Linux).
*   Create a database (e.g., `cmsdb`) and a user/password (e.g., `postgres`/`postgres`) or configure your `.env` to match your existing setup.

**3. Backend Setup:**

```bash
cd backend

# Copy environment variables example
cp .env.example .env

# Edit .env file with your database credentials
# Example:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=cmsdb
# JWT_SECRET=your_jwt_secret_key
# JWT_EXPIRES_IN=1h

# Install dependencies
npm install

# Run migrations to create schema
npm run migrate:run

# Seed initial data (optional, creates admin@example.com / password123, etc.)
npm run seed

# Start the backend in development mode
npm run dev
```
The backend should now be running on `http://localhost:5000`.

**4. Frontend Setup:**

```bash
cd ../frontend

# Copy environment variables example
cp .env.example .env

# Edit .env file (ensure REACT_APP_API_BASE_URL points to your backend)
# Example:
# REACT_APP_API_BASE_URL=http://localhost:5000/api/v1

# Install dependencies
npm install

# Start the frontend in development mode
npm start
```
The frontend should now be running on `http://localhost:3000`.

### Docker Compose Setup (Recommended for Development & Production)

This method containerizes both the backend and frontend applications along with a PostgreSQL database, providing a consistent environment.

**1. Clone the repository:**

```bash
git clone https://github.com/your-username/cms-system.git
cd cms-system
```

**2. Prepare Environment Variables:**

*   Create a `.env` file in the root directory of the project (next to `docker-compose.yml`).
*   Copy the content from `backend/.env.example` and `frontend/.env.example` into this root `.env` file, merging them. Ensure `DB_HOST` for the backend points to the `db` service name (already set in `docker-compose.yml`).
*   **Example `.env` (root directory):**
    ```dotenv
    # Backend Configuration
    NODE_ENV=development
    PORT=5000

    # Database Configuration
    DB_HOST=db # Important: This refers to the 'db' service in docker-compose
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=postgres
    DB_DATABASE=cmsdb

    # JWT Configuration
    JWT_SECRET=supersecretjwtkeythatshouldbechangedinproduction
    JWT_EXPIRES_IN=1h

    # Logging
    LOG_LEVEL=info

    # Rate Limiting
    RATE_LIMIT_WINDOW_MS=15
    RATE_LIMIT_MAX_REQUESTS=100

    # Frontend Configuration
    REACT_APP_API_BASE_URL=http://localhost:5000/api/v1 # Frontend accesses backend via host IP
    ```
    *(Note: For production, `REACT_APP_API_BASE_URL` would point to the public URL of your backend API gateway or server.)*

**3. Build and Run with Docker Compose:**

```bash
docker compose build
docker compose up -d
```
This will:
*   Build Docker images for the backend and frontend.
*   Start a PostgreSQL container.
*   Start the backend container (which will run TypeORM migrations and then start the server).
*   Start the frontend container (Nginx serving the React app).

**4. Access the applications:**
*   Frontend: `http://localhost:3000`
*   Backend API: `http://localhost:5000/api/v1`

**5. Seed Data (after initial `docker compose up`):**
The backend `Dockerfile` and `docker-compose.yml` include a command to run migrations. For seeding, you'll need to manually execute the seed script within the backend container *after* the database and backend are up.

```bash
# Find the name of your backend container
docker ps

# Example: cms-system-backend-1
docker exec -it <backend-container-name> npm run seed
```
This will populate the database with an admin user (`admin@example.com`/`password123`), an editor, a viewer, and some sample content/categories.

---

## 6. Database Management

### Migrations

TypeORM migrations are used to manage schema changes in a version-controlled way.

*   **Create a new migration:**
    ```bash
    cd backend
    npm run migrate:create --name=YourMigrationName
    ```
    This generates a new `.ts` file in `src/migrations`. You'll need to manually define your `up` and `down` methods.
*   **Run pending migrations:**
    ```bash
    cd backend
    npm run migrate:run
    ```
*   **Revert the last migration:**
    ```bash
    cd backend
    npm run migrate:revert
    ```

### Seeding

The `seed.ts` script populates the database with initial data (e.g., an admin user, sample categories, and content).

*   **Run the seed script:**
    ```bash
    cd backend
    npm run seed
    ```
    *Caution: Running `seed` in development will typically clear existing data before re-populating. Do not run this on a production database unless you understand the implications.*

---

## 7. Running Tests

### Backend Tests

Backend tests are written with Jest and Supertest.

```bash
cd backend
npm test               # Run all tests
npm test -- --watch    # Run tests in watch mode
npm test -- --coverage # Run tests and generate coverage report (aim for 80%+)
```

### Frontend Tests

Frontend tests are written with Jest and React Testing Library.

```bash
cd frontend
npm test               # Run all tests
npm test -- --watch    # Run tests in watch mode
npm test -- --coverage # Run tests and generate coverage report
```

### API Testing

For manual API testing and exploration, you can use tools like Postman or Insomnia. The API endpoints are documented (see [API Documentation](#api-documentation)).

A sample Postman collection (not provided in this response due to length) would include:
*   Register User (Viewer, Editor, Admin)
*   Login User (get JWT token)
*   Get current user profile (`/api/v1/auth/me` with JWT)
*   CRUD operations for Content and Categories (using appropriate JWT roles)
*   User Management (for Admin)

### Performance Testing

Performance tests are crucial for identifying bottlenecks under load. Tools like k6, JMeter, or Locust can be used.

*   **Tool:** k6 (recommended for scriptable, lightweight load testing).
*   **Approach:**
    1.  Install k6 globally or via Docker.
    2.  Write k6 scripts to simulate user journeys (e.g., login, browse content, create content).
    3.  Execute tests to measure response times, throughput, and error rates.
    4.  Analyze results to identify performance bottlenecks in the backend or database.

*(A conceptual k6 script is shown in the `Testing & Quality` section above, but not included as a file in the project structure.)*

---

## 8. API Documentation

The backend API is designed to be RESTful. API documentation can be generated using tools like Swagger/OpenAPI.
For this project, JSDoc comments are used directly in the route definitions (`backend/src/routes/*.ts`) and controllers, structured to be compatible with tools like `express-jsdoc-swagger` or similar.

To generate a full Swagger UI:
1.  Install `express-jsdoc-swagger`: `npm install express-jsdoc-swagger`
2.  Add configuration to `backend/src/app.ts` or a dedicated `swagger.ts` file.
    ```typescript
    // In backend/src/app.ts
    // ... imports
    import expressJSDocSwagger from 'express-jsdoc-swagger';

    const swaggerOptions = {
      info: {
        version: '1.0.0',
        title: 'CMS API',
        description: 'API documentation for the Enterprise CMS',
        license: {
          name: 'MIT',
        },
      },
      baseDir: __dirname,
      filesPattern: './**/*.ts', // Pattern to find JSDoc comments
      swaggerUIPath: '/api-docs',
      exposeSwaggerUI: true,
      exposeApiDocs: false,
      apiDocsPath: '/api/v1/docs.json',
    };

    expressJSDocSwagger(app)(swaggerOptions);
    // ... rest of app setup
    ```
3.  Restart the backend server. You can then access the documentation at `http://localhost:5000/api-docs`.

---

## 9. Deployment Guide

This project is containerized using Docker, making it highly portable. The `docker-compose.yml` provides a setup for local development that can be adapted for production.

**General Deployment Steps:**

1.  **Server Setup:** Provision a Linux server (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine).
2.  **Install Docker & Docker Compose:**
    ```bash
    sudo apt-get update
    sudo apt-get install docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER # Add user to docker group, log out and back in
    ```
3.  **Clone Repository:** On your server, clone the repository.
    ```bash
    git clone https://github.com/your-username/cms-system.git
    cd cms-system
    ```
4.  **Environment Variables:**
    *   Create a `.env` file in the root directory.
    *   **Crucially**, update `JWT_SECRET` with a strong, randomly generated secret.
    *   Update `REACT_APP_API_BASE_URL` in the root `.env` to point to your *public* backend URL (e.g., `https://api.yourdomain.com/api/v1`).
    *   Set `NODE_ENV=production` in the root `.env`.
    *   Ensure database credentials are secure.
5.  **Build and Run Containers:**
    ```bash
    docker compose build --no-cache
    docker compose up -d
    ```
    The `docker compose up -d` command in production should ensure migrations run before the server starts.
6.  **Reverse Proxy (Recommended):** For production, it's highly recommended to use a reverse proxy like Nginx (outside the `frontend` container, or configured more extensively within it) to:
    *   Handle SSL/TLS (HTTPS).
    *   Serve static files more efficiently.
    *   Route traffic to backend/frontend containers.
    *   Manage domain names.
7.  **DNS Configuration:** Point your domain A records to your server's IP address.
8.  **Monitoring & Logging:** Set up external logging (e.g., ELK stack, Loggly, DataDog) and monitoring for your containers and database.
9.  **Backup Strategy:** Implement regular database backups.

**CI/CD Deployment (using GitHub Actions - conceptual):**

The `.github/workflows/main.yml` file outlines a CI/CD pipeline. For full deployment, you'll need to:

*   Configure GitHub Actions secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`).
*   Ensure your SSH key has proper permissions on the target server.
*   The deploy job will build and push images to Docker Hub (or another registry) and then SSH into your server to pull the new images and restart the Docker Compose services.

---

## 10. Additional Features (Brief Notes)

*   **Caching Layer:**
    *   **Implementation:** Integrate Redis. For example, use `redis` client in `src/config/redis.ts` and apply it in services.
    *   **Usage:** Cache frequently accessed public content (e.g., `getContents`, `getContentById`). Invalidate cache on content update/delete.
    *   **Example Middleware:** A `cacheMiddleware` could check Redis before hitting the database.
*   **Media Management:**
    *   Currently stores `thumbnailUrl` as a string.
    *   **Extension:** Implement AWS S3, Cloudinary, or a local file storage solution. This would involve a dedicated upload route, image processing (resizing, optimization), and storing the resulting URLs in the database.
*   **Search Engine Optimization (SEO):**
    *   **Backend:** Generate clean URLs (slugs), provide meta descriptions, sitemaps.
    *   **Frontend:** Use React Helmet for dynamic `<head>` tags.
*   **Analytics:** Integrate Google Analytics or other tracking solutions on the frontend.
*   **Internationalization (i18n):** Implement `react-i18next` for the frontend and manage translations for content.

---

## 11. License

This project is open-sourced under the MIT License. See the `LICENSE` file for more details.