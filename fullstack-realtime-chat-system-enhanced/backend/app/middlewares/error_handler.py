```python
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException, RequestValidationError
from pydantic import ValidationError

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles FastAPI's built-in HTTPException.
    """
    logger.error(f"HTTPException: {exc.detail} for path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles Pydantic validation errors from request bodies or query parameters.
    """
    # Customize the error message to be more user-friendly if needed
    error_details = exc.errors()
    logger.error(f"RequestValidation Error: {error_details} for path: {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": error_details},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handles all other unhandled exceptions. This is the last resort.
    """
    logger.critical(f"Unhandled Exception: {exc} for path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

```