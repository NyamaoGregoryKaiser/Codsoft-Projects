```markdown
# DataViz Pro - Comprehensive Data Visualization System

DataViz Pro is an enterprise-grade, full-stack data visualization platform designed to help users connect to various data sources, create interactive dashboards, and share insights. Built with modern web technologies, it emphasizes performance, security, and a rich user experience.

## Features

**Core Application:**
*   **User Management:** Secure user registration, login, and role-based access control (RBAC).
*   **Data Source Management:** Connect to various databases (PostgreSQL, MySQL, MongoDB - extensible) and REST APIs.
*   **Dashboard Creation:** Drag-and-drop interface for building custom dashboards with multiple charts.
*   **Chart Configuration:** Define chart types (bar, line, pie, etc.), map data fields, and customize visualization options.
*   **Data Fetching & Processing:** Backend handles querying external data sources and basic data transformations.

**Enterprise-Grade Features:**
*   **Authentication & Authorization:** JWT-based authentication, RBAC (Admin, User, Viewer roles).
*   **Logging & Monitoring:** Structured logging with Winston, covering application events and errors.
*   **Error Handling:** Centralized exception filters and validation pipes for robust API responses.
*   **Caching Layer:** Redis integration for frequently accessed data to improve response times.
*   **Rate Limiting:** Protects the API from abuse and ensures fair usage.

**Development & Operations:**
*   **TypeScript:** Full-stack type safety for enhanced development experience and reduced bugs.
*   **Docker:** Containerized setup for easy deployment and consistent environments.
*   **CI/CD Pipeline:** Automated testing and deployment workflows with GitHub Actions.
*   **Comprehensive Testing:** Unit, Integration, API, and E2E tests for high quality and reliability.
*   **Detailed Documentation:** README, API documentation (Swagger), Architecture, and Deployment Guides.

## Technologies Used

**Backend (NestJS / TypeScript):**
*   **Framework:** NestJS
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** Passport.js, JWT
*   **Caching:** Redis (`cache-manager-redis-store`)
*   **Logging:** Winston
*   **Validation:** Class-validator, Class-transformer
*   **API Docs:** Swagger (OpenAPI)

**Frontend (Next.js / React / TypeScript):**
*   **Framework:** Next.js
*   **UI Library:** React
*   **State Management:** Zustand
*   **Data Fetching:** React Query
*   **Styling:** Tailwind CSS
*   **Charting:** ECharts (or similar, like D3.js, Chart.js)
*   **Notifications:** React Hot Toast

**Infrastructure & DevOps:**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Reverse Proxy/Load Balancer:** Nginx
*   **Testing Frameworks:** Jest, React Testing Library, Supertest, Cypress, k6 (for performance)

## Setup Instructions

### Prerequisites

*   Node.js (v18+) & npm
*   Docker & Docker Compose
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/data-viz-system.git
cd data-viz-system
```

### 2. Environment Configuration

Create `.env.development` (for backend) and `.env.development.local` (for frontend) files based on `.env.example` in both `backend/` and `frontend/` directories.

**`backend/.env.development`**
```
PORT=3000
FRONTEND_URL=http://localhost:3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/data_viz_db?schema=public"
JWT_SECRET="supersecretkey" # CHANGE ME IN PRODUCTION
JWT_EXPIRATION_TIME="1h"
REDIS_HOST=localhost
REDIS_PORT=6379
```

**`frontend/.env.development.local`**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
# Other frontend specific variables
```

### 3. Docker Setup

Ensure Docker Desktop is running.

Build and start all services using Docker Compose:

```bash
docker-compose up --build -d
```
This will:
*   Spin up PostgreSQL and Redis containers.
*   Build the backend and frontend Docker images.
*   Run Prisma migrations and seed data for the backend.
*   Start the backend (http://localhost:3000) and frontend (http://localhost:3001) services.
*   (Optional) Start Nginx as a reverse proxy (http://localhost:80).

**Note:** The `command` in `docker-compose.yml` for the backend includes `npx prisma migrate deploy` and `npx prisma db seed`. This is convenient for development but in production, migrations should be handled as a separate step before application deployment.

### 4. Access the Application

*   **Frontend:** Open your browser and navigate to `http://localhost:3001` (or `http://localhost` if using Nginx).
*   **Backend API Docs:** Access Swagger UI at `http://localhost:3000/api/docs`.

**Default Admin Credentials (from seed data):**
*   **Email:** `admin@example.com`
*   **Password:** `adminpassword`

## Running Tests

### Backend Tests

Navigate to the `backend/` directory:
```bash
cd backend
npm install
npm test # Run all unit and integration tests
npm run test:e2e # Run end-to-end tests (requires running backend/DB)
npm run test:cov # Run tests with coverage report
```

### Frontend Tests

Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm test # Run unit tests
npm run test:coverage # Run tests with coverage report
npm run e2e # Open Cypress test runner
npm run e2e:headless # Run Cypress tests in headless mode
```

### Performance Tests

Navigate to the `k6/` directory (if you set up k6):
```bash
cd k6
k6 run --env BACKEND_URL=http://localhost:3000/api scripts/api-stress-test.js
```

## Contributing

Please refer to `CONTRIBUTING.md` (not provided in this blueprint) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License.
```