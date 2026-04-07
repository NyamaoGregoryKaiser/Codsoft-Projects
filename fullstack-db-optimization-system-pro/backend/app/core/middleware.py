from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from typing import Callable
from loguru import logger
import time

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException, NotFoundException, \
    ConflictException, UnprocessableEntityException


def setup_middlewares(app: FastAPI):
    # Global Exception Handling
    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        logger.warning(f"Unauthorized access attempt: {request.url} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
        logger.warning(f"Forbidden access attempt: {request.url} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        logger.info(f"Resource not found: {request.url} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(ConflictException)
    async def conflict_exception_handler(request: Request, exc: ConflictException):
        logger.warning(f"Resource conflict: {request.url} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(UnprocessableEntityException)
    async def unprocessable_entity_handler(request: Request, exc: UnprocessableEntityException):
        logger.error(f"Unprocessable entity: {request.url} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled internal server error: {request.url}") # Log traceback
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # Request Logging Middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next: Callable):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        logger.info(f"Request: {request.method} {request.url} - Status: {response.status_code} - Time: {process_time:.4f}s")
        return response

    # Rate Limiting & Caching (Initialized in main.py's lifespan event)
    # These depend on Redis, so they are initialized as part of the app's startup
    # For rate limiting, decorators like `@limiter.limit("5/minute")` will be used on routes.
    # For caching, decorators like `@cache()` will be used on routes.