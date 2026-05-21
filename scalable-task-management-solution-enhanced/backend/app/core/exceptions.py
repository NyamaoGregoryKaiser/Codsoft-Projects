from fastapi import HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class CustomHTTPException(HTTPException):
    """
    Custom HTTP Exception to provide more structured error messages.
    """
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code if error_code else f"HTTP_{status_code}"

async def http_exception_handler(request, exc: CustomHTTPException):
    """
    Handler for CustomHTTPException.
    """
    logger.warning(
        f"CustomHTTPException caught: {exc.status_code} - {exc.error_code} - {exc.detail}"
        f" Request URL: {request.url}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail, "code": exc.error_code},
    )

class NotFoundException(CustomHTTPException):
    def __init__(self, detail: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(status_code=404, detail=detail, error_code=error_code)

class UnauthorizedException(CustomHTTPException):
    def __init__(self, detail: str = "Not authenticated", error_code: str = "UNAUTHORIZED"):
        super().__init__(status_code=401, detail=detail, error_code=error_code)

class ForbiddenException(CustomHTTPException):
    def __init__(self, detail: str = "Not authorized to perform this action", error_code: str = "FORBIDDEN"):
        super().__init__(status_code=403, detail=detail, error_code=error_code)

class BadRequestException(CustomHTTPException):
    def __init__(self, detail: str = "Bad request", error_code: str = "BAD_REQUEST"):
        super().__init__(status_code=400, detail=detail, error_code=error_code)

class ConflictException(CustomHTTPException):
    def __init__(self, detail: str = "Resource conflict", error_code: str = "CONFLICT"):
        super().__init__(status_code=409, detail=detail, error_code=error_code)