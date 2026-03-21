```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from contextlib import asynccontextmanager
import redis.asyncio as redis
from loguru import logger

from backend.core.config import settings
from backend.core.logging import setup_logging
from backend.core.exception_handlers import http_exception_handler, generic_exception_handler, UserAlreadyExistsError, UnauthorizedAccessError, ResourceNotFoundError
from backend.api.v1 import auth, datasets, preprocessing, models, predictions
from backend.database import Base, engine
from backend.services.cache_service import cache_service # Import to initialize

# Setup logging as early as possible
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} environment...")
    
    # Initialize Redis for rate limiting and caching
    try:
        redis_connection = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_connection)
        logger.info("FastAPILimiter initialized with Redis.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis for FastAPILimiter: {e}. Rate limiting might not work.")
    
    # Ensure database tables are created (for dev/testing, Alembic handles this in prod)
    # This is useful for initial setup without running alembic manually, but use alembic for migrations.
    # Base.metadata.create_all(bind=engine) 
    logger.info("Database (PostgreSQL) engine initialized.")

    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")
    if FastAPILimiter.redis:
        await FastAPILimiter.redis.close()
        logger.info("FastAPILimiter Redis connection closed.")
    
    cache_service.clear_all() # Clear cache on shutdown (optional, or just specific keys)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    version="1.0.0",
    description="A comprehensive Machine Learning Utilities System with data management, preprocessing, model training, and prediction capabilities.",
    lifespan=lifespan # Use async context manager for app lifecycle
)

# Set up CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:3000",
    # Add other frontend URLs for production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(UserAlreadyExistsError, http_exception_handler)
app.add_exception_handler(UnauthorizedAccessError, http_exception_handler)
app.add_exception_handler(ResourceNotFoundError, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()} for URL: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# Rate Limiting (example usage, apply to specific routes or globally)
# For example, to limit all API calls to 100 requests per minute per IP:
# app.add_middleware(SlowAPIMiddleware, rate_limit="100/minute") # This is a different middleware
# FastAPILimiter works via decorator/dependency
# Example for a specific endpoint (see auth.py for actual implementation notes)
# @router.post("/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])

# Include API routes
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(
    datasets.router,
    prefix=f"{settings.API_V1_STR}/datasets",
    tags=["Datasets"],
    dependencies=[Depends(RateLimiter(times=100, seconds=60))] # Apply rate limit to all dataset operations
)
app.include_router(
    preprocessing.router,
    prefix=f"{settings.API_V1_STR}/preprocessing",
    tags=["Preprocessing"],
    dependencies=[Depends(RateLimiter(times=30, seconds=60))] # Preprocessing can be resource intensive
)
app.include_router(
    models.router,
    prefix=f"{settings.API_V1_STR}/models",
    tags=["ML Models"],
    dependencies=[Depends(RateLimiter(times=30, seconds=60))] # Model training can be resource intensive
)
app.include_router(
    predictions.router,
    prefix=f"{settings.API_V1_STR}/predictions",
    tags=["Predictions"],
    dependencies=[Depends(RateLimiter(times=300, seconds=60))] # Predictions can be more frequent
)

@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"Welcome to the {settings.APP_NAME} API! Visit {settings.API_V1_STR}/docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=settings.ENVIRONMENT == "development")
```