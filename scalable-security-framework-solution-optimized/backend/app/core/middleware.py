```python
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from app.core.logging import logger
from app.core.config import settings

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging request and response details.
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        start_time = time.monotonic()
        
        request_id = request.headers.get("X-Request-ID")
        # Add request ID to logger context for correlation
        if request_id:
            logger_context = logger.bind(request_id=request_id)
        else:
            logger_context = logger # No request ID, use base logger

        # Log request details
        logger_context.info(
            "Incoming Request",
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host,
            headers={k: v for k, v in request.headers.items() if k.lower() not in ["authorization", "cookie"]}, # Redact sensitive headers
            query_params=dict(request.query_params)
        )

        response = await call_next(request)
        process_time = (time.monotonic() - start_time) * 1000 # ms

        # Log response details
        logger_context.info(
            "Outgoing Response",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            process_time_ms=f"{process_time:.2f}",
            client_ip=request.client.host
        )

        return response
```