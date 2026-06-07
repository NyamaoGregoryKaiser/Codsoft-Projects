```python
import logging
import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp

from app.core.config import settings
from app.utils.cache import RedisClient  # Assuming RedisClient is defined in app.utils.cache

logger = logging.getLogger(__name__)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting incoming requests using Redis.
    Limits requests based on client IP address or authenticated user ID.
    """
    def __init__(self, app: ASGIApp, redis_client: RedisClient,
                 requests_per_minute: int = settings.RATE_LIMIT_REQUESTS_PER_MINUTE):
        super().__init__(app)
        self.redis_client = redis_client
        self.requests_per_minute = requests_per_minute
        self.rate_limit_enabled = settings.RATE_LIMIT_ENABLED
        logger.info(f"Rate Limiting Middleware initialized. Enabled: {self.rate_limit_enabled}, Limit: {requests_per_minute} req/min.")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.rate_limit_enabled:
            return await call_next(request)

        # Attempt to identify the client by user ID (if authenticated) or IP address
        client_id = await self._get_client_id(request)
        if not client_id:
            # If client_id cannot be determined (e.g., no IP, no user), bypass rate limit or block
            # For now, we'll let it pass but log a warning. In production, might want to block or use a default.
            logger.warning("Could not determine client ID for rate limiting. Request passed through.")
            return await call_next(request)

        # Use a sliding window approach for rate limiting
        current_time = int(time.time())
        window_start_time = current_time - 60  # 60 seconds window

        key = f"rate_limit:{client_id}"

        # Atomically update and check the request count using Redis pipeline
        async with self.redis_client.client.pipeline() as pipe:
            pipe.zremrangebyscore(key, 0, window_start_time)  # Remove old requests
            pipe.zadd(key, {current_time: current_time})      # Add current request
            pipe.zcard(key)                                   # Get count of requests in window
            pipe.expire(key, 60)                              # Ensure key expires
            results = await pipe.execute()

        request_count = results[2] # Result from zcard

        if request_count > self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too Many Requests", "message": f"Rate limit exceeded. Try again in {60 - (current_time % 60)} seconds."},
                headers={"Retry-After": str(60 - (current_time % 60))}
            )

        response = await call_next(request)
        return response

    async def _get_client_id(self, request: Request) -> Optional[str]:
        """
        Determines the client ID for rate limiting.
        Prioritizes authenticated user ID, then falls back to IP address.
        """
        # Try to get authenticated user ID from the request state (set by auth dependency)
        # Note: This middleware runs before endpoint dependencies.
        # So, if we want user_id, we'd need to parse the token here, or rely on IP.
        # For simplicity, we'll rely on IP for now.
        # A more advanced approach would involve parsing the token, but that duplicates auth logic.
        # A common pattern is to apply rate limiting by IP *before* auth, and by user_id *after* auth.
        # For this example, we'll stick to IP based before auth for simplicity.

        # If you wanted user-based rate limiting, you'd integrate with JWT validation here:
        # from app.core.security import decode_access_token
        # token = request.headers.get("Authorization")
        # if token and token.startswith("Bearer "):
        #     try:
        #         payload = decode_access_token(token.split(" ")[1])
        #         user_id = payload.get("sub")
        #         if user_id:
        #             return f"user:{user_id}"
        #     except Exception:
        #         pass # Token invalid, fall back to IP

        # Fallback to client IP address
        # Handles proxies via X-Forwarded-For or X-Real-IP headers
        ip_address = request.headers.get("X-Forwarded-For") or \
                     request.headers.get("X-Real-IP") or \
                     request.client.host if request.client else None
        
        if ip_address:
            return f"ip:{ip_address}"
        
        return None

```