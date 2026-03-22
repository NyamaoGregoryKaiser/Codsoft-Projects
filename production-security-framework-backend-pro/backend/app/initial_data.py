```python
import asyncio
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.db import engine, SessionLocal
from app.crud.user import crud_user
from app.schemas.user import UserCreate
from app.core.config import settings
from app.models.user import User # To access the User model directly if needed
from app.core.security import get_password_hash
from loguru import logger

async def get_db_for_init() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def init_db():
    async with SessionLocal() as session:
        # Check if initial admin user already exists
        admin_user = await crud_user.get_by_email(session, email=settings.INITIAL_ADMIN_EMAIL)

        if not admin_user:
            logger.info("Creating initial superuser...")
            user_in = UserCreate(
                email=settings.INITIAL_ADMIN_EMAIL,
                password=settings.INITIAL_ADMIN_PASSWORD,
                full_name="Admin User",
                role="admin", # Assign 'admin' role
            )
            admin_user = await crud_user.create(session, obj_in=user_in)
            logger.success(f"Superuser created: {admin_user.email}")
        else:
            logger.info("Superuser already exists, skipping creation.")

if __name__ == "__main__":
    logger.info("Running initial data setup...")
    asyncio.run(init_db())
    logger.info("Initial data setup complete.")
```