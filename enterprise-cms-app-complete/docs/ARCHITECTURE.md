# CMS Project Architecture

This document outlines the high-level architecture, design principles, and technologies used in the CMS project.

## 1. High-Level Overview

The CMS is a full-stack web application designed with a clear separation of concerns, following a client-server architecture. It consists of:

*   **Frontend (Client-side):** A React.js single-page application (SPA) providing the user interface for content creators, administrators, and public visitors.
*   **Backend (Server-side):** A Node.js Express.js API responsible for handling business logic, data persistence, authentication, and serving content to the frontend and other potential clients.
*   **Database:** A PostgreSQL relational database for structured data storage.
*   **Caching:** A Redis in-memory data store for accelerating common data retrieval.
*   **Infrastructure:** Docker for containerization, Docker Compose for local orchestration, and GitHub Actions for CI/CD.

```
+----------------+      +------------------+      +---------------+
|    Browser     | <--> |   React Frontend   | <--> | Node.js API   |
| (User Interface)|      | (Client-side logic)|      | (Backend Logic)|
+----------------+      +------------------+      +-------+-------+
                                                            |
                                                            | HTTP/REST
                                                            |
                                                  +---------+--------+
                                                  |   Middleware     |
                                                  | (Auth, RateLimit)|
                                                  +---------+--------+
                                                            |
                                                            |
                                                  +---------+--------+
                                                  |   Services       |
                                                  | (Business Logic) |
                                                  +---------+--------+
                                                            |
                 +-------------------+                        | (ORM / Data Access)
                 | Redis (Caching)   | <----------------------+
                 +-------------------+                        |
                                                            +----------------+
                                                            |  PostgreSQL    |
                                                            | (Data Storage) |
                                                            +----------------+
```

## 2. Backend Architecture (Node.js/Express)

The backend follows a modular, layer-based architecture to ensure maintainability, scalability, and separation of concerns.

*   **`server.js`**: The application's entry point. Initializes the Express app, connects to the database, Redis, and starts the server.
*   **`app.js`**: Configures the Express application with middleware (security, CORS, rate limiting, error handling) and mounts API routes.
*   **`config/`**: Contains environment-specific configurations for the database, JWT, Redis, etc.
*   **`models/`**: Defines Sequelize ORM models for database entities (User, Post, Category, Media) and their associations. Database schema is managed via migrations.
*   **`migrations/`**: Version-controlled database schema changes using Sequelize CLI.
*   **`seeders/`**: Scripts to populate the database with initial data.
*   **`services/`**: Encapsulates the core business logic. Each service is responsible for a specific domain (e.g., `authService`, `postService`). Services interact directly with models and include data validation, caching logic, and complex operations.
*   **`controllers/`**: Handles incoming HTTP requests, validates input using Joi, calls the appropriate service methods, and sends back HTTP responses. Keeps business logic out of controllers.
*   **`routes/`**: Defines API endpoints, maps them to controller methods, and applies necessary middleware (authentication, authorization, file uploads).
*   **`middleware/`**:
    *   `authMiddleware.js`: Handles JWT token verification and extracts user information.
    *   `authorize.js`: Checks user roles against required permissions for specific routes.
    *   `errorHandler.js`: Centralized error handling, catches errors from routes/middleware/services, logs them, and sends standardized error responses. Includes `ApiError` for custom operational errors.
    *   `rateLimitMiddleware.js`: Protects against brute-force and DDoS attacks.
    *   `uploadMiddleware.js`: Handles file uploads using Multer.
*   **`utils/`**: Contains utility functions like JWT token generation/verification, and a Winston-based logger.

**Data Flow Example (Create Post):**
1.  **Frontend:** User submits a form to create a new post.
2.  **`POST /api/posts` (Route):** Receives the request.
3.  **`authenticate` Middleware:** Verifies JWT token, attaches `req.user`.
4.  **`authorize` Middleware:** Checks if `req.user.role` is `admin`, `editor`, or `author`.
5.  **`postController.createPost` (Controller):** Validates request body using Joi. Calls `postService.createPost()`.
6.  **`postService.createPost` (Service):** Performs business logic (e.g., checks for unique slug), interacts with `Post` model to save data to PostgreSQL. Invalidates relevant Redis cache keys.
7.  **`Post` Model (Sequelize):** Handles ORM operations with PostgreSQL.
8.  **`postService.createPost` (Service):** Returns the created post.
9.  **`postController.createPost` (Controller):** Formats the response and sends it back to the client.

## 3. Frontend Architecture (React)

The frontend is built using React.js and utilizes `react-router-dom` for navigation.

*   **`index.js`**: Entry point for the React application, setting up the root component and React Router.
*   **`App.js`**: The main application component, manages global state (e.g., user authentication context) and renders the `Navbar` and `AppRouter`.
*   **`router.js`**: Defines application routes using `react-router-dom`, including public and private routes. Implements `PrivateRoute` component for authentication and basic role-based authorization at the client-side routing level.
*   **`api/api.js`**: Centralized Axios instance for making API requests to the backend. Configured with request/response interceptors for automatically attaching JWT tokens and handling token expiry.
*   **`components/`**: Reusable UI components (e.g., `Navbar`, `ContentEditor`).
*   **`pages/`**: Page-level components that represent different views of the application (e.g., `LoginPage`, `DashboardPage`, `PostListPage`, `PostCreateEditPage`). These pages fetch data using the `api` client and manage their local state.
*   **`utils/AuthContext.js`**: React Context for managing and providing authentication state (user object, login/logout functions) throughout the application.

## 4. Database Layer (PostgreSQL with Sequelize)

*   **Relational Database:** PostgreSQL is chosen for its robustness, reliability, and advanced features.
*   **ORM:** Sequelize is used as the Object-Relational Mapper, abstracting SQL queries and providing a powerful way to define models, associations, and perform database operations using JavaScript objects.
*   **Schema Definition:** Models (e.g., `User.js`, `Post.js`) define table schemas, data types, validations, and hooks (e.g., password hashing `beforeCreate`/`beforeUpdate`).
*   **Migrations:** Sequelize CLI is used to create and manage database migrations, ensuring schema changes are applied consistently across environments.
*   **Query Optimization:**
    *   **Indexing:** Important columns (e.g., `slug`, `authorId`, `categoryId`, `status`, `publishedAt`) are indexed in migrations to speed up common queries.
    *   **Eager Loading:** Sequelize's `include` option is used to fetch associated data (e.g., `Post` with `author` and `category`) in a single query, reducing N+1 problems.

## 5. Caching Layer (Redis)

*   **In-Memory Store:** Redis is used as an in-memory data store for caching frequently accessed data.
*   **Service Integration:** The `cacheService` module provides a Redis client and methods for `get`, `set`, and `del` operations.
*   **Targeted Caching:** Currently, `getAllPosts` and `getAllCategories`, `getPostByIdentifier`, `getCategoryByIdentifier` responses are cached. When data is modified (e.g., a post is created/updated/deleted), relevant cache keys are invalidated to ensure data freshness.

## 6. Authentication & Authorization

*   **Authentication:** JWT (JSON Web Tokens) are used. Upon successful login, a token is issued and stored client-side. This token is sent with every subsequent request in the `Authorization` header.
*   **Authorization (Backend):**
    *   `authenticate` middleware: Verifies the JWT and populates `req.user` with decoded user information (ID, email, role).
    *   `authorize` middleware: Takes an array of allowed roles and checks if `req.user.role` is among them.
*   **Authorization (Frontend):**
    *   `PrivateRoute` component: Wraps routes that require authentication, redirecting unauthenticated users to the login page.
    *   Conditional rendering: UI elements (e.g., navigation links, action buttons) are conditionally rendered based on the logged-in user's role (`user.role`).

## 7. Development & Deployment

*   **Local Development:** Docker Compose provides an isolated and consistent development environment for all services.
*   **CI/CD:** GitHub Actions (configured in `.github/workflows/ci-cd.yml`) automates testing and deployment steps (build, test, deploy to cloud).
*   **Containerization:** Dockerfiles are provided for both backend and frontend, enabling consistent builds and deployments to any container-compatible environment.
*   **Static File Serving:** Backend serves uploaded media files from `/uploads`. Frontend production build is served by Nginx.

## 8. Quality & Maintainability

*   **Modular Design:** Clear separation of concerns into services, controllers, models, and middleware.
*   **Input Validation:** Joi schemas ensure data integrity and prevent common vulnerabilities.
*   **Error Handling:** Centralized error middleware provides consistent and informative error responses.
*   **Logging:** Winston is used for structured logging, aiding in debugging and monitoring.
*   **Testing:** Unit and integration tests cover critical parts of the backend. Frontend tests (conceptual) ensure component functionality.
*   **Code Linting & Formatting:** ESLint and Prettier (configured in `package.json` and `.eslintrc.js`) enforce code quality standards.

This architecture provides a solid foundation for a scalable and maintainable CMS, ready for further feature development and deployment.