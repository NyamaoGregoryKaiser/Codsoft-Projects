from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger()

engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True) # echo=True for SQL logs

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Prevents objects from expiring after commit, useful for async
)

async def init_db():
    logger.info("Initializing database...")
    # This function can be used for initial setup if needed, e.g., creating tables
    # if using declarative base without alembic for simple cases.
    # With Alembic, migrations handle schema creation/updates.
    logger.info("Database initialized.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()