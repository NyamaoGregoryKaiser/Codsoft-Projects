import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from rich.logging import RichHandler # For improved console logging
from app.api.v1 import api_router
from app.core.config import settings
from app.db.init_db import create_db_and_tables, init_db
from app.db.session import AsyncSessionLocal
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limiter import initialize_rate_limiter
from app.services.cache import init_redis, close_redis

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    logger.info(f"Starting {settings.PROJECT_NAME} application...")
    
    # Initialize Redis
    await init_redis()
    await initialize_rate_limiter(app)

    # Initialize DB (create tables and seed data if not exists)
    await create_db_and_tables()
    async with AsyncSessionLocal() as session:
        await init_db(session)

    yield # Application runs

    # Shutdown events
    logger.info(f"Shutting down {settings.PROJECT_NAME} application...")
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add custom error handling middleware
app.add_middleware(ErrorHandlerMiddleware)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Task Management System API!"}

# Optional: Global rate limiting (e.g., 100 requests per minute per IP)
# from fastapi_limiter.depends import RateLimiter
# app.add_middleware(FastAPILimiterMiddleware, limiter=RateLimiter(times=100, seconds=60))

# For production, consider using gunicorn with uvicorn workers:
# gunicorn -k uvicorn.workers.UvicornWorker -c gunicorn_conf.py app.main:app
# gunicorn_conf.py might look like:
"""
# gunicorn_conf.py
workers = 4 # Adjust based on CPU cores
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = 120
loglevel = "info"
"""