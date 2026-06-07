```python
import logging
import json
from typing import Any, Optional, Union

import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    """
    A wrapper class for asynchronous Redis client operations.
    Provides methods for common caching patterns (get, set, delete).
    """
    def __init__(self):
        self._client: Optional[Redis] = None
        self.redis_url = settings.REDIS_URL
        logger.info(f"RedisClient initialized with URL: {self.redis_url}")

    async def init(self):
        """
        Initializes the asynchronous Redis client connection.
        This should be called during application startup.
        """
        if self._client is None:
            try:
                self._client = aioredis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
                await self._client.ping() # Test the connection
                logger.info("Redis client connected successfully.")
            except Exception as e:
                logger.error(f"Failed to connect to Redis at {self.redis_url}: {e}", exc_info=True)
                # In a real app, you might want to retry or raise a critical error
                raise ConnectionRefusedError(f"Could not connect to Redis: {e}") from e
        else:
            logger.info("Redis client already initialized.")

    @property
    def client(self) -> Redis:
        """
        Provides access to the underlying Redis client instance.
        Ensures init() has been called.
        """
        if self._client is None:
            raise RuntimeError("Redis client not initialized. Call .init() first.")
        return self._client

    async def close(self):
        """
        Closes the Redis client connection.
        This should be called during application shutdown.
        """
        if self._client:
            await self._client.close()
            logger.info("Redis client connection closed.")
            self._client = None

    async def get(self, key: str) -> Optional[Any]:
        """
        Retrieves a value from Redis. Assumes stored values are JSON strings.

        Args:
            key (str): The key to retrieve.

        Returns:
            Optional[Any]: The deserialized value, or None if key does not exist.
        """
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting key '{key}' from Redis: {e}", exc_info=True)
            return None

    async def set(self, key: str, value: Any, ex: Optional[int] = None):
        """
        Stores a value in Redis. Serializes values to JSON strings.

        Args:
            key (str): The key to store the value under.
            value (Any): The value to store.
            ex (Optional[int]): Expiration time in seconds (e.g., 300 for 5 minutes).
        """
        try:
            serialized_value = json.dumps(value)
            await self.client.set(key, serialized_value, ex=ex)
            logger.debug(f"Set key '{key}' in Redis with expiry {ex}s.")
        except Exception as e:
            logger.error(f"Error setting key '{key}' in Redis: {e}", exc_info=True)

    async def delete(self, key: str) -> int:
        """
        Deletes one or more keys from Redis.

        Args:
            key (str): The key (or keys) to delete.

        Returns:
            int: The number of keys that were removed.
        """
        try:
            deleted_count = await self.client.delete(key)
            logger.debug(f"Deleted {deleted_count} keys from Redis: {key}")
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting key '{key}' from Redis: {e}", exc_info=True)
            return 0
    
    async def ping(self) -> bool:
        """
        Pings the Redis server to check connectivity.

        Returns:
            bool: True if connection is successful, False otherwise.
        """
        try:
            return await self.client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}", exc_info=True)
            return False


redis_client = RedisClient()

```