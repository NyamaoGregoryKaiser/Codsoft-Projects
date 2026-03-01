import logging
from typing import Any, Dict

from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

class CustomException(HTTPException):
    """
    Base class for custom HTTP exceptions.
    Allows for more structured error responses.
    """
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        detail: Any = "An error occurred",
        headers: Dict[str, str] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class CredentialException(CustomException):
    """
    Exception for authentication/authorization errors.
    """
    def __init__(self, detail: Any = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class ForbiddenException(CustomException):
    """
    Exception for forbidden access.
    """
    def __init__(self, detail: Any = "Operation forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class NotFoundException(CustomException):
    """
    Exception for resource not found.
    """
    def __init__(self, detail: Any = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ConflictException(CustomException):
    """
    Exception for resource conflict (e.g., duplicate unique entry).
    """
    def __init__(self, detail: Any = "Resource conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

# --- Exception Handlers ---

async def custom_exception_handler(request: Request, exc: CustomException):
    """Handles CustomException."""
    logger.warning(f"CustomException caught: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic RequestValidationError."""
    errors = exc.errors()
    # Log detailed errors during development, more generic in production
    logger.error(f"Request validation failed: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles FastAPI/Starlette HTTPException."""
    logger.warning(f"HTTPException caught: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches all unhandled exceptions."""
    logger.exception(f"Unhandled exception caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )
```