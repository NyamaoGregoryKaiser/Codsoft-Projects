import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logger import get_logger
from app.core.exceptions import APIException, NotAuthenticatedException, PermissionDeniedException, NotFoundException, \
    ValidationException, RateLimitExceededException
from app.core.middleware import ErrorHandlingMiddleware, LoggingMiddleware, RateLimitMiddleware # Custom or integrated

logger = get_logger(__name__)

# --- Custom Route Class for consistent operation IDs (for OpenAPI) ---
class CustomAPIRoute(APIRoute):
    def generate_unique_id(self, route: APIRoute) -> str:
        return f"{route.name}_{route.operation_id}"


# --- Lifespan Context for app startup/shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    Initializes Redis for caching and rate limiting.
    """
    logger.info("Application startup initiated.")
    try:
        # Initialize Redis for FastAPI-Limiter and custom caching
        redis_client = Redis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
        await FastAPILimiter.init(redis_client)
        app.state.redis = redis_client  # Store redis client in app state for access in dependencies/services
        logger.info("Redis client initialized.")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize application components: {e}", exc_info=True)
        # It's critical to exit if core components like Redis fail to initialize
        raise RuntimeError(f"Application failed to start: {e}")
    finally:
        logger.info("Application shutdown initiated.")
        if FastAPILimiter.redis:
            await FastAPILimiter.redis.close()
            logger.info("FastAPI-Limiter Redis client closed.")
        if hasattr(app.state, 'redis') and app.state.redis:
            await app.state.redis.close()
            logger.info("Custom Redis client closed.")

# --- FastAPI Application Instance ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    version=settings.APP_VERSION,
    description="A comprehensive payment processing system API.",
    lifespan=lifespan,
    route_class=CustomAPIRoute, # Use custom route for consistent OpenAPI IDs
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Custom Exception Handlers ---
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    logger.warning(f"APIException caught: {exc.detail} (Status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # FastAPI's default HTTPException handler, but we can log it.
    logger.error(f"HTTPException caught: {exc.detail} (Status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.critical(f"Unhandled exception: {type(exc).__name__} - {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

# --- Global Middleware ---
# Order matters: Logging first for all requests, then error handling, then rate limiting (if not integrated into routes)
app.middleware("http")(LoggingMiddleware())
# Custom ErrorHandlingMiddleware is handled by @app.exception_handler, but can be added here for other cases.
# app.add_middleware(ErrorHandlingMiddleware) # If needed for non-FastAPI exceptions
# Rate limiting is mostly handled via decorator, but a global middleware could catch unhandled cases.

# --- Include API Routes ---
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- Root Endpoint (optional) ---
@app.get("/", summary="Root endpoint", include_in_schema=False)
async def root():
    return {"message": f"{settings.PROJECT_NAME} API is running!"}

# Example of a health check endpoint
@app.get("/health", response_model=dict, summary="Health check endpoint")
async def health_check(request: Request):
    """
    Checks the health of the application and its dependencies.
    """
    db_status = "unhealthy"
    try:
        # Attempt to get a DB session to check connectivity
        from app.database.session import SessionLocal
        async with SessionLocal() as db:
            await db.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"

    redis_status = "unhealthy"
    try:
        if hasattr(request.app.state, 'redis') and request.app.state.redis:
            await request.app.state.redis.ping()
            redis_status = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy" if db_status.startswith("healthy") and redis_status.startswith("healthy") else "unhealthy"

    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
        "timestamp": time.time()
    }

```

#### `payment_processor/app/api/v1/api.py`
```python