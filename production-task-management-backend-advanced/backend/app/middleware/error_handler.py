import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp
from app.core.exceptions import DetailedHTTPException

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except DetailedHTTPException as exc:
            logger.warning(
                f"HTTP Exception caught: {exc.status_code} - {exc.detail} for {request.url}"
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=getattr(exc, "headers", None)
            )
        except Exception as e:
            logger.exception(f"Unhandled exception caught for {request.url}: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "An unexpected error occurred."},
            )