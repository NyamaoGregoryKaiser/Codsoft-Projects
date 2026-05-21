import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

async def add_process_time_header(request: Request, call_next):
    """
    Middleware to add X-Process-Time header to responses.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

async def log_request_middleware(request: Request, call_next):
    """
    Middleware to log incoming requests.
    """
    request_id = request.headers.get("X-Request-ID") or "no-request-id"
    logger.info(f"[{request_id}] Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"[{request_id}] Outgoing response: {response.status_code} {request.method} {request.url}")
    return response

async def error_logging_middleware(request: Request, call_next):
    """
    Middleware to catch and log any unhandled exceptions during request processing.
    """
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        request_id = request.headers.get("X-Request-ID") or "no-request-id"
        logger.error(
            f"[{request_id}] Unhandled error during request processing for {request.method} {request.url}: {e}",
            exc_info=True,
            extra={"request_url": request.url, "request_method": request.method}
        )
        return JSONResponse(
            status_code=500,
            content={"message": "An unexpected server error occurred."},
        )