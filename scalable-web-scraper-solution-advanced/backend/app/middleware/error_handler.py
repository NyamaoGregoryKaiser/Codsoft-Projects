import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.exceptions import HTTPException as CustomHTTPException

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except CustomHTTPException as exc:
            logger.warning(f"Custom HTTP Exception: {exc.status_code} - {exc.detail} for {request.url}")
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except StarletteHTTPException as exc:
            logger.warning(f"Starlette HTTP Exception: {exc.status_code} - {exc.detail} for {request.url}")
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except Exception as exc:
            logger.exception(f"Unhandled exception: {exc} for {request.url}")
            return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})