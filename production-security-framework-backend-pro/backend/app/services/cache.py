```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
import redis.asyncio as redis
from app.core.config import settings
from loguru import logger

def init_cache():
    try:
        redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=1) # Use a different DB for cache
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        logger.info(f"FastAPICache initialized with Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    except Exception as e:
        logger.error(f"Failed to initialize FastAPICache: {e}")
```