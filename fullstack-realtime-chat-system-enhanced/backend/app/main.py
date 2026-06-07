```python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException, RequestValidationError

from app.api.v1.endpoints import auth, users, chats
from app.core.config import settings
from app.core.database import database_startup, database_shutdown
from app.core.logging_config import setup_logging
from app.middlewares.error_handler import http_exception_handler, validation_exception_handler, generic_exception_handler
from app.middlewares.rate_limiter import RateLimitingMiddleware
from app.core.websocket_manager import WebSocketManager
from app.utils.cache import redis_client

# Setup logging configuration as early as possible
setup_logging()
logger = logging.getLogger(__name__)

# Initialize WebSocketManager
ws_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    """
    logger.info("Application starting up...")
    # Database initialization
    await database_startup()
    # Initialize Redis client
    await redis_client.init()
    logger.info("Database and Redis client initialized.")

    # Yield control to the application startup
    yield

    # Application shutdown events
    logger.info("Application shutting down...")
    await database_shutdown()
    await redis_client.close()
    logger.info("Database and Redis client closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="A real-time chat application API built with FastAPI.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
# Allows all origins for development. In production, restrict this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production (e.g., ["http://localhost:3000", "https://yourfrontend.com"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
app.add_middleware(RateLimitingMiddleware, redis_client=redis_client)


# Global Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["Users"])
app.include_router(chats.router, prefix=settings.API_V1_STR, tags=["Chats"])


@app.get("/", summary="Root endpoint for health check", tags=["Health Check"])
async def root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": f"{settings.PROJECT_NAME} API is running!"}


@app.get("/health", summary="Detailed health check", tags=["Health Check"])
async def health_check():
    """
    Provides a detailed health check of the API, database, and Redis.
    """
    db_status = "healthy"
    redis_status = "healthy"

    try:
        # Attempt a simple database query to check connection
        async with app.state.db_session_maker() as session:
            await session.execute("SELECT 1")
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    try:
        # Attempt a simple Redis command to check connection
        await redis_client.ping()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "unhealthy"

    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy"

    return JSONResponse(
        status_code=status.HTTP_200_OK if overall_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": overall_status,
            "database": db_status,
            "redis": redis_status,
            "api_version": settings.API_VERSION,
            "project_name": settings.PROJECT_NAME,
        },
    )

```