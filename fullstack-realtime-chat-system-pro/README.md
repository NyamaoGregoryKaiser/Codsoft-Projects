# Realtime Chat Application (Enterprise Grade)

A full-stack, real-time chat application built with Java Spring Boot for the backend and React for the frontend, utilizing WebSockets for instant message delivery. This project is designed with production readiness, scalability, and maintainability in mind, incorporating essential enterprise features.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
    *   [Backend](#backend)
    *   [Frontend](#frontend)
    *   [Database & Infrastructure](#database--infrastructure)
3.  [Architecture](#architecture)
4.  [Setup and Local Development](#setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
    *   [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
    *   [Running Backend Natively](#running-backend-natively)
    *   [Running Frontend Natively](#running-frontend-natively)
5.  [API Documentation](#api-documentation)
6.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [API Testing (Manual/Automated)](#api-testing-manualautomated)
    *   [Performance Testing](#performance-testing)
7.  [Deployment Guide](#deployment-guide)
8.  [CI/CD](#cicd)
9.  [Future Enhancements](#future-enhancements)
10. [Contributing](#contributing)
11. [License](#license)

## 1. Features

*   **User Authentication & Authorization:** Secure JWT-based authentication for user login/registration.
*   **Real-time Messaging:** Instant message delivery using WebSockets (STOMP protocol).
*   **Chat Room Management:**
    *   Create public/private chat rooms.
    *   List chat rooms a user is part of.
    *   Add participants to existing chat rooms.
*   **Message History:** Retrieve historical messages for a chat room with pagination.
*   **Responsive UI:** Basic but functional user interface for chat interactions.
*   **Robust Error Handling:** Centralized exception handling on the backend.
*   **Logging & Monitoring:** Structured logging with Logback for backend.
*   **Caching:** Local caching with Caffeine for frequently accessed data (users, chat rooms).
*   **Dockerization:** Containerized application for easy deployment.
*   **Database Migrations:** Flyway for managing database schema evolution.
*   **Comprehensive Testing:** Unit, Integration, and API testing coverage.
*   **API Documentation:** Swagger/OpenAPI for easy API exploration.

## 2. Technology Stack

### Backend
*   **Language:** Java 17
*   **Framework:** Spring Boot 3.2.x
*   **Web:** Spring Web (REST APIs)
*   **Real-time:** Spring WebSocket (STOMP over WebSocket)
*   **Persistence:** Spring Data JPA, Hibernate
*   **Security:** Spring Security, JWT (jjwt library)
*   **Database Migration:** Flyway
*   **Caching:** Caffeine
*   **Validation:** Spring Validation API
*   **Documentation:** SpringDoc OpenAPI (Swagger UI)
*   **Logging:** SLF4J with Logback
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers (for integration tests)
*   **Build Tool:** Maven

### Frontend
*   **Language:** JavaScript (ES6+)
*   **Framework:** React 18
*   **State Management:** React Context API
*   **Routing:** React Router DOM 6
*   **API Client:** Axios
*   **WebSocket Client:** Stomp.js, SockJS-client
*   **Styling:** Pure CSS (modular components)
*   **Utility:** `jwt-decode`, `moment`
*   **Build Tool:** Create React App (Webpack, Babel)
*   **Testing:** Jest, React Testing Library

### Database & Infrastructure
*   **Database:** PostgreSQL 15
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions (configured example)

## 3. Architecture

The application follows a typical microservice-oriented (or at least modular monolithic) architecture, separating concerns into a backend API, a real-time WebSocket service, and a single-page application (SPA) frontend.

```mermaid
graph TD
    UserClient[User's Browser/Client] --> |HTTP/S Requests| Nginx(Frontend Nginx)
    Nginx --> |Static Assets (HTML, CSS, JS)| UserClient
    Nginx --> |HTTP/S API Requests| Backend(Spring Boot Backend:8080)
    UserClient -- WebSocket Connection (WSS) --> Backend
    Backend --> |JDBC| PostgreSQL(PostgreSQL Database)
    Backend -- Pub/Sub (Internal) --> Backend
    Backend --> |Logs| LogFile(Log Files)

    subgraph Backend Services
        AuthService[Auth Controller + Service]
        UserService[User Controller + Service]
        ChatRoomService[ChatRoom Controller + Service]
        MessageService[Message Controller + WebSocket Handler]
        JWTSecurity[Spring Security + JWT Filter]
        WebSocketConfig[WebSocket Config]
        Cache[Caffeine Cache]
    end

    Backend --> AuthService
    Backend --> UserService
    Backend --> ChatRoomService
    Backend --> MessageService
    Backend --> JWTSecurity
    Backend --> WebSocketConfig
    Backend --> Cache

    PostgreSQL -- Migrations --> Flyway(Flyway)
```

**Key Architectural Decisions:**

*   **Separation of Concerns:** Frontend and backend are decoupled, communicating via REST APIs and WebSockets.
*   **Stateless Backend:** JWT for authentication ensures a stateless API, simplifying horizontal scaling.
*   **WebSocket (STOMP):** Chosen for efficient, bidirectional real-time communication for chat messages. STOMP provides a robust, message-oriented protocol layer over WebSockets.
*   **Caching:** Caffeine (in-memory) is used for frequently accessed, less volatile data (e.g., user profiles, chat room metadata) to reduce database load and improve response times. For distributed caching, Redis would be a suitable choice.
*   **Database:** PostgreSQL is a reliable, open-source relational database well-suited for structured data and ACID compliance.
*   **Dockerization:** Simplifies environment setup, ensures consistency across development, testing, and production.
*   **API First:** Clear API contracts defined and documented with OpenAPI/Swagger.
*   **Error Handling:** Global exception handling centralizes error responses and improves API consistency.
*   **Security:** Comprehensive Spring Security configuration with JWT for authentication, CORS handling, and secure WebSocket connections.

## 4. Setup and Local Development

### Prerequisites

*   **Git:** For cloning the repository.
*   **Java 17 SDK:** For the backend.
*   **Maven:** For building the backend.
*   **Node.js (v18+):** For the frontend.
*   **Yarn (recommended) or npm:** For managing frontend dependencies.
*   **Docker & Docker Compose:** For running the entire stack easily.
*   **PostgreSQL Client (Optional):** To inspect the database directly (e.g., `psql`).

### Environment Variables

Create a `.env` file in the project root directory (same level as `docker-compose.yml`):

```dotenv
# .env
DB_NAME=chat_db
DB_USER=chat_user
DB_PASSWORD=password
JWT_SECRET=a_very_long_and_complex_secret_key_for_production_use_1234567890abcdefghijklmnopqrstuvwxyz
```
**IMPORTANT:** Replace `JWT_SECRET` with a truly long, random, and secure string for any deployment beyond local development.

### Running with Docker Compose (Recommended)

This is the easiest way to get the entire application running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/realtime-chat-app.git
    cd realtime-chat-app
    ```
2.  **Build and run the containers:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build the `backend` Docker image from `Dockerfile.backend`.
    *   Build the `frontend` Docker image from `Dockerfile.frontend`.
    *   Start a PostgreSQL database container (`db`).
    *   Start the `backend` application, waiting for the database to be healthy. Flyway migrations will run automatically.
    *   Start the `frontend` Nginx server, serving the React app.

3.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API (Swagger UI): `http://localhost:8080/swagger-ui/index.html`

4.  **Stop the containers:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (database data):
    ```bash
    docker-compose down --volumes
    ```

### Running Backend Natively

If you prefer to run the backend separately without Docker Compose:

1.  **Start a PostgreSQL database:**
    Make sure a PostgreSQL database is running and accessible. You can use Docker:
    ```bash
    docker run --name chat_db_local -e POSTGRES_USER=chat_user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=chat_db -p 5432:5432 -d postgres:15-alpine
    ```
2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
3.  **Set environment variables:**
    Ensure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET` are set in your environment (e.g., from the `.env` file or directly in your shell).
    ```bash
    # Example for Linux/macOS
    export DB_HOST=localhost
    export DB_USER=chat_user
    export DB_PASSWORD=password
    export DB_NAME=chat_db
    export JWT_SECRET=a_very_long_and_complex_secret_key_for_production_use_1234567890abcdefghijklmnopqrstuvwxyz
    ```
4.  **Run Flyway migrations manually (optional, Spring Boot will do this on startup):**
    You can force a clean migration if needed:
    ```bash
    ./mvnw flyway:clean flyway:migrate
    ```
5.  **Build and run the application:**
    ```bash
    ./mvnw spring-boot:run
    ```
    The backend will be available at `http://localhost:8080`.

### Running Frontend Natively

If you prefer to run the frontend separately for development:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    yarn install
    # or npm install
    ```
3.  **Set environment variables for React:**
    React apps read `REACT_APP_*` variables at build time. For local development, you can create a `.env.local` file in the `frontend/` directory:
    ```dotenv
    # frontend/.env.local
    REACT_APP_API_BASE_URL=http://localhost:8080/api
    REACT_APP_WEBSOCKET_URL=ws://localhost:8080/websocket
    ```
4.  **Start the development server:**
    ```bash
    yarn start
    # or npm start
    ```
    The frontend will be available at `http://localhost:3000`.

## 5. API Documentation

The backend API is documented using SpringDoc OpenAPI (Swagger UI).
Once the backend is running, you can access the Swagger UI at:
`http://localhost:8080/swagger-ui/index.html`

**How to use Swagger UI:**

1.  **Authenticate:**
    *   Go to the `Authentication` section and use the `/api/auth/login` endpoint with a registered user's credentials (e.g., `alice` / `password123` from seed data).
    *   Copy the `token` value from the response.
    *   Click the green "Authorize" button at the top of the Swagger UI.
    *   In the "Value" field, enter `Bearer <YOUR_JWT_TOKEN>` (replace `<YOUR_JWT_TOKEN>` with the token you copied).
    *   Click "Authorize" and then "Close".
2.  **Explore Endpoints:** You can now explore and test other protected endpoints.

## 6. Testing

### Backend Tests

*   **Unit Tests:** Located in `backend/src/test/java/.../service/` and `backend/src/test/java/.../repository/`. These tests use JUnit 5 and Mockito to test individual components in isolation.
    *   **Coverage Target:** Aim for 80%+ code coverage for business logic services.
*   **Integration Tests:** Located in `backend/src/test/java/.../controller/`. These tests use `@SpringBootTest` and `MockMvc` to test API endpoints, and `Testcontainers` to provide a real PostgreSQL database instance for testing the full persistence layer integration.
*   **Running Backend Tests:**
    ```bash
    cd backend
    ./mvnw test
    ```

### Frontend Tests

*   **Unit Tests:** Located in `frontend/src/tests/`. These tests use Jest and React Testing Library to test individual React components and utility functions.
*   **Running Frontend Tests:**
    ```bash
    cd frontend
    yarn test # or npm test
    ```
    To run all tests once: `yarn test --watchAll=false`

### API Testing (Manual/Automated)

*   **Manual Testing:** Use tools like Postman, Insomnia, or browser developer tools to manually test REST endpoints and WebSocket functionality (e.g., subscribing to topics, sending messages).
*   **Automated API Testing:** For production, integrate tools like [RestAssured](https://rest-assured.io/) (for Java) or [Newman](https://www.postman.com/downloads/run-postman-from-cli/) (for Postman collections) into your CI/CD pipeline. Examples using `curl` are provided in the documentation within the code.

### Performance Testing

*   **Tools:** Apache JMeter, Gatling, or K6 are recommended.
*   **Strategy:**
    1.  Simulate varying numbers of concurrent users.
    2.  Test API endpoints (Login, Create Room, Get Rooms, Get Messages).
    3.  Crucially, test WebSocket message sending and receiving under load.
    4.  Monitor server resources (CPU, RAM, Network I/O, DB connections).
    5.  Measure response times, throughput, and error rates.

## 7. Deployment Guide

This project is designed for containerized deployment using Docker.

1.  **Build Docker Images:**
    Ensure you have built the latest Docker images for both backend and frontend. The `docker-compose up --build` command does this automatically. If building separately:
    ```bash
    cd backend
    docker build -t realtime-chat-backend -f Dockerfile.backend .
    cd ../frontend
    docker build -t realtime-chat-frontend -f Dockerfile.frontend .
    ```
2.  **Environment Variables:**
    Ensure your `.env` file contains production-ready values, especially `JWT_SECRET` and `DB_PASSWORD`.
    For a production frontend, `REACT_APP_API_BASE_URL` and `REACT_APP_WEBSOCKET_URL` in `Dockerfile.frontend`'s build arguments should point to your deployed backend's URL.

    Example for `Dockerfile.frontend` if backend is at `api.yourdomain.com`:
    ```dockerfile
    # ...
    ARG REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
    ARG REACT_APP_WEBSOCKET_URL=wss://api.yourdomain.com/websocket
    ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
    ENV REACT_APP_WEBSOCKET_URL=$REACT_APP_WEBSOCKET_URL
    RUN yarn build
    # ...
    ```
    Also, ensure `CORS_ALLOWED_ORIGINS` in `backend/src/main/resources/application.yml` (or environment variable) includes your production frontend domain.

3.  **Docker Compose Deployment:**
    Copy `docker-compose.yml` and the `.env` file to your production server.
    ```bash
    # On your production server
    # Make sure Docker and Docker Compose are installed
    # Create the .env file with production secrets
    docker-compose up -d
    ```
    This will run all services in detached mode. You might want to use a reverse proxy like Nginx or Caddy on the host machine to serve the frontend on standard ports (80/443) and proxy API/WebSocket requests to the backend, enabling HTTPS.

4.  **Example Nginx Reverse Proxy Configuration (on host machine, not in Docker):**
    ```nginx
    # /etc/nginx/sites-available/chat-app.conf
    server {
        listen 80;
        listen [::]:80;
        server_name chat.yourdomain.com; # Replace with your domain

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name chat.yourdomain.com; # Replace with your domain

        ssl_certificate /etc/letsencrypt/live/chat.yourdomain.com/fullchain.pem; # Use Certbot for SSL
        ssl_certificate_key /etc/letsencrypt/live/chat.yourdomain.com/privkey.pem;

        location / {
            proxy_pass http://localhost:3000; # Forward to frontend container (ports exposed on host)
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            proxy_pass http://localhost:8080; # Forward to backend container (ports exposed on host)
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /websocket/ {
            proxy_pass http://localhost:8080; # Forward to backend container
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    Enable this configuration and restart Nginx.

## 8. CI/CD

A sample GitHub Actions workflow is provided in `.github/workflows/main.yml`.

This workflow currently includes:

*   **`build-and-test-backend` job:**
    *   Checks out code.
    *   Sets up Java 17.
    *   Caches Maven dependencies.
    *   Starts a PostgreSQL container using `docker run` for integration tests.
    *   Runs Maven `clean install` which executes unit and integration tests.
    *   Builds the backend Docker image.
    *   Uploads test reports as artifacts.
*   **`build-and-test-frontend` job:**
    *   Checks out code.
    *   Sets up Node.js 18.
    *   Caches Yarn dependencies.
    *   Installs frontend dependencies.
    *   Runs Yarn tests (Jest).
    *   Builds the frontend Docker image.
    *   Uploads test reports as artifacts.

**To enable the CI/CD pipeline:**

1.  Push your code to a GitHub repository.
2.  The workflow will automatically trigger on pushes to `main` or `develop` branches and on pull requests.
3.  For deployment steps (commented out in the example), you would need to configure:
    *   Docker Hub credentials as GitHub Secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`).
    *   SSH credentials for your deployment server as GitHub Secrets (`SSH_HOST`, `SSH_USERNAME`, `SSH_KEY`).
    *   Adjust `yourdockerhub` to your actual Docker Hub username.
    *   Update `REACT_APP_API_BASE_URL` and `REACT_APP_WEBSOCKET_URL` in the frontend Docker build args to reflect your deployed backend's URL.

## 9. Future Enhancements

*   **User Profiles:** Profile pictures, status messages.
*   **Direct Messaging (DM):** One-on-one private chats.
*   **Group Chat Enhancements:** Private chat rooms, inviting users by username, leaving rooms.
*   **Message Features:** Edit/delete messages, reactions, file uploads, message search.
*   **Notifications:** Desktop notifications for new messages.
*   **Online Status:** Indicate when users are online/offline.
*   **Typing Indicators:** Show when someone is typing.
*   **Read Receipts:** Show when messages have been read.
*   **Scalability:**
    *   Replace Caffeine with Redis for distributed caching.
    *   Horizontal scaling of backend services.
    *   Load balancing.
*   **Advanced Security:**
    *   Rate limiting for API endpoints.
    *   Role-based access control (RBAC) for users and chat rooms.
    *   Input sanitization on the frontend and backend to prevent XSS.
*   **Observability:**
    *   Integrate Prometheus/Grafana for metric collection and visualization.
    *   Integrate ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging.
    *   Distributed tracing (e.g., with Zipkin or Jaeger).
*   **Frontend UI/UX:** More polished design, better responsiveness, dark mode.

## 10. Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 11. License

This project is open-source and available under the [MIT License](LICENSE).
```