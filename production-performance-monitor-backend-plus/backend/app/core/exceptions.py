from typing import Any
from fastapi import HTTPException as FastAPIHTTPException, Request, status
from fastapi.responses import JSONResponse


class HTTPException(FastAPIHTTPException):
    """Custom base HTTP exception for consistent error responses."""
    def __init__(self, status_code: int, detail: Any = None, headers: dict[str, Any] | None = None) -> None:
        super().__init__(status_code, detail, headers)


class UnauthorizedException(HTTPException):
    def __init__(self, detail: Any = "Not authenticated", headers: dict[str, Any] | None = None) -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, {"WWW-Authenticate": "Bearer", **(headers or {})})


class ForbiddenException(HTTPException):
    def __init__(self, detail: Any = "Not authorized to perform this action", headers: dict[str, Any] | None = None) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, detail, headers)


class NotFoundException(HTTPException):
    def __init__(self, detail: Any = "Resource not found", headers: dict[str, Any] | None = None) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail, headers)


# Custom Exception Handlers
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

async def not_found_exception_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )