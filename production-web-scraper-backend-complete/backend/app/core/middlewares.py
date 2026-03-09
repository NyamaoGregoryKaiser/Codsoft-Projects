import logging
import time
from typing import Union

import structlog
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from redis.asyncio import Redis

from app.core.config import settings
from app.core.exceptions import (
    ConflictException, ForbiddenException, NotFoundException,
    UnauthorizedException, UnprocessableEntityException
)

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger("api_log")

def setup_logging(app: FastAPI):
    """Configures logging for the FastAPI application."""
    @app.middleware("http")
    async def logging_middleware(request: Request, call_next):
        start_time = time.time()
        request_id = request.headers.get("X-Request-ID")
        log_ctx = {
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "ip": request.client.host,
            "user_agent": request.headers.get("User-Agent"),
        }

        with structlog.contextvars.bind_contextvars(**log_ctx):
            try:
                response = await call_next(request)
                process_time = time.time() - start_time
                status_code = response.status_code
                logger.info(
                    "Request processed",
                    status_code=status_code,
                    process_time=f"{process_time:.4f}s",
                )
                return response
            except Exception as e:
                process_time = time.time() - start_time
                logger.error(
                    "Request failed",
                    status_code=500,
                    process_time=f"{process_time:.4f}s",
                    error=str(e),
                    exc_info=True,
                )
                raise e # Re-raise to be caught by the exception handler

def setup_exception_handlers(app: FastAPI):
    """Configures custom exception handlers for the FastAPI application."""

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        logger.warning("Unauthorized request", detail=exc.detail, request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
        logger.warning("Forbidden request", detail=exc.detail, request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        logger.warning("Resource not found", detail=exc.detail, url=str(request.url), request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(ConflictException)
    async def conflict_exception_handler(request: Request, exc: ConflictException):
        logger.warning("Resource conflict", detail=exc.detail, request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(UnprocessableEntityException)
    async def unprocessable_entity_exception_handler(request: Request, exc: UnprocessableEntityException):
        logger.error("Unprocessable entity", detail=exc.detail, request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception occurred", exc_info=True, error=str(exc), request_id=request.headers.get("X-Request-ID"))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred."},
        )

async def setup_rate_limiting(app: FastAPI):
    """Initializes and configures API rate limiting."""
    redis_instance = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_instance)
    logger.info("FastAPI Limiter initialized")

# Rate limiting dependency (use in API routes)
rate_limit_dependency = RateLimiter(times=int(settings.RATE_LIMIT_PER_MINUTE.split('/')[0]), seconds=60)
```
---