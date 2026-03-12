# Enterprise-Grade Content Management System (CMS)

This is a comprehensive, production-ready full-stack Content Management System built with Django (REST Framework) for the backend and React (Chakra UI) for the frontend. It includes features like user authentication, content management (posts, pages, media), categorization, testing, Dockerization, and CI/CD setup.

## Features

**Backend (Django/DRF)**
*   **User Management:** Custom User model, JWT-based authentication (login, register, refresh, logout), user profiles.
*   **Content Management:**
    *   **Posts & Pages:** CRUD operations, title, content (rich text ready), slug generation, status (draft, published, archived).
    *   **Categories & Tags:** For content organization, CRUD operations.
    *   **Media Management:** Upload, store, and retrieve image/file assets.
    *   **Content Revisions:** Basic versioning to track changes and restore previous states.
*   **API:** Full CRUD API endpoints with `djangorestframework`.
*   **Permissions & Authorization:** Role-based access control (Admin, Staff/Editor, Authenticated User).
*   **Error Handling:** Custom exception handler for consistent API responses.
*   **Caching:** Redis integration for API response caching to improve performance.
*   **Rate Limiting:** DRF's built-in throttling for API endpoints.
*   **Logging:** Configurable logging with console and file output.
*   **Database:** PostgreSQL for robust data storage.
*   **API Documentation:** Integrated Swagger UI / OpenAPI Spec using `drf-spectacular`.

**Frontend (React/Chakra UI)**
*   **Modern UI:** Built with React 18, utilizing Chakra UI for accessible and responsive components.
*   **Authentication:** Integration with JWT backend for user login/logout.
*   **Admin Dashboard:** A responsive admin panel for managing posts, pages, categories, tags, and media.
*   **Content Forms:** Forms for creating and editing content with rich text editing capabilities (placeholder).
*   **Public Views:** Basic public-facing pages for displaying posts and static pages.
*   **Routing:** React Router DOM for client-side navigation.
*   **State Management:** React Context API for authentication state.
*   **API Integration:** `axios` for interacting with the backend API.

**Infrastructure**
*   **Docker:** Containerization for all services (backend, frontend, database, redis).
*   **Docker Compose:** Easy local development setup with all services orchestrated.
*   **Environment Configuration:** `python-decouple` and `.env` files for managing sensitive configurations.

**Quality & Development Practices**
*   **Testing:** Unit and integration tests for backend APIs and models, basic frontend component tests.
*   **CI/CD:** GitHub Actions workflow for linting, testing, and building Docker images.

## Technologies Used

*   **Backend:** Python 3.10+, Django 4.x, Django REST Framework, PostgreSQL, Redis
*   **Frontend:** React 18, Chakra UI, JavaScript/ES6+
*   **Containerization:** Docker, Docker Compose
*   **API Documentation:** DRF Spectacular (Swagger/OpenAPI)
*   **Authentication:** JWT (JSON Web Tokens)
*   **Deployment (Conceptual):** Nginx, Gunicorn

## Setup Instructions

### Prerequisites

*   Docker & Docker Compose
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-cms-project.git
cd your-cms-project
```

### 2. Environment Configuration

Create `.env` files in the root directory from the examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env # Although docker-compose will handle most backend env
cp frontend/.env.example frontend/.env
```

**Edit `.env` (root directory):**
*   Update `SECRET_KEY` with a strong, random string.
*   Adjust `DB_NAME`, `DB_USER`, `DB_PASSWORD` if desired.
*   Set `REACT_APP_API_BASE_URL` to `http://localhost:8000/api/v1` for local development.

**Example `.env` (root directory, for `docker-compose.yml`):**
```
# Django Settings
SECRET_KEY=your_super_secret_key_at_least_50_chars
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=cms_dev_db
DB_USER=cms_dev_user
DB_PASSWORD=cms_dev_password

# Frontend Settings
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_SITE_NAME=My Awesome CMS
```

### 3. Build and Run with Docker Compose

From the project root directory:

```bash
docker-compose build
docker-compose up -d
```

This will:
*   Build the `backend` and `frontend` Docker images.
*   Start `PostgreSQL`, `Redis`, `backend`, and `frontend` services.
*   Apply Django migrations and collect static files (in `backend` service's `entrypoint.sh`).

Wait for all services to start. You can check their status with `docker-compose ps`.
The `backend` will be running on `http://localhost:8000` and `frontend` on `http://localhost:3000`.

### 4. Initial Setup (Backend)

Once the backend service is running:

**Create a Superuser (for Django Admin and initial content creation):**
```bash
docker-compose exec backend python manage.py createsuperuser
```
Follow the prompts to create an admin user (e.g., email: `admin@example.com`, password: `adminpassword`).

**Seed Sample Data:**
```bash
docker-compose exec backend python manage.py seed --posts 15 --pages 5 --categories 5 --tags 10 --media 5
```
This command will populate the database with some sample posts, pages, categories, tags, and media items for testing. It will also ensure the `admin@example.com` user exists.

### 5. Access the Applications

*   **Frontend:** Open your browser to `http://localhost:3000`
    *   You can log in to the admin panel at `http://localhost:3000/login` using the superuser credentials (`admin@example.com`/`adminpassword`).
*   **Backend API:** Access the API endpoints at `http://localhost:8000/api/v1/`
*   **API Documentation (Swagger UI):** `http://localhost:8000/api/schema/swagger-ui/`
*   **Django Admin:** `http://localhost:8000/admin/`

## Running Tests

### Backend Tests

From the project root:
```bash
docker-compose exec backend python manage.py test
```

### Frontend Tests

From the project root:
```bash
docker-compose exec frontend yarn test --watchAll=false
```

## Further Development

*   **Rich Text Editor:** Replace the placeholder `Textarea` in `RichTextEditor.js` with a proper rich text editor library (e.g., `react-quill`, `draft-js`, `ckeditor5-react`).
*   **Media Gallery:** Enhance `MediaManagementPage` with image previews, search, filtering, and pagination.
*   **User Roles & Permissions:** Implement more granular user roles (e.g., "Editor" who can publish but not manage users).
*   **SEO Fields:** Add meta title, meta description fields to Post/Page models and serializers.
*   **Frontend Authentication:** Persist user session more robustly, handle token expiration and refresh token failures gracefully.
*   **Internationalization (i18n):** Support multiple languages for content and UI.
*   **Deployment:** Implement a full production deployment setup (e.g., AWS, GCP, DigitalOcean) using Nginx for static file serving and reverse proxy, Gunicorn for the Django app, and dedicated database/redis instances.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
```

#### `architecture.md`

```markdown