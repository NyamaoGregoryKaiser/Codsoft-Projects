```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger

from app.exceptions.custom_exceptions import (
    EntityNotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
)

def add_exception_handlers(app: FastAPI):
    @app.exception_handler(EntityNotFoundException)
    async def entity_not_found_exception_handler(request: Request, exc: EntityNotFoundException):
        logger.warning(f"EntityNotFoundException: {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
        )

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        logger.warning(f"UnauthorizedException: {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
            headers=exc.headers,
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
        logger.warning(f"ForbiddenException: {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
        )

    @app.exception_handler(ConflictException)
    async def conflict_exception_handler(request: Request, exc: ConflictException):
        logger.warning(f"ConflictException: {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
        )
    
    @app.exception_handler(BadRequestException)
    async def bad_request_exception_handler(request: Request, exc: BadRequestException):
        logger.warning(f"BadRequestException: {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation error: {exc.errors()} for URL: {request.url}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"message": "Validation error", "details": exc.errors()},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # Catch generic HTTPExceptions (e.g., 404 from FastAPI if route not found)
        logger.error(f"HTTPException: {exc.status_code} - {exc.detail} for URL: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
            headers=exc.headers if hasattr(exc, 'headers') else None,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        # Catch all other unhandled exceptions
        logger.critical(f"Unhandled exception: {exc} for URL: {request.url}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An unexpected error occurred. Please try again later."},
        )
```