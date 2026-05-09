import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.utils.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Custom middleware for logging incoming requests and outgoing responses.
    Assigns a unique request ID for tracing.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id # Attach request_id to state for downstream use

        start_time = time.perf_counter()

        logger.info(
            f"Incoming request: {request.method} {request.url}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else "unknown"
            }
        )

        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url} - {e}",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "response_time_ms": int(process_time * 1000)
                }
            )
            raise # Re-raise the exception after logging

        process_time = time.perf_counter() - start_time
        response_status = response.status_code

        logger.info(
            f"Outgoing response: {request.method} {request.url} - {response_status}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response_status,
                "response_time_ms": int(process_time * 1000)
            }
        )

        return response
```