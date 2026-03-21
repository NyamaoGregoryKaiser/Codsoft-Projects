from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter

from app.api.v1 import auth, users, applications, metrics, metric_data
from app.core.config import settings
from app.core.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    HTTPException,
    http_exception_handler,
    unauthorized_exception_handler,
    forbidden_exception_handler,
    not_found_exception_handler,
)
from app.core.logging_config import setup_logging
from app.database.session import engine
from app.database import models
import redis.asyncio as redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    """
    # Create all database tables if they don't exist (handled by Alembic in production)
    # models.Base.metadata.create_all(bind=engine) # Commented out for Alembic
    
    # Initialize Redis for rate limiting and caching
    try:
        redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_client)
        print("Redis client initialized for rate limiting.")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        # Optionally, raise an error or handle gracefully if Redis is critical

    yield

    # Shutdown events
    await FastAPILimiter.close()
    print("FastAPILimiter client closed.")


app = FastAPI(
    title="Horizon Monitor API",
    version="1.0.0",
    description="API for managing and monitoring application performance data.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Setup logging
setup_logging()

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:3000",  # Frontend development URL
    # Add your production frontend URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(UnauthorizedException, unauthorized_exception_handler)
app.add_exception_handler(ForbiddenException, forbidden_exception_handler)
app.add_exception_handler(NotFoundException, not_found_exception_handler)


# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["Metrics"])
app.include_router(metric_data.router, prefix="/api/v1/metric_data", tags=["Metric Data"])


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify API operational status.
    """
    return {"status": "ok", "message": "Horizon Monitor API is running!"}