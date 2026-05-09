```python
import time
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from loguru import logger

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import CustomException, UnauthorizedException, ForbiddenException, NotFoundException, \
    ValidationException
from app.db.session import engine, init_db
from app.middleware.error_handler import custom_exception_handler
from app.middleware.logging_middleware import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for application startup and shutdown events.
    """
    logger.info("Application starting up...")

    # Database initialization
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    # Redis for rate limiting and token caching
    logger.info("Connecting to Redis...")
    try:
        redis_connection = redis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
            encoding="utf8",
            decode_responses=True
        )
        await FastAPILimiter.init(redis_connection)
        logger.info("Redis connected and FastAPILimiter initialized.")
        app.state.redis = redis_connection # Store redis connection in app state
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise

    yield  # Application runs here

    logger.info("Application shutting down...")
    # Clean up FastAPILimiter
    await FastAPILimiter.close()
    if hasattr(app.state, 'redis') and app.state.redis:
        await app.state.redis.close()
    logger.info("Redis connection closed.")
    logger.info("Application shut down complete.")


app = FastAPI(
    title=settings.APP_NAME,
    description="A secure, scalable authentication and authorization service with example CRUD operations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging Middleware
app.add_middleware(LoggingMiddleware)

# Custom Exception Handlers
app.add_exception_handler(HTTPException, custom_exception_handler)
app.add_exception_handler(CustomException, custom_exception_handler)
app.add_exception_handler(UnauthorizedException, custom_exception_handler)
app.add_exception_handler(ForbiddenException, custom_exception_handler)
app.add_exception_handler(NotFoundException, custom_exception_handler)
app.add_exception_handler(ValidationException, custom_exception_handler)


# Include API routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health Check"])
async def root():
    """
    Root endpoint for health check.
    """
    return {"message": f"Welcome to {settings.APP_NAME} API!"}


@app.get("/health", tags=["Health Check"])
async def health_check(request: Request, response: Response):
    """
    Performs a health check of the application and its dependencies.
    """
    start_time = time.perf_counter()
    status = {"status": "ok", "uptime": f"{time.monotonic() - request.app.state.startup_time:.2f} seconds"}

    # Database connection check
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        status["database"] = "connected"
    except Exception as e:
        status["database"] = f"error: {e}"
        response.status_code = 500

    # Redis connection check
    try:
        if hasattr(request.app.state, 'redis') and request.app.state.redis:
            await request.app.state.redis.ping()
            status["redis"] = "connected"
        else:
            status["redis"] = "error: Redis client not initialized"
            response.status_code = 500
    except Exception as e:
        status["redis"] = f"error: {e}"
        response.status_code = 500
    
    end_time = time.perf_counter()
    status["response_time_ms"] = (end_time - start_time) * 1000
    return status

app.state.startup_time = time.monotonic() # Track app startup time for uptime calculation

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Running FastAPI application in {settings.ENV} environment.")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development",
        workers=1 # For local dev, Gunicorn handles workers in production
    )
```