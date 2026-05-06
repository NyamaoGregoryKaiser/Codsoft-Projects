```python
from fastapi import Request, Response, HTTPException, status
from typing import Callable, Awaitable
from cachetools import LRUCache, TTLCache
from datetime import datetime, timedelta
from backend.core.config import settings
from backend.core.logger import logger

# Simple in-memory rate limiter, not suitable for distributed systems without a shared cache (e.g., Redis)
# Each FastAPI instance would have its own rate limits.
# For production, consider using a dedicated package like `fastapi-limiter` with Redis.

class RateLimiter:
    def __init__(self, default_rate: str = "5/minute"):
        self.limits = LRUCache(maxsize=10000) # Cache for storing IP/user limits
        self.default_rate = self._parse_rate(default_rate)

    def _parse_rate(self, rate_str: str) -> tuple[int, timedelta]:
        try:
            count_str, period_str = rate_str.split('/')
            count = int(count_str)
            if period_str == "second":
                period = timedelta(seconds=1)
            elif period_str == "minute":
                period = timedelta(minutes=1)
            elif period_str == "hour":
                period = timedelta(hours=1)
            elif period_str == "day":
                period = timedelta(days=1)
            else:
                raise ValueError("Invalid rate period. Use second, minute, hour, or day.")
            return count, period
        except ValueError as e:
            logger.error(f"Invalid rate limit string: {rate_str}. Using default. Error: {e}")
            return (5, timedelta(minutes=1)) # Fallback

    async def __call__(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Use client IP as key, or user ID if authenticated (more robust)
        # For simplicity, let's use client IP
        client_id = request.client.host if request.client else "unknown"
        
        # You could define different limits per endpoint or per user role
        # For now, a global default limit
        limit_count, limit_period = self.default_rate

        current_time = datetime.utcnow()
        
        # Get or initialize the access log for this client
        access_log = self.limits.get(client_id, [])
        
        # Filter out requests older than the limit_period
        access_log = [t for t in access_log if current_time - t < limit_period]
        
        if len(access_log) >= limit_count:
            # If the limit is exceeded, raise an exception
            retry_after = (limit_period - (current_time - access_log[0])).total_seconds()
            logger.warning(f"Rate limit exceeded for {client_id}. Retrying after {retry_after} seconds.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {int(retry_after)} seconds.",
                headers={"Retry-After": str(int(retry_after))}
            )
        
        # Add the current request time to the log
        access_log.append(current_time)
        self.limits[client_id] = access_log

        response = await call_next(request)
        return response

rate_limiter_middleware = RateLimiter(default_rate=settings.RATE_LIMIT_DEFAULT)
```