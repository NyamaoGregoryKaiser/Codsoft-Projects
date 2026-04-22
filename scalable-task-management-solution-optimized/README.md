# Enterprise-Grade Task Management System

This is a comprehensive, full-stack, production-ready Task Management System built with NestJS (backend) and Next.js (frontend), leveraging PostgreSQL, Redis, and Docker for robust deployment. It aims to provide an enterprise-grade solution with features like authentication, authorization, logging, caching, rate limiting, and extensive testing.

## Table of Contents
1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker Compose)](#local-development-setup-docker-compose)
    *   [Backend Setup (Manual)](#backend-setup-manual)
    *   [Frontend Setup (Manual)](#frontend-setup-manual)
4.  [Project Structure](#project-structure)
5.  [API Documentation (Swagger)](#api-documentation-swagger)
6.  [Architecture Overview](#architecture-overview)
7.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests](#performance-tests)
8.  [CI/CD Pipeline](#cicd-pipeline)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

This system provides a full suite of features for managing tasks effectively:

*   **User Management**: Registration, Login, Profile Management.
*   **Authentication & Authorization**: JWT-based authentication, Role-Based Access Control (RBAC) with `User` and `Admin` roles.
*   **Project Management**: Create, Read, Update, Delete (CRUD) projects, associate tasks with projects.
*   **Task Management**: CRUD tasks, assign tasks to users, set due dates, categorize by status (TODO, In Progress, Done, Archived).
*   **Task Commenting**: Add comments to tasks, view comment history.
*   **Tagging System**: Create and apply tags to tasks for better organization and filtering.
*   **Data Validation**: Robust input validation using `class-validator`.
*   **Error Handling**: Centralized HTTP exception filter for consistent error responses.
*   **Logging & Monitoring**: Winston-based structured logging for application events and errors.
*   **Caching**: Redis-backed caching for frequently accessed read-heavy endpoints to improve performance.
*   **Rate Limiting**: Throttling incoming requests to prevent abuse and ensure API stability.
*   **Comprehensive Testing**: Unit, Integration, and E2E tests for both backend and frontend.
*   **API Documentation**: Auto-generated Swagger UI for easy API exploration.
*   **Containerization**: Docker support for consistent development and deployment environments.
*   **CI/CD**: GitHub Actions workflow for automated builds and tests.
*   **Responsive UI**: Modern, accessible user interface built with Chakra UI.

---

## 2. Technology Stack

*   **Backend**:
    *   **Framework**: [NestJS](https://nestjs.com/) (Node.js, TypeScript)
    *   **Database ORM**: [TypeORM](https://typeorm.io/)
    *   **Database**: [PostgreSQL](https://www.postgresql.org/)
    *   **Authentication**: [Passport-JWT](http://www.passportjs.org/packages/passport-jwt/)
    *   **Validation**: [Class-validator](https://github.com/typestack/class-validator)
    *   **Logging**: [Winston](https://github.com/winstonjs/winston)
    *   **Caching/Rate Limiting Store**: [Redis](https://redis.io/)
    *   **API Docs**: [Swagger](https://swagger.io/)
*   **Frontend**:
    *   **Framework**: [Next.js](https://nextjs.org/) (React, TypeScript)
    *   **UI Library**: [Chakra UI](https://chakra-ui.com/)
    *   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
    *   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Development & Deployment**:
    *   **Containerization**: [Docker](https://www.docker.com/)
    *   **CI/CD**: [GitHub Actions](https://docs.github.com/en/actions)
    *   **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/visionmedia/supertest), [React Testing Library](https://testing-library.com/react/)

---

## 3. Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/en/download/) (v18 or later)
*   [npm](https://www.npmjs.com/get-npm) (or Yarn)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (for Docker Compose setup)
*   [Git](https://git-scm.com/downloads)

### Local Development Setup (Docker Compose)

This is the recommended way to run the entire application, including the database and Redis cache, with minimal local setup.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/task-management-system.git
    cd task-management-system
    ```

2.  **Create `.env` files:**
    *   Copy `backend/.env.example` to `backend/.env`
    *   Copy `frontend/.env.local.example` to `frontend/.env.local`
    *   Adjust values in these files as needed. The Docker Compose setup will use the environment variables defined in `backend/.env` for the backend service and the `NEXT_PUBLIC_API_BASE_URL` from `frontend/.env.local` for the frontend build.

3.  **Build and run services with Docker Compose:**
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```
    This command will:
    *   Build the `backend` and `frontend` Docker images.
    *   Start PostgreSQL (`db`) and Redis (`redis`) containers.
    *   Run database migrations (`npm run migration:run`) on the backend container.
    *   Start the `backend` and `frontend` application containers.

4.  **Seed initial data (optional but recommended):**
    Once the backend service is up and running (you can check logs with `docker-compose logs backend`), you can seed the database.
    ```bash
    docker-compose exec backend npm run seed
    ```
    This will create default users (`john@example.com`, `jane@example.com`, `admin@example.com`) and some sample projects and tasks.

5.  **Access the applications:**
    *   **Backend API**: `http://localhost:3000/api/v1`
    *   **Swagger API Docs**: `http://localhost:3000/docs`
    *   **Frontend**: `http://localhost:3001`

    You can now navigate to `http://localhost:3001` in your browser, register a new user, or log in with the seeded `admin@example.com` (password: `adminpassword`) or `john@example.com` (password: `password123`) accounts.

### Backend Setup (Manual - if not using Docker Compose for backend)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in your PostgreSQL and Redis connection details.
    ```bash
    cp .env.example .env
    # Edit .env to match your local PostgreSQL/Redis setup
    ```

4.  **Start PostgreSQL and Redis:**
    Ensure you have local PostgreSQL and Redis servers running, or start them via Docker (e.g., `docker run --name my-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine` and `docker run --name my-redis -p 6379:6379 -d redis:7-alpine`).

5.  **Run database migrations:**
    ```bash
    npm run migration:run
    ```

6.  **Seed initial data (optional):**
    ```bash
    npm run seed
    ```

7.  **Start the backend application:**
    ```bash
    npm run start:dev
    # Or for production build:
    # npm run start:prod
    ```
    The API will be available at `http://localhost:3000/api/v1`.

### Frontend Setup (Manual - if not using Docker Compose for frontend)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy `.env.local.example` to `.env.local` and ensure `NEXT_PUBLIC_API_BASE_URL` points to your backend API.
    ```bash
    cp .env.local.example .env.local
    # Ensure NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 (or your backend URL)
    ```

4.  **Start the frontend application:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:3001`.

---

## 4. Project Structure

The project is organized into `backend` and `frontend` directories, with shared Docker configurations.

```
.
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # Authentication & Authorization (Login, Register, JWT Strategy)
│   │   ├── comments/         # Task Comments (Entities, DTOs, Services, Controllers)
│   │   ├── projects/         # Project Management (Entities, DTOs, Services, Controllers)
│   │   ├── shared/           # Common modules (Guards, Filters, Interceptors, Enums, Logger, Migrations, Seed)
│   │   ├── tags/             # Tag Management (Entities, DTOs, Services, Controllers)
│   │   ├── tasks/            # Task Management (Entities, DTOs, Services, Controllers)
│   │   ├── users/            # User Management (Entities, DTOs, Services, Controllers)
│   │   ├── app.module.ts     # Root module, integrates all features
│   │   └── main.ts           # Application entry point, global setup
│   ├── test/                 # E2E tests for the backend
│   ├── ormconfig.ts          # TypeORM configuration for CLI (migrations)
│   ├── .env.example          # Backend environment variables
│   ├── package.json          # Backend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── frontend/                 # Next.js / React UI
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── api/              # Axios instance for API calls
│   │   ├── components/       # Reusable UI components (Layout, Header, Sidebar, Cards, Forms)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions, types, constants
│   │   ├── pages/            # Next.js pages (Login, Register, Dashboard, Projects, Tasks, etc.)
│   │   ├── store/            # Zustand stores for global state management
│   │   ├── styles/           # Global CSS
│   │   └── theme/            # Chakra UI theme configuration
│   ├── .env.local.example    # Frontend environment variables
│   ├── package.json          # Frontend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── docker/                   # Docker related files
│   ├── Dockerfile.backend    # Dockerfile for the NestJS backend
│   ├── Dockerfile.frontend   # Dockerfile for the Next.js frontend
│   └── docker-compose.yml    # Defines multi-container application services
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml
├── README.md                 # Project documentation (this file)
└── .gitignore                # Git ignore rules
```

---

## 5. API Documentation (Swagger)

The backend API is documented using Swagger UI. Once the backend is running, you can access the interactive documentation at:

**`http://localhost:3000/docs`**

This interface allows you to:
*   View all available API endpoints.
*   Understand request/response schemas (DTOs).
*   Test endpoints directly from the browser (requires obtaining a JWT token from `/auth/login` and providing it via the "Authorize" button).

---

## 6. Architecture Overview

### Backend (NestJS)
The backend follows a modular, layered architecture:

*   **Controllers**: Handle incoming HTTP requests, validate input, and delegate to services. Annotated with Swagger for API documentation.
*   **Services**: Encapsulate business logic, interact with repositories, and orchestrate complex operations.
*   **Entities (TypeORM)**: Define database schemas and relationships.
*   **DTOs (Data Transfer Objects)**: Define the shape of data for incoming requests (request body, query params) and outgoing responses. Used with `class-validator` for input validation.
*   **Modules**: Group related components (controllers, services, entities) into logical units (e.g., `AuthModule`, `UsersModule`, `ProjectsModule`).
*   **Shared Components**:
    *   **Guards**: Protect routes based on authentication (JWT) and authorization (Roles).
    *   **Filters**: Catch exceptions globally for consistent error responses.
    *   **Interceptors**: Intercept requests/responses for logging, caching, or transforming data.
    *   **Logger**: Custom Winston-based logger for structured logging.
    *   **Middleware**: Helmet for security, CORS for cross-origin requests.
    *   **Database**: PostgreSQL with TypeORM for object-relational mapping.
    *   **Caching/Rate Limiting**: Redis is used as a highly performant store for both caching responses and tracking request counts for rate limiting.

### Frontend (Next.js/React)
The frontend uses a component-based architecture:

*   **Pages**: Next.js pages handle routing and often orchestrate data fetching for specific routes.
*   **Components**: Reusable UI elements, ranging from atomic elements (buttons, inputs) to complex ones (TaskCard, ProjectForm).
*   **State Management (Zustand)**: A lightweight global state management library for authentication status, user data, and potentially large data sets like projects or tasks (though often data is fetched page-specific).
*   **API Client (Axios)**: Centralized Axios instance with interceptors for JWT token attachment and error handling (e.g., redirecting on 401 Unauthorized).
*   **UI Library (Chakra UI)**: Provides a set of accessible and customizable UI components, ensuring a consistent design system.
*   **Auth Guard**: A higher-order component or route wrapper to protect routes based on authentication status.

---

## 7. Testing

The project emphasizes comprehensive testing to ensure quality and reliability.

### Backend Tests

*   **Unit Tests**: Located in `backend/src/**/*.spec.ts`. These tests focus on individual classes (services, controllers, guards) in isolation, mocking their dependencies. Aim for 80%+ code coverage.
    *   Example: `backend/src/auth/auth.service.spec.ts`
    *   Run unit tests: `cd backend && npm test`
*   **Integration Tests (E2E Tests)**: Located in `backend/test/*.e2e-spec.ts`. These tests cover the interaction between multiple components (e.g., controller -> service -> database) or the entire API flow for a specific feature. They use `supertest` to make actual HTTP requests to the NestJS application instance.
    *   Example: `backend/test/app.e2e-spec.ts`
    *   Run E2E tests: `cd backend && npm run test:e2e`

### Frontend Tests

*   **Unit Tests**: Located in `frontend/src/**/*.test.tsx`. These tests use `Jest` and `React Testing Library` to test individual React components in isolation or small groups, simulating user interactions and asserting UI behavior.
    *   Example: `frontend/src/components/TaskCard.test.tsx`
    *   Run frontend tests: `cd frontend && npm test`

### Performance Tests

Performance testing is critical for enterprise-grade applications. While the `supertest` E2E example includes a basic rate limit test, for comprehensive performance testing, you would typically use dedicated tools:

*   **k6**: Open-source load testing tool. Allows writing JS scripts to define load scenarios (users, requests per second).
*   **JMeter**: Apache JMeter. A robust, Java-based load testing tool with a GUI.
*   **Artillery**: Modern, powerful, and easy-to-use load testing toolkit.

**Approach**:
1.  **Identify Critical Endpoints**: Focus on read-heavy (e.g., `GET /tasks`, `GET /projects`) and write-heavy (e.g., `POST /tasks`, `PATCH /tasks/:id`) endpoints.
2.  **Define Scenarios**: Simulate typical user flows (login, view projects, create task, add comment).
3.  **Configure Load**: Determine the number of virtual users, ramp-up time, and duration of the test.
4.  **Execute Tests**: Run tests against a deployed staging environment.
5.  **Analyze Results**: Monitor response times, error rates, throughput, and resource utilization (CPU, memory, database connections).

---

## 8. CI/CD Pipeline

The project includes a basic CI/CD pipeline configured with GitHub Actions. The workflow is defined in `.github/workflows/ci-cd.yml`.

**`backend/.github/workflows/ci-cd.yml`** (Conceptual)
```yaml