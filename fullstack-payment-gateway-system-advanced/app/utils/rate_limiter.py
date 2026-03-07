```python
from fastapi import Request, HTTPException, status
from app.utils.cache import get_redis_client
from app.utils.logger import logger
from functools import wraps
import time

async def _rate_limit_key(request: Request) -> str:
    """Generate a key for rate limiting based on client IP."""
    # For production, consider using X-Forwarded-For if behind a proxy, with proper validation
    return f"rate_limit:{request.client.host}"

async def rate_limit(
    key_prefix: str = "default",
    limit: int = 100,
    period: int = 60 # seconds
):
    """
    Decorator for rate limiting FastAPI endpoints.
    Uses a simple fixed window counter with Redis.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, request: Request, **kwargs):
            client = await get_redis_client()
            ip_key = await _rate_limit_key(request)
            rate_key = f"{key_prefix}:{ip_key}"

            current_requests = await client.get(rate_key)
            if current_requests is None:
                # Set initial count and expiration
                await client.setex(rate_key, period, 1)
                return await func(*args, request=request, **kwargs)
            else:
                current_requests = int(current_requests)
                if current_requests >= limit:
                    logger.warning(f"Rate limit exceeded for {ip_key} on {request.url.path}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Try again in {period} seconds."
                    )
                await client.incr(rate_key)
                return await func(*args, request=request, **kwargs)
        return wrapper
    return decorator

# Example Usage:
# @router.get("/my-endpoint")
# @rate_limit(key_prefix="my_endpoint", limit=10, period=60) # 10 requests per minute
# async def my_endpoint(request: Request):
#    return {"message": "Hello!"}
```