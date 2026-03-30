import logging
import asyncio

from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter

from app.api.v1 import auth, users, scrapers, jobs, data
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.middleware.error_handler import ErrorHandlingMiddleware
from app.api.deps import get_redis_client

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def custom_generate_unique_id(route: APIRoute):
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG,
    generate_unique_id_function=custom_generate_unique_id
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production to specific frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom error handling middleware
app.add_middleware(ErrorHandlingMiddleware)

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup event.")
    # Initialize Redis for FastAPI-Limiter and other caching needs
    redis = await get_redis_client().__anext__() # Get a client from the async generator
    await FastAPILimiter.init(redis)
    logger.info("FastAPILimiter initialized with Redis.")

    # Initialize the database (e.g., create superuser)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    logger.info("Database initialized.")


app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(scrapers.router, prefix=f"{settings.API_V1_STR}/scrapers", tags=["scrapers"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(data.router, prefix=f"{settings.API_V1_STR}/data", tags=["data"])

@app.get("/")
async def root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API! Visit {settings.API_V1_STR}/docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")