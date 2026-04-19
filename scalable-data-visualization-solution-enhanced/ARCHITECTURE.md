# Architecture Documentation - Data Visualization System

## 1. Overview

The Data Visualization System is a full-stack web application designed with a clear separation of concerns, following a client-server architecture. The primary goal is to provide a robust, scalable, and maintainable platform for data analysis and visualization.

## 2. High-Level Architecture

```
+------------------+             +-----------------+               +-----------------+
|   Client (Web)   |<----------->|  Backend (API)  |<------------->|   Database      |
| (React.js, TS)   |   (HTTP/S)  | (Node.js/Express,|   (ORM/SQL)   |  (PostgreSQL)   |
|                  |             |      TS)        |               |                 |
+------------------+             +-----------------+               +-----------------+
        ^                                 ^                                ^
        |                                 |                                |
        |        +-----------------+      |     +--------------------+     |
        +--------+  User's Browser |<-----+-----+   External Services  |---+
                 +-----------------+            +--------------------+
                                                      (e.g., CI/CD, Monitoring)
```

*   **Client (Frontend):** A single-page application (SPA) built with React.js and TypeScript. It provides the user interface for interacting with the system, including data management, visualization building, and dashboard creation.
*   **Backend (API Server):** A RESTful API built with Node.js, Express.js, and TypeScript. It handles business logic, data processing, authentication, authorization, and interacts with the database.
*   **Database:** A PostgreSQL relational database, used for persistent storage of users, datasets, visualization configurations, and dashboard layouts.

## 3. Backend Architecture (Node.js/Express)

The backend follows a layered architecture to ensure modularity and separation of concerns.

```
+-----------------------------------------------------+
|                     API Gateway (Load Balancer/Proxy)   |
+-----------------------------------------------------+
        |
        v
+-----------------------------------------------------+
|        Express.js Application (app.ts)            |
| +-------------------------------------------------+ |
| |        Middleware Layer                         | |
| | (Logging, Error Handling, Auth, Rate Limiting, Cache) |
| +-------------------------------------------------+ |
| |        Routing Layer (routes/)                  | |
| | (Defines API endpoints)                         | |
| +-------------------------------------------------+ |
| |        Controller Layer (controllers/)          | |
| | (Parses requests, calls services, sends responses)| |
| +-------------------------------------------------+ |
| |        Service Layer (services/)                | |
| | (Encapsulates Business Logic, Data Processing)  | |
| +-------------------------------------------------+ |
| |        Data Access Layer (models/)              | |
| | (TypeORM Entities, interacts with Database)     | |
| +-------------------------------------------------+ |
| |        Configuration & Utilities (config/, utils/) | |
| +-------------------------------------------------+ |
+-----------------------------------------------------+
        |
        v
+-----------------------------------------------------+
|        PostgreSQL Database (TypeORM, Migrations)  |
+-----------------------------------------------------+
```

### Key Components:

*   **`server.ts`**: The application's entry point, responsible for initializing the database connection and starting the Express server.
*   **`app.ts`**: Configures the Express application, sets up middleware, and registers routes.
*   **`config/`**: Manages environment variables and database connection settings.
*   **`middleware/`**:
    *   **Authentication (`auth.ts`):** JWT-based authentication to verify user identity.
    *   **Authorization (`authorize.ts`):** Role-based access control (RBAC) to enforce permissions.
    *   **Error Handling (`errorHandler.ts`):** Centralized error management to catch and respond to application errors consistently.
    *   **Logging (`logger.ts`):** Integrates Winston for structured logging of requests, errors, and system events.
    *   **Rate Limiting (`rateLimiter.ts`):** Protects against abuse and ensures fair usage of API resources.
    *   **Caching (`caching.ts`):** In-memory caching for API responses to improve performance for frequently requested, static data.
*   **`routes/`**: Defines the API endpoints and maps them to corresponding controller functions.
*   **`controllers/`**: Handles incoming HTTP requests, performs input validation, calls appropriate services, and formats the HTTP response.
*   **`services/`**: Contains the core business logic. Services encapsulate operations related to specific domains (e.g., `UserService`, `DatasetService`). They interact with the data access layer but are decoupled from HTTP concerns.
*   **`models/`**: Defines TypeORM entities, representing the database schema (e.g., `User`, `Dataset`, `Dashboard`, `Visualization`, `ChartConfig`). Includes relations and validations.
*   **`migrations/`**: TypeORM migration scripts to manage database schema changes in a version-controlled manner.
*   **`utils/`**: Helper functions, such as password hashing, JWT token generation, and other reusable logic.

## 4. Frontend Architecture (React.js)

The frontend is a modern React application structured for maintainability and scalability.

```
+-----------------------------------------------------+
|                     App.tsx (Root Component, Router)  |
+-----------------------------------------------------+
        | Handles Routing (React Router DOM)
        v
+-----------------------------------------------------+
|           Pages/Views (pages/)                      |
| (Login, Register, DashboardList, DashboardEditor,    |
|  DatasetList, DatasetDetail, VisualizationBuilder)  |
+-----------------------------------------------------+
        | Orchestrates components, manages local state, dispatches actions
        v
+-----------------------------------------------------+
|           Components (components/)                  |
| (Reusable UI elements: Header, Sidebar, Buttons,    |
|  Forms, ChartRenderer, VisualizationCard, etc.)     |
+-----------------------------------------------------+
        | Uses context, hooks, and utility functions
        v
+-----------------------------------------------------+
|   Contexts (contexts/) | Hooks (hooks/) | API Calls (api/) | Utils (utils/) |
| (Global state, e.g., Auth)| (Reusable logic) | (Axios-based API client) | (Helpers, formatters) |
+-----------------------------------------------------+
```

### Key Components:

*   **`index.tsx`**: Entry point of the React application, renders the `App` component.
*   **`App.tsx`**: Sets up the main routing using `react-router-dom` and wraps the application with necessary context providers (e.g., `AuthContext`).
*   **`pages/`**: Top-level components representing distinct views or pages of the application. They orchestrate child components and manage page-specific logic.
*   **`components/`**: Reusable UI components.
    *   `common/`: Generic components (buttons, inputs, modals, spinners).
    *   `charts/`: Components specifically for rendering visualizations (`ChartRenderer`).
    *   `ui/`: Application-specific UI components (e.g., `DashboardCard`, `DatasetTable`).
*   **`contexts/`**: Provides global state management using React's Context API (e.g., `AuthContext` to manage user authentication state).
*   **`api/`**: Contains an Axios instance and functions for making API requests to the backend. This centralizes API communication logic.
*   **`hooks/`**: Custom React hooks to encapsulate reusable stateful logic (e.g., `useAuth`, `useForm`).
*   **`types/`**: TypeScript interface and type definitions for frontend data structures.
*   **`utils/`**: Frontend utility functions (e.g., data formatters, validation helpers).

## 5. Database Schema (PostgreSQL with TypeORM)

The database schema is designed to store user information, dataset metadata and content, visualization configurations, and dashboard layouts.

*   **`User`**: Stores user authentication details and roles.
    *   `id` (PK)
    *   `username` (Unique)
    *   `email` (Unique)
    *   `password` (Hashed)
    *   `role` (e.g., 'user', 'admin')
    *   `createdAt`, `updatedAt`
*   **`Dataset`**: Stores metadata about uploaded datasets and a reference to the data itself (e.g., file path, or the data as text/JSON).
    *   `id` (PK)
    *   `name`
    *   `description`
    *   `userId` (FK to User)
    *   `fileType` (e.g., 'csv', 'json')
    *   `data` (Text/JSONB - simplified for demonstration, would typically be S3 link or dedicated storage)
    *   `createdAt`, `updatedAt`
*   **`Visualization`**: Stores the configuration for a single chart or visualization.
    *   `id` (PK)
    *   `name`
    *   `description`
    *   `userId` (FK to User)
    *   `datasetId` (FK to Dataset)
    *   `chartType` (e.g., 'bar', 'line', 'pie')
    *   `config` (JSONB - detailed configuration for the charting library)
    *   `createdAt`, `updatedAt`
*   **`Dashboard`**: Stores the layout and content of a dashboard, referencing multiple visualizations.
    *   `id` (PK)
    *   `name`
    *   `description`
    *   `userId` (FK to User)
    *   `layout` (JSONB - grid layout, position, and size of visualizations)
    *   `createdAt`, `updatedAt`
*   **`DashboardVisualization`**: A join table to link Dashboards to Visualizations (Many-to-Many relationship).
    *   `dashboardId` (FK to Dashboard, PK part)
    *   `visualizationId` (FK to Visualization, PK part)
    *   `position` (Optional: x, y, width, height for specific layout)
    *   `id` (PK - composite or separate if more fields needed)

## 6. Security Considerations

*   **Authentication:** JWT (JSON Web Tokens) for stateless authentication.
*   **Authorization:** Role-Based Access Control (RBAC) middleware to restrict access based on user roles.
*   **Password Hashing:** `bcrypt` for securely storing user passwords.
*   **Input Validation:** Sanitize and validate all incoming request data to prevent injections and other vulnerabilities.
*   **Rate Limiting:** Protects against brute-force attacks and API abuse.
*   **CORS:** Properly configured Cross-Origin Resource Sharing.
*   **Environment Variables:** Sensitive information stored in `.env` files and not committed to version control.

## 7. Scalability & Performance

*   **Stateless Backend:** JWTs enable a stateless API, making it easier to scale horizontally.
*   **Caching:** In-memory caching (e.g., `node-cache`) for frequently accessed, less dynamic data to reduce database load. For larger scale, Redis would be integrated.
*   **Database Indexing:** Appropriate indexing on frequently queried columns in PostgreSQL.
*   **Optimized Queries:** TypeORM provides powerful query builders, encouraging efficient database interactions.
*   **Containerization:** Docker allows for easy deployment and scaling of individual services.

## 8. Observability

*   **Logging:** Centralized structured logging with Winston, capturing request details, errors, and significant application events.
*   **Error Handling:** Global error handling middleware ensures consistent error responses and prevents sensitive information from leaking.
*   **Monitoring (Placeholder):** The foundation is laid for integrating external monitoring tools like Prometheus and Grafana, or cloud-specific solutions.

## 9. CI/CD

A basic CI/CD pipeline (e.g., GitHub Actions) is configured to automate:
*   Code linting and formatting checks.
*   Running unit and integration tests.
*   Building Docker images.
*   (Placeholder for deployment to a staging/production environment).

## 10. Future Enhancements

*   **Advanced Data Processing:** Integration with a more robust data processing engine (e.g., Apache Spark, Dask, or a dedicated analytics service).
*   **More Chart Types & Customization:** Expand the library of supported chart types and offer deeper customization options.
*   **Real-time Dashboards:** WebSockets for real-time data updates.
*   **Data Connectors:** Ability to connect to external data sources (e.g., SQL databases, cloud storage, APIs).
*   **Collaborative Features:** Share dashboards, real-time co-editing.
*   **User Permissions Granularity:** More fine-grained access control beyond simple roles.
*   **Full-text Search:** Search functionality for datasets and dashboards.
*   **Improved Caching:** Integrate Redis for a distributed, persistent cache.

---