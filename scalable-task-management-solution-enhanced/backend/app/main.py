import logging

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter
from contextlib import asynccontextmanager

from app.api.router import api_router
from app.core.config import settings
from app.core.db import engine, Base
from app.core.exceptions import CustomHTTPException, http_exception_handler
from app.core.middleware import (
    add_process_time_header, log_request_middleware, error_logging_middleware
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for application startup and shutdown events.
    Handles database initialization and Redis connection for caching/rate limiting.
    """
    logger.info("Application startup initiated.")
    try:
        # Initialize Redis for rate limiting and caching
        if settings.REDIS_URL:
            redis_connection = Redis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
            await FastAPILimiter.init(redis_connection)
            app.state.redis = redis_connection # Store redis connection in app state
            logger.info("Redis connection established and FastAPILimiter initialized.")
        else:
            logger.warning("REDIS_URL is not set. Caching and rate limiting will be disabled.")
            app.state.redis = None # Ensure redis is None if URL isn't set

        # Optional: Create all tables (for development, use Alembic in production)
        # async with engine.begin() as conn:
        #     await conn.run_sync(Base.metadata.create_all)
        # logger.info("Database tables checked/created (if not using Alembic for initial setup).")

    except Exception as e:
        logger.error(f"Error during application startup: {e}", exc_info=True)
        raise

    yield # Application runs here

    logger.info("Application shutdown initiated.")
    try:
        # Close Redis connection
        if app.state.redis:
            await app.state.redis.close()
            logger.info("Redis connection closed.")
    except Exception as e:
        logger.error(f"Error during application shutdown: {e}", exc_info=True)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_V1_STR,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan # Attach the lifespan context manager
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for CustomHTTPException
app.add_exception_handler(CustomHTTPException, http_exception_handler)

# Generic exception handler for unhandled errors
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True, extra={"request_url": request.url})
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred."},
    )

# Add custom middleware
app.middleware("http")(log_request_middleware)
app.middleware("http")(add_process_time_header)
app.middleware("http")(error_logging_middleware)


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint for health check or basic info
@app.get("/", summary="Root endpoint", tags=["Root"])
async def root():
    return {"message": "Welcome to the Task Management API", "version": settings.API_V1_STR}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting Uvicorn server on {settings.SERVER_HOST}:{settings.SERVER_PORT}")
    uvicorn.run(app, host=settings.SERVER_HOST, port=settings.SERVER_PORT)