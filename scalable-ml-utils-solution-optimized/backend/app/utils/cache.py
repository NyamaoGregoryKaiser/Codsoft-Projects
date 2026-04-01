```python
import json
from typing import Any, Optional
import redis.asyncio as redis
from backend.app.core.config import settings
from backend.app.core.logging_config import logger

class RedisCache:
    def __init__(self, redis_url: str = settings.REDIS_URL):
        self._redis = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        logger.info(f"Initialized RedisCache with URL: {redis_url}")

    async def get(self, key: str) -> Optional[Any]:
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get failed for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """
        Set a key-value pair in Redis.
        :param key: The key to set.
        :param value: The value to set (will be JSON serialized).
        :param ex: Expiration time in seconds.
        :return: True if successful, False otherwise.
        """
        try:
            serialized_value = json.dumps(value)
            await self._redis.set(key, serialized_value, ex=ex)
            return True
        except Exception as e:
            logger.error(f"Redis set failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete failed for key {key}: {e}")
            return False

    async def health_check(self) -> bool:
        try:
            await self._redis.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

cache_client = RedisCache()
```