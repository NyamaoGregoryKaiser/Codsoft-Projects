from typing import Callable, Union
from functools import wraps
from datetime import timedelta

from fastapi import Request, HTTPException, status
from redis.asyncio import Redis

from app.utils.redis_client import get_redis_client
from app.utils.logger import logger

class RateLimiter:
    """
    A simple rate limiter using Redis.
    Limits requests based on a key (e.g., IP address or user ID) and a defined rate.
    """
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def _get_key(self, request: Request, key_prefix: str, identifier: Union[str, Callable]) -> str:
        """
        Determines the key to use for rate limiting.
        If identifier is a callable, it's called with the request.
        Otherwise, it's treated as a string (e.g., "ip", "user_id").
        """
        if callable(identifier):
            id_value = await identifier(request)
        elif identifier == "ip":
            id_value = request.client.host if request.client else "unknown_ip"
        elif identifier == "user_id":
            # This requires an authenticated user. It's best to handle
            # access to request.state.user.id if the endpoint is protected.
            # For non-protected endpoints, 'ip' is more appropriate.
            try:
                id_value = str(request.state.user.id) # Assumes user is set by auth dependency
            except AttributeError:
                id_value = request.client.host if request.client else "unknown_ip" # Fallback to IP if user not authenticated
        else:
            id_value = str(identifier) # Use literal string as identifier

        return f"{key_prefix}:{id_value}"

    def limit(
        self,
        key_prefix: str,
        max_requests: int,
        window: timedelta,
        identifier: Union[str, Callable] = "ip"
    ):
        """
        Decorator to apply rate limiting to a FastAPI route.
        :param key_prefix: A prefix for the Redis key (e.g., "login", "register").
        :param max_requests: The maximum number of requests allowed within the window.
        :param window: The time window (as timedelta) in which max_requests are allowed.
        :param identifier: How to identify the client ('ip', 'user_id', or a callable that returns a string).
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(request: Request, *args, **kwargs):
                redis_client = await get_redis_client() # Get redis client dynamically
                rate_limiter_instance = RateLimiter(redis_client) # Create instance for access to methods

                key = await rate_limiter_instance._get_key(request, key_prefix, identifier)
                window_seconds = int(window.total_seconds())

                current_count = await redis_client.incr(key)
                if current_count == 1:
                    await redis_client.expire(key, window_seconds)

                if current_count > max_requests:
                    ttl = await redis_client.ttl(key)
                    retry_after = max(0, ttl)
                    logger.warning(
                        f"Rate limit exceeded for {key}. Max: {max_requests}, Current: {current_count}",
                        extra={"request_id": getattr(request.state, 'request_id', 'unknown'), "key": key}
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later.",
                        headers={"Retry-After": str(retry_after)}
                    )
                return await func(request, *args, **kwargs)
            return wrapper
        return decorator

```