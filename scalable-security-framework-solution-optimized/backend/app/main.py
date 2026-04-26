```python
import uvicorn
from fastapi import FastAPI, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter.depends import RateLimiter

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.core.handlers import add_exception_handlers
from app.core.middleware import LoggingMiddleware
from app.core.rate_limiter import initialize_rate_limiter, close_rate_limiter
from app.db.session import SessionLocal, engine
from app.db.base import Base # Import Base to ensure models are registered
from app.db.init_db import init_db
from app.core.exceptions import UnauthorizedException # Example specific exception

# --- App Initialization ---
configure_logging(settings.ENVIRONMENT)
logger.info("Starting SecureSphere API initialization...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    debug=settings.DEBUG,
    openapi_url=f"/openapi.json" if settings.DEBUG else None, # Disable OpenAPI in production
    docs_url="/docs" if settings.DEBUG else None, # Disable Swagger UI in production
    redoc_url="/redoc" if settings.DEBUG else None, # Disable ReDoc in production
)

# --- Middleware ---
# Add custom logging middleware before CORS and others for full request/response capture
app.add_middleware(LoggingMiddleware)

# CORS Middleware
# This should come before any authentication middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured", origins=settings.BACKEND_CORS_ORIGINS)

# --- Exception Handlers ---
add_exception_handlers(app)

# --- Event Handlers ---
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup event triggered.")
    # Initialize Rate Limiter
    await initialize_rate_limiter()

    # Database initialization (migrations handled by Alembic, but seed data here)
    # Ensure all models are imported so that Base.metadata.create_all works (if used without Alembic)
    # This also applies to init_db
    with SessionLocal() as db:
        init_db(db)
    logger.info("Database initialized (seed data applied).")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown event triggered.")
    # Close Rate Limiter (Redis) connection
    await close_rate_limiter()

# --- API Routes ---
app.include_router(api_router, prefix="/api/v1")

# --- Root Endpoint (Optional) ---
@app.get("/", summary="Root endpoint for API status check", response_model=dict)
async def root():
    logger.info("Root endpoint accessed.")
    return {"message": f"{settings.PROJECT_NAME} API is running", "version": settings.PROJECT_VERSION}

# --- Health Check ---
@app.get("/health", summary="Health check endpoint", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check. In a real application, this would check DB connection, Redis, etc.
    """
    # Example: Check DB connection
    try:
        with SessionLocal() as db:
            db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error("Health check failed - database connection error", error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection failed")

# --- Rate Limiting Example for a specific endpoint (optional, applied globally via middleware in `rate_limiter.py`) ---
# This demonstrates how to apply a specific rate limit to an individual endpoint.
# @app.get("/limited-resource", dependencies=[Depends(RateLimiter(times=5, seconds=10))])
# async def limited_resource(request: Request):
#    return {"message": "You can access this 5 times per 10 seconds"}

if __name__ == "__main__":
    # This block is for local development with `python app/main.py`
    # For production, Gunicorn (or equivalent) will manage Uvicorn workers.
    logger.info("Running Uvicorn directly for development.")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config="uvicorn_log_config.json" # Use structured logging config
    )
```