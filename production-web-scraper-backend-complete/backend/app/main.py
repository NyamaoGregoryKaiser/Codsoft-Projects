import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis # Use async Redis client

from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.middlewares import setup_exception_handlers, setup_logging, setup_rate_limiting
from app.crud.user import seed_initial_superuser # For seed data on startup

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger("api_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    logger.info("Application starting up...")

    # Initialize database
    logger.info("Initializing database...")
    await init_db()
    
    # Seed initial superuser
    await seed_initial_superuser()

    # Initialize caching
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    logger.info("FastAPI Cache initialized with Redis.")

    # Initialize rate limiting
    await setup_rate_limiting(app)
    logger.info("FastAPI Limiter initialized.")

    yield
    # Shutdown events
    logger.info("Application shutting down...")
    await FastAPICache.clear() # Clear cache on shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    openapi_url=f"/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Setup logging middleware
setup_logging(app)

# Setup custom exception handlers
setup_exception_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Web Scraping System API!"}

```
---