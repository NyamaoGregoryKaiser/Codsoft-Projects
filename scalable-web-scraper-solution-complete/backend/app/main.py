import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.core.database import init_db, close_db_connections, AsyncSessionLocal, get_db
from app.core.security import get_password_hash
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.api.v1 import auth, users, tasks, results
from app.middleware.error_handler import ErrorHandlingMiddleware
from loguru import logger

# For caching and rate limiting
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis # Use async redis client
from fastapi_limiter import FastAPILimiter

# Configure Loguru logger
logger.add("file.log", rotation="10 MB", compression="zip", level="INFO")
logger.add("error.log", rotation="10 MB", compression="zip", level="ERROR", backtrace=True, diagnose=True)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan events for startup and shutdown.
    """
    logger.info("Application startup...")

    # Initialize Database
    try:
        await init_db()
        logger.info("Database initialized successfully.")
        
        # Seed admin user if not exists
        async with AsyncSessionLocal() as db:
            existing_admin = await crud_user.get_by_email(db, email=settings.ADMIN_EMAIL)
            if not existing_admin:
                admin_user_in = UserCreate(
                    email=settings.ADMIN_EMAIL,
                    password=settings.ADMIN_PASSWORD,
                    is_active=True,
                    role=UserRole.ADMIN
                )
                await crud_user.create(db, obj_in=admin_user_in)
                logger.info(f"Admin user '{settings.ADMIN_EMAIL}' created.")
            else:
                logger.info(f"Admin user '{settings.ADMIN_EMAIL}' already exists.")
    except Exception as e:
        logger.critical(f"Failed to initialize database or seed admin user: {e}")
        # Depending on criticality, might raise exception to prevent app startup
        raise e

    # Initialize Redis for caching and rate limiting
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        await FastAPILimiter.init(redis_client)
        logger.info("Redis cache and rate limiter initialized.")
    except Exception as e:
        logger.critical(f"Failed to initialize Redis for caching/rate limiting: {e}")
        # This might be a softer failure, but log it.

    # Start the background task for scheduling due tasks
    app.state.scheduler_task = asyncio.create_task(periodic_task_checker())
    logger.info("Background task for checking due tasks started.")
    
    yield  # Application runs here

    logger.info("Application shutdown...")
    # Clean up on shutdown
    await close_db_connections()
    logger.info("Database connections closed.")
    FastAPILimiter.redis = None # Explicitly clear redis client for fastapi-limiter
    
    if app.state.scheduler_task:
        app.state.scheduler_task.cancel()
        try:
            await app.state.scheduler_task
        except asyncio.CancelledError:
            logger.info("Scheduler background task cancelled.")

async def periodic_task_checker():
    """
    Background task to periodically check for scraping tasks that are due.
    """
    from app.services.task_scheduler import task_scheduler # Import here to avoid circular dependencies
    while True:
        try:
            await task_scheduler.check_and_schedule_due_tasks()
        except Exception as e:
            logger.error(f"Error in periodic_task_checker: {e}")
        await asyncio.sleep(60) # Check every 60 seconds

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Add custom error handling middleware
app.add_middleware(ErrorHandlingMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

# Example for health check
@app.get("/health", response_model=dict, tags=["Monitoring"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Test DB connection
        await db.execute("SELECT 1")
        # Test Redis connection (FastAPICache will raise if no connection)
        await FastAPICache.get_backend()._redis.ping()
        return {"status": "ok", "database": "connected", "redis": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {e}"
        )

# Main entry point for Uvicorn
if __name__ == "__main__":
    import uvicorn
    # Use 'app.main:app' when running with uvicorn command
    # uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG, workers=1)
```