```python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_limiter import FastAPILimiter
from redis import asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import api_router
from app.core.config import settings
from app.core.exceptions import CustomException, UnauthorizedException, ForbiddenException, NotFoundException
from app.core.logging_config import setup_logging
from app.db.session import engine, init_db as init_app_db_session
from app.db.init_db import init_db as seed_initial_data
from app.crud.users import crud_user
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB, Redis, Seed data, Logging
    setup_logging()
    logger.info("Application startup initiated.")

    await init_app_db_session()
    logger.info("Database initialized.")

    # Initialize Redis for caching and rate limiting
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    await FastAPILimiter.init(redis)
    logger.info("Redis cache and rate limiter initialized.")

    # Seed initial data (e.g., admin user) if DB is empty
    async with AsyncSession(engine) as session:
        if not await crud_user.get_by_email(session, email=settings.FIRST_SUPERUSER_EMAIL):
            logger.info("Seeding initial superuser.")
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                full_name="Admin User",
                is_superuser=True
            )
            await crud_user.create(session, obj_in=user_in)
            await session.commit()
            logger.info("Superuser created successfully.")
        else:
            logger.info("Superuser already exists.")

    logger.info("Application startup complete.")
    yield
    # Shutdown: Close connections, etc.
    logger.info("Application shutdown initiated.")
    await engine.dispose()
    await redis.close()
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    logger.error(f"CustomException caught: {exc.name} - {exc.message}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "name": exc.name},
    )

@app.exception_handler(UnauthorizedException)
async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
    logger.warning(f"UnauthorizedException caught: {exc.message}")
    return JSONResponse(
        status_code=401,
        content={"detail": exc.message, "name": "Unauthorized"},
    )

@app.exception_handler(ForbiddenException)
async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
    logger.warning(f"ForbiddenException caught: {exc.message}")
    return JSONResponse(
        status_code=403,
        content={"detail": exc.message, "name": "Forbidden"},
    )

@app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    logger.warning(f"NotFoundException caught: {exc.message}")
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message, "name": "Not Found"},
    )

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/", summary="Health Check")
async def root():
    return {"message": "DataViz System API is running!"}
```