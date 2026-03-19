```markdown
# Real-time Chat Application

A comprehensive, enterprise-grade real-time chat application built with a full-stack approach using NestJS (TypeScript) for the backend and React (TypeScript) with Chakra UI for the frontend, powered by PostgreSQL and Socket.IO.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Setup](#manual-setup)
        *   [Backend](#backend)
        *   [Frontend](#frontend)
5.  [Database](#database)
6.  [API Documentation](#api-documentation)
7.  [Testing](#testing)
8.  [CI/CD](#ci-cd)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [Contributing](#contributing)
12. [License](#license)

## Features

*   **User Management**: Registration, Login, Logout, Profile Management.
*   **Authentication & Authorization**: JWT-based authentication for REST APIs and WebSocket connections. Refresh token mechanism for seamless sessions.
*   **Real-time Messaging**:
    *   One-to-one private chats.
    *   Group conversations with multiple participants.
    *   Sending and receiving messages instantly.
    *   Typing indicators (Work-in-progress/basic implementation).
    *   Read receipts/status for messages.
    *   Online/Offline user status.
*   **Conversation Management**:
    *   Create private or group conversations.
    *   List user's conversations with latest message preview.
    *   Add/remove participants from group conversations.
*   **Robust Error Handling**: Centralized exception filters.
*   **Logging**: Structured logging for backend activities.
*   **Configuration**: Environment-based configuration.
*   **API Documentation**: Swagger (OpenAPI) for backend API.

## Architecture

The application follows a modular, layered architecture to ensure scalability, maintainability, and clear separation of concerns.

*   **Monorepo Structure**: The project is organized into `backend` (NestJS) and `frontend` (React) applications within a single repository.
*   **Backend (NestJS)**:
    *   **Layered Design**: Controllers handle HTTP requests, Services encapsulate business logic, and Prisma is used for database interactions.
    *   **Modules**: Features are organized into modules (Auth, Users, Conversations, Messages, Gateway) with clear boundaries.
    *   **Real-time Gateway**: A dedicated WebSocket Gateway using Socket.IO handles real-time communication, separate from REST API.
    *   **Authentication**: Passport.js with JWT strategy secures REST endpoints and WebSocket connections.
    *   **Database**: PostgreSQL accessed via Prisma ORM for type-safe and efficient database operations.
*   **Frontend (React)**:
    *   **Component-Based**: UI is composed of reusable React components.
    *   **State Management**: Zustand for global and local state management (e.g., conversations, messages).
    *   **Real-time Client**: Socket.IO client integrates with the backend WebSocket gateway.
    *   **UI Library**: Chakra UI for accessible and responsive design.

```mermaid
graph TD
    UserClient[User/Browser] <--> |HTTP/S| FrontendApp[React Frontend]
    UserClient <--> |WebSocket (Socket.IO)| BackendGateway[NestJS WebSocket Gateway]

    FrontendApp <--> |HTTP/S REST API (Axios)| BackendAPI[NestJS REST API]

    BackendAPI <--> |Prisma ORM| PostgreSQL[PostgreSQL Database]
    BackendGateway <--> |Prisma ORM| PostgreSQL

    subgraph Backend Services
        BackendAPI
        BackendGateway
        AuthService(Auth Service)
        UserService(User Service)
        ConversationService(Conversation Service)
        MessageService(Message Service)
    end

    subgraph Frontend Components
        FrontendApp
        AuthForms(Login/Register)
        ChatLayout(Main Layout)
        ConversationList(Conversations)
        ChatWindow(Message Display/Input)
    end

    AuthService <--> PostgreSQL
    UserService <--> PostgreSQL
    ConversationService <--> PostgreSQL
    MessageService <--> PostgreSQL
```

## Technologies Used

*   **Backend**:
    *   Node.js (v18+)
    *   NestJS (Framework)
    *   TypeScript
    *   Prisma (ORM for PostgreSQL)
    *   Socket.IO (WebSockets)
    *   Passport.js (Authentication)
    *   JWT (JSON Web Tokens)
    *   Bcrypt (Password Hashing)
    *   Winston (Logging)
    *   Class-validator / Class-transformer (Validation / Transformation)
    *   Swagger (API Documentation)
    *   Jest, Supertest (Testing)
*   **Frontend**:
    *   React (v18+)
    *   Vite (Build Tool)
    *   TypeScript
    *   Chakra UI (Component Library)
    *   Zustand (State Management)
    *   Axios (HTTP Client)
    *   Socket.IO-client
    *   React Router DOM (Routing)
    *   Jest, React Testing Library (Testing)
*   **Database**:
    *   PostgreSQL
*   **Containerization**:
    *   Docker
    *   Docker Compose
*   **CI/CD**:
    *   GitHub Actions

## Setup and Installation

### Prerequisites

*   Node.js (v18 or higher)
*   Yarn (or npm)
*   Docker & Docker Compose
*   Git

### Local Development with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/realtime-chat-app.git
    cd realtime-chat-app
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` to `.env` in the root directory and fill in your desired values.
    ```bash
    cp .env.example .env
    ```
    Ensure `DATABASE_URL` is configured correctly for the `db` service (e.g., `postgresql://user:password@db:5432/chat_db?schema=public`). Also, ensure `FRONTEND_URL` in backend matches frontend's default port (`http://localhost:5173`).

3.  **Build and run Docker containers:**
    This will start the PostgreSQL database, backend, and frontend services.
    ```bash
    docker-compose up --build -d
    ```

4.  **Run Prisma Migrations (Backend):**
    Once the `db` and `backend` services are healthy, apply database migrations.
    ```bash
    docker-compose exec backend yarn prisma migrate dev --name init
    ```

5.  **Seed the database (Optional but recommended for testing):**
    ```bash
    docker-compose exec backend yarn prisma:seed
    ```

6.  **Access the application:**
    *   **Frontend**: Open your browser to `http://localhost:5173`
    *   **Backend API Docs**: Access Swagger UI at `http://localhost:3000/api-docs` (or your configured backend port).

### Manual Setup (Without Docker Compose)

#### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd realtime-chat-app/backend
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Create `.env` file:**
    Copy `.env.example` from the root directory to `backend/.env` and configure your database connection and JWT secrets. Ensure `DATABASE_URL` points to your local PostgreSQL instance (e.g., `postgresql://user:password@localhost:5432/chat_db?schema=public`).

4.  **Start a PostgreSQL database:**
    Make sure you have a PostgreSQL server running locally (e.g., via Homebrew, Docker, or direct installation).

5.  **Run Prisma Migrations:**
    ```bash
    yarn prisma migrate dev --name init
    ```

6.  **Seed the database (Optional):**
    ```bash
    yarn prisma:seed
    ```

7.  **Start the backend server:**
    ```bash
    yarn start:dev
    ```
    The backend will run at `http://localhost:3000` (or your configured port). API documentation will be available at `/api-docs`.

#### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd realtime-chat-app/frontend
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Create `.env` file:**
    Create a `.env` file in `frontend/.env` (no example needed for basic setup, Vite uses `VITE_` prefix for env vars).
    By default, it will connect to `http://localhost:3000/api/v1` for REST and `ws://localhost:3000/chat` for WebSockets. If your backend is on a different host/port, update `VITE_API_BASE_URL` and `VITE_WS_URL` in `frontend/vite.config.ts` or set environment variables.

4.  **Start the frontend development server:**
    ```bash
    yarn dev
    ```
    The frontend will run at `http://localhost:5173`.

## Database

*   **ORM**: Prisma is used for interacting with the PostgreSQL database.
*   **Schema**: The database schema is defined in `prisma/schema.prisma`.
    *   `User`: Stores user credentials and profile information.
    *   `OnlineStatus`: Tracks user online/offline status.
    *   `Conversation`: Represents a chat conversation (private or group).
    *   `ConversationParticipant`: Junction table for users participating in conversations.
    *   `Message`: Stores chat messages.
    *   `MessageReadBy`: Junction table to track which users have read a specific message.
*   **Migrations**: Prisma handles database migrations. New changes to `schema.prisma` can be applied using `yarn prisma migrate dev`.
*   **Seeding**: `prisma/seed.ts` provides initial data for testing, including sample users and conversations.

## API Documentation

The backend API is documented using **Swagger (OpenAPI)**.
Once the backend is running, you can access the interactive API documentation at:
`http://localhost:3000/api-docs`

This documentation provides details on all available endpoints, request/response schemas, and allows you to test the APIs directly.

## Testing

The project includes comprehensive tests to ensure code quality and functionality.

*   **Backend (NestJS)**:
    *   **Unit Tests**: Located in `backend/test/<module>/*.spec.ts`. These tests cover individual services and components in isolation.
        *   Run all backend unit tests: `cd backend && yarn test`
        *   Run tests with coverage: `cd backend && yarn test:cov` (aims for 80%+ coverage on core logic)
    *   **Integration Tests**: Located in `backend/test/<module>/*.spec.ts`. These tests verify the interaction between multiple components (e.g., controllers interacting with services).
    *   **E2E Tests**: A basic e2e setup is available in `backend/test/app.e2e-spec.ts`. For a full enterprise application, more extensive e2e tests would be added.
        *   Run backend E2E tests: `cd backend && yarn test:e2e`
*   **Frontend (React)**:
    *   **Unit Tests**: Located in `frontend/src/**/*.test.tsx`. These tests use React Testing Library and Jest to verify component rendering and behavior.
        *   Run all frontend tests: `cd frontend && yarn test`
        *   Run tests in watch mode: `cd frontend && yarn test:watch`
*   **Performance Tests**:
    *   **Strategy**: For performance testing, tools like `k6` or `Artillery` would be used.
        *   Simulate high concurrency on API endpoints (login, register, send message, get conversations).
        *   Simulate concurrent WebSocket connections and message exchanges.
        *   Monitor server resource utilization (CPU, Memory, Network I/O) using tools like Prometheus/Grafana.
    *   *(Note: Actual performance test scripts are not included in this comprehensive setup but are a critical part of enterprise-grade solutions.)*

## CI/CD

An example GitHub Actions workflow (`.github/workflows/main.yml`) is provided. This workflow demonstrates:

*   **Separate jobs for Backend and Frontend**: Ensuring isolated builds and tests.
*   **Database setup for backend tests**: Uses a temporary PostgreSQL service.
*   **Prisma Migrations**: Applied before running backend tests.
*   **Test execution**: Runs unit and integration tests for both applications.
*   **Build artifacts**: Builds both frontend and backend for potential deployment.
*   **Conditional deployment**: An example `deploy` job is commented out, showing how you might trigger deployment to a cloud provider (e.g., pushing Docker images, deploying to Kubernetes) upon merge to `main`.

To use the deployment job, you would need to:
1.  Uncomment the `deploy` job.
2.  Configure Docker Hub credentials as GitHub Secrets (`DOCKER_USERNAME`, `DOCKER_TOKEN`).
3.  Replace placeholder image tags with your own.
4.  Add specific deployment steps for your chosen cloud provider (e.g., AWS EKS, Google GKE, Azure AKS, DigitalOcean Kubernetes).

## Deployment Guide

This application is designed for containerized deployment, typically using Docker and Kubernetes in a production environment.

1.  **Containerize Applications**:
    *   `Dockerfile`s are provided for both `backend` and `frontend`.
    *   Build Docker images:
        ```bash
        docker build -t your-repo/chat-backend:latest ./backend
        docker build -t your-repo/chat-frontend:latest ./frontend
        ```
    *   Push images to a container registry (e.g., Docker Hub, AWS ECR, Google Container Registry).

2.  **Environment Variables**:
    *   Ensure all necessary environment variables (from `.env.example`) are configured in your deployment environment (Kubernetes secrets, EC2 user data, etc.).
    *   Crucially, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (for CORS and WS origin) must be set correctly.
    *   For `FRONTEND_URL`, specify the actual public URL of your frontend.

3.  **Database Provisioning**:
    *   Provision a managed PostgreSQL instance (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL). This offers high availability, backups, and scalability.
    *   Apply Prisma migrations to the production database.

4.  **Orchestration (Kubernetes Example)**:
    *   Create Kubernetes deployment and service manifests for:
        *   **Backend**: Exposing the API and WebSocket services. Consider using an Ingress controller (Nginx, Traefik) for routing.
        *   **Frontend**: Serving static files, potentially via an Nginx container or a static site hosting service.
    *   Configure Horizontal Pod Autoscaling (HPA) for both backend and frontend to handle varying load.

5.  **Networking**:
    *   Set up a load balancer (e.g., AWS ALB, Nginx Ingress Controller) to distribute traffic to frontend and backend instances.
    *   Configure SSL/TLS certificates for HTTPS.
    *   Ensure proper firewall rules are in place.

6.  **Monitoring & Logging**:
    *   Integrate with cloud-native logging services (e.g., AWS CloudWatch, Google Cloud Logging, Datadog) by sending application logs.
    *   Set up monitoring (e.g., Prometheus/Grafana, cloud monitoring tools) to track application health, performance metrics, and errors.
    *   Configure alerts for critical issues.

## Future Enhancements

*   **File Uploads**: Sharing images, videos, or documents within chats.
*   **Push Notifications**: Mobile and desktop notifications for new messages.
*   **Emoji Support**: Richer message content.
*   **Message Editing/Deletion**: Ability to modify or retract sent messages.
*   **Search**: Search for messages, conversations, or users.
*   **Read Receipts**: Advanced read receipts (e.g., showing who has read a message in a group).
*   **User Profiles**: More detailed user profiles, avatars.
*   **Typing Indicators**: More robust and real-time typing indicators.
*   **Mentions (@user)**: Tagging users in group chats.
*   **Reaction to Messages**: Adding emojis reactions to messages.
*   **Online Status Aggregation**: Using Redis to manage and broadcast online statuses more efficiently.
*   **Comprehensive E2E Testing**: Cypress or Playwright for full user flow testing.
*   **Internationalization (i18n)**: Support for multiple languages.

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```