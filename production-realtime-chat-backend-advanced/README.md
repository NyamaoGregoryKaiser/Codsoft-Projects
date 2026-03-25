```markdown
# Real-time Chat Application - Enterprise Grade

This is a comprehensive, full-stack real-time chat application built with TypeScript, NestJS (backend), React (frontend), PostgreSQL (database), and Redis (caching/real-time PubSub). It's designed for scalability, security, and maintainability, adhering to enterprise-grade standards.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Architecture](#2-architecture)
3.  [Technology Stack](#3-technology-stack)
4.  [Features](#4-features)
5.  [Setup & Installation](#5-setup--installation)
    *   [Prerequisites](#prerequisites)
    *   [Environment Configuration](#environment-configuration)
    *   [Database & Redis Setup (Docker Compose)](#database--redis-setup-docker-compose)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Full-Stack Docker Compose](#full-stack-docker-compose)
6.  [API Endpoints](#6-api-endpoints)
7.  [WebSocket Events](#7-websocket-events)
8.  [Testing Strategy](#8-testing-strategy)
9.  [Deployment Guide](#9-deployment-guide-conceptual)
10. [CI/CD Pipeline](#10-cicd-pipeline-conceptual)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Error Handling](#12-error-handling)
13. [Caching & Rate Limiting](#13-caching--rate-limiting)
14. [Code Structure](#14-code-structure)

## 1. Project Overview

This real-time chat application allows users to:
*   Securely register and log in.
*   Create and manage conversations (direct messages).
*   Send and receive messages in real-time.
*   View historical messages within a conversation.

It's built with a strong focus on modularity, testability, and performance, suitable for large-scale applications.

## 2. Architecture

The system follows a microservice-oriented (or modular monolithic for this project's scale) client-server architecture:

*   **Frontend (React SPA):** A responsive web interface for users, consuming REST APIs and WebSockets.
*   **Backend (NestJS API & WebSocket Server):** Handles business logic, data persistence, authentication, and real-time communication.
*   **PostgreSQL Database:** Primary data store for users, conversations, and messages.
*   **Redis Cache/PubSub:** Used for rate limiting, `socket.io` adapter for horizontal scaling, and potentially other caching needs.

## 3. Technology Stack

### Backend (NestJS)
*   **Language:** TypeScript
*   **Framework:** NestJS
*   **WebSockets:** `socket.io`
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Authentication:** JWT (Passport.js)
*   **Caching/PubSub:** Redis (Ioredis)
*   **Logging:** Winston
*   **Validation:** Class-validator / Class-transformer
*   **Testing:** Jest, Supertest
*   **Rate Limiting:** `express-rate-limit`

### Frontend (React)
*   **Language:** TypeScript
*   **Framework:** React
*   **State Management:** Zustand
*   **Styling:** Tailwind CSS
*   **Real-time:** `socket.io-client`
*   **API Client:** Axios
*   **Routing:** React Router DOM
*   **Testing:** Jest, React Testing Library

### DevOps & Infrastructure
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions (conceptual)

## 4. Features

*   **User Management:** Secure Registration, Login, Profile Retrieval.
*   **Authentication & Authorization:** JWT-based, protected API routes and WebSocket events.
*   **Conversations:** Create 1:1 conversations, list user's conversations.
*   **Real-time Messaging:** Instant message delivery, message history.
*   **Robust Error Handling:** Consistent error responses, global exception filters.
*   **Centralized Logging:** Structured logging for easy debugging and monitoring.
*   **API Rate Limiting:** Protects against abuse and DoS attacks.
*   **Scalability:** Ready for horizontal scaling of backend services via Redis `socket.io` adapter.
*   **Input Validation:** Strict data validation on all API inputs.

## 5. Setup & Installation

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
*   [Git](https://git-scm.com/)

### Environment Configuration

Create `.env` files in both the `backend/` and `frontend/` directories.

#### `backend/.env`
```
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/chat_app" # Use 'db' as host if running with Docker Compose
JWT_SECRET="YOUR_SUPER_SECRET_KEY_CHANGE_THIS"
JWT_EXPIRATION_TIME="3600s" # 1 hour
REDIS_HOST=localhost # Use 'redis' as host if running with Docker Compose
REDIS_PORT=6379
REDIS_PASSWORD=
API_RATE_LIMIT_TTL=60 # seconds
API_RATE_LIMIT_MAX=100 # requests per TTL
```

#### `frontend/.env`
```
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_WS_BASE_URL=http://localhost:3000
```
**Note:** Adjust `localhost` to your server IP or domain in production. When using Docker Compose, `backend` service should be the host for `REACT_APP_API_BASE_URL` and `REACT_APP_WS_BASE_URL` from the frontend's perspective.

### Database & Redis Setup (Docker Compose)

The easiest way to get PostgreSQL and Redis running is using Docker Compose. A `docker-compose.yml` is provided at the root of the project.

```bash
# From the project root directory
docker-compose up -d db redis
```
This will start your PostgreSQL database and Redis server.

#### Run Migrations

After starting the database, navigate to the `backend` directory and run TypeORM migrations to create the schema.

```bash
cd backend
npm install
npm run typeorm migration:run
```

### Backend Setup

```bash
cd backend
npm install
npm run start:dev # Starts in development mode with hot-reloading
```
The backend server will run on the port specified in `backend/.env` (default: `3000`).

### Frontend Setup

```bash
cd frontend
npm install
npm run start # Starts the React development server
```
The frontend application will run on `http://localhost:3001` (or another available port).

### Full-Stack Docker Compose

To run the entire application stack (backend, frontend, PostgreSQL, Redis) using Docker Compose:

1.  **Update `.env` files:**
    *   `backend/.env`:
        ```
        DATABASE_URL="postgresql://user:password@db:5432/chat_app"
        REDIS_HOST=redis
        ```
    *   `frontend/.env`:
        ```
        REACT_APP_API_BASE_URL=http://localhost:3000/api
        REACT_APP_WS_BASE_URL=http://localhost:3000
        ```
    *(Note: The frontend accesses the backend via `localhost:3000` because the backend service port `3000` is mapped to the host's `3000` in `docker-compose.yml`.)*

2.  **Build and Run:**
    ```bash
    # From the project root
    docker-compose build
    docker-compose up -d
    ```
    This will build Docker images for backend and frontend and start all services.
    *   Backend: `http://localhost:3000`
    *   Frontend: `http://localhost:3001` (or specified `ports` in `docker-compose.yml` for frontend service)

## 6. API Endpoints

All REST API endpoints are prefixed with `/api`.

**Authentication (`/api/auth`)**

*   `POST /api/auth/register`: Register a new user.
    *   Body: `{ username: string, email: string, password: string }`
    *   Response: `201 { message: 'User registered successfully' }`
*   `POST /api/auth/login`: Authenticate a user and get a JWT.
    *   Body: `{ email: string, password: string }`
    *   Response: `200 { access_token: string }`
*   `GET /api/auth/profile` (Protected): Get the profile of the authenticated user.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Response: `200 { id: string, username: string, email: string }`

**Users (`/api/users`)**

*   `GET /api/users` (Protected): Get a list of all users.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Response: `200 [{ id: string, username: string, email: string }]`
*   `GET /api/users/:id` (Protected): Get a specific user by ID.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Response: `200 { id: string, username: string, email: string }`

**Conversations (`/api/conversations`)**

*   `POST /api/conversations` (Protected): Create a new conversation.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Body: `{ participantIds: string[], name?: string }` (participantIds must include the requesting user's ID)
    *   Response: `201 { id: string, name: string, type: 'direct' | 'group', participants: User[], createdAt: Date }`
*   `GET /api/conversations` (Protected): Get all conversations for the authenticated user.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Response: `200 [{ id, name, type, participants, lastMessage, updatedAt }]`
*   `GET /api/conversations/:id` (Protected): Get a specific conversation by ID.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Response: `200 { id, name, type, participants, messages: Message[], createdAt, updatedAt }`

**Messages (`/api/conversations/:conversationId/messages`)**

*   `GET /api/conversations/:conversationId/messages` (Protected): Get paginated messages for a conversation.
    *   Headers: `Authorization: Bearer <access_token>`
    *   Query: `?skip=0&take=50`
    *   Response: `200 [{ id, sender: User, content, createdAt }]`

## 7. WebSocket Events

The WebSocket connection uses `socket.io`. The JWT token should be passed during the connection handshake (e.g., `auth: { token: 'your_jwt' }`).

*   **Client Emit (`socket.emit`)**
    *   `'joinConversation'`: User joins a conversation room to receive messages.
        *   Payload: `{ conversationId: string }`
    *   `'leaveConversation'`: User leaves a conversation room.
        *   Payload: `{ conversationId: string }`
    *   `'sendMessage'`: User sends a new message.
        *   Payload: `{ conversationId: string, content: string }`

*   **Server Emit (`socket.on` / `io.to(...).emit`)**
    *   `'receiveMessage'`: A new message has been sent to the conversation.
        *   Payload: `{ id: string, conversationId: string, sender: { id: string, username: string }, content: string, createdAt: Date }`
    *   `'conversationUpdate'`: A conversation's metadata (e.g., last message, name change) has been updated. (Conceptual - for more advanced features)
    *   `'error'`: An error occurred during WebSocket communication (e.g., invalid payload, unauthorized).
        *   Payload: `{ message: string }`

## 8. Testing Strategy

This project employs a comprehensive testing strategy:

*   **Unit Tests:** (`*.spec.ts` / `*.test.ts`)
    *   **Backend:** Focus on isolated services, controllers, and utility functions using Jest. Mocks are heavily utilized for dependencies (repositories, external APIs). Aim for 80%+ code coverage.
    *   **Frontend:** Focus on individual components, hooks, and utility functions using Jest and React Testing Library. Mocks are used for API calls, WebSocket connections, and global state.
*   **Integration Tests:**
    *   **Backend:** Verify interactions between multiple NestJS modules, database operations (using an in-memory database or dedicated test DB), and middleware/guards. `Supertest` is used to simulate HTTP requests.
*   **API (E2E) Tests:**
    *   **Backend:** End-to-end tests that hit actual API endpoints and WebSocket events, often using a dedicated test database. These verify full request/response cycles including authentication, data persistence, and real-time broadcasts. `socket.io-client` is used to simulate client WebSocket interactions.
*   **Performance Tests (Conceptual):**
    *   Using tools like `k6` or `JMeter` to simulate high load, measure latency, throughput, and identify bottlenecks in both REST and WebSocket layers.

## 9. Deployment Guide (Conceptual)

This section outlines a high-level deployment strategy for a production environment.

1.  **Build Artifacts:**
    *   `backend`: `npm run build` generates JavaScript in `dist/`.
    *   `frontend`: `npm run build` generates static assets in `build/`.
2.  **Containerization:**
    *   Use provided `Dockerfile`s to build optimized Docker images for both backend and frontend. Push these to a container registry (e.g., Docker Hub, AWS ECR).
3.  **Infrastructure:**
    *   **Cloud Provider:** AWS, GCP, Azure, DigitalOcean.
    *   **Container Orchestration:** Kubernetes (EKS, GKE, AKS) is highly recommended for scalability and resilience. Alternatively, use AWS ECS, GCP Cloud Run, or DigitalOcean App Platform.
    *   **Managed Services:** Use managed PostgreSQL (e.g., AWS RDS, GCP Cloud SQL) and Redis (e.g., AWS ElastiCache, GCP Memorystore) for high availability, backups, and operational ease.
    *   **Load Balancing:** A load balancer (e.g., AWS ALB, Nginx Ingress) to distribute traffic to multiple backend instances and handle SSL termination.
    *   **CDN:** For serving frontend static assets (e.g., AWS CloudFront).
4.  **Configuration:**
    *   **Environment Variables:** Securely inject sensitive configurations (JWT_SECRET, DB credentials) using environment variables (e.g., Kubernetes Secrets, AWS Secrets Manager).
    *   **Backend Host:** Ensure `REDIS_HOST` points to your Redis instance, and `DATABASE_URL` points to your PostgreSQL instance.
    *   **Frontend Endpoints:** `REACT_APP_API_BASE_URL` and `REACT_APP_WS_BASE_URL` must point to your deployed backend service URL.
5.  **Scaling:**
    *   **Backend:** Deploy multiple instances/replicas of the NestJS backend behind a load balancer. Ensure `socket.io-redis` adapter is configured for WebSockets to work across instances.
    *   **Database:** Consider read replicas and connection pooling for high read loads.
6.  **Monitoring & Alerting:** Integrate with your chosen monitoring solutions (Prometheus/Grafana, cloud-native tools) to track application health, performance, and errors. Set up alerts for critical events.

## 10. CI/CD Pipeline (Conceptual)

A GitHub Actions workflow (`.github/workflows/main.yml`) is provided conceptually. This pipeline would typically include:

1.  **Trigger:** On `push` to `main` branch or `pull_request`.
2.  **Build & Test Backend:**
    *   Install Node.js dependencies.
    *   Run Unit and Integration tests (with coverage).
    *   Run Linter.
    *   (Optional) Run E2E tests against a temporary test environment.
3.  **Build & Test Frontend:**
    *   Install Node.js dependencies.
    *   Run Unit and Component tests.
    *   Run Linter.
    *   Build production bundle.
4.  **Deployment (on `main` branch push if all tests pass):**
    *   Login to Docker registry.
    *   Build and push Docker images for backend and frontend.
    *   Deploy to a Kubernetes cluster or other hosting environment (e.g., by updating deployment manifests or triggering a cloud-specific deployment).

## 11. Monitoring & Logging

*   **Logging:**
    *   **Backend:** Uses `Winston` for structured, JSON-formatted logs.
        *   Custom `LoggerMiddleware` to log all incoming HTTP requests.
        *   Global `AllExceptionsFilter` to log all unhandled exceptions with full stack traces.
        *   Logs can be easily streamed to centralized logging solutions (e.g., ELK Stack, Datadog, Splunk, CloudWatch Logs).
    *   **Frontend:** Browser console logs for development. For production, integrate with client-side error tracking (e.g., Sentry, Bugsnag).
*   **Monitoring (Conceptual):**
    *   **Metrics:** Collect key metrics like request latency, error rates, active WebSocket connections, message throughput, CPU/memory usage of containers.
    *   **Tools:** Prometheus for metrics collection, Grafana for dashboard visualization.
    *   **Health Checks:** `GET /health` endpoint on the backend for liveness/readiness probes in container orchestrators.

## 12. Error Handling

*   **Backend:**
    *   **Global `AllExceptionsFilter`:** Catches all exceptions (HTTP and non-HTTP) and transforms them into a consistent JSON error response. This prevents sensitive internal errors from leaking to clients.
    *   **NestJS `ValidationPipe`:** Automatically validates incoming DTOs using `class-validator` and `class-transformer`, returning `400 Bad Request` with detailed error messages if validation fails.
    *   **Custom `HttpException`s:** Specific business logic errors extend `HttpException` (e.g., `NotFoundException`, `UnauthorizedException`) for semantically correct HTTP status codes.
    *   **Centralized Logging:** All errors are logged via Winston.
*   **Frontend:**
    *   `try-catch` blocks around API calls to gracefully handle errors.
    *   Display user-friendly error messages in the UI (e.g., toast notifications).
    *   Log relevant error details to the console or client-side error tracking.

## 13. Caching & Rate Limiting

*   **Caching (Redis):**
    *   **Socket.io Adapter:** `socket.io-redis` is crucial for allowing multiple backend instances to share WebSocket events, enabling horizontal scaling of the chat gateway.
    *   **Rate Limiting Store:** Redis is used by `express-rate-limit` to store request counts for each client, ensuring accurate rate limiting across distributed backend instances.
    *   **Session Management:** Can be extended to store user sessions or refresh tokens for advanced authentication flows.
    *   **Data Cache:** Though not extensively implemented in this example, Redis can cache frequently accessed database query results (e.g., user profiles, conversation lists) to reduce database load.
*   **Rate Limiting (Backend):**
    *   Implemented using `express-rate-limit` as a global middleware.
    *   Configurable via environment variables (`API_RATE_LIMIT_TTL`, `API_RATE_LIMIT_MAX`).
    *   Protects against brute-force attacks and excessive API usage.

## 14. Code Structure

The project follows a standard monorepo structure with `backend` and `frontend` folders. Each folder contains its own `package.json`, `tsconfig.json`, and source code.

```
.
├── README.md                 # Project root README
├── docker-compose.yml        # For PostgreSQL, Redis, Backend, Frontend containers
├── .github/                  # CI/CD workflows (conceptual)
│   └── workflows/
│       └── main.yml
├── backend/                  # NestJS API & WebSocket server
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── ormconfig.ts          # TypeORM database configuration
│   ├── src/
│   │   ├── main.ts           # Entry point
│   │   ├── app.module.ts     # Root module, connects other modules
│   │   ├── config/           # Environment configuration service
│   │   ├── auth/             # Authentication (register, login, JWT)
│   │   ├── users/            # User management
│   │   ├── conversations/    # Conversation creation & listing
│   │   ├── messages/         # Message fetching
│   │   ├── gateway/          # Real-time WebSocket logic
│   │   ├── common/           # Shared modules: guards, filters, interceptors, decorators
│   │   ├── database/         # Seed scripts
│   │   ├── migrations/       # TypeORM database migrations
│   │   └── tests/            # Unit, Integration, E2E tests
├── frontend/                 # React SPA
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/               # Public assets (index.html)
│   ├── src/
│   │   ├── index.tsx         # Entry point
│   │   ├── App.tsx           # Main component, routing
│   │   ├── assets/           # Static assets (images, icons)
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Layouts for different routes (Login, Chat)
│   │   ├── services/         # API interaction, WebSocket client
│   │   ├── store/            # Zustand state management stores
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── tests/            # Component and Page tests
```
```

---