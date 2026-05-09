from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.core.config import settings

# Database engine configuration
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

# Asynchronous session maker
AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to provide an asynchronous database session.
    Yields a session which is automatically closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# For Alembic to discover models
def get_base():
    return Base
```