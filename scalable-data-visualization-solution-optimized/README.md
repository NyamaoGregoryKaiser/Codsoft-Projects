# DataVizPro: Enterprise Data Visualization Platform

DataVizPro is a full-stack, enterprise-grade data visualization platform designed to empower users to connect to various data sources, create interactive dashboards, and share insights.

## Features

- **User Management**: Secure authentication and authorization (JWT, Spring Security).
- **Data Source Management**: Connect to various SQL databases (PostgreSQL, MySQL, H2) with extensible connectors.
- **Dashboard Creation**: Drag-and-drop interface for building interactive dashboards.
- **Visualization Editor**: Create different chart types (bar, line, pie, table) with customizable queries and styles.
- **Role-Based Access Control**: Granular permissions for data sources, dashboards, and visualizations.
- **API**: Comprehensive RESTful API with full CRUD operations.
- **Scalability**: Built with Spring Boot for the backend and React for the frontend, designed for modern cloud deployments.
- **Observability**: Integrated logging, monitoring (via Actuator), and error handling.
- **Performance**: Caching layer (Caffeine) and rate limiting.

## Tech Stack

**Backend**:
- **Language**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (local dev/tests use H2/Testcontainers)
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security, JWT
- **Database Migrations**: Flyway
- **Build Tool**: Maven

**Frontend**:
- **Language**: TypeScript
- **Framework**: React 18+
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Charting Library**: Apache Echarts
- **HTTP Client**: Axios
- **Build Tool**: Vite

**DevOps & Infrastructure**:
- **Containerization**: Docker, Docker Compose
- **CI/CD**: Jenkins (example pipeline provided)
- **API Documentation**: OpenAPI/Swagger UI

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Java 17+ SDK
- Node.js 20+ and npm
- Docker and Docker Compose
- Maven (optional, if not using `mvnw` wrapper)

### Setup & Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/datavizpro.git
cd datavizpro
```

#### 2. Create Nginx config for frontend (if serving locally via Docker)

Create a `nginx/nginx.conf` file at the root of the `datavizpro` directory:

```nginx
# datavizpro/nginx/nginx.conf
server {
    listen 80;
    server_name localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080/api/; # 'backend' is the service name in docker-compose
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

#### 3. Build and Run with Docker Compose (Recommended for local development)

This will set up PostgreSQL, the Spring Boot backend, and the React frontend.

```bash
docker-compose up --build -d
```

- Backend will be available at `http://localhost:8080`
- Frontend will be available at `http://localhost:3000`
- PostgreSQL will be available at `localhost:5432`

Wait for all services to be healthy. You can check their status with `docker-compose ps`.

#### 4. Access the Application

- **Frontend**: Open your browser and navigate to `http://localhost:3000`.
- **Backend API Documentation (Swagger UI)**: `http://localhost:8080/swagger-ui.html`
- **Actuator Endpoints**: `http://localhost:8080/actuator`

**Default Credentials:**
- **Admin User**:
  - Username: `admin`
  - Password: `admin123`
- **Regular User**:
  - Username: `user`
  - Password: `user123`
- **Viewer User**:
  - Username: `viewer`
  - Password: `viewer123`

### Manual Setup (Alternative)

#### Backend (Spring Boot)

```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
Ensure you have a PostgreSQL database running and configured in `application.yml` or via environment variables.

#### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```
The frontend will try to connect to the backend at `http://localhost:8080/api/v1` (configured in `frontend/.env` or `vite.config.ts`).

## Testing

### Backend Tests

Run all backend tests:
```bash
cd backend
./mvnw test
```
To run tests and generate JaCoCo coverage report:
```bash
./mvnw clean verify
```
The report will be available at `backend/target/jacoco-report/index.html`.

### Frontend Tests

Run all frontend tests:
```bash
cd frontend
npm test
```
To run tests with coverage:
```bash
npm test -- --coverage
```
Coverage reports will be in `frontend/coverage/`.

## Contributing

Please refer to `CONTRIBUTING.md` (not provided in this response, but would be a real file) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details (not provided in this response).

## Contact

[Your Name/Organization] - [Your Email/Website]
```