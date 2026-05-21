from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from tenacity import retry, stop_after_attempt, wait_fixed, before_log
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy Base for declarative models
Base = declarative_base()

# Async engine for database connection
# echo=True is good for development to see SQL queries, set to False in production
engine = create_async_engine(str(settings.ASYNC_DATABASE_URL), echo=False, pool_pre_ping=True)

# Async session maker for database interactions
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # To allow accessing attributes after commit
)

@retry(
    stop=stop_after_attempt(5),
    wait=wait_fixed(2),
    before=before_log(logger, logging.INFO),
    reraise=True
)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get an async database session.
    It yields a session and ensures it's closed properly.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db_connection():
    """
    Initializes and tests the database connection.
    Used during application startup for health checks.
    """
    logger.info("Attempting to connect to the database...")
    try:
        async with engine.connect() as conn:
            # Execute a simple query to test the connection
            await conn.execute("SELECT 1")
        logger.info("Successfully connected to the database.")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db_connection())