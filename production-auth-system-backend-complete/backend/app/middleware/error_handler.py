from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.utils.logger import logger

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Custom middleware for centralized error handling.
    Catches unhandled exceptions and returns a standardized JSON error response.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as http_exception:
            # Handle FastAPI's HTTPException directly
            logger.warning(
                f"HTTPException caught: {http_exception.status_code} - {http_exception.detail}",
                extra={"request_id": request.state.request_id, "path": request.url.path}
            )
            return JSONResponse(
                status_code=http_exception.status_code,
                content={"message": http_exception.detail},
                headers=http_exception.headers
            )
        except Exception as e:
            # Catch all other unhandled exceptions
            logger.error(
                f"Unhandled exception: {e}",
                exc_info=True,
                extra={"request_id": request.state.request_id, "path": request.url.path}
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "An unexpected error occurred. Please try again later."},
            )
```