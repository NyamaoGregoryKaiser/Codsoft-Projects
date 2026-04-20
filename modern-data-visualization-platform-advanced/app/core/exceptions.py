from fastapi import HTTPException as FastAPIHTTPException
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

class HTTPException(FastAPIHTTPException):
    """Custom HTTP Exception to maintain consistency."""
    pass

async def http_exception_handler(request, exc: FastAPIHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def validation_exception_handler(request, exc: StarletteHTTPException):
    # This handles FastAPI's RequestValidationError
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def generic_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."},
    )