```markdown
# Enterprise Content Manager (ECM)

A comprehensive, production-ready Content Management System (CMS) built with Node.js (Express), React, and PostgreSQL. This project focuses on delivering an enterprise-grade solution with robust backend, dynamic frontend, and a strong emphasis on security, scalability, and maintainability.

## Table of Contents

1.  [Features](#features)
2.  [Technologies Used](#technologies-used)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Setup with Docker Compose](#local-setup-with-docker-compose)
    *   [Manual Setup (Without Docker)](#manual-setup-without-docker)
4.  [API Documentation](#api-documentation)
5.  [Architecture](#architecture)
6.  [Testing](#testing)
7.  [Deployment Guide](#deployment-guide)
8.  [Additional Features](#additional-features)
9.  [Contributing](#contributing)
10. [License](#license)

## 1. Features

**Core CMS Functionality:**

*   **User Management:** Register, Login, User profiles, Role-Based Access Control (RBAC: User, Author, Editor, Admin).
*   **Content Management (Posts):** CRUD operations for articles/posts, rich text content (conceptual), featured images, status (draft, published, archived), categories, author attribution.
*   **Category Management:** CRUD operations for content categorization.
*   **Media Management:** File uploads (images, PDFs, videos), storage, and retrieval.
*   **Slug Generation:** Automatic and customizable SEO-friendly slugs for posts and categories.

**Technical & Enterprise-Grade Features:**

*   **API Endpoints:** RESTful API with full CRUD operations for all modules.
*   **Authentication & Authorization:** JWT-based authentication, Express middleware for protected routes and role checks.
*   **Database Layer:** PostgreSQL with Sequelize ORM, database migrations, and seed data.
*   **Error Handling:** Centralized error handling middleware.
*   **Logging:** Structured logging with Winston.
*   **Request Validation:** Joi-based input validation.
*   **Security:** Helmet middleware for HTTP headers, CORS, bcrypt for password hashing.
*   **Performance:** Rate limiting, pagination, query optimization (eager loading, indexing).
*   **Containerization:** Docker and Docker Compose setup for local development and deployment.
*   **CI/CD:** GitHub Actions workflow for automated testing and deployment.
*   **Testing:** Unit, Integration, and API tests.
*   **Caching (Conceptual):** Hooks for integrating Redis.

## 2. Technologies Used

**Backend (Node.js/Express):**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** Sequelize
*   **Authentication:** JSON Web Tokens (JWT), bcryptjs
*   **Validation:** Joi
*   **File Uploads:** Multer
*   **Logging:** Winston, Morgan
*   **Security:** Helmet, express-rate-limit, cors
*   **Utilities:** `dotenv`, `http-status`, `uuid`

**Frontend (React):**
*   **Framework:** React.js (Create React App structure)
*   **Routing:** React Router DOM
*   **State Management:** React Context API, `useState`, `useReducer`
*   **API Client:** Axios
*   **Styling:** TailwindCSS (conceptual, basic CSS included)
*   **Auth Utilities:** `jwt-decode`

**DevOps & Tooling:**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** Jest, Supertest
*   **API Docs:** Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)
*   **Database Migrations:** Sequelize CLI
*   **Performance Testing:** k6 (conceptual script)

## 3. Getting Started

### Prerequisites

*   Git
*   Node.js (v18+) and npm
*   Docker and Docker Compose (recommended for easy setup)
*   PostgreSQL (if not using Docker)

### Local Setup with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecm-cms.git
    cd ecm-cms
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the project root:
    ```bash
    cp .env.example .env
    ```
    **Important:** Update the `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` variables in `.env` to match your local setup or preferences. For Docker Compose, the `DATABASE_URL` for the backend should point to the `db` service: `postgres://user:password@db:5432/ecm_cms_db`.

3.  **Build and run Docker containers:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the frontend (React) and backend (Node.js) Docker images.
    *   Start a PostgreSQL database service.
    *   Start the backend application (running on port `5000` locally, mapped from container `5000`).
    *   Start the frontend application (running on port `3000` locally, mapped from container `3000`).
    *   Wait for PostgreSQL to be healthy before starting the backend.

4.  **Run database migrations and seed data:**
    Once the backend container is up and running (it might take a moment), execute the migrations and seeders inside the `backend` container:
    ```bash
    docker exec -it ecm-cms-backend-1 npm run migrate --workspace=server
    docker exec -it ecm-cms-backend-1 npm run seed --workspace=server
    ```
    (Replace `ecm-cms-backend-1` with your actual backend container name if different, use `docker-compose ps` to find it.)

5.  **Access the applications:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:5000/api/v1`
    *   **Swagger API Docs:** `http://localhost:5000/api/v1/docs` (only in `development` environment)

    **Default Users (from seed data):**
    *   **Admin:** `admin@example.com` / `admin123`
    *   **Editor:** `editor@example.com` / `editor123`
    *   **Author:** `author@example.com` / `author123`

### Manual Setup (Without Docker)

This setup assumes you have a local PostgreSQL instance running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecm-cms.git
    cd ecm-cms
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the project root.
    **Important:** Update the `DATABASE_URL` to point to your local PostgreSQL instance (e.g., `postgres://user:password@localhost:5432/ecm_cms_db`), and configure `JWT_SECRET` and `CORS_ORIGIN`.

3.  **Install backend dependencies:**
    ```bash
    cd server
    npm install
    ```

4.  **Run backend migrations and seed data:**
    Ensure your PostgreSQL database is running and accessible.
    ```bash
    npm run migrate
    npm run seed
    ```

5.  **Start the backend server:**
    ```bash
    npm run dev # for development with nodemon
    # or
    npm start # for production-like start
    ```
    The backend will run on `http://localhost:5000`.

6.  **Install frontend dependencies:**
    Open a new terminal and navigate to the `client` directory:
    ```bash
    cd ../client
    npm install
    ```

7.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

## 4. API Documentation

Interactive API documentation is available via Swagger UI at `http://localhost:5000/api/v1/docs` when the backend is running in `development` mode.

A static version of the API documentation can be found in `docs/api.md`.

## 5. Architecture

The ECM CMS follows a decoupled, monorepo-like architecture:

*   **Frontend (client/):** A single-page application (SPA) built with React, consuming the RESTful API.
*   **Backend (server/):** A RESTful API built with Node.js and Express.js. It handles business logic, data persistence, authentication, and serves as the primary interface for the frontend.
    *   **MVC-like structure:** Controllers, Services, Models.
    *   **Middleware:** For authentication, authorization, error handling, logging, validation, and rate limiting.
    *   **Database:** PostgreSQL, accessed via Sequelize ORM.
*   **Shared Utilities:** Common configurations, logging, and validation schemas.
*   **Monorepo Tools:** npm workspaces for managing `client` and `server` packages within a single repository.

**Diagram (Conceptual):**

```
+----------------+          +-----------------------+          +------------------+
|    Client      |          |       Backend         |          |    Database      |
|  (React SPA)   |          |  (Node.js / Express)  |          |   (PostgreSQL)   |
|                |          |                       |          |                  |
|  User actions  |--------->|   Routes / Controllers|          |                  |
| (Login, CRUD)  |   HTTP   |                       |          |                  |
|                |<---------|   Services (Logic)    |<-------->|  Sequelize ORM   |
|  Displays UI   |  (JSON)  |                       |   SQL    |                  |
|                |          |   Models (Schema)     |          |   Tables         |
|                |          |                       |          | (Users, Posts,   |
|                |          |   Middleware          |          | Categories, Media)|
|                |          | (Auth, Error, Logging)|          |                  |
+----------------+          +-----------------------+          +------------------+
                                        ^
                                        |
                                        +-----------------+
                                        |  File Storage   |
                                        |  (Local/S3)     |
                                        +-----------------+
```

## 6. Testing

The project emphasizes quality through various testing methodologies:

*   **Unit Tests:**
    *   **Backend (`server/tests/unit/`):** Jest for testing individual functions, services, and isolated components of the backend logic. Achieves high code coverage.
    *   **Frontend (`client/tests/components/`):** Jest and React Testing Library for testing React components in isolation.
*   **Integration Tests:**
    *   **Backend (`server/tests/integration/`):** Supertest is used with Jest to test API endpoints, ensuring controllers, services, and database interactions work correctly together.
*   **API Tests:**
    *   Swagger UI (`/api/v1/docs`) provides a visual interface for manually testing API endpoints.
    *   Integration tests cover the core API logic.
*   **Performance Tests:**
    *   A sample `k6` script (`performance_tests/k6_script.js`) is provided to demonstrate how to perform load and stress testing on the API endpoints. This helps identify performance bottlenecks and ensure scalability under load.

**Running Tests:**
*   From the root directory: `npm test` (runs both backend and frontend tests)
*   For backend tests: `cd server && npm test`
*   For backend coverage: `cd server && npm run test:coverage`
*   For frontend tests: `cd client && npm test`

## 7. Deployment Guide

### Overview

Deployment to production typically involves:
1.  **Building:** Create optimized production builds for both frontend and backend.
2.  **Containerizing:** Package the application into Docker images.
3.  **Orchestrating:** Deploy containers to a cloud environment (e.g., Kubernetes, AWS ECS, Google Cloud Run, DigitalOcean App Platform, Render.com).
4.  **Database Setup:** Ensure a managed PostgreSQL database service is used.
5.  **Environment Configuration:** Securely manage environment variables (secrets).
6.  **Domain & SSL:** Configure a domain and SSL certificate.

### Steps (using Docker & a Cloud VM example)

1.  **Prepare Production `.env`:**
    Create a production `.env` file for your server (e.g., `production.env`) or securely configure environment variables in your cloud provider's console.
    **Crucial:** Use strong, unique values for `JWT_SECRET` and ensure `DATABASE_URL` points to your *production* PostgreSQL database. `CORS_ORIGIN` should be your frontend's production URL.

2.  **Build Docker Image:**
    From the root directory, build the production Docker image:
    ```bash
    docker build -t your_docker_username/ecm-cms:latest .
    ```
    This Dockerfile builds the frontend, then the backend, and combines them into a single image.

3.  **Push to Docker Registry:**
    Log in to Docker Hub (or your preferred registry) and push the image:
    ```bash
    docker login
    docker push your_docker_username/ecm-cms:latest
    ```

4.  **Server Setup (Example: Linux VM):**
    *   Provision a Linux server (e.g., AWS EC2, DigitalOcean Droplet).
    *   Install Docker and Docker Compose on the server.
    *   Ensure PostgreSQL database is set up and accessible from your server (e.g., using a managed database service).

5.  **Deployment on Server:**
    SSH into your server and run the application container.
    ```bash
    # Create a directory for persistent uploads
    mkdir -p /path/to/ecm-cms/uploads/posts
    mkdir -p /path/to/ecm-cms/uploads/media
    mkdir -p /path/to/ecm-cms/uploads/misc

    docker pull your_docker_username/ecm-cms:latest

    # Stop and remove any old container
    docker stop ecm-cms-app || true
    docker rm ecm-cms-app || true

    # Run the new container with production environment variables
    # Replace with your actual production variables and volume paths
    docker run -d \
      --name ecm-cms-app \
      -p 80:5000 \
      -e NODE_ENV=production \
      -e PORT=5000 \
      -e DATABASE_URL="YOUR_PROD_DATABASE_URL" \
      -e JWT_SECRET="YOUR_PROD_JWT_SECRET" \
      -e CORS_ORIGIN="YOUR_FRONTEND_PROD_URL" \
      --mount type=bind,source=/path/to/ecm-cms/uploads,target=/app/server/uploads \
      your_docker_username/ecm-cms:latest

    # Run migrations on production
    docker exec ecm-cms-app node server/node_modules/sequelize-cli/lib/sequelize db:migrate
    ```
    **Note:** For media uploads, a more robust solution would be to use cloud storage like AWS S3 or Google Cloud Storage instead of local filesystem mounts.

6.  **Reverse Proxy (Nginx - Optional but Recommended):**
    For proper domain handling, SSL termination, and serving static files, it's recommended to put Nginx in front of your Docker container.

    ```nginx
    # /etc/nginx/sites-available/ecm-cms
    server {
        listen 80;
        listen [::]:80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration (use Certbot for easy SSL)
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location /api/v1/ {
            proxy_pass http://localhost:5000; # Forward API requests to the Node.js backend
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /uploads/ {
            # Serve uploaded files directly from the host filesystem or from the container
            # If serving from host, ensure Nginx has access to `/path/to/ecm-cms/uploads`
            alias /path/to/ecm-cms/uploads/;
            # If serving from container (and Dockerfile copies to /app/server/uploads)
            # proxy_pass http://localhost:5000;
        }

        location / {
            # Serve the React frontend static files
            root /app/client/build; # Assuming Nginx runs inside a container with /app/client/build mounted
            # or if Nginx is on host and build files are copied:
            # root /path/to/ecm-cms/client/build;
            try_files $uri /index.html;
        }

        error_page 500 502 503 504 /500.html;
        location = /500.html {
            root /usr/share/nginx/html;
        }
    }
    ```
    Enable the Nginx config: `sudo ln -s /etc/nginx/sites-available/ecm-cms /etc/nginx/sites-enabled/` and `sudo nginx -t && sudo systemctl reload nginx`.

### CI/CD Deployment

The provided GitHub Actions workflow `ci-cd.yml` automates the build, test, and deployment process:
*   **`build-and-test` job:** Lints, runs unit/integration tests (with a temporary PostgreSQL container), builds the frontend.
*   **`deploy-to-prod` job:** Pushes the Docker image to a registry and then SSHs into a production server to pull and run the latest image. This requires configuring GitHub Secrets for Docker credentials and SSH access.
*   A `deploy-to-staging` job is included as a placeholder for a staging environment.

## 8. Additional Features

*   **Authentication/Authorization:** Implemented with JWT and role-based access control middleware.
*   **Logging and Monitoring:** Winston for structured logging (console, file). For production monitoring, integrate with tools like Prometheus/Grafana or cloud-specific logging/monitoring services (e.g., AWS CloudWatch, Google Cloud Logging).
*   **Error Handling Middleware:** Centralized error handling catches `ApiError` instances and other exceptions, returning standardized JSON responses.
*   **Caching Layer:** (Conceptual) For a production environment, integrating **Redis** would significantly improve performance for frequently accessed data (e.g., published posts, categories).
    *   **Implementation Idea:**
        *   Install `redis` npm package.
        *   Create a `cache.middleware.js` to check Redis before hitting the database.
        *   Create a `cache.service.js` to abstract Redis operations (set, get, del).
        *   Integrate cache invalidation in CRUD operations (e.g., delete cache entry for a post when it's updated or deleted).
    *   Example:
        ```javascript
        // In post.service.js (conceptual)
        const getPostById = async (id) => {
          const cachedPost = await cacheService.get(`post:${id}`);
          if (cachedPost) return JSON.parse(cachedPost);

          const post = await Post.findByPk(id, { /* include */ });
          if (post) await cacheService.set(`post:${id}`, JSON.stringify(post.toJSON()), 3600); // Cache for 1 hour
          return post;
        };

        const updatePostById = async (postId, updateBody) => {
          // ... update logic ...
          await cacheService.del(`post:${postId}`); // Invalidate cache
          // ...
        };
        ```
*   **Rate Limiting:** Implemented using `express-rate-limit` to protect against brute-force attacks and abuse. Configured globally and can be applied specifically to sensitive routes (e.g., login).
*   **Content Versioning/Revisions:** For a full enterprise CMS, this would be a critical feature. This involves storing historical versions of content in a separate table and allowing rollback.
*   **Rich Text Editor Integration:** The frontend components currently use basic `textarea`. In a real CMS, a library like TinyMCE, Quill, or CKEditor would be integrated.
*   **Media Optimization:** Image resizing, compression, and serving optimized formats (e.g., WebP) would be crucial for performance. This could involve cloud services or server-side processing.
*   **Scheduled Publishing:** Allowing posts to be published automatically at a future date/time (requires a cron job or similar scheduling mechanism).
*   **Search Functionality:** Advanced search using PostgreSQL's full-text search, ElasticSearch, or Algolia.

## 9. Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test`).
6.  Ensure code linting passes (`npm run lint`).
7.  Commit your changes (`git commit -am 'feat: Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature`).
9.  Create a new Pull Request.

## 10. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```