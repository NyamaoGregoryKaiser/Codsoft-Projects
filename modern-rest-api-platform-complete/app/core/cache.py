import logging
from typing import Optional, Callable, Any
import json
import asyncio

import aioredis
from aioredis.client import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[Redis] = None

async def init_redis():
    """Initializes the Redis connection."""
    global redis_client
    try:
        redis_client = aioredis.from_url(str(settings.REDIS_URL), encoding="utf-8", decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connection established successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None # Ensure client is None if connection fails
        raise

async def close_redis():
    """Closes the Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed.")
        redis_client = None

async def get_redis_client() -> Redis:
    """Returns the initialized Redis client."""
    if redis_client is None:
        # In case init_redis failed or was not called, attempt to re-init
        logger.warning("Redis client not initialized. Attempting to re-initialize.")
        await init_redis()
        if redis_client is None:
            raise ConnectionError("Redis client failed to initialize.")
    return redis_client

def cached(
    key_prefix: str = "cache",
    ttl: int = 300 # Time to live in seconds (5 minutes)
):
    """
    Decorator for caching function results in Redis.
    The cache key is generated from key_prefix + function_name + arguments.
    """
    def decorator(func: Callable[..., Any]):
        async def wrapper(*args, **kwargs):
            r = await get_redis_client()
            
            # Generate a cache key based on function name and arguments
            # Simple serialization for demo purposes; consider more robust solutions for complex objects
            key_parts = [key_prefix, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            for k, v in sorted(kwargs.items()): # Sort kwargs for consistent key generation
                key_parts.append(f"{k}={v}")
            cache_key = ":".join(key_parts)

            # Try to get data from cache
            cached_data = await r.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for key: {cache_key}")
                return json.loads(cached_data) # Assuming cached data is JSON-serializable

            logger.debug(f"Cache miss for key: {cache_key}. Executing function...")
            # If not in cache, execute the original function
            result = await func(*args, **kwargs)

            # Cache the result
            if result is not None:
                await r.setex(cache_key, ttl, json.dumps(result))
                logger.debug(f"Cached result for key: {cache_key} with TTL: {ttl}s")

            return result
        return wrapper
    return decorator

```