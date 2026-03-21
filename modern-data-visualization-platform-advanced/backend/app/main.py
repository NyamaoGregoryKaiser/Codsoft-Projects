```python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis

from app.api.v1 import auth, users, datasources, dashboards, charts
from app.core.config import settings
from app.core.logger import setup_logging
from app.core.middlewares import setup_error_handlers
from app.core.rate_limiter import setup_rate_limiting, RateLimitExceeded
from app.core.caching import redis_client, init_redis_pool
from app.db.session import engine
from app.db.init_db import init_db_data
from app.schemas.msg import Msg

# Setup logging before FastAPI app creation
setup_logging()
logger = logging.getLogger(__name__)

# Custom route class to apply rate limiting to all API routes
class RateLimitedRoute(APIRoute):
    async def handle_middleware_exceptions(self, request: Request, call_next):
        try:
            return await call_next(request)
        except RateLimitExceeded as e:
            return JSONResponse(
                status_code=429,
                content={"detail": str(e), "message": "Too many requests, please try again later."}
            )
        except Exception as e:
            # Fallback for unexpected errors not caught by other handlers
            logger.exception(f"Unhandled exception in RateLimitedRoute: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "An internal server error occurred."}
            )

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown events.
    """
    logger.info("VisuFlow application starting up...")

    # Initialize Redis connection pool
    await init_redis_pool()
    logger.info("Redis connection pool initialized.")

    # Initialize database if not already done (e.g., for local development/testing)
    # In production, migrations should be run explicitly.
    # For simplicity, we run init_db_data here.
    try:
        await init_db_data()
        logger.info("Database initialized with seed data (if applicable).")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        # Depending on criticality, you might want to raise here
        # raise SystemExit(f"Failed to initialize database: {e}")

    logger.info("VisuFlow application startup complete.")
    yield
    logger.info("VisuFlow application shutting down...")
    # Close Redis connection pool
    if redis_client.connection_pool:
        await redis_client.connection_pool.disconnect()
        logger.info("Redis connection pool disconnected.")
    # Close DB engine
    if engine:
        await engine.dispose()
        logger.info("SQLAlchemy engine disposed.")
    logger.info("VisuFlow application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version=settings.API_VERSION,
    description="VisuFlow: An Enterprise Data Visualization Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    route_class=RateLimitedRoute # Apply custom route class for rate limiting
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup global error handlers
setup_error_handlers(app)

# Setup rate limiting middleware
setup_rate_limiting(app, redis_client)

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["Users"])
app.include_router(datasources.router, prefix=settings.API_V1_STR, tags=["Data Sources"])
app.include_router(dashboards.router, prefix=settings.API_V1_STR, tags=["Dashboards"])
app.include_router(charts.router, prefix=settings.API_V1_STR, tags=["Charts"])


@app.get("/", response_model=Msg, tags=["Health Check"])
async def root():
    """
    Root endpoint for health checks.
    """
    logger.info("Root endpoint accessed.")
    return {"msg": "VisuFlow Backend is running!"}

# Example of a health check endpoint for monitoring
@app.get("/health", response_model=Msg, tags=["Health Check"])
async def health_check():
    """
    Detailed health check including database and Redis connectivity.
    """
    try:
        # Check DB connection
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        # Check Redis connection
        await redis_client.ping()
        logger.info("Health check successful.")
        return {"msg": "VisuFlow Backend is healthy."}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service Unavailable: {e}")
```