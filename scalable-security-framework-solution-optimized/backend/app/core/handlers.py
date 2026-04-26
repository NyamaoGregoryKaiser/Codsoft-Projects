```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError
from typing import Union

from app.core.logging import logger
from app.core.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    UnprocessableEntityException,
)

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handles standard HTTPException and custom HTTP exceptions.
    """
    status_code = exc.status_code
    detail = exc.detail
    headers = exc.headers if hasattr(exc, 'headers') else None

    logger.warning("HTTP Exception",
                   status_code=status_code,
                   detail=detail,
                   path=request.url.path,
                   method=request.method,
                   client_ip=request.client.host)

    response_content = {"detail": detail}
    if headers:
        return JSONResponse(status_code=status_code, content=response_content, headers=headers)
    return JSONResponse(status_code=status_code, content=response_content)

async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]):
    """
    Handles Pydantic validation errors (RequestValidationError and internal ValidationError).
    """
    errors = exc.errors() if isinstance(exc, RequestValidationError) else exc.errors()
    simplified_errors = []
    for error in errors:
        loc = ".".join(map(str, error["loc"])) if error["loc"] else "body"
        simplified_errors.append({"field": loc, "message": error["msg"]})
    
    logger.warning("Validation Error",
                   errors=simplified_errors,
                   path=request.url.path,
                   method=request.method,
                   client_ip=request.client.host)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation Error", "errors": simplified_errors},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handles all other unhandled exceptions.
    """
    logger.error("Unhandled Exception",
                 exc_info=True,
                 path=request.url.path,
                 method=request.method,
                 client_ip=request.client.host)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )

def add_exception_handlers(app):
    """Registers custom exception handlers with the FastAPI app."""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler) # For internal Pydantic errors
    app.add_exception_handler(UnauthorizedException, http_exception_handler)
    app.add_exception_handler(ForbiddenException, http_exception_handler)
    app.add_exception_handler(NotFoundException, http_exception_handler)
    app.add_exception_handler(ConflictException, http_exception_handler)
    app.add_exception_handler(UnprocessableEntityException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler) # Catch-all for other exceptions
```