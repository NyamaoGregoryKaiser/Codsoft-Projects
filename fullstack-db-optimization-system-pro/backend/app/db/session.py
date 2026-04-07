from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from loguru import logger

engine = create_async_engine(settings.DATABASE_URL, echo=False) # Set echo=True for SQL logging

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Important for detaching objects from session after commit
)

async def get_async_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

async def create_db_and_tables():
    """
    This function is primarily for local development/testing without Alembic.
    In production, Alembic migrations should be used.
    """
    async with engine.begin() as conn:
        # Import all models here so that Base.metadata knows about them
        from app.db.models import User, Database, Metric, OptimizationSuggestion, Task # noqa
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created (if not existing).")

async def close_db_connection():
    await engine.dispose()
    logger.info("Database connection pool disposed.")