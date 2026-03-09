```python
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

logger = logging.getLogger("ecommerce_system")

class LoguruMiddleware(BaseHTTPMiddleware):
    """
    A custom middleware to log incoming requests and their processing time.
    Also provides a basic mechanism to catch unhandled errors from within the middleware itself.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = request.headers.get("X-Request-ID", "N/A")

        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request ID: {request_id} - Unhandled exception in request: {request.method} {request.url} - Error: {e}",
                exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
        else:
            process_time = time.time() - start_time
            log_message = (
                f"Request ID: {request_id} - "
                f"Method: {request.method} - "
                f"Path: {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Duration: {process_time:.4f}s"
            )

            if response.status_code >= 500:
                logger.error(log_message)
            elif response.status_code >= 400:
                logger.warning(log_message)
            else:
                logger.info(log_message)

            return response

```