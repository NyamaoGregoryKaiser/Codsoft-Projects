```python
import logging
from typing import Any, Callable
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class UnicornException(Exception):
    def __init__(self, name: str):
        self.name = name

async def unicorn_exception_handler(request: Request, exc: UnicornException):
    logger.error(f"Unicorn exception handler caught: {exc.name}", exc_info=True)
    return JSONResponse(
        status_code=418,
        content={"message": f"Oops! {exc.name} did something. There goes a unicorn."},
    )

async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]):
    """
    Handles Pydantic validation errors from request bodies or path/query parameters.
    """
    errors = exc.errors()
    simplified_errors = []
    for error in errors:
        field = ".".join(map(str, error["loc"]))
        simplified_errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {simplified_errors} for request {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": simplified_errors},
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles FastAPI's built-in HTTPException.
    """
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail} for request {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catches all other uncaught exceptions.
    """
    logger.error(f"Unhandled exception for request {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred."},
    )

def setup_error_handlers(app: FastAPI):
    """
    Registers custom exception handlers with the FastAPI application.
    """
    app.add_exception_handler(UnicornException, unicorn_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler) # For non-request validation errors
    app.add_exception_handler(HTTPException, http_exception_handler) # This should be registered *after* more specific HTTP handlers if any
    app.add_exception_handler(Exception, generic_exception_handler) # Catch-all handler
    logger.info("Custom error handlers registered.")
```