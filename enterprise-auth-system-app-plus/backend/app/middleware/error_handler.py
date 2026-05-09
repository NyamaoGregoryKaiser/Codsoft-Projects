```python
from fastapi import Request, Response, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import RequestResponseEndpoint
from loguru import logger
from pydantic import ValidationError

from app.core.exceptions import CustomException, UnauthorizedException, ForbiddenException, NotFoundException, \
    ValidationException, ConflictException


async def custom_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Custom exception handler to catch all exceptions and return a standardized JSON response.
    """
    error_detail = "An unexpected error occurred."
    status_code = 500
    headers = None

    if isinstance(exc, CustomException):
        status_code = exc.status_code
        error_detail = exc.detail
        headers = exc.headers
        logger.warning(f"CustomException: {status_code} - {error_detail} (Path: {request.url.path})")
    elif isinstance(exc, HTTPException):
        status_code = exc.status_code
        error_detail = exc.detail
        headers = exc.headers
        logger.warning(f"HTTPException: {status_code} - {error_detail} (Path: {request.url.path})")
    elif isinstance(exc, RequestValidationError) or isinstance(exc, ValidationError):
        status_code = 422
        # For RequestValidationError, extract details for better error messages
        errors = []
        for error in exc.errors():
            loc = ".".join(map(str, error["loc"])) if error["loc"] else "body"
            errors.append(f"Field '{loc}': {error['msg']}")
        error_detail = "Validation Error: " + ", ".join(errors)
        logger.warning(f"Validation Error: {error_detail} (Path: {request.url.path})")
    else:
        logger.error(f"Unhandled Exception: {type(exc).__name__} - {exc} (Path: {request.url.path})", exc_info=True)

    response_content = {"detail": error_detail}
    return JSONResponse(
        status_code=status_code,
        content=response_content,
        headers=headers
    )

```