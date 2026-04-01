```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.middleware.error_handler import ErrorHandlingMiddleware
from backend.app.middleware.rate_limiter import initialize_rate_limiter, rate_limit_10_per_minute
from backend.app.core.logging_config import logger
from fastapi_limiter.depends import RateLimiter # Required for the decorator

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add custom error handling middleware
app.add_middleware(ErrorHandlingMiddleware)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS.split(',')],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Default to allowing all for development, but specify in .env in production
    logger.warning("BACKEND_CORS_ORIGINS not set. Allowing all origins for CORS. Please configure in production.")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Add the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info(f"{settings.PROJECT_NAME} backend starting up...")
    await initialize_rate_limiter()
    # Further startup tasks like DB connection checks, initial data loading etc.

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"{settings.PROJECT_NAME} backend shutting down...")
    # Clean up resources if necessary

@app.get("/")
async def root():
    return {"message": "ML Utilities System Backend is running! Access docs at /docs"}

# Example of a rate-limited endpoint
# @app.get("/rate-limited-test", dependencies=[Depends(rate_limit_10_per_minute)])
# async def rate_limited_endpoint():
#     return {"message": "This endpoint is rate limited to 10 requests per minute."}

```