```python
import json
import logging
from typing import Any, Callable, Optional
from functools import wraps, partial

from redis.asyncio import Redis, ConnectionPool
from app.core.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[Redis] = None

async def init_redis_pool():
    """Initializes the Redis connection pool."""
    global redis_client
    if redis_client is None or redis_client.connection_pool.is_connected is False:
        try:
            redis_client = Redis.from_url(
                str(settings.REDIS_URL),
                encoding="utf-8",
                decode_responses=True,
                max_connections=10 # Example: adjust based on expected load
            )
            await redis_client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Could not connect to Redis at {settings.REDIS_URL}: {e}")
            redis_client = None # Ensure it's None if connection fails
            raise # Re-raise to prevent app startup with no Redis

def get_redis_client() -> Redis:
    """Returns the initialized Redis client, raises error if not initialized."""
    if redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis_pool() first.")
    return redis_client

def cache_data(key_prefix: str, expiration_seconds: int = settings.CACHE_EXPIRATION_SECONDS):
    """
    Decorator to cache the result of an async function in Redis.
    The cache key is generated from the function name and its arguments.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_client:
                logger.warning(f"Redis not available. Skipping cache for {func.__name__}")
                return await func(*args, **kwargs)

            # Generate a unique cache key based on function name and args
            func_args = f"{key_prefix}:{func.__name__}:" + \
                        json.dumps({"args": args[1:], "kwargs": kwargs}, sort_keys=True, default=str)
            
            try:
                # Try to get data from cache
                cached_data = await redis_client.get(func_args)
                if cached_data:
                    logger.debug(f"Cache HIT for key: {func_args}")
                    return json.loads(cached_data)
                
                logger.debug(f"Cache MISS for key: {func_args}")
                # If not in cache, call the original function
                result = await func(*args, **kwargs)
                
                # Cache the result
                await redis_client.setex(func_args, expiration_seconds, json.dumps(result))
                return result
            except Exception as e:
                logger.error(f"Error accessing or writing to Redis cache for {func.__name__}: {e}")
                # Fallback to calling the original function if cache operation fails
                return await func(*args, **kwargs)
        return wrapper
    return decorator

async def invalidate_cache(key_prefix: str, pattern: str = "*"):
    """
    Invalidates cache entries matching a pattern for a given key prefix.
    """
    if not redis_client:
        logger.warning("Redis not available. Skipping cache invalidation.")
        return
    
    full_pattern = f"{key_prefix}:{pattern}"
    try:
        keys = []
        async for key in redis_client.scan_iter(match=full_pattern):
            keys.append(key)
        
        if keys:
            await redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries matching pattern: {full_pattern}")
        else:
            logger.debug(f"No cache entries found to invalidate for pattern: {full_pattern}")

    except Exception as e:
        logger.error(f"Error invalidating Redis cache for pattern {full_pattern}: {e}")
```