from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Database URL determined by DEBUG mode for testing or production
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL if not settings.DEBUG else settings.DATABASE_URL # For simplicity, using same DB for now. In a real scenario, DEBUG could point to TEST_DATABASE_URL
# In a real test environment, TEST_DATABASE_URL would be used with a separate test database setup.

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=settings.DEBUG, future=True)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Ensures objects remain valid after commit
)

Base = declarative_base()

async def get_db():
    """Dependency to get an async database session."""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    """Initializes the database by creating all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def close_db_connections():
    """Closes all database connections."""
    await engine.dispose()

if __name__ == "__main__":
    import asyncio
    
    async def _test_db_connection():
        print("Testing database connection...")
        try:
            async with AsyncSessionLocal() as session:
                await session.connection()
                print("Database connection successful!")
        except Exception as e:
            print(f"Database connection failed: {e}")
        finally:
            await close_db_connections()

    asyncio.run(_test_db_connection())
```