from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import init_db # init_db can be used to run initial setup if needed
from app.core.exceptions import http_exception_handler, validation_exception_handler, generic_exception_handler
from app.utils.logger import get_logger
from app.utils.rate_limiter import identifier_by_user_or_ip

logger = get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    logger.info("Application starting up...")
    await init_db()

    # Initialize Redis for caching and rate limiting
    redis_connection = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB, decode_responses=True)
    await FastAPILimiter.init(redis=redis_connection, identifier=identifier_by_user_or_ip)
    FastAPICache.init(backend=RedisBackend(redis_connection), prefix="fastapi-cache")
    
    logger.info("Redis initialized for caching and rate limiting.")
    logger.info("Application startup complete.")
    yield
    # Shutdown events
    logger.info("Application shutting down...")
    await FastAPILimiter.close()
    logger.info("Redis connection closed.")
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"], # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Request Logging Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    user_info = f"User ID: {request.state.user.id}" if hasattr(request.state, "user") else "Guest"
    logger.info(f"Request: {request.method} {request.url.path} | {user_info} | Process Time: {process_time:.4f}s | Status: {response.status_code}")
    
    return response


app.include_router(api_router, prefix="/api")

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} is running."}

# Example of using caching (can be applied to specific endpoints)
from fastapi_cache.decorator import cache
from datetime import timedelta

@app.get("/api/v1/cached_example", dependencies=[Depends(get_current_active_user)], tags=["Example"])
@cache(expire=timedelta(minutes=5)) # Cache response for 5 minutes
async def get_cached_data(db: Annotated[AsyncSession, Depends(get_db)]):
    """
    An example endpoint demonstrating caching.
    The response will be cached for 5 minutes.
    """
    logger.info("Fetching data for cached_example (this should only appear once per cache period)")
    # Simulate a slow database query or computation
    await asyncio.sleep(2)
    return {"message": "This data is potentially cached!", "timestamp": datetime.utcnow().isoformat()}

# Note: The 'cached_example' above requires 'asyncio' and 'datetime' imports.
import asyncio
from datetime import datetime
```