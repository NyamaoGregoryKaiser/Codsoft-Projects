# CMS Project Architecture Documentation

This document outlines the high-level architecture, design patterns, and module structure of the Enterprise-Grade Content Management System (CMS).

## 1. High-Level Overview

The CMS is designed as a **Monorepo** containing two primary applications: a **Backend API** and a **Frontend Single Page Application (SPA)**. Both applications are containerized using Docker and orchestrated with Docker Compose for local development and production deployment.

### System Diagram

```mermaid
graph TD
    subgraph Client Tier
        C[Web Browser] -- HTTP/S --> FE_Nginx[Nginx (Frontend)]
    end

    subgraph Application Tier
        FE_Nginx -- Static Files --> FE_React[React SPA]
        FE_React -- API Calls (Axios) --> BE_Express[Node.js/Express API]
        BE_Express -- External Services (Optional) --> CloudStorage(Cloud Storage like S3 for Media)
    end

    subgraph Data Tier
        BE_Express -- ORM (Sequelize) --> DB_PostgreSQL[PostgreSQL Database]
        BE_Express -- Caching (Node-Cache/Redis) --> Cache[Cache Layer]
    end

    subgraph Infrastructure & Monitoring
        DevOps[CI/CD Pipelines - GitHub Actions] -- Deployment --> Docker[Docker Environment]
        Docker -- Containerization --> {FE_Nginx, BE_Express, DB_PostgreSQL}
        BE_Express -- Structured Logging --> LogFiles[Winston Log Files]
        BE_Express -- Metrics (Prometheus/Grafana - Future) --> Monitoring[Monitoring System]
    end

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style FE_Nginx fill:#bbf,stroke:#333,stroke-width:2px
    style FE_React fill:#bbf,stroke:#333,stroke-width:2px
    style BE_Express fill:#ccf,stroke:#333,stroke-width:2px
    style DB_PostgreSQL fill:#cfc,stroke:#333,stroke-width:2px
    style Cache fill:#ffc,stroke:#333,stroke-width:2px
    style LogFiles fill:#fcf,stroke:#333,stroke-width:2px
    style Monitoring fill:#fcf,stroke:#333,stroke-width:2px
    style DevOps fill:#dcf,stroke:#333,stroke-width:2px
    style Docker fill:#eef,stroke:#333,stroke-width:2px
    style CloudStorage fill:#f0f0f0,stroke:#333,stroke-width:2px
```

## 2. Backend Architecture (`backend/`)

The backend follows a **layered architecture** and **separation of concerns** principles.

### 2.1. Folder Structure

*   **`src/server.js`**: Entry point, initializes Express app and connects to DB.
*   **`src/app.js`**: Central Express application setup (middleware, routes, error handling).
*   **`src/config/`**: Environment-specific configurations and database connection settings.
*   **`src/models/`**: Defines Sequelize ORM models and their associations (e.g., User, Post, Category). `index.js` initializes all models.
*   **`src/services/`**: Contains core business logic. Services interact with models, perform data manipulation, validation, and complex operations. They are designed to be independent of the HTTP request/response cycle.
*   **`src/controllers/`**: Handles incoming HTTP requests, extracts data from `req` (body, params, query), calls appropriate service methods, and formats the response for `res`. They act as a bridge between routes and services.
*   **`src/routes/`**: Defines API endpoints and maps them to controller methods. Includes authentication and authorization middleware.
*   **`src/middleware/`**: Reusable Express middleware functions for cross-cutting concerns (e.g., authentication, authorization, error handling, rate limiting).
*   **`src/utils/`**: Helper utilities like logging (`winston`), JWT token generation, and caching (`node-cache`).
*   **`migrations/`**: Database schema changes managed by Sequelize CLI.
*   **`seeders/`**: Initial data population scripts for the database.
*   **`tests/`**: Contains unit, integration, and API tests.

### 2.2. Design Patterns & Principles

*   **MVC-like Structure**: Routes act as controllers, controllers delegate to services, services interact with models (data layer).
*   **Dependency Injection (Implicit)**: Services and utilities are imported where needed, making components loosely coupled.
*   **Error Handling Middleware**: A single, centralized middleware (`errorHandler.js`) catches all errors, logs them, and sends consistent JSON error responses to the client. This prevents unhandled exceptions and standardizes API error formats.
*   **Structured Logging**: Using Winston, logs are categorized by level (debug, info, warn, error, http) and output in a structured format (JSON for files, colored text for console), aiding in debugging and monitoring.
*   **JWT Authentication**: Stateless authentication mechanism where tokens are issued upon login and validated on subsequent requests.
*   **Role-Based Access Control (RBAC)**: `authMiddleware.js` provides `authorize` function to restrict route access based on user roles (`admin`, `editor`, `viewer`).
*   **Caching**: An in-memory cache (`node-cache`) is implemented in `utils/cache.js` and integrated into services (e.g., `postService.js`) to reduce database load for frequently accessed read operations. This can be easily swapped for a distributed cache like Redis in a clustered environment.
*   **Rate Limiting**: `express-rate-limit` middleware prevents abuse and DDoS attacks by limiting the number of requests a client can make within a time window.
*   **Security Headers**: `helmet.js` is used to set various HTTP headers that help protect the application from common web vulnerabilities.
*   **Input Validation**: Performed at the model level (Sequelize validators) and sometimes explicitly in controllers/services.

## 3. Frontend Architecture (`frontend/`)

The frontend is a React Single Page Application (SPA) built using Create React App.

### 3.1. Folder Structure

*   **`src/index.js`**: Entry point for the React application.
*   **`src/App.js`**: Main application component, handles routing and global state (e.g., user authentication context).
*   **`src/api/`**: Centralized Axios instance and functions for interacting with the backend API.
*   **`src/components/`**: Reusable UI components (e.g., `LoginForm`, `Navbar`, `PostCard`).
*   **`src/pages/`**: Page-level components that compose smaller components to form complete views (e.g., `LoginPage`, `DashboardPage`, `PostsPage`).
*   **`src/context/`**: (If using Context API) Manages global state (e.g., `AuthContext`).
*   **`src/hooks/`**: Custom React Hooks for reusable logic.
*   **`src/styles/`**: Global styles or theme definitions.
*   **`tests/`**: Frontend unit and integration tests using React Testing Library and Jest.

### 3.2. Design Patterns & Principles

*   **Component-Based Architecture**: UI is broken down into small, reusable components.
*   **React Router DOM**: Manages client-side routing, enabling navigation without full page reloads.
*   **Context API / useState**: Simple, built-in state management for global data like authentication status and user information. For larger applications, a dedicated state management library (e.g., Redux, Zustand, Recoil) might be considered.
*   **Axios for API Calls**: A promise-based HTTP client for making requests to the backend, often configured with interceptors for error handling and token attachment.
*   **Responsive Design**: Basic CSS styling is included, with potential for expansion to a full UI library or CSS framework.

## 4. Database Schema (PostgreSQL with Sequelize)

The database schema is designed to support core CMS functionalities with relationships between entities.

### Key Models:

*   **`User`**:
    *   `id` (UUID, Primary Key)
    *   `username` (String, Unique)
    *   `email` (String, Unique, Indexed)
    *   `password` (String, Hashed)
    *   `role` (ENUM: `admin`, `editor`, `viewer`, Indexed)
    *   `isActive` (Boolean, Indexed)
    *   `lastLogin` (Date)
    *   `createdAt`, `updatedAt`
*   **`Category`**:
    *   `id` (UUID, Primary Key)
    *   `name` (String, Unique, Indexed)
    *   `slug` (String, Unique, Indexed)
    *   `description` (Text)
    *   `createdAt`, `updatedAt`
*   **`Post`**:
    *   `id` (UUID, Primary Key)
    *   `title` (String)
    *   `slug` (String, Unique, Indexed)
    *   `content` (Text)
    *   `excerpt` (String)
    *   `status` (ENUM: `draft`, `published`, `archived`, Indexed)
    *   `featuredImage` (String - URL)
    *   `publishedAt` (Date, Indexed)
    *   `authorId` (UUID, Foreign Key to `User.id`, Indexed)
    *   `categoryId` (UUID, Foreign Key to `Category.id`, Indexed)
    *   `createdAt`, `updatedAt`

### Relationships:

*   **One-to-Many**:
    *   `User` has many `Posts` (a post belongs to one author).
    *   `Category` has many `Posts` (a post belongs to one category).

## 5. Scalability Considerations

*   **Stateless Backend**: JWT authentication allows the backend to be stateless, making it easy to scale horizontally by adding more instances behind a load balancer.
*   **Database Scaling**: PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding - more complex). ORM usage facilitates database changes.
*   **Caching**: Node-Cache is in-memory, suitable for single instances. For horizontal scaling, integrate a distributed cache like Redis.
*   **Microservices (Future)**: The service layer in the backend provides a clear boundary, making it easier to extract specific functionalities into separate microservices if the application grows significantly in complexity or traffic.
*   **Media Storage**: For production, featured images would typically be stored in cloud object storage (e.g., AWS S3, Google Cloud Storage) instead of local file system, with URLs stored in the database.

## 6. Security Considerations

*   **Password Hashing**: Bcrypt.js is used with a configurable salt rounds for strong password storage.
*   **JWT Security**: Tokens are signed with a strong secret and have expiry times.
*   **Input Validation**: Prevents common injection attacks (SQL, XSS) by sanitizing and validating all user inputs.
*   **CORS**: Configured to only allow requests from the specified frontend origin.
*   **HTTP Headers**: Helmet.js adds various security headers to mitigate common web vulnerabilities.
*   **Environment Variables**: Sensitive information (database credentials, JWT secret) is stored in environment variables, not committed to source control.
*   **HTTPS**: Critical for production to encrypt all traffic between client and server. Nginx (frontend container) can be configured with SSL certificates.
*   **Least Privilege**: User roles define minimal necessary permissions.

## 7. Future Enhancements

*   **Rich Text Editor**: Integrate a powerful rich text editor (e.g., TinyMCE, Quill) for post content.
*   **Media Library**: Implement robust media management with file uploads to cloud storage (e.g., S3).
*   **Versioning**: Track changes to posts for rollback capabilities.
*   **Scheduled Publishing**: Ability to schedule posts to be published at a future date/time.
*   **SEO Tools**: Add meta tags, sitemap generation, etc.
*   **User Interface**: Enhance frontend UI/UX with a design system, advanced filtering, and real-time updates.
*   **Internationalization (i18n)**: Support for multiple languages.
*   **GraphQL API**: Explore GraphQL as an alternative or alongside REST for more flexible data fetching.
*   **Webhooks**: For external integrations (e.g., notify other services on new post).
*   **Search**: Implement full-text search with dedicated solutions (e.g., ElasticSearch, Algolia) for large datasets.
```