```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from app.utils.logger import logger

# Async engine for PostgreSQL
engine = create_async_engine(settings.DATABASE_URL, echo=True if settings.APP_ENV == "development" else False)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Ensures objects remain valid after commit
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """Dependency to provide a database session for each request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initializes the database by creating all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

async def dispose_db():
    """Disposes the database engine."""
    await engine.dispose()
    logger.info("Database engine disposed.")
```