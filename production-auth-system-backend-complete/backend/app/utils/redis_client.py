import redis.asyncio as redis
from typing import Annotated
from fastapi import Depends

from app.core.config import settings
from app.utils.logger import logger

# Global Redis client instance
_redis_client: redis.Redis | None = None

async def init_redis_client():
    """
    Initializes the global Redis client.
    This should be called on application startup.
    """
    global _redis_client
    try:
        _redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await _redis_client.ping()
        logger.info("Successfully connected to Redis.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}", exc_info=True)
        _redis_client = None # Ensure it's None if connection fails

async def close_redis_client():
    """
    Closes the global Redis client.
    This should be called on application shutdown.
    """
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        logger.info("Redis client closed.")
        _redis_client = None

async def get_redis_client() -> redis.Redis:
    """
    Dependency function to provide a Redis client.
    Raises an error if Redis is not initialized or available.
    """
    if _redis_client is None:
        logger.error("Redis client not initialized or connection failed.")
        raise ConnectionError("Redis client not available.")
    return _redis_client

# Dependency for FastAPI
RedisClient = Annotated[redis.Redis, Depends(get_redis_client)]
```