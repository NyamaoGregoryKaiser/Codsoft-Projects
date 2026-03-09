from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Construct the async database URL
ASYNC_DATABASE_URL = settings.DATABASE_URL.replace("psycopg2", "asyncpg")

# Create the async engine
engine = create_async_engine(ASYNC_DATABASE_URL, echo=settings.DEBUG, future=True)

# Create a session maker
AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for declarative models
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initializes the database schema (useful for fresh starts or tests)."""
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Use with caution!
        await conn.run_sync(Base.metadata.create_all)

```
---