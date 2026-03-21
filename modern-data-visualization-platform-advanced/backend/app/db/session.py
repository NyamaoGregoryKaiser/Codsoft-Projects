```python
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool # Use NullPool for FastAPI, handled by application context

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure SQLAlchemy engine for PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO, # Set to True to log SQL queries
    poolclass=NullPool, # FastAPI manages sessions per request, so no need for engine-level pooling
    # future=True # Required for SQLAlchemy 2.0 style async operations
)

# Configure sessionmaker
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Prevent objects from expiring after commit
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to provide an SQLAlchemy AsyncSession.
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
```