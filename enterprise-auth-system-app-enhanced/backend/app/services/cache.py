import redis.asyncio as redis
from redis.asyncio import Redis
from app.core.config import settings
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

_redis_client: Redis = None

def get_redis_client() -> Redis:
    """
    Returns a singleton Redis client instance.
    Initializes it if it doesn't exist.
    """
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True # Decode responses to Python strings
        )
        logger.info(f"Redis client initialized for {settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}")
    return _redis_client

async def invalidate_refresh_token(refresh_token_jti: str, expires_in_seconds: int):
    """
    Invalidates a refresh token by blacklisting its JTI (JWT ID) in Redis.
    The key will expire automatically, ensuring eventual cleanup.
    """
    redis_client = get_redis_client()
    key = f"blacklist:refresh:{refresh_token_jti}"
    await redis_client.setex(key, expires_in_seconds, "1")
    logger.info(f"Refresh token JTI '{refresh_token_jti}' blacklisted for {expires_in_seconds} seconds.")

async def is_refresh_token_blacklisted(refresh_token_jti: str) -> bool:
    """
    Checks if a refresh token's JTI is blacklisted.
    """
    redis_client = get_redis_client()
    return bool(await redis_client.get(f"blacklist:refresh:{refresh_token_jti}"))

async def blacklist_access_token(access_token: str, expires_in_seconds: int):
    """
    Blacklists an access token, useful for explicit logout or password change.
    """
    redis_client = get_redis_client()
    key = f"blacklist:access:{access_token}" # Storing the token itself or its JTI
    await redis_client.setex(key, expires_in_seconds, "1")
    logger.info(f"Access token blacklisted for {expires_in_seconds} seconds.")

```