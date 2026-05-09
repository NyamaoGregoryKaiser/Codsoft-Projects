```python
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import CustomException
from app.core.logging_config import setup_logging
from app.db.session import engine, Base
from app.core.cache import get_redis_client

# Setup logging configuration
logger = setup_logging(__name__)

# Create database tables (if they don't exist) - not for migrations in prod
# Base.metadata.create_all(bind=engine) # Handled by Alembic in production


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for application startup and shutdown events.
    Initializes Redis client for caching and rate limiting.
    """
    logger.info("Application startup event triggered.")
    try:
        redis_client = get_redis_client()
        await FastAPILimiter.init(redis_client)
        logger.info("Redis client and FastAPI-Limiter initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Redis or FastAPI-Limiter: {e}")
        # Depending on criticality, you might want to raise the exception or allow partial startup
        # For production, consider making Redis essential or implementing a fallback
    yield
    logger.info("Application shutdown event triggered.")
    # Optional: Close Redis client if it has a close method
    # await FastAPILimiter.close() # FastAPI-Limiter doesn't expose a direct close, rely on Redis client's lifecycle


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan # Use the lifespan context manager
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Middleware for request logging and error handling
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except CustomException as e:
        logger.error(f"Caught CustomException for {request.url}: {e.name} - {e.message}", exc_info=True)
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.message}
        )
    except Exception as e:
        logger.error(f"Caught unhandled exception for {request.url}: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred."}
        )

    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Request to {request.url} processed in {process_time:.4f} seconds.")
    return response

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint for health check
@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to the E-commerce API! Visit /api/v1/docs for API documentation."}

```