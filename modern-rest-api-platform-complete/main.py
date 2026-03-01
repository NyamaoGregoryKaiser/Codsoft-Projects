import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import auth, users, projects, tasks, comments
from app.core.config import settings
from app.core.database import database_startup, database_shutdown
from app.core.cache import init_redis, close_redis
from app.core.exceptions import CustomException, custom_exception_handler, validation_exception_handler, http_exception_handler, unhandled_exception_handler
from app.middleware.log_request import LogRequestMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO if settings.FASTAPI_ENV == "development" else logging.WARNING,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the application.
    """
    logger.info("Application starting up...")
    await database_startup()
    await init_redis()
    logger.info("Database and Redis initialized.")
    yield
    logger.info("Application shutting down...")
    await database_shutdown()
    await close_redis()
    logger.info("Database and Redis connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    version="0.1.0",
    description="An enterprise-grade Project Management System API",
    lifespan=lifespan,
)

# Set up CORS middleware
origins = [
    "http://localhost:3000", # Frontend dev server
    # Add other origins for production, e.g., your domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware for request logging
app.add_middleware(LogRequestMiddleware)

# Register exception handlers
app.add_exception_handler(CustomException, custom_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler) # Catch all unhandled exceptions

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["Users"])
app.include_router(projects.router, prefix=settings.API_V1_STR, tags=["Projects"])
app.include_router(tasks.router, prefix=settings.API_V1_STR, tags=["Tasks"])
app.include_router(comments.router, prefix=settings.API_V1_STR, tags=["Comments"])

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Welcome to the Project Management System API!"}

```