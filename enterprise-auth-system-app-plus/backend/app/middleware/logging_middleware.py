```python
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log incoming requests and outgoing responses,
    including request processing time.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        
        # Log request
        logger.info(f"Incoming Request: {request.method} {request.url} from {request.client.host}")

        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(f"Request failed: {request.method} {request.url} - {type(e).__name__}: {e} "
                         f"({process_time:.4f}s)", exc_info=True)
            raise e # Re-raise the exception to be caught by FastAPI's exception handlers

        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log response
        logger.info(f"Outgoing Response: {request.method} {request.url} Status: {response.status_code} "
                    f"Time: {process_time:.4f}s")

        return response

```