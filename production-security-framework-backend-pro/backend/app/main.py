```python
import time
import redis.asyncio as redis
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from fastapi_limiter import FastAPILimiter

from app.core.config import settings
from app.api.api_router import api_router
from app.middleware.logging import LoggingMiddleware
from app.exceptions.handlers import add_exception_handlers
from app.services.cache import init_cache

# Configure Loguru
logger.add(
    "logs/app_log.log",
    rotation="500 MB",
    level=settings.LOG_LEVEL,
    colorize=True,
    format="{time} {level} {message}",
    enqueue=True # Use multiprocessing safe queue
)
logger.info(f"Logger initialized with level: {settings.LOG_LEVEL}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    logger.info("Application starting up...")
    
    # Initialize Redis for Rate Limiting
    try:
        redis_connection_limiter = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_connection_limiter)
        logger.info(f"FastAPILimiter initialized with Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT} (DB 0)")
    except Exception as e:
        logger.error(f"Failed to initialize FastAPILimiter: {e}")

    # Initialize Redis for Caching
    init_cache()
    
    logger.info("Application startup complete.")
    yield
    # Shutdown events
    logger.info("Application shutting down...")
    await FastAPILimiter.close()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    version="1.0.0",
    lifespan=lifespan,
)

# Add custom exception handlers
add_exception_handlers(app)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add main API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["monitoring"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} is running"}

# Root endpoint for basic access
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Welcome to Secure Task Management API!"}
```