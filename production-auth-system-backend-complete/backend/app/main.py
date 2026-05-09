from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.utils.redis_client import init_redis_client, close_redis_client
from app.utils.logger import logger
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.error_handler import ErrorHandlingMiddleware

from app.api.v1 import auth, users, admin

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Handles application startup and shutdown events.
    Initializes and closes external resources like Redis.
    """
    logger.info("Application startup event started.")
    await init_redis_client()
    yield
    logger.info("Application shutdown event started.")
    await close_redis_client()
    logger.info("Application shutdown event completed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG,
    description="Enterprise-grade authentication system with FastAPI and React."
)

# --- Middleware ---

# Custom Logging Middleware
app.add_middleware(BaseHTTPMiddleware, dispatch=LoggingMiddleware().dispatch)
# Custom Error Handling Middleware must come after other middlewares if they raise exceptions
app.add_middleware(BaseHTTPMiddleware, dispatch=ErrorHandlingMiddleware().dispatch)

# CORS Middleware for frontend communication
origins = [
    "http://localhost",
    "http://localhost:3000",  # React frontend
    # Add other frontend origins if deployed
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin"])

@app.get("/", tags=["Health Check"])
async def root():
    """
    Root endpoint for health checks.
    """
    logger.info("Root endpoint accessed.")
    return {"message": "Welcome to the Enterprise Auth System API!"}

```