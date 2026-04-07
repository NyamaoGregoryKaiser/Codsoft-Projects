from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from loguru import logger

from app.api.v1 import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.middleware import setup_middlewares
from app.db.session import create_db_and_tables, close_db_connection
from app.initial_data import create_initial_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    setup_logging()
    logger.info("Application starting up...")

    # Initialize Redis for Rate Limiting and Caching
    try:
        redis_connection_string = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}" \
                                  if settings.REDIS_PASSWORD else f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
        redis_client = aioredis.from_url(redis_connection_string, encoding="utf8", decode_responses=True)
        await FastAPILimiter.init(redis_client)
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        logger.info("Redis for Rate Limiting and Caching initialized.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        # Depending on criticality, you might want to raise an exception or run without Redis features

    # Database setup (use Alembic for production, this is for quick dev/testing)
    if settings.PROJECT_NAME == "DBOptiFlow" and "test" not in settings.PROJECT_NAME.lower():
        # In a real production system, Alembic migrations would be run externally,
        # not automatically on app startup. This is for quick local dev setup.
        await create_db_and_tables()
        await create_initial_data() # Create admin user and sample data

    logger.info("Application startup complete.")
    yield
    # Shutdown events
    logger.info("Application shutting down...")
    await close_db_connection()
    if FastAPILimiter._redis: # Check if Redis client was initialized
        await FastAPILimiter._redis.close()
        logger.info("Redis connection closed.")
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in [settings.FRONTEND_URL, "http://localhost:8000"]], # Add more origins as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up global exception handlers and request logging
setup_middlewares(app)

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"], summary="Root endpoint for API status")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API! Go to /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)