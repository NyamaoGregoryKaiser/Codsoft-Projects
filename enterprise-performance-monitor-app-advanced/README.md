.
├── .github/                       # CI/CD workflows (GitHub Actions)
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration
│       └── cd.yml                 # Continuous Deployment (simplified)
├── backend/                       # FastAPI application
│   ├── alembic/                   # Database migration scripts
│   │   ├── versions/
│   │   └── env.py
│   │   └── script.py.mako
│   ├── app/                       # Source code for the FastAPI app
│   │   ├── api/                   # API routes definitions
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/     # Specific API endpoints
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── projects.py
│   │   │   │   │   └── metrics.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── auth/                  # Authentication and authorization logic
│   │   │   ├── security.py
│   │   │   └── services.py
│   │   ├── core/                  # Core configurations and utilities
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── exceptions.py
│   │   │   ├── middlewares.py
│   │   │   └── __init__.py
│   │   ├── crud/                  # CRUD operations for database models
│   │   │   ├── base.py
│   │   │   ├── project.py
│   │   │   ├── metric.py
│   │   │   └── user.py
│   │   ├── models/                # SQLAlchemy database models
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── metric.py
│   │   ├── schemas/               # Pydantic schemas for request/response validation
│   │   │   ├── token.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── metric.py
│   │   ├── services/              # Business logic services
│   │   │   ├── metric_aggregator.py
│   │   │   └── __init__.py
│   │   ├── tasks/                 # Celery background tasks
│   │   │   ├── celery_worker.py
│   │   │   └── __init__.py
│   │   ├── main.py                # Main FastAPI application entry point
│   │   └── logger.py              # Centralized logging configuration
│   ├── Dockerfile                 # Dockerfile for the FastAPI app
│   ├── requirements.txt           # Python dependencies
│   └── tests/                     # Unit, integration, and API tests
│       ├── unit/
│       ├── integration/
│       └── api/
│       └── performance/
├── frontend/                      # React application
│   ├── public/
│   ├── src/
│   │   ├── api/                   # API client for backend communication
│   │   ├── assets/                # Static assets (images, icons)
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # React Context for global state (e.g., Auth)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Top-level page components
│   │   ├── styles/                # Global styles, utility classes
│   │   ├── utils/                 # Utility functions
│   │   ├── App.js                 # Main App component
│   │   ├── index.css              # Global CSS
│   │   └── index.js               # Entry point for React app
│   ├── Dockerfile                 # Dockerfile for the React app
│   ├── package.json               # Node.js dependencies and scripts
│   ├── .env.example               # Environment variables example
│   └── nginx.conf                 # Nginx configuration for serving React app
├── monitored-app-example/         # Example application sending metrics to PerfSight
│   ├── app.py                     # Simple Flask app
│   ├── perf_client.py             # Custom client to send metrics to PerfSight
│   ├── requirements.txt           # Python dependencies for example app
│   ├── start_gunicorn.sh          # Script to start Gunicorn
│   ├── Dockerfile                 # Dockerfile for the example app
│   └── .env.example               # Environment variables for example app
├── docker-compose.yml             # Docker Compose for local development/deployment
├── .env.example                   # Example environment variables for docker-compose
├── README.md                      # Main project README
├── API_DOCUMENTATION.md           # Detailed API documentation
├── ARCHITECTURE.md                # Architecture overview
└── DEPLOYMENT_GUIDE.md            # Deployment instructions