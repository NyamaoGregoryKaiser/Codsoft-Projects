```python
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool # Use NullPool for asyncpg + Uvicorn to avoid connection issues

from app.core.config import settings

logger = logging.getLogger(__name__)

# Base for SQLAlchemy declarative models
Base = declarative_base()

# Asynchronous engine configuration
# Use NullPool with asyncpg and FastAPI's lifespan events to manage connections explicitly
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True to see SQL queries in logs
    poolclass=NullPool, # Important for asyncpg with FastAPI lifespan management
    future=True
)

# Async session maker
# expire_on_commit=False prevents objects from being detached after commit,
# which can be useful for accessing relationships after a commit.
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get an asynchronous database session.
    Manages session lifecycle (creation and closing).
    """
    session: AsyncSession = AsyncSessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error(f"Database session error: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()

async def database_startup():
    """
    Function to be called on application startup to initialize the database connection.
    In an async setup with NullPool, this might not do much beyond ensuring
    the engine is created, but it's good practice for potential future needs
    like connection testing or event hooks.
    """
    logger.info("Initializing database connection...")
    # You can add connection test here if needed, e.g.,
    # async with engine.connect() as conn:
    #     await conn.execute(text("SELECT 1"))
    #     logger.info("Database connection test successful.")
    logger.info("Database connection initialized.")

async def database_shutdown():
    """
    Function to be called on application shutdown to close the database engine.
    This ensures all connections are properly released.
    """
    logger.info("Closing database engine...")
    await engine.dispose()
    logger.info("Database engine closed.")

```