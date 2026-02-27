# Enterprise E-commerce Solution

This repository contains a comprehensive, production-ready e-commerce solution built with a modern full-stack TypeScript architecture.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Features](#features)
3.  [Architecture](#architecture)
4.  [Technology Stack](#technology-stack)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
    *   [Docker Compose (Recommended)](#docker-compose-recommended)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
6.  [Database](#database)
7.  [API Documentation](#api-documentation)
8.  [Frontend Usage](#frontend-usage)
9.  [Testing](#testing)
10. [CI/CD](#cicd)
11. [Deployment Guide](#deployment-guide)
12. [Future Enhancements](#future-enhancements)
13. [Contributing](#contributing)
14. [License](#license)

## 1. Project Overview

This project aims to demonstrate a robust, scalable, and secure e-commerce platform. It focuses on best practices for full-stack development, UI/UX, and business solutions suitable for enterprise-grade applications.

## 2. Features

*   **User Management:** Register, Login, User Profiles, Role-Based Access Control (RBAC).
*   **Product Catalog:** CRUD operations for products, search, filtering, pagination.
*   **Shopping Cart:** Add, update, remove items, persist cart state.
*   **Order Management:** Create orders, view order history, update order status (admin).
*   **Authentication & Authorization:** JWT-based authentication, protected routes.
*   **Security:** Helmet (HTTP headers), CORS, password hashing (bcrypt).
*   **Performance:** Caching layer (in-memory for demo, easily swappable with Redis), Rate Limiting.
*   **Observability:** Structured logging (Winston), comprehensive error handling.
*   **Scalability:** Layered architecture, Dockerized services.
*   **Developer Experience:** TypeScript, ESLint, Prettier, Hot-reloading (development).
*   **Testing:** Unit, Integration, and API tests.

## 3. Architecture

The system follows a micro-service-oriented (or modular monolithic for simplicity in this example) architecture with clear separation of concerns, designed for scalability and maintainability.

*   **Frontend (React):** A single-page application (SPA) providing the user interface, interacting with the backend API.
*   **Backend (Node.js/Express):** A RESTful API serving data to the frontend and handling all business logic.
    *   **Layered Architecture:**
        *   **Routes:** Defines API endpoints and maps them to controllers.
        *   **Controllers:** Handles incoming HTTP requests, validates input (basic, more robust with Zod), and orchestrates services.
        *   **Services:** Contains core business logic, interacts with repositories, and handles caching.
        *   **Repositories:** Abstracts database interactions, directly uses Prisma Client.
        *   **Models (Prisma):** Defines the database schema and generates the ORM client.
        *   **Middlewares:** Handles cross-cutting concerns like authentication, authorization, error handling, logging, and rate limiting.
        *   **Utilities:** Helper functions for JWT, password hashing, caching, etc.
*   **Database (PostgreSQL):** A robust relational database for persistent data storage.

```
+------------------+     +-------------------+     +-----------------+
|   Frontend       |     |   Backend API     |     |    Database     |
| (React/TS)       |     |  (Node.js/TS)     |     |   (PostgreSQL)  |
|                  |     |                   |     |                 |
| - Pages          | <-> | - Routes          |     | - Prisma Schema |
| - Components     |     | - Controllers     | <-> | - Data Storage  |
| - Contexts       |     | - Services        |     | - Indexes       |
| - API Client     |     | - Repositories    |     |                 |
|                  |     | - Middlewares     |     |                 |
+------------------+     +-------------------+     +-----------------+
                           |      ^
                           |      | Caching (NodeCache/Redis)
                           v      |
                       +-------------------+
                       |    Monitoring     |
                       |    (Winston)      |
                       +-------------------+
```

## 4. Technology Stack

*   **Backend:**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   Prisma ORM
    *   PostgreSQL
    *   JWT (Authentication)
    *   Bcrypt (Password Hashing)
    *   Winston (Logging)
    *   Node-Cache (Caching)
    *   Express-Rate-Limit (Rate Limiting)
    *   Helmet, CORS (Security)
    *   Zod (Schema Validation - *partially implemented, highly recommended for all DTOs*)
    *   Jest, Supertest (Testing)
*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (Build Tool)
    *   Tailwind CSS (Styling)
    *   Axios (HTTP Client)
    *   React Router DOM (Routing)
    *   React Context API (State Management)
    *   Jest, React Testing Library (Testing)
*   **Infrastructure:**
    *   Docker, Docker Compose
    *   GitHub Actions (CI/CD)

## 5. Setup and Installation

### Prerequisites

*   Node.js (v18+) & npm (or yarn)
*   Docker & Docker Compose (recommended for local development)
*   Git

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories based on their respective `.env.example` files.

*   `backend/.env`:
    ```
    PORT=5000
    DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db?schema=public"
    JWT_SECRET="YOUR_SUPER_STRONG_SECRET_KEY_HERE_MIN_32_CHARS"
    JWT_EXPIRES_IN="1h"
    NODE_ENV="development"
    LOG_LEVEL="info"
    CACHE_TTL=3600
    RATE_LIMIT_MAX=100
    RATE_LIMIT_WINDOW_MS=60000
    FRONTEND_URL=http://localhost:3000
    ```
*   `frontend/.env`:
    ```
    VITE_API_BASE_URL=http://localhost:5000/api
    NODE_ENV="development"
    ```

### Docker Compose (Recommended)

This is the easiest way to get the entire stack running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecommerce-system.git
    cd ecommerce-system
    ```
2.  **Create `.env` files:**
    Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
3.  **Start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This will build the Docker images, start the PostgreSQL database, backend, and frontend services.
4.  **Run Prisma Migrations and Seed Data (from inside backend container):**
    ```bash
    docker exec -it ecommerce-system-backend-1 sh # or the actual container name
    npm run prisma:migrate
    npm run prisma:seed
    exit
    ```
    (Note: `ecommerce-system-backend-1` might vary, use `docker ps` to find the correct name for the backend service).
5.  **Access the applications:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api`

### Manual Setup (Backend)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up PostgreSQL database:**
    Ensure you have a PostgreSQL instance running (e.g., locally or via Docker). Update `DATABASE_URL` in `backend/.env` accordingly.
4.  **Run Prisma Migrations:**
    ```bash
    npm run prisma:migrate
    ```
5.  **Seed initial data:**
    ```bash
    npm run prisma:seed
    ```
6.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend API will be available at `http://localhost:5000/api`.

### Manual Setup (Frontend)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`.

## 6. Database

*   **ORM:** Prisma is used for type-safe database access and migrations.
*   **Schema:** Defined in `backend/prisma/schema.prisma`.
*   **Migrations:** Generated using `npx prisma migrate dev --name <migration_name>`.
*   **Seed Data:** `backend/prisma/seed.ts` provides initial admin/customer users and sample products.
    *   **Admin User:** `admin@example.com` / `admin123`
    *   **Customer User:** `customer@example.com` / `user123`
*   **Query Optimization:**
    *   **Indexing:** Essential fields like `email` (unique), `name` (search), `price` (range), `userId` (relationships) are indexed in `schema.prisma`.
    *   **Eager Loading:** Prisma's `include` and `select` clauses are used in repositories to fetch related data efficiently and avoid N+1 query problems.
    *   **Connection Pooling:** Prisma Client manages connection pooling automatically.

## 7. API Documentation

The backend exposes a RESTful API. Below are key endpoints. For a full API reference, consider generating OpenAPI (Swagger) documentation.

**Base URL:** `http://localhost:5000/api`

---

### **Authentication (`/api/auth`)**

*   **`POST /register`**
    *   **Description:** Register a new customer user.
    *   **Body:** `{ firstName, lastName, email, password }`
    *   **Response:** `{ token, user }` (user object without password)
*   **`POST /login`**
    *   **Description:** Authenticate a user and get a JWT token.
    *   **Body:** `{ email, password }`
    *   **Response:** `{ token, user }` (user object without password)
*   **`GET /me`** (Protected)
    *   **Description:** Get the profile of the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ user }`

---

### **Products (`/api/products`)**

*   **`GET /`**
    *   **Description:** Get a list of products. Supports filtering and pagination.
    *   **Query Params:**
        *   `page`: (Optional) Page number (default: 1)
        *   `limit`: (Optional) Items per page (default: 10)
        *   `name`: (Optional) Search by product name (case-insensitive)
        *   `minPrice`: (Optional) Minimum price
        *   `maxPrice`: (Optional) Maximum price
        *   `isActive`: (Optional) Filter by active status (true/false)
    *   **Response:** `[Product]`
*   **`GET /:id`**
    *   **Description:** Get a single product by ID.
    *   **Path Params:** `id` (Product ID)
    *   **Response:** `Product` (or 404 if not found)
*   **`POST /`** (Protected: Admin Only)
    *   **Description:** Create a new product.
    *   **Headers:** `Authorization: Bearer <admin_token>`
    *   **Body:** `{ name, description, price, stock, imageUrl? }`
    *   **Response:** `Product` (newly created)
*   **`PUT /:id`** (Protected: Admin Only)
    *   **Description:** Update an existing product.
    *   **Headers:** `Authorization: Bearer <admin_token>`
    *   **Path Params:** `id` (Product ID)
    *   **Body:** `{ name?, description?, price?, stock?, imageUrl?, isActive? }`
    *   **Response:** `Product` (updated)
*   **`DELETE /:id`** (Protected: Admin Only)
    *   **Description:** Delete a product.
    *   **Headers:** `Authorization: Bearer <admin_token>`
    *   **Path Params:** `id` (Product ID)
    *   **Response:** `204 No Content`

---

*(Other modules like `/api/users`, `/api/orders`, `/api/cart` would follow similar documentation structures.)*

## 8. Frontend Usage

The frontend is a standard React application.
*   **Home Page:** `/`
*   **Product Listing:** `/products` (with search and filters)
*   **Product Detail:** `/products/:id`
*   **Login:** `/login`
*   **Register:** `/register`
*   **Cart:** `/cart` (Protected)
*   **Checkout:** `/checkout` (Protected)
*   **Order History:** `/orders` (Protected)
*   **Admin Dashboard:** `/admin/*` (Protected: Admin Only)

## 9. Testing

The project emphasizes comprehensive testing to ensure quality and reliability.

*   **Unit Tests:**
    *   **Location:** `backend/src/**/*.test.ts`, `frontend/src/**/*.test.tsx`
    *   **Tools:** Jest for backend, Jest and React Testing Library for frontend.
    *   **Coverage Goal:** Aim for 80%+ line, branch, function, and statement coverage for critical business logic.
    *   **Run:**
        *   Backend: `npm run test --prefix backend` or `npm run test:coverage --prefix backend`
        *   Frontend: `npm run test --prefix frontend`
*   **Integration Tests:**
    *   **Location:** `backend/src/routes/*.test.ts`
    *   **Tools:** Supertest with Jest to test API endpoints, including middleware and database interactions.
    *   **Run:** `npm run test --prefix backend`
*   **API Tests:**
    *   Manual testing with tools like Postman/Insomnia.
    *   Automated E2E tests (e.g., Cypress, Playwright) would be a future enhancement.
*   **Performance Tests:**
    *   **Tools:** Locust, k6, JMeter.
    *   **Purpose:** Measure response times, throughput, and error rates under load. Identify bottlenecks.
    *   (No automated scripts provided in this setup, but highly recommended for production.)

## 10. CI/CD

A basic GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is provided for Continuous Integration and Continuous Deployment.

```yaml