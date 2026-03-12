.
├── .env.example                # Example environment variables
├── Dockerfile                  # Dockerfile for the FastAPI application
├── docker-compose.yml          # Docker Compose for app, db, redis
├── alembic.ini                 # Alembic configuration
├── app/
│   ├── __init__.py             # Makes 'app' a Python package
│   ├── api/                    # API endpoints
│   │   ├── __init__.py
│   │   ├── v1/                 # Version 1 of the API
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/      # Specific resource endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   ├── projects.py # Project CRUD
│   │   │   │   ├── tasks.py    # Task CRUD
│   │   │   │   ├── users.py    # User CRUD & Auth
│   │   │   ├── router.py       # Aggregates v1 endpoints
│   ├── core/                   # Core application components
│   │   ├── __init__.py
│   │   ├── config.py           # Application settings
│   │   ├── exceptions.py       # Custom exceptions
│   │   ├── security.py         # Password hashing, JWT utilities
│   ├── crud/                   # Create, Read, Update, Delete operations
│   │   ├── __init__.py
│   │   ├── base.py             # Generic CRUD operations
│   │   ├── project.py
│   │   ├── task.py
│   │   ├── user.py
│   ├── database/               # Database setup and models
│   │   ├── __init__.py
│   │   ├── base.py             # Base class for SQLAlchemy models
│   │   ├── session.py          # Database session management
│   ├── middleware/             # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── error_handler.py    # Global exception handler
│   │   ├── logger.py           # Request logging
│   │   ├── rate_limiter.py     # Rate limiting middleware
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── task.py
│   │   ├── user.py
│   ├── schemas/                # Pydantic models for request/response validation
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── task.py
│   │   ├── token.py            # JWT token schemas
│   │   ├── user.py
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── project_service.py
│   │   ├── task_service.py
│   │   ├── user_service.py
│   ├── main.py                 # FastAPI application entry point
├── alembic/                    # Alembic migration environment
│   ├── env.py
│   ├── script.py.mako
│   └── versions/               # Generated migration scripts
│       └── <timestamp>_initial_setup.py
├── scripts/
│   ├── seed_data.py            # Script to populate initial database data
├── static/                     # Frontend static files
│   ├── index.html              # Main frontend page
│   ├── app.js                  # Frontend JavaScript logic
│   ├── style.css               # Frontend CSS
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── unit/                   # Unit tests for CRUD/Services
│   │   ├── test_crud_project.py
│   │   ├── test_crud_user.py
│   │   ├── test_service_project.py
│   │   ├── test_service_user.py
│   ├── integration/            # Integration tests for API endpoints
│   │   ├── test_api_projects.py
│   │   ├── test_api_tasks.py
│   │   ├── test_api_users.py
├── .gitignore
├── requirements.txt            # Python dependencies
├── Makefile                    # Utility commands
├── README.md                   # Comprehensive project documentation
├── .github/                    # GitHub Actions CI/CD configuration
│   └── workflows/
│       └── main.yml