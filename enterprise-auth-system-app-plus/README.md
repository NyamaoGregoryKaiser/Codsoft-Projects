# Enterprise-Grade Authentication System

This project is a comprehensive, production-ready full-stack authentication system designed to demonstrate enterprise-grade development practices. It features a robust Spring Boot backend, a responsive React frontend, and a PostgreSQL database, all orchestrated with Docker Compose for easy local setup.

## Features

**Core Application (Backend - Java/Spring Boot):**
*   **User Management:** Registration, login, profile retrieval.
*   **Role-Based Authorization:** `ROLE_USER` and `ROLE_ADMIN`.
*   **CRUD for Notes:** Demonstrates secure data operations tied to users and roles.
*   **RESTful API:** Clear and consistent API endpoints.
*   **Data Validation:** Using Jakarta Bean Validation.

**Core Application (Frontend - React):**
*   **User Interface:** Intuitive UI for login, registration, dashboard, profile, and note management.
*   **Authentication Flow:** Handles JWT tokens, redirects for unauthorized access.
*   **React Router:** For single-page application navigation.
*   **Context API:** For global authentication state management.
*   **API Integration:** Uses Axios for seamless backend communication.

**Database Layer (PostgreSQL & Flyway):**
*   **Schema Definitions:** Users, Roles, User_Roles, Notes tables.
*   **Migration Scripts:** Managed by Flyway for version-controlled schema evolution.
*   **Seed Data:** Initial admin user, regular user, and roles are automatically populated.
*   **Query Optimization:** Leverages Spring Data JPA for efficient data access, with indexing on foreign keys.

**Configuration & Setup:**
*   **Dependency Management:** Maven for Java, npm for React.
*   **Environment Configuration:** `application.yml` for Spring Boot, `.env` for React.
*   **Docker Setup:** `Dockerfile`s for backend and frontend, `docker-compose.yml` for multi-container orchestration (PostgreSQL, Spring Boot, Nginx/React).
*   **CI/CD Configuration:** GitHub Actions workflow described for automated builds and tests.

**Testing & Quality:**
*   **Unit Tests:** JUnit 5 and Mockito for isolated component testing (e.g., services, mappers).
*   **Integration Tests:** `@DataJpaTest` with Testcontainers for repository layer, `@SpringBootTest` for full application context.
*   **API Tests:** `@WebMvcTest` for controller layer testing, simulating HTTP requests.
*   **Performance Tests:** Description of tools and approach (JMeter/Gatling).

**Additional Features:**
*   **Authentication/Authorization:** JWT-based authentication with Spring Security. Role-based access control using `@PreAuthorize`.
*   **Logging & Monitoring:** SLF4J with Logback configured for structured logging. Spring Boot Actuator for health checks (integrated with Docker healthchecks).
*   **Error Handling:** Global `@ControllerAdvice` for consistent error responses (400, 401, 403, 404, 409, 500).
*   **Caching Layer:** Spring Cache with Caffeine for improving performance (e.g., user details lookup).
*   **Rate Limiting:** Implemented with Bucket4j on authentication endpoints to prevent abuse.
*   **API Documentation:** Integrated Springdoc OpenAPI (Swagger UI) for interactive API documentation.

## Getting Started

Follow these steps to set up and run the project locally using Docker Compose.

### Prerequisites

*   Docker Desktop (includes Docker Engine and Docker Compose)
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/auth-system.git # Replace with your actual repo
cd auth-system
```

### 2. Configure Frontend Environment (Optional, for local `npm start` development)

Create a `.env` file in the `frontend/` directory with the following content:
```
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
```
This is only needed if you plan to run the frontend separately using `npm start`. When using `docker-compose up`, the API URL is handled by Nginx proxy or Docker environment variables.

### 3. Build and Run with Docker Compose

Navigate to the root directory of the project (where `docker-compose.yml` is located) and run:

```bash
docker-compose up --build -d
```

*   `--build`: Builds the Docker images from the `Dockerfile`s before starting containers.
*   `-d`: Runs the containers in detached mode (in the background).

This command will:
1.  Build the `db` (PostgreSQL) image.
2.  Build the `backend` (Spring Boot) image.
3.  Build the `frontend` (React + Nginx) image.
4.  Start all three services, ensuring the database is healthy before the backend starts, and the backend is healthy before the frontend starts.
5.  Run Flyway migrations on the `db` container, populating initial schema and seed data.

Wait a few minutes for all services to start up completely. You can check their status with:
```bash
docker-compose ps
docker-compose logs -f
```

### 4. Access the Applications

*   **Frontend (React App):** Open your browser and go to `http://localhost:3000`
*   **Backend (Spring Boot API):**
    *   API Endpoints: `http://localhost:8080/api/v1/...`
    *   Swagger UI (API Docs): `http://localhost:8080/swagger-ui.html`
    *   Actuator Health: `http://localhost:8080/actuator/health`

### 5. Default Credentials

The `V2__Add_Seed_Data.sql` migration script creates the following default users:

*   **Admin User:**
    *   Username: `adminuser`
    *   Email: `admin@example.com`
    *   Password: `admin123`
    *   Roles: `ROLE_USER`, `ROLE_ADMIN`
*   **Regular User:**
    *   Username: `testuser`
    *   Email: `test@example.com`
    *   Password: `user123`
    *   Roles: `ROLE_USER`

You can use these credentials to log in via the frontend.

### 6. Stop and Clean Up

To stop and remove all services and their associated networks/volumes:
```bash
docker-compose down --volumes
```
*   `--volumes`: Removes the named volumes declared in the `docker-compose.yml` (e.g., `auth_db_data`), which will delete your database data. Use with caution! If you want to keep the data, remove this flag.

---

## Architecture Documentation

### Backend (Spring Boot)

*   **Layered Architecture:**
    *   **Controllers:** Handle HTTP requests, delegate to services, and return responses. Annotated with `@RestController`, `@RequestMapping`.
    *   **Services:** Contain business logic, orchestrate repository calls, apply validation. Annotated with `@Service`, `@Transactional`.
    *   **Repositories:** Interact with the database using Spring Data JPA. Extend `JpaRepository`.
    *   **Entities:** JPA annotated classes representing database tables. Use `AuditModel` for common auditing fields.
    *   **DTOs (Data Transfer Objects):** Used for data transfer between layers and external clients, ensuring separation of concerns from entities.
    *   **Mappers:** MapStruct interfaces (`@Mapper`) for efficient and type-safe conversion between entities and DTOs.
*   **Security (Spring Security & JWT):**
    *   `SecurityConfig`: Main configuration for Spring Security, defining filter chain, authentication manager, password encoder, and CORS.
    *   `JwtAuthenticationFilter`: Custom filter that intercepts requests, extracts JWT, validates it, and sets `Authentication` in `SecurityContextHolder`.
    *   `JwtTokenProvider`: Utility for generating and validating JWT tokens.
    *   `CustomUserDetailsService`: Loads user details from the database during authentication, implementing Spring Security's `UserDetailsService`.
    *   `JwtAuthenticationEntryPoint`: Handles authentication failures (e.g., invalid/missing token) by sending 401 Unauthorized response.
    *   `@PreAuthorize`: Used on service methods and controller endpoints for method-level role-based authorization.
*   **Database Integration:**
    *   **JPA:** Spring Data JPA for ORM.
    *   **PostgreSQL:** Relational database.
    *   **Flyway:** Database migration tool for schema version control (`/db/migration` scripts).
*   **Additional Features:**
    *   **Error Handling:** `GlobalExceptionHandler` (`@ControllerAdvice`) provides consistent, standardized JSON error responses for various exceptions.
    *   **Logging:** Configured with Logback (`logback-spring.xml`) for detailed, categorized logging to console and file.
    *   **Caching:** Spring Cache with Caffeine (`CacheConfig`) for performance optimization (e.g., caching `UserDetails` objects).
    *   **Rate Limiting:** `RateLimitingConfig` with Bucket4j applied to authentication endpoints (`AuthController`) to prevent brute-force attacks.
    *   **API Documentation:** Springdoc OpenAPI integration (`OpenApiConfig`) generates interactive Swagger UI documentation at `/swagger-ui.html`.

### Frontend (React)

*   **Component-Based:** Organized into reusable React components (e.g., `Header`, `Footer`, `PrivateRoute`) and pages (`LoginPage`, `DashboardPage`).
*   **State Management:** `AuthContext.js` uses React Context API for global authentication state (`user`, `isAuthenticated`).
*   **Routing:** React Router DOM handles navigation (`App.js`, `PrivateRoute.js`).
*   **API Communication:** `api.js` configures Axios for HTTP requests, including interceptors for adding JWT tokens to headers and handling global error responses (e.g., 401 redirect to login).
*   **Services:** `auth.service.js`, `user.service.js`, `note.service.js` encapsulate API calls related to specific resources.
*   **UI/UX:** Basic CSS styling for a clean and functional interface.

## API Documentation

The backend exposes a comprehensive RESTful API, fully documented with Swagger UI.

**Access Swagger UI at:** `http://localhost:8080/swagger-ui.html`

Here's a summary of key endpoints:

**Authentication (`/api/v1/auth`)**
*   `POST /login`: Authenticate user, returns JWT token.
    *   Request Body: `LoginRequest` (usernameOrEmail, password)
    *   Response: `JwtAuthenticationResponse`
*   `POST /register`: Register new user.
    *   Request Body: `RegisterRequest` (username, email, password)
    *   Response: String message

**User Management (`/api/v1/users`)**
*   `GET /me`: Get current authenticated user's profile. (Requires JWT, `ROLE_USER` or `ROLE_ADMIN`)
    *   Response: `UserProfileDTO`
*   `GET /{userId}`: Get user details by ID. (Requires JWT, `ROLE_ADMIN`)
    *   Response: `UserDTO`
*   `GET /`: Get all users. (Requires JWT, `ROLE_ADMIN`)
    *   Response: List of `UserDTO`

**Note Management (`/api/v1/notes`)**
*   `POST /`: Create a new note. (Requires JWT, `ROLE_USER` or `ROLE_ADMIN`)
    *   Request Body: `CreateNoteRequest` (title, content, userId)
    *   Response: `NoteDTO`
*   `GET /{noteId}`: Get note by ID. (Requires JWT, `ROLE_USER` (owner only) or `ROLE_ADMIN`)
    *   Response: `NoteDTO`
*   `GET /my-notes`: Get all notes for the authenticated user. (Requires JWT, `ROLE_USER` or `ROLE_ADMIN`)
    *   Response: List of `NoteDTO`
*   `GET /all`: Get all notes in the system. (Requires JWT, `ROLE_ADMIN`)
    *   Response: List of `NoteDTO`
*   `PUT /{noteId}`: Update an existing note. (Requires JWT, `ROLE_USER` (owner only) or `ROLE_ADMIN`)
    *   Request Body: `UpdateNoteRequest` (title, content)
    *   Response: `NoteDTO`
*   `DELETE /{noteId}`: Delete a note. (Requires JWT, `ROLE_USER` (owner only) or `ROLE_ADMIN`)
    *   Response: 204 No Content

## Testing and Quality

### Backend Tests

*   **Unit Tests:** Located in `backend/src/test/java/...`
    *   Examples: `AuthServiceTest.java`
    *   Focus: Isolated testing of individual components (services, mappers) using Mockito.
*   **Integration Tests:**
    *   `UserRepositoryTest.java`: Uses `@DataJpaTest` and Testcontainers to test repository interactions with a real database.
    *   Full `@SpringBootTest` examples would test the entire application context, including embedded web server and real database. (Not provided in full here due to length, but `Testcontainers` is configured for it).
*   **API Tests (Controller Tests):**
    *   `AuthControllerTest.java`: Uses `@WebMvcTest` and `MockMvc` to test controller endpoints without starting a full HTTP server, mocking service layer.
    *   For end-to-end API testing, tools like **RestAssured** or **Postman/Newman** could be used.

### Frontend Tests

*   **Unit Tests:** Located in `frontend/src/...test.js`
    *   Example: `App.test.js`
    *   Focus: Testing individual React components and functions using `@testing-library/react` and Jest. Mocking API calls and local storage to isolate component logic.
*   **End-to-End Tests:**
    *   For a production-grade application, frameworks like **Cypress** or **Playwright** would be used to simulate user interactions across the entire stack.

### Performance Tests

*   **Tools:** **Apache JMeter** or **Gatling** are recommended.
*   **Strategy:**
    1.  Define realistic user scenarios (e.g., concurrent logins, registration spikes, frequent note CRUD operations).
    2.  Simulate varying load levels (number of concurrent users, ramp-up time).
    3.  Monitor key metrics: response times, throughput, error rates, server resource utilization (CPU, memory, database connections).
    4.  Identify bottlenecks and areas for optimization (e.g., cache tuning, query optimization, scaling).

## CI/CD Pipeline Configuration (Conceptual using GitHub Actions)

The `.github/workflows/ci-cd.yml` file defines a basic CI/CD pipeline.

```yaml