from fastapi import FastAPI, Request, Response
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
import logging
from app.core.config import settings
from app.core.exceptions import DetailedHTTPException, ForbiddenException
from typing import Optional

logger = logging.getLogger(__name__)

# Re-use the existing redis client from cache service
from app.services.cache import redis_client

async def initialize_rate_limiter(app: FastAPI):
    """
    Initializes the rate limiter with a Redis connection.
    This should be called on application startup.
    """
    if not redis_client:
        logger.warning("Redis client not available, skipping Rate Limiter initialization.")
        return

    try:
        await FastAPILimiter.init(
            redis=redis_client,
            prefix="fastapi-limiter",
            identifier=lambda request: request.client.host,
            period_callback=lambda request: 60, # Default 60 seconds
            callback=rate_limit_exceeded_callback # Custom callback
        )
        logger.info("FastAPILimiter initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize FastAPILimiter: {e}")

async def rate_limit_exceeded_callback(request: Request, response: Response, pttl: Optional[int]):
    """
    Custom callback when rate limit is exceeded.
    """
    raise ForbiddenException(f"Rate limit exceeded for {request.client.host}. Please try again in {pttl//1000} seconds.")

# Dependency for applying rate limits to specific endpoints
# Example usage:
# @router.get("/limited-resource", dependencies=[Depends(rate_limit_per_minute(times=5))])
def rate_limit_per_minute(times: int = 5):
    """
    Returns a RateLimiter dependency configured for 'times' requests per minute.
    """
    return RateLimiter(times=times, seconds=60)

def rate_limit_per_hour(times: int = 60):
    """
    Returns a RateLimiter dependency configured for 'times' requests per hour.
    """
    return RateLimiter(times=times, seconds=3600)