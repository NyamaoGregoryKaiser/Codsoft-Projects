from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
import uvicorn
import redis.asyncio as redis

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import APIException
from app.core.logging_config import setup_logging
from app.db.init_db import init_db
from app.middlewares.error_handler import error_handling_middleware_factory
from app.services.cache import get_redis_client

# Setup logging
logger = setup_logging(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for application startup and shutdown events.
    """
    logger.info("Application starting up...")
    
    # Initialize DB (create tables, seed data)
    await init_db()
    logger.info("Database initialized.")

    # Initialize Redis for rate limiting and caching
    r = get_redis_client()
    await FastAPILimiter.init(r)
    logger.info("FastAPI Limiter and Redis cache initialized.")

    yield
    
    # Clean up on shutdown
    await r.close()
    logger.info("Redis client closed.")
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0",
    description="A production-ready authentication system API.",
    lifespan=lifespan,
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

# Add custom error handling middleware
app.middleware("http")(error_handling_middleware_factory)

# Add API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Global exception handler for APIException
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    logger.warning(f"API Exception caught: {exc.detail} (Status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Global exception handler for generic exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```