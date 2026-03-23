from typing import Callable, Any
from functools import wraps
import json
import redis.asyncio as redis
from app.core.config import settings
from app.core.exceptions import DetailedHTTPException
import logging

logger = logging.getLogger(__name__)

# Initialize Redis client (using decode_responses=True for automatic decoding)
redis_client: redis.Redis | None = None

async def init_redis():
    global redis_client
    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True # Decodes responses from bytes to strings
        )
        await redis_client.ping()
        logger.info("Connected to Redis successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None # Ensure it's None if connection fails
        # Depending on requirements, you might want to raise an exception or run without cache

async def close_redis():
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed.")

def cache(expire: int = settings.CACHE_EXPIRE_SECONDS):
    """
    Decorator to cache the result of an async function in Redis.
    The cache key is generated from the function name and its arguments.
    Handles Pydantic models for serialization.
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not redis_client:
                logger.warning(f"Redis not available for caching. Skipping cache for {func.__name__}.")
                return await func(*args, **kwargs)

            # Generate cache key based on function name and args/kwargs
            # Simple serialization for args and kwargs (adjust as needed for complex objects)
            key_parts = [func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.error(f"Error reading from Redis cache for key {cache_key}: {e}")
                # Continue without cache in case of Redis error

            result = await func(*args, **kwargs)

            try:
                # Serialize result to JSON. Handles Pydantic models by using .model_dump_json()
                if hasattr(result, 'model_dump_json') and callable(result.model_dump_json):
                    json_data = result.model_dump_json()
                else:
                    json_data = json.dumps(result, default=str) # default=str handles datetime, etc.
                await redis_client.setex(cache_key, expire, json_data)
                logger.debug(f"Cache set for key: {cache_key} with expiry {expire}s")
            except Exception as e:
                logger.error(f"Error writing to Redis cache for key {cache_key}: {e}")
                # Log error but don't prevent function from returning result

            return result
        return wrapper
    return decorator

async def invalidate_cache(key_prefix: str):
    """
    Invalidates cache entries matching a prefix.
    Useful for invalidating all cached data related to a specific entity.
    """
    if not redis_client:
        logger.warning("Redis not available. Cannot invalidate cache.")
        return

    try:
        keys_to_delete = []
        async for key in redis_client.scan_iter(f"{key_prefix}*"):
            keys_to_delete.append(key)

        if keys_to_delete:
            deleted_count = await redis_client.delete(*keys_to_delete)
            logger.info(f"Invalidated {deleted_count} cache entries with prefix: {key_prefix}")
        else:
            logger.debug(f"No cache entries found to invalidate for prefix: {key_prefix}")
    except Exception as e:
        logger.error(f"Error invalidating cache for prefix {key_prefix}: {e}")