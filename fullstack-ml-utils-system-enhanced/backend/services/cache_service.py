```python
import json
import pickle
from typing import Optional, Any
import redis
from backend.core.config import settings
from loguru import logger

class CacheService:
    def __init__(self):
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=False # Keep bytes for pickling
            )
            self.redis_client.ping()
            logger.info("Redis cache service initialized successfully.")
        except redis.exceptions.ConnectionError as e:
            logger.error(f"Could not connect to Redis: {e}. Caching will be disabled.")
            self.redis_client = None

    def set(self, key: str, value: Any, ex: Optional[int] = None):
        if not self.redis_client:
            return
        try:
            # For complex objects (like Pandas DFs or scikit-learn models), use pickle
            # For simple JSON-serializable objects, JSON.dumps might be lighter.
            # Here we'll default to pickle for generality.
            serialized_value = pickle.dumps(value)
            self.redis_client.set(key, serialized_value, ex=ex)
            logger.debug(f"Cached key: {key}")
        except Exception as e:
            logger.error(f"Error setting cache for key {key}: {e}")

    def get(self, key: str) -> Optional[Any]:
        if not self.redis_client:
            return None
        try:
            serialized_value = self.redis_client.get(key)
            if serialized_value:
                value = pickle.loads(serialized_value)
                logger.debug(f"Retrieved key from cache: {key}")
                return value
        except Exception as e:
            logger.error(f"Error getting cache for key {key}: {e}")
        return None

    def delete(self, key: str):
        if not self.redis_client:
            return
        try:
            self.redis_client.delete(key)
            logger.debug(f"Deleted key from cache: {key}")
        except Exception as e:
            logger.error(f"Error deleting cache for key {key}: {e}")

    def clear_all(self):
        if not self.redis_client:
            return
        try:
            self.redis_client.flushdb()
            logger.info("Cleared all items from Redis cache.")
        except Exception as e:
            logger.error(f"Error clearing Redis cache: {e}")

cache_service = CacheService()
```