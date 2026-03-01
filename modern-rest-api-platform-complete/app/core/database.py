import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create the async engine with connection pooling and future=True for SQLAlchemy 2.0 style
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=False, # Set to True to see SQL queries in logs (useful for debugging)
    poolclass=NullPool, # Using NullPool as uvicorn handles concurrency, and we use connection per request
    future=True
)

# Create a configured "Session" class
# expire_on_commit=False is important for working with relationships outside of the session
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

async def database_startup():
    """Initializes database connections."""
    logger.info("Connecting to the database...")
    try:
        # Test connection
        async with engine.connect() as connection:
            await connection.run_sync(lambda sync_conn: sync_conn.execute("SELECT 1"))
        logger.info("Database connection established successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")
        raise

async def database_shutdown():
    """Closes database connections."""
    logger.info("Closing database connections...")
    await engine.dispose()
    logger.info("Database connections closed.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a SQLAlchemy async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```