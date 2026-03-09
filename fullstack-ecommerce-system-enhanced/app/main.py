```python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

# from fastapi_limiter import FastAPILimiter # Uncomment if using fastapi-limiter
# from fastapi_limiter.depends import RateLimiter # Uncomment if using fastapi-limiter
# import redis.asyncio as redis # Uncomment if using redis for caching/rate-limiting

from app.api.v1 import auth, users, products, orders
from app.core.config import settings
from app.database import init_db_connection
from app.middleware import LoguruMiddleware
from app.utils.logger import customize_logging

# Customize logging
customize_logging(
    level=settings.LOG_LEVEL,
    name="ecommerce_system",
    json_format=False,
    log_dir="logs",
    file_size="10MB",
    rotation="1 day"
)

# Get the logger for app specific messages
logger = logging.getLogger("ecommerce_system")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the application.
    """
    logger.info(f"{settings.APP_NAME} app starting up...")
    
    # Initialize database connection
    await init_db_connection()
    logger.info("Database connection initialized.")

    # # Initialize FastAPI-Limiter (if Redis is configured)
    # if settings.REDIS_URL and settings.RATE_LIMIT_ENABLED:
    #     try:
    #         redis_connection = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    #         await FastAPILimiter.init(redis_connection)
    #         logger.info("FastAPI-Limiter initialized successfully.")
    #     except Exception as e:
    #         logger.error(f"Failed to connect to Redis for rate limiting: {e}")
    # else:
    #     logger.info("FastAPI-Limiter not initialized (Redis not configured or disabled).")

    yield  # The application runs here

    logger.info(f"{settings.APP_NAME} app shutting down...")
    # Clean up resources if necessary
    # await FastAPILimiter.close() # Uncomment if using fastapi-limiter
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# === Middleware ===
# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging Middleware
app.add_middleware(LoguruMiddleware)

# === Exception Handlers ===
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors."""
    detail = exc.errors()
    logger.warning(f"Validation error for request to {request.url}: {detail}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handles all other unhandled exceptions."""
    logger.error(f"Unhandled exception for request to {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )


# === API Routers ===
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])


# Serve static files for the frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def read_root():
    """Serves the main frontend application."""
    with open("frontend/index.html", "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) # reload=True for dev
```