```python
import redis.asyncio as redis
from app.core.config import settings
from app.utils.logger import logger

_redis_client: redis.Redis | None = None

async def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True # Decode responses to Python strings
            )
            await _redis_client.ping() # Test connection
            logger.info("Connected to Redis successfully.")
        except redis.exceptions.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise ConnectionError("Could not connect to Redis.") from e
    return _redis_client

async def close_redis_client():
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis client closed.")

async def set_cache(key: str, value: str, ex: int = 300):
    """Sets a value in cache with an expiration time (default 300 seconds)."""
    client = await get_redis_client()
    await client.set(key, value, ex=ex)

async def get_cache(key: str) -> str | None:
    """Gets a value from cache."""
    client = await get_redis_client()
    return await client.get(key)

async def delete_cache(key: str):
    """Deletes a key from cache."""
    client = await get_redis_client()
    await client.delete(key)
```