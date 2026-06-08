# Enterprise-Grade CMS Project

This is a comprehensive, production-ready Content Management System (CMS) designed with a focus on full-stack web development best practices, UI/UX implementation, and business solutions. It features a Node.js (Express) backend, a React.js frontend, and a PostgreSQL database.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Features](#2-features)
3.  [Technology Stack](#3-technology-stack)
4.  [Project Structure](#4-project-structure)
5.  [Setup and Installation](#5-setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Setup (Without Docker)](#manual-setup-without-docker)
6.  [Running the Application](#6-running-the-application)
7.  [Database Management](#7-database-management)
8.  [Testing](#8-testing)
9.  [API Documentation](#9-api-documentation)
10. [Architecture Documentation](#10-architecture-documentation)
11. [Deployment Guide](#11-deployment-guide)
12. [Contribution](#12-contribution)
13. [License](#13-license)

---

## 1. Project Overview

The CMS allows for managing users with different roles (Admin, Editor, User), creating and publishing posts, organizing content with categories, and uploading/managing media files. It's built with scalability, security, and maintainability in mind.

## 2. Features

*   **User Management:** Register, Login, Logout, CRUD for users (Admin only).
*   **Role-Based Access Control (RBAC):** Admin, Editor, User roles with granular permissions.
*   **Content Management:** CRUD for Posts, Categories.
*   **Media Management:** File uploads (images, PDFs) with local storage.
*   **Authentication:** JWT-based authentication.
*   **Authorization:** Middleware for role-based route protection.
*   **Data Validation:** Joi for API input validation.
*   **Error Handling:** Centralized error handling middleware.
*   **Logging:** Winston for structured logging.
*   **Caching:** Redis-based caching for API responses.
*   **Rate Limiting:** Express-rate-limit with Redis store.
*   **Database:** PostgreSQL with Sequelize ORM for migrations and seeding.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **CI/CD:** GitHub Actions for automated testing and deployment.
*   **Testing:** Unit, Integration, and API tests.
*   **Frontend UI/UX:** Responsive React interface for content authors and administrators.

## 3. Technology Stack

*   **Backend:** Node.js (Express), Sequelize, PostgreSQL, Redis, JWT, bcryptjs, Winston, Joi, Multer.
*   **Frontend:** React.js, React Router, Axios, Context API.
*   **Database:** PostgreSQL
*   **Containerization:** Docker, Docker Compose
*   **Testing:** Jest, Supertest, React Testing Library, Artillery (for performance)
*   **CI/CD:** GitHub Actions
*   **Code Quality:** ESLint, Prettier

## 4. Project Structure

```
cms-project/
├── backend/                  # Node.js Express API
│   ├── src/                  # Source code for the backend
│   ├── tests/                # Backend tests
│   ├── migrations/           # Database migration scripts
│   ├── seeders/              # Database seed scripts
│   ├── uploads/              # Local storage for uploaded media
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # React.js SPA
│   ├── public/
│   ├── src/                  # Source code for the frontend
│   ├── tests/                # Frontend tests
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── .github/                  # GitHub Actions CI/CD workflows
├── docker-compose.yml        # Docker Compose setup for development
├── README.md                 # This file
└── package.json              # Root package.json for monorepo scripts
```

## 5. Setup and Installation

### Prerequisites

*   Node.js (v18 or higher) & npm (or Yarn)
*   Docker & Docker Compose (recommended)
*   (Optional, for manual setup) PostgreSQL installed locally
*   (Optional, for manual setup) Redis installed locally

### Environment Variables

Create `.env` files in both the `backend/` and `frontend/` directories by copying from their respective `.env.example` files and filling in the values.

**`backend/.env`**

```dotenv
NODE_ENV=development
PORT=5000

DB_DIALECT=postgres
DB_HOST=db        # 'localhost' for manual setup
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=cms_db

JWT_SECRET=supersecretjwtkeythatshouldbechangedinproduction
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=7

REDIS_HOST=redis  # 'localhost' for manual setup
REDIS_PORT=6379
REDIS_PASSWORD=

UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:3000

RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
```

**`frontend/.env`**

```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### Local Development with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cms-project.git
    cd cms-project
    ```
2.  **Create `.env` files:**
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    # Edit the .env files with your desired values (default values should work for local Docker setup)
    ```
3.  **Build and run containers:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build Docker images for backend and frontend.
    *   Start PostgreSQL and Redis containers.
    *   Start the backend service, which will automatically run database migrations and seeders (as configured in `docker-compose.yml`).
    *   Start the frontend development server.

4.  **Verify services:**
    *   Backend API: `http://localhost:5000/api`
    *   Frontend App: `http://localhost:3000`
    *   PostgreSQL: `localhost:5432`
    *   Redis: `localhost:6379`

### Manual Setup (Without Docker)

1.  **Install Dependencies:**
    ```bash
    npm install # in the root directory, to install 'concurrently'
    npm install --prefix backend
    npm install --prefix frontend
    ```
2.  **Setup PostgreSQL and Redis:**
    *   Ensure PostgreSQL is running on `localhost:5432` with a database named `cms_db` and user `cms_user`/`cms_password` (or update `.env` accordingly).
    *   Ensure Redis is running on `localhost:6379`.
3.  **Run Migrations and Seeders:**
    ```bash
    npm run db:reset --prefix backend # This drops, creates, migrates, and seeds the DB
    ```
    (You might need to install `sequelize-cli` globally: `npm install -g sequelize-cli`)
4.  **Start Backend:**
    ```bash
    npm run dev --prefix backend
    ```
5.  **Start Frontend:**
    ```bash
    npm start --prefix frontend
    ```

## 6. Running the Application

*   **With Docker Compose:** `docker-compose up -d` (then access `http://localhost:3000`)
*   **Manual Setup (both at once):** From the root directory: `npm run dev`

## 7. Database Management

(Run from `backend/` directory or using root scripts like `npm run db:migrate --prefix backend`)

*   **Migrate database:** `npm run db:migrate`
*   **Undo last migration:** `npm run db:migrate:undo`
*   **Seed database:** `npm run db:seed`
*   **Reset database (drop, create, migrate, seed):** `npm run db:reset` (USE WITH CAUTION IN PRODUCTION!)

## 8. Testing

(Run from respective `backend/` or `frontend/` directories or using root scripts)

*   **Backend Unit/Integration/API tests:** `npm test --prefix backend`
    *   For coverage: `npm test --prefix backend -- --coverage`
*   **Frontend Unit/Component tests:** `npm test --prefix frontend`
*   **Performance tests (Artillery):**
    1.  Install Artillery globally: `npm install -g artillery`
    2.  From `backend/` directory: `artillery run performance-tests.yml`
    3.  Ensure `users.csv` exists in `backend/` for authenticated tests.

## 9. API Documentation

The API follows a RESTful design. Below is a high-level overview. A full Swagger/OpenAPI specification could be generated using tools like `swagger-jsdoc` and `swagger-ui-express` for production.

**Base URL:** `/api` (e.g., `http://localhost:5000/api`)

### Authentication

*   `POST /auth/register` - Register a new user.
    *   Body: `{ name, email, password, role? }`
    *   Response: `{ user: { id, name, email, role, createdAt, updatedAt }, tokens: { access: { token, expires }, refresh: { token, expires } } }`
*   `POST /auth/login` - Authenticate a user.
    *   Body: `{ email, password }`
    *   Response: `{ user, tokens }` (same as register)
*   `POST /auth/logout` - Invalidate tokens (client-side only for this JWT implementation).
    *   Auth required: Yes

### Users (Admin Only)

*   `POST /users` - Create a new user.
    *   Auth required: Admin
*   `GET /users` - Get all users.
    *   Auth required: Admin, Editor
*   `GET /users/:userId` - Get a single user by ID.
    *   Auth required: Admin, Editor
*   `PATCH /users/:userId` - Update a user by ID.
    *   Auth required: Admin
*   `DELETE /users/:userId` - Delete a user by ID.
    *   Auth required: Admin

### Posts (Admin, Editor)

*   `POST /posts` - Create a new post.
    *   Auth required: Admin, Editor
*   `GET /posts` - Get all posts (can be cached).
    *   Auth required: No (public access by default)
*   `GET /posts/:postId` - Get a single post by ID (can be cached).
    *   Auth required: No (public access by default)
*   `PATCH /posts/:postId` - Update a post by ID.
    *   Auth required: Admin, Editor (or Post owner)
*   `DELETE /posts/:postId` - Delete a post by ID.
    *   Auth required: Admin, Editor (or Post owner if role permits)

### Categories (Admin, Editor)

*   `POST /categories` - Create a new category.
    *   Auth required: Admin, Editor
*   `GET /categories` - Get all categories (can be cached).
    *   Auth required: No (public access by default)
*   `GET /categories/:categoryId` - Get a single category by ID (can be cached).
    *   Auth required: No (public access by default)
*   `PATCH /categories/:categoryId` - Update a category by ID.
    *   Auth required: Admin, Editor
*   `DELETE /categories/:categoryId` - Delete a category by ID.
    *   Auth required: Admin

### Media (Authenticated Users)

*   `POST /media/upload` - Upload a new media file.
    *   Auth required: Any authenticated user
    *   `Content-Type: multipart/form-data` with field `file`
*   `GET /media` - Get all media items (can be cached).
    *   Auth required: No (public access by default, or restricted as needed)
*   `GET /media/:mediaId` - Get a single media item by ID (can be cached).
    *   Auth required: No (public access by default)
*   `DELETE /media/:mediaId` - Delete a media item by ID.
    *   Auth required: Admin, Editor, User (or Media item owner)

## 10. Architecture Documentation

### Backend (Node.js/Express)

*   **Modular Design:** Separated into `config`, `models`, `controllers`, `routes`, `middlewares`, `utils` for better organization and maintainability.
*   **ORM:** Sequelize is used to interact with PostgreSQL, providing an abstraction layer for database operations, migrations, and model definitions.
*   **Authentication:** JWT (JSON Web Tokens) are used for stateless authentication. Access tokens have a short lifespan, while refresh tokens (though not fully implemented in this example for simplicity) would be used to obtain new access tokens.
*   **Authorization (RBAC):** Middleware checks `req.user.role` against required roles to restrict access to certain routes or actions.
*   **Error Handling:** A centralized error handling mechanism ensures consistent API error responses and proper logging. `ApiError` class is used for custom operational errors.
*   **Logging:** Winston provides structured logging, configured for different log levels based on the environment.
*   **Caching:** Redis is integrated as a caching layer for read-heavy endpoints, improving performance and reducing database load.
*   **Rate Limiting:** `express-rate-limit` with a Redis store prevents abuse by limiting the number of requests per IP within a time window.
*   **Security:** `helmet`, `xss-clean`, `hpp`, `cors`, and `compression` middlewares enhance security and performance.
*   **Input Validation:** Joi schemas are used with a custom `validate` middleware to ensure all incoming request data is well-formed.

### Frontend (React.js)

*   **Component-Based:** UI is broken down into reusable components (e.g., `Navbar`) and page-level components (e.g., `Login`, `Dashboard`, `Posts`).
*   **Routing:** `react-router-dom` handles client-side routing, with `ProtectedRoute` components enforcing authentication and authorization.
*   **State Management:** React Context API is used for global state like authentication (`AuthContext`), keeping it simple for common needs. For more complex state, a library like Redux or Zustand could be integrated.
*   **API Interaction:** `axios` is configured with interceptors to automatically attach JWT tokens to requests and handle global error responses (e.g., token expiration).
*   **Basic UI/UX:** The provided UI is functional but minimal, designed for extensibility with proper CSS frameworks or component libraries.

## 11. Deployment Guide

This project is containerized with Docker, making deployment relatively straightforward.

1.  **Server Setup:**
    *   Provision a Linux server (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine).
    *   Install Docker and Docker Compose on the server.
    *   Install a reverse proxy like Nginx (recommended) to handle SSL termination, serve static files, and forward requests to your Docker containers.

2.  **Environment Variables:**
    *   Create a `.env` file on your server (e.g., in `/path/to/your/cms-app/.env`).
    *   Fill in environment variables appropriate for your production environment, especially `DB_HOST`, `REDIS_HOST`, `JWT_SECRET`, `FRONTEND_URL`, and any sensitive information.
        *   `DB_HOST` and `REDIS_HOST` would typically be the names of your Docker services if they're in the same `docker-compose.yml`, or external URLs if using managed services (e.g., AWS RDS, Elasticache).
        *   `FRONTEND_URL` should be your production domain (e.g., `https://yourdomain.com`).
        *   `NODE_ENV=production` is critical.

3.  **CI/CD (GitHub Actions - as configured):**
    *   Ensure your GitHub repository has the necessary secrets configured (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_USER`, `PRODUCTION_SSH_KEY`, `PRODUCTION_API_BASE_URL`).
    *   Pushing to the `main` branch will trigger the `deploy-to-production` job.
    *   The GitHub Actions workflow builds Docker images and pushes them to Docker Hub (or your chosen container registry).
    *   It then SSHs into your production server and pulls the latest images and restarts your Docker Compose services.

4.  **Manual Deployment (Alternative to CI/CD):**
    1.  SSH into your server.
    2.  Clone the repository: `git clone https://github.com/your-username/cms-project.git /path/to/your/cms-app`
    3.  Copy `docker-compose.yml` and your `.env` file to `/path/to/your/cms-app`.
    4.  Log in to Docker Hub (or your registry): `docker login -u your_docker_username -p your_docker_password`
    5.  Build and run containers:
        ```bash
        cd /path/to/your/cms-app
        docker-compose build --no-cache
        docker-compose up -d
        ```
    6.  **Database Migrations (Production):** It's generally safer to run migrations as a separate step or via a specialized tool rather than directly in `docker-compose up`.
        ```bash
        docker-compose exec backend npm run db:migrate
        ```
        (Consider `docker-compose run --rm backend npm run db:migrate` for one-off commands).

5.  **Nginx Configuration (Example):**
    A basic Nginx configuration might look like this (placed in `/etc/nginx/sites-available/yourdomain.com` and symlinked to `sites-enabled`):

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration (Use Certbot for Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";

        location / {
            proxy_pass http://localhost:3000; # Frontend service
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            proxy_pass http://localhost:5000/api/; # Backend service
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /uploads/ {
            # Directly serve static files from the backend container's uploads volume
            # Or, if Nginx has access to the host's mounted volume:
            alias /path/to/your/cms-app/backend/uploads/; # Ensure this path is correct on the host
            expires 30d; # Cache static files
            add_header Cache-Control "public, max-age=2592000";
        }
    }
    ```
    Remember to replace `yourdomain.com`, `/path/to/your/cms-app`, and setup Certbot for SSL.

## 12. Contribution

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure tests pass.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Create a pull request.

## 13. License

This project is licensed under the MIT License. See the `LICENSE` file for details.