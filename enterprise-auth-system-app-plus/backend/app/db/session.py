```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.db.models import User, Post, RefreshToken, PasswordResetToken # Import models to ensure they are registered with Base


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for verbose SQL logging
    pool_size=10,
    max_overflow=20,
    future=True
)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession
)

async def init_db():
    """
    Initializes the database: creates all tables and seeds initial data if necessary.
    """
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Use with caution for fresh start
        await conn.run_sync(Base.metadata.create_all)
    await seed_db()


async def seed_db():
    """
    Seeds initial data into the database, e.g., an admin user.
    """
    from app.crud.user import create_user
    from app.schemas.user import UserCreate
    from app.core.security import get_password_hash
    from app.db.models import User
    from sqlalchemy import select

    async with async_session() as session:
        # Check if admin user already exists
        result = await session.execute(select(User).filter(User.email == settings.ADMIN_EMAIL))
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            print(f"Seeding admin user: {settings.ADMIN_EMAIL}")
            admin_user_in = UserCreate(
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD,
                first_name="Admin",
                last_name="User",
                is_admin=True,
                is_active=True
            )
            # Directly create user to avoid circular dependency with service layer if `create_user` in CRUD expects hashed password
            hashed_password = get_password_hash(admin_user_in.password)
            db_user = User(
                email=admin_user_in.email,
                hashed_password=hashed_password,
                first_name=admin_user_in.first_name,
                last_name=admin_user_in.last_name,
                is_active=admin_user_in.is_active,
                is_admin=admin_user_in.is_admin,
            )
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)
            print(f"Admin user '{db_user.email}' created successfully.")
        else:
            print(f"Admin user '{settings.ADMIN_EMAIL}' already exists. Skipping seed.")

```