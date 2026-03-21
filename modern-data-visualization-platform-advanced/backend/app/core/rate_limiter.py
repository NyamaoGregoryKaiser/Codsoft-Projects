```python
import logging
from typing import Callable, Optional
from functools import wraps
from datetime import timedelta

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from redis.asyncio import Redis
from asyncio_throttle import Throttler

from app.core.config import settings
from app.core.security import decode_access_token # Assuming you have this for user ID
from app.core.caching import redis_client

logger = logging.getLogger(__name__)

class RateLimitExceeded(HTTPException):
    def __init__(self, detail: str = "Too many requests.", headers: Optional[dict] = None):
        super().__init__(status_code=429, detail=detail, headers=headers)

class FixedWindowRateLimiter:
    """
    Simple fixed window rate limiter using Redis.
    """
    def __init__(self, redis: Redis, default_rate: str = settings.RATE_LIMIT_DEFAULT):
        self.redis = redis
        self.default_rate = self._parse_rate(default_rate) # (count, period_seconds)
        self.throttlers = {} # For per-user throttlers, if needed

    def _parse_rate(self, rate_str: str) -> tuple[int, int]:
        """Parses a rate string like '10/minute' into (count, period_seconds)."""
        try:
            count_str, period_str = rate_str.split('/')
            count = int(count_str)
            period_multiplier = {
                'second': 1, 'minute': 60, 'hour': 3600, 'day': 86400
            }
            if period_str.endswith('s'): # handle 'seconds', 'minutes'
                period_str = period_str[:-1]
            period_seconds = period_multiplier[period_str]
            return count, period_seconds
        except (ValueError, KeyError):
            logger.error(f"Invalid rate limit string: {rate_str}. Using default.")
            return 10, 60 # Default to 10 requests per minute

    async def _get_client_id(self, request: Request, authorized: bool) -> str:
        """Determines client ID based on authorization status."""
        if authorized:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                return f"user:{payload['sub']}" # Use user ID if authenticated
        return f"ip:{request.client.host}" # Fallback to IP address

    async def check_limit(self, request: Request, rate: str, authorized: bool = False):
        """Checks if a request is within the rate limit."""
        client_id = await self._get_client_id(request, authorized)
        count_limit, period_seconds = self._parse_rate(rate)
        
        current_window = int(request.scope["start_time"] / period_seconds) # Start of current window
        key = f"rate_limit:{client_id}:{current_window}"

        # Increment and get current count
        current_count = await self.redis.incr(key)

        # Set expiry for the key if it's the first request in the window
        if current_count == 1:
            await self.redis.expire(key, period_seconds)

        if current_count > count_limit:
            retry_after = await self.redis.ttl(key)
            raise RateLimitExceeded(
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
        logger.debug(f"Rate limit check for {client_id}: {current_count}/{count_limit} in {period_seconds}s")


# Global rate limiter instance
rate_limiter = FixedWindowRateLimiter(redis_client)

def rate_limit(rate: str):
    """Decorator to apply rate limiting to FastAPI endpoints."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request = kwargs.get("request") or next(
                (arg for arg in args if isinstance(arg, Request)), None
            )
            if not request:
                raise RuntimeError("Request object not found in endpoint arguments for rate_limit decorator.")

            # Check if user is authenticated (simple check for token presence)
            authorized = "Authorization" in request.headers and request.headers["Authorization"].startswith("Bearer ")
            
            await rate_limiter.check_limit(request, rate, authorized=authorized)
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def setup_rate_limiting(app: FastAPI, redis: Redis):
    """
    Integrates rate limiting into the FastAPI application.
    This creates a middleware that checks rate limits for ALL routes.
    More granular control can be achieved with the `rate_limit` decorator per endpoint.
    """
    global rate_limiter
    rate_limiter = FixedWindowRateLimiter(redis, settings.RATE_LIMIT_DEFAULT)

    # You can add a middleware here for global rate limiting, but for demonstration,
    # we use the RateLimitedRoute and `rate_limit` decorator in `main.py`
    # or you can add a global middleware:
    # @app.middleware("http")
    # async def add_rate_limit_middleware(request: Request, call_next):
    #     try:
    #         # Default rate limit for all paths, specific paths can be overridden by decorator
    #         await rate_limiter.check_limit(request, settings.RATE_LIMIT_DEFAULT, authorized=False)
    #         response = await call_next(request)
    #         return response
    #     except RateLimitExceeded as e:
    #         return JSONResponse(status_code=e.status_code, content={"detail": e.detail}, headers=e.headers)
    
    logger.info("Rate limiting initialized.")
```