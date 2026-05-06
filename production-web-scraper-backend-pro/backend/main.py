```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError
from contextlib import asynccontextmanager
import uvicorn

from backend.core.config import settings
from backend.core.database import engine, Base, SessionLocal
from backend.core.logger import logger
from backend.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    generic_exception_handler
)
from backend.middleware.rate_limiter import rate_limiter_middleware
from backend.services.scheduler import initialize_scheduler, shutdown_scheduler
from backend.seed_data import create_initial_data

# Import routers
from backend.routers import auth, users, scrapers, tasks, proxies, user_agents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables, seed data, initialize scheduler
    logger.info("Application starting up...")
    
    # Not using alembic for automatic table creation in app startup, 
    # but for initial setup and dev purposes it's fine.
    # In production, alembic migrations should be run explicitly.
    # Base.metadata.create_all(bind=engine) 
    logger.info("Database migration check (or creation) complete.")
    
    # Seed initial data (e.g., admin user)
    create_initial_data(SessionLocal)
    
    # Initialize scheduler
    initialize_scheduler(SessionLocal)
    
    logger.info("Application startup complete.")
    yield
    # Shutdown: Stop scheduler
    logger.info("Application shutting down...")
    shutdown_scheduler()
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
if settings.RATE_LIMIT_ENABLED:
    app.middleware("http")(rate_limiter_middleware)
    logger.info("Rate Limiting Middleware enabled.")
else:
    logger.info("Rate Limiting Middleware disabled.")


# Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)
logger.info("Custom exception handlers registered.")

# API V1 Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(scrapers.router, prefix=f"{settings.API_V1_STR}/scrapers", tags=["Scrapers"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(proxies.router, prefix=f"{settings.API_V1_STR}/proxies", tags=["Proxies"])
app.include_router(user_agents.router, prefix=f"{settings.API_V1_STR}/user-agents", tags=["User Agents"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Web Scraping Orchestrator API!"}

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    try:
        with SessionLocal() as db:
            db.execute(Base.metadata.tables['users'].select()) # Try a simple query
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database connection failed: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```