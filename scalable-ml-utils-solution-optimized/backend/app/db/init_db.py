```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.base_class import Base
from backend.app.db.session import engine
from backend.app.core.config import settings
from backend.app.crud.crud_user import user as crud_user
from backend.app.schemas.user import UserCreate

async def init_db(db: AsyncSession) -> None:
    # Create tables if they don't exist (only for dev/testing, Alembic handles migrations in prod)
    # await Base.metadata.create_all(bind=engine) # This line is commented out as Alembic handles schema creation/updates

    # Create initial superuser
    superuser = await crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not superuser:
        user_in = UserCreate(
            username=settings.FIRST_SUPERUSER_USERNAME,
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True
        )
        await crud_user.create(db, obj_in=user_in)
        print("Superuser created!")
    else:
        print("Superuser already exists.")

if __name__ == "__main__":
    # This block is for direct execution to test db initialization
    # In a real app, this would be part of a setup script or docker entrypoint
    from backend.app.db.session import AsyncSessionLocal
    async def _init():
        async with AsyncSessionLocal() as db_session:
            await init_db(db_session)
            await db_session.commit() # Commit any changes made by init_db
    asyncio.run(_init())
```