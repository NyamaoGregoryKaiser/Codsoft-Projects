```markdown
# Architecture Documentation: ML Utilities System

This document outlines the high-level architecture of the ML Utilities System, covering its components, their interactions, and the underlying technologies.

## 1. High-Level Overview

The ML Utilities System follows a **Monolithic Frontend / Microservice Backend** approach (though the backend is currently a single Node.js service, it's structured with modules to allow for future microservice decomposition). It's a **three-tier architecture**:

1.  **Frontend (Presentation Layer):** A React.js single-page application (SPA) providing the user interface.
2.  **Backend (Application Layer):** A Node.js/Express API gateway that handles business logic, data processing, authentication, and orchestrates interactions with the data layer and potentially external ML services.
3.  **Database (Data Layer):** A PostgreSQL relational database for persistent storage of application data.

All components are containerized using Docker and orchestrated with Docker Compose for ease of deployment and scalability.

```
+----------------+
|    Client      |
| (Web Browser)  |
+-------+--------+
        | HTTP/HTTPS
        v
+-------+--------+
|   Frontend App |
| (React/Vite)   |
|   - UI/UX      |
|   - API Calls  |
+-------+--------+
        | HTTP/HTTPS (API)
        v
+-------+------------------+
|      Backend API         |
|   (Node.js/Express)      |
|   - Authentication       |
|   - Authorization        |
|   - CRUD Operations      |
|   - File Uploads (local) |
|   - Business Logic       |
|   - Logging & Error Hdl  |
+-------+------------------+
        | SQL
        v
+-------+--------+
|   Database     |
| (PostgreSQL)   |
|   - User Data  |
|   - Project Data |
|   - ML Metadata|
+----------------+
        ^
        | Files (Models/Datasets)
        | (Local Storage / S3-like)
        +-----------------+
        | File System/S3  |
        +-----------------+
```

## 2. Component Breakdown

### 2.1. Frontend Application (React/TypeScript)

*   **Framework:** React.js with Vite for blazing-fast development and optimized builds.
*   **Language:** TypeScript for type safety and improved code quality.
*   **UI Library:** Material-UI for a consistent, enterprise-grade look and feel.
*   **State Management:** React Context API for authentication, local component state for forms/UI.
*   **Routing:** React Router DOM for navigation.
*   **API Client:** Axios for making HTTP requests to the backend API. Interceptors handle JWT attachment and global error handling (e.g., redirecting on 401).
*   **Authentication:** Utilizes `AuthContext` to manage user sessions and token persistence.
*   **Key Components:** `AppLayout` for consistent navigation and structure, dedicated pages for each module (Dashboard, Projects, Datasets, Models, Experiments, Users), and reusable UI components.

### 2.2. Backend API (Node.js/Express/TypeScript)

*   **Framework:** Express.js for building RESTful APIs.
*   **Language:** TypeScript for strong typing and maintainability.
*   **ORM:** TypeORM for interacting with the PostgreSQL database, defining entities, and handling migrations.
*   **Modules:** Organized into distinct, loosely coupled modules (e.g., `auth`, `users`, `projects`, `datasets`, `models`, `experiments`). Each module typically contains:
    *   **Entity:** TypeORM entity defining the database table schema.
    *   **Repository:** Encapsulates database access logic for an entity.
    *   **Service:** Contains business logic and orchestrates repository interactions.
    *   **Controller:** Handles incoming HTTP requests, validates input, calls service methods, and sends responses.
*   **Authentication:** JWT (JSON Web Tokens) for stateless authentication. `auth.middleware.ts` handles token verification and user role checks. `AuthService` for registration and login logic.
*   **Authorization:** Role-based access control (`restrictTo` middleware) ensures users only access resources they are permitted to.
*   **File Uploads:** `multer` for handling multipart/form-data for dataset and model file uploads. Files are stored locally in the `uploads` directory (can be extended to cloud storage).
*   **Logging:** `winston` for structured logging, supporting console and file transports.
*   **Error Handling:** Centralized `errorHandler` middleware catches `AppError` instances (custom operational errors) and handles system errors gracefully, providing consistent API responses.
*   **Rate Limiting:** `express-rate-limit` middleware protects against API abuse.
*   **Configuration:** `dotenv` for environment variable management.
*   **Testing:** Jest for unit tests (services, utilities), Supertest for API integration tests (controllers, routes), and TypeORM's `DataSource` for database integration tests (repositories).

### 2.3. Database (PostgreSQL)

*   **Type:** Relational Database Management System (RDBMS).
*   **Data Model:** Stores user information, project metadata, dataset metadata (not the actual files), model metadata, and experiment tracking details.
*   **Schema:** Defined by TypeORM entities and managed via migrations (`src/database/migrations`).
*   **Indexing:** Utilizes database indexing on frequently queried columns (e.g., foreign keys, email for users) for query optimization.
*   **Relationships:** Implements one-to-many and many-to-one relationships between entities (e.g., Project has many Datasets, User has many Projects).

## 3. Data Flow Example: Uploading a Dataset

1.  **Frontend (DatasetsList Page):** User clicks "Upload Dataset", fills out a form (name, description, project ID), and selects a file.
2.  **Frontend (API Client):** The frontend uses `axios` to send a `POST` request to `/api/v1/datasets` with the form data, including the file in `multipart/form-data` format. The JWT token from `localStorage` is attached to the `Authorization` header by `axios` interceptors.
3.  **Backend (Express `datasets.routes.ts`):**
    *   The request first hits `protect` middleware to verify the JWT.
    *   `uploadSingleFile` (Multer middleware) processes the file:
        *   Checks file type and size.
        *   Stores the file in the `backend/uploads` directory on the server.
        *   Attaches file metadata (path, size, mimetype) to `req.file`.
    *   `dataset.controller.ts` receives the request.
    *   Validates `req.body` using `yup` schema.
    *   Calls `dataset.service.ts` to create the dataset record.
4.  **Backend (DatasetService):**
    *   Calls `dataset.repository.ts` to persist dataset metadata (name, description, file path, size, MIME type, associated project ID, owner ID) to the PostgreSQL database.
5.  **Backend (DatasetRepository):**
    *   Uses TypeORM to insert a new row into the `datasets` table.
6.  **Backend (Controller):** Responds with a `201 Created` status and the new dataset's metadata.
7.  **Frontend:** Receives the success response, updates the UI (e.g., refreshes the datasets list), and notifies the user. If an error occurs at any stage, the global error handler (`errorHandler.ts`) ensures a consistent error response. If a file was uploaded but a DB error occurred, the controller attempts to delete the orphaned file.

## 4. Scalability Considerations

*   **Horizontal Scaling:** Both frontend and backend applications are stateless (JWT authentication) and can be easily scaled horizontally by running multiple instances behind a load balancer.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally using replication (read replicas) for read-heavy workloads. Sharding is an option for extreme scale.
*   **File Storage:** Transitioning from local `uploads` to cloud-based object storage (e.g., AWS S3) is crucial for production to ensure durability, availability, and scalability of large files, decoupling storage from the backend instances.
*   **ML Inference:** For high-performance or specialized model inference, integrate with dedicated ML serving frameworks (e.g., TensorFlow Serving, TorchServe, BentoML) or a separate microservice, potentially deployed on GPU-enabled infrastructure. The current `runInference` is a placeholder.
*   **Caching:** Implementing a caching layer (e.g., Redis) for frequently accessed data (e.g., project lists, dashboard summaries) can significantly reduce database load.

## 5. Security Considerations

*   **Authentication & Authorization:** JWT with secure secret, role-based access. Password hashing with `bcryptjs`.
*   **Input Validation:** Comprehensive validation on both frontend and backend (`yup`) to prevent injection attacks and ensure data integrity.
*   **CORS:** Configured to allow only trusted origins in production.
*   **Helmet:** Middleware used to set various HTTP headers for security.
*   **Rate Limiting:** Protects against brute-force attacks and DDoS.
*   **Environment Variables:** Sensitive information is stored in environment variables, not in code.
*   **Dependency Security:** Regular vulnerability scanning of dependencies is recommended.
*   **SQL Injection:** TypeORM's query builder helps prevent SQL injection by parameterizing queries.

This architecture provides a solid foundation for a robust and extensible ML Utilities system, with clear pathways for future enhancements and scaling.
```