import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

class LogRequestMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log incoming requests and outgoing responses.
    Logs request method, URL, status code, and processing time.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url} - Exception: {e} - "
                f"Processed in: {process_time:.4f}s"
            )
            raise # Re-raise to be caught by other exception handlers
        
        process_time = time.perf_counter() - start_time
        
        log_message = (
            f"Request: {request.method} {request.url} | "
            f"Response: {response.status_code} | "
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