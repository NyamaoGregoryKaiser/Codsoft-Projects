```python
import redis.asyncio as redis
from fastapi import Request, Depends
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from backend.app.core.config import settings
from backend.app.core.logging_config import logger

async def initialize_rate_limiter():
    """Initializes FastAPI-Limiter with Redis."""
    try:
        redis_connection = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_connection)
        logger.info("FastAPI-Limiter initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize FastAPI-Limiter: {e}")
        # In a real production app, you might want to exit or fail health checks here.

# Example rate limiting dependency
# Use this as `Depends(rate_limit_10_per_minute)` in your endpoint decorators
rate_limit_10_per_minute = RateLimiter(times=10, seconds=60)
rate_limit_5_per_hour = RateLimiter(times=5, seconds=3600)
```