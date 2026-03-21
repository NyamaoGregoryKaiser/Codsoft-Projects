```python
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from loguru import logger

class UserAlreadyExistsError(HTTPException):
    def __init__(self, detail: str = "User with this email already exists."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class UnauthorizedAccessError(HTTPException):
    def __init__(self, detail: str = "Not authorized to access this resource."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ResourceNotFoundError(HTTPException):
    def __init__(self, detail: str = "Resource not found."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail} for URL: {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception for URL: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )
```