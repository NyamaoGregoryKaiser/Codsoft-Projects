```python
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError
from backend.core.logger import logger

async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail} for URL: {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error(f"Pydantic Validation Error: {exc.errors()} for URL: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

async def integrity_error_handler(request: Request, exc: IntegrityError):
    # This handler catches database unique constraint violations, etc.
    logger.error(f"Database Integrity Error: {exc.args[0]} for URL: {request.url}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "A resource with this unique identifier already exists or violates a constraint."},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.critical(f"Unhandled Exception: {type(exc).__name__} - {exc} for URL: {request.url}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )
```