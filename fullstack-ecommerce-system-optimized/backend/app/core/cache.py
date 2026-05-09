```python
import functools
import json
from typing import Any, Callable, TypeVar, Optional, ParamSpec

import redis.asyncio as redis
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from app.core.config import settings
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """
    Provides a singleton Redis client instance.
    """
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                str(settings.REDIS_URL),
                encoding="utf-8",
                decode_responses=True,
            )
            logger.info("Redis client initialized.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise ConnectionError(f"Could not connect to Redis at {settings.REDIS_URL}") from e
    return _redis_client

P = ParamSpec('P')
R = TypeVar('R')

def cached(
    key_prefix: str = "cache",
    ttl: int = 300,  # Time to live in seconds (5 minutes)
    invalidate_on_post: bool = False,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    Decorator to cache the results of an async function.
    The cache key is generated from the function name and its arguments (excluding the Request object).
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            request: Optional[Request] = kwargs.get("request")
            if request and request.method == "POST" and invalidate_on_post:
                # Invalidate cache for this prefix on POST requests if configured
                logger.debug(f"Invalidating cache for prefix '{key_prefix}' due to POST request.")
                await _invalidate_cache_by_prefix(key_prefix)
                return await func(*args, **kwargs)

            cache_key_parts = [key_prefix, func.__name__]
            
            # Extract relevant arguments for caching, excluding Request and DB session
            for arg_name, arg_value in kwargs.items():
                if arg_name not in ["request", "db"] and arg_value is not None:
                    # Convert to string to include in key; handle complex types if necessary
                    cache_key_parts.append(f"{arg_name}:{arg_value}")
            
            # For path parameters, they are often direct arguments
            # This is a simplification; a more robust solution might inspect func signature
            # For simplicity, if we only care about `id` in /products/{product_id}, we can add it
            if 'product_id' in kwargs and kwargs['product_id'] is not None:
                cache_key_parts.append(f"product_id:{kwargs['product_id']}")
            elif 'category_id' in kwargs and kwargs['category_id'] is not None:
                cache_key_parts.append(f"category_id:{kwargs['category_id']}")
            elif 'order_id' in kwargs and kwargs['order_id'] is not None:
                cache_key_parts.append(f"order_id:{kwargs['order_id']}")
            elif 'user_id' in kwargs and kwargs['user_id'] is not None:
                cache_key_parts.append(f"user_id:{kwargs['user_id']}")
            elif 'review_id' in kwargs and kwargs['review_id'] is not None:
                cache_key_parts.append(f"review_id:{kwargs['review_id']}")

            cache_key = ":".join(map(str, cache_key_parts))

            redis_client = get_redis_client()
            cached_result = await redis_client.get(cache_key)

            if cached_result:
                logger.debug(f"Cache HIT for key: {cache_key}")
                return json.loads(cached_result)
            
            logger.debug(f"Cache MISS for key: {cache_key}")
            result = await func(*args, **kwargs)
            # Encode result to JSON before caching
            await redis_client.setex(cache_key, ttl, json.dumps(jsonable_encoder(result)))
            return result
        return wrapper
    return decorator

async def _invalidate_cache_by_prefix(prefix: str):
    """
    Invalidates all cache entries that start with a given prefix.
    """
    redis_client = get_redis_client()
    keys_to_delete = []
    # Use async_iter since keys() returns an async iterator
    async for key in redis_client.scan_iter(f"{prefix}:*"):
        keys_to_delete.append(key)
    
    if keys_to_delete:
        await redis_client.delete(*keys_to_delete)
        logger.info(f"Invalidated {len(keys_to_delete)} cache entries with prefix '{prefix}'.")
    else:
        logger.debug(f"No cache entries found to invalidate for prefix '{prefix}'.")

# Example of how to explicitly invalidate cache for a resource (e.g., after POST, PUT, DELETE)
async def invalidate_product_cache(product_id: Optional[int] = None):
    """
    Invalidates product-related caches.
    If product_id is None, invalidates the "all_products" cache.
    If product_id is provided, invalidates the specific product cache.
    """
    redis_client = get_redis_client()
    if product_id is None:
        await redis_client.delete("cache:all_products")
        logger.info("Invalidated 'all_products' cache.")
    else:
        await redis_client.delete(f"cache:product:read_product_by_id:product_id:{product_id}")
        logger.info(f"Invalidated product cache for ID: {product_id}.")
    
    # Also invalidate the general product list if any product changes
    await redis_client.delete("cache:all_products:read_products")
    logger.info("Invalidated general products list cache.")

async def invalidate_category_cache(category_id: Optional[int] = None):
    """
    Invalidates category-related caches.
    """
    redis_client = get_redis_client()
    if category_id is None:
        await redis_client.delete("cache:all_categories")
        logger.info("Invalidated 'all_categories' cache.")
    else:
        await redis_client.delete(f"cache:category:read_category_by_id:category_id:{category_id}")
        logger.info(f"Invalidated category cache for ID: {category_id}.")
    
    await redis_client.delete("cache:all_categories:read_categories")
    logger.info("Invalidated general categories list cache.")

```