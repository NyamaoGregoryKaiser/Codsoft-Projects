```python
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request details
        logger.info(f"Request: {request.method} {request.url} from {request.client.host}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        # Log response details
        logger.info(f"Response: {request.method} {request.url} {response.status_code} - Took {process_time:.4f}s")
        
        return response
```