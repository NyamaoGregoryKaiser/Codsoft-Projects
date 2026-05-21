from typing import Optional, Any
import json
import logging
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self, redis_client: Optional[Redis]):
        self.redis = redis_client
        if not self.redis:
            logger.warning("CacheService initialized without a Redis client. Caching will be disabled.")

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        try:
            value = await self.redis.get(key)
            if value:
                logger.debug(f"Cache HIT for key: {key}")
                return json.loads(value)
            logger.debug(f"Cache MISS for key: {key}")
            return None
        except Exception as e:
            logger.error(f"Error getting from cache for key {key}: {e}", exc_info=True)
            return None

    async def set(self, key: str, value: Any, ex: int = 300) -> bool: # Default 5 minutes
        if not self.redis:
            return False
        try:
            await self.redis.set(key, json.dumps(value), ex=ex)
            logger.debug(f"Cache SET for key: {key} with expiry: {ex}s")
            return True
        except Exception as e:
            logger.error(f"Error setting to cache for key {key}: {e}", exc_info=True)
            return False

    async def delete(self, key: str) -> bool:
        if not self.redis:
            return False
        try:
            result = await self.redis.delete(key)
            if result:
                logger.debug(f"Cache DELETED for key: {key}")
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting from cache for key {key}: {e}", exc_info=True)
            return False

    async def delete_prefix(self, prefix: str) -> int:
        """Deletes all keys matching a given prefix."""
        if not self.redis:
            return 0
        try:
            keys = []
            async for key in self.redis.scan_iter(f"{prefix}*"):
                keys.append(key)
            if keys:
                deleted_count = await self.redis.delete(*keys)
                logger.debug(f"Cache DELETED {deleted_count} keys with prefix: {prefix}")
                return deleted_count
            return 0
        except Exception as e:
            logger.error(f"Error deleting cache by prefix {prefix}: {e}", exc_info=True)
            return 0

# Dependency to provide CacheService instance
def get_cache_service(request: Request) -> CacheService:
    return CacheService(request.app.state.redis)