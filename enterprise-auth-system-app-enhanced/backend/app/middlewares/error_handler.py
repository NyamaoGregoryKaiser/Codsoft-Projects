from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.requests import Request
from starlette.types import ASGIApp

from app.core.exceptions import APIException
from app.core.logging_config import setup_logging
from fastapi import status

logger = setup_logging(__name__)

async def error_handling_middleware_factory(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except APIException as exc:
        logger.warning(f"API Exception caught by middleware: {exc.detail} (Status: {exc.status_code}) for path: {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    except Exception as exc:
        # Catch all other unhandled exceptions
        logger.error(f"Unhandled exception caught by middleware for path: {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred."},
        )
```