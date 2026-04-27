# Real-time Chat Application System

This is a comprehensive, enterprise-grade real-time chat application system built with a modern full-stack architecture. It focuses on modularity, scalability, and developer experience.

## Features

**Core Chat Functionality:**
*   Real-time messaging (text)
*   User presence (online/offline)
*   Typing indicators
*   Private and Public chat rooms
*   Direct messaging (conceptual, rooms with two members)
*   Message history with pagination

**User Management & Authentication:**
*   User registration and login
*   JWT-based authentication (HTTP & WebSocket)
*   User profiles

**Backend Features:**
*   NestJS (TypeScript) framework
*   PostgreSQL database with TypeORM ORM
*   RESTful API for Auth and User management
*   WebSocket API for real-time chat (Socket.IO)
*   Global exception handling
*   Request logging (Winston)
*   Rate limiting (Throttler)
*   Caching layer (Redis for sessions, extendable for data)
*   Database migrations & seeding

**Frontend Features:**
*   Next.js (React.js, TypeScript) framework
*   Modern UI with Tailwind CSS
*   Responsive design
*   Authentication context
*   Service layer for API and WebSocket interactions

**Infrastructure & DevOps:**
*   Docker & Docker Compose for local development and deployment
*   CI/CD pipeline configuration (GitHub Actions - conceptual)

**Quality & Testing:**
*   Unit, Integration, and E2E tests for backend
*   Unit tests for frontend components/hooks
*   API documentation (Swagger)
*   Performance testing guidelines

## Tech Stack

**Backend:**
*   **Framework**: NestJS (TypeScript)
*   **Database**: PostgreSQL
*   **ORM**: TypeORM
*   **Real-time**: Socket.IO
*   **Authentication**: Passport.js (JWT Strategy, Local Strategy)
*   **Logging**: Winston
*   **Caching/Sessions**: Redis, `connect-redis`, `express-session`
*   **Validation**: Class-validator, Class-transformer
*   **API Docs**: Swagger (OpenAPI)
*   **Testing**: Jest, Supertest

**Frontend:**
*   **Framework**: Next.js (React, TypeScript)
*   **Styling**: Tailwind CSS
*   **Real-time**: Socket.IO Client
*   **HTTP Client**: Axios
*   **State Management**: React Context API
*   **Routing**: Next.js Router
*   **Testing**: Jest, React Testing Library

**Infrastructure:**
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions

## Setup Instructions

### Prerequisites

*   Node.js (v20 or higher)
*   npm (v9 or higher) or yarn
*   Docker & Docker Compose
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Environment Variables

Create `.env` files based on the examples:

*   **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in values.
    ```bash
    cp backend/.env.example backend/.env
    ```
    _Minimum required:_ `DATABASE_URL`, `JWT_SECRET`, `REDIS_HOST`, `SESSION_SECRET`, `FRONTEND_URL`.

*   **Frontend**: Copy `frontend/.env.local.example` to `frontend/.env.local` and fill in values.
    ```bash
    cp frontend/.env.local.example frontend/.env.local
    ```
    _Minimum required:_ `NEXT_PUBLIC_API_BASE_URL`.

### 3. Build and Run with Docker Compose (Recommended)

This will set up PostgreSQL, Redis, Backend, and Frontend services.

```bash
docker-compose up --build -d
```

*   `--build`: Builds images from Dockerfiles (needed for first run or if Dockerfiles change).
*   `-d`: Runs containers in detached mode.

Wait for all services to start (this might take a few minutes for the database to be healthy and backend to run migrations/seeds).

**Check service status:**
```bash
docker-compose ps
```

**Accessing Services:**
*   **Backend API**: `http://localhost:3000`
*   **Backend Swagger Docs**: `http://localhost:3000/api/docs`
*   **Frontend App**: `http://localhost:3001`

### 4. Running Backend and Frontend Separately (for Development)

#### Backend Setup

```bash
cd backend
npm install
npm run start:dev # Starts in watch mode
```

This will run the backend on `http://localhost:3000`. Ensure your PostgreSQL and Redis instances are running and accessible (e.g., via `docker-compose up -d db redis`).

**Database Migrations & Seeding (for backend running locally):**
```bash
# To generate a new migration (after entity changes)
npm run migration:generate -- ./src/database/migrations/NewMigrationName

# To run migrations
npm run migration:run

# To revert the last migration
npm run migration:revert

# To seed initial data
npm run seed
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev # Starts in development mode
```

This will run the frontend on `http://localhost:3001`.

## Development & Folder Structure

The project is structured into `backend` and `frontend` directories, each with its own `package.json` and dependencies.

### `backend/`
*   `src/`: NestJS source code
    *   `auth/`: Authentication logic (JWT, Passport strategies, guards, DTOs)
    *   `chat/`: Real-time chat logic (Gateway, Service, Entities, DTOs)
    *   `common/`: Shared utilities (filters, interceptors, decorators, guards, logger, middleware)
    *   `config/`: Application configuration
    *   `database/`: TypeORM entities, migrations, and seed scripts
    *   `users/`: User management (Service, Controller, Entity, DTOs)
*   `test/`: Backend unit, integration, and e2e tests
*   `.env`: Environment variables
*   `Dockerfile`: Docker image for the backend

### `frontend/`
*   `src/app/`: Next.js pages and root layout
*   `src/components/`: Reusable React components (auth forms, chat UI)
*   `src/contexts/`: React Context API for global state (e.g., AuthContext)
*   `src/hooks/`: Custom React hooks
*   `src/services/`: API (Axios) and WebSocket (Socket.IO) client interactions
*   `src/styles/`: Global styles and Tailwind CSS configuration
*   `src/types.ts`: Shared TypeScript interfaces/types
*   `test/`: Frontend unit tests
*   `.env.local`: Local environment variables
*   `Dockerfile.frontend`: Docker image for the frontend

## Testing

### Backend Tests

Run all backend tests:
```bash
cd backend
npm test
```

Run tests with coverage:
```bash
cd backend
npm run test:cov
```

Run E2E tests:
```bash
cd backend
npm run test:e2e
```

### Frontend Tests

Run all frontend tests:
```bash
cd frontend
npm test
```

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is unlicensed for demonstration purposes. For production use, consider an appropriate license.

---
**This README provides the essential information. For more detailed documentation, please refer to the following files:**
*   `ARCHITECTURE.md`
*   `API.md`
*   `DEPLOYMENT.md`