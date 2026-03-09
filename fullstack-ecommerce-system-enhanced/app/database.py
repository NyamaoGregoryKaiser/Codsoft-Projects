```python
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

logger = logging.getLogger("ecommerce_system")

# Create the SQLAlchemy engine for async operations
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

# Create a sessionmaker for producing new AsyncSession objects
# expire_on_commit=False prevents objects from being detached after commit,
# which can cause issues when accessing relationships later.
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Base class for our declarative models
Base = declarative_base()

async def init_db_connection():
    """
    Initializes the database connection.
    This can be extended to perform initial checks, migrations, etc.
    """
    try:
        # Test connection by executing a simple query
        async with engine.connect() as conn:
            await conn.execute(Base.metadata.drop_all) # Dangerous in prod, for dev/test
            await conn.execute(Base.metadata.create_all) # Dangerous in prod, for dev/test
            logger.info("Successfully connected to the database.")
            # We explicitly drop and create all tables for testing/initial dev setup.
            # In a real production environment, you would use Alembic for migrations
            # and only `create_all` for new, unmigrated databases, or specific test databases.
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")
        # Depending on the application, you might want to re-raise,
        # exit, or implement a retry mechanism.
        raise

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to provide an async database session to API endpoints.
    Ensures the session is closed after the request is finished.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session rolled back due to error: {e}")
            raise
        finally:
            await session.close()

```