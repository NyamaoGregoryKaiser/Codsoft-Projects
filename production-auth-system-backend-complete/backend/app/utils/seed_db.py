import asyncio
from datetime import datetime, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, Base, engine
from app.models.user import User, Role
from app.schemas.user import UserCreate
from app.services.auth import auth_service
from app.crud.roles import role_crud
from app.utils.logger import logger

async def init_db():
    """
    Initializes the database by creating all tables.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

async def seed_roles(db: AsyncSession):
    """
    Seeds initial roles into the database.
    """
    roles_to_seed = ["admin", "user"]
    for role_name in roles_to_seed:
        existing_role = await role_crud.get_by_name(db, role_name)
        if not existing_role:
            await role_crud.create_role(db, {"name": role_name, "description": f"{role_name.capitalize()} role"})
            logger.info(f"Role '{role_name}' created.")
        else:
            logger.info(f"Role '{role_name}' already exists.")
    await db.commit()

async def seed_admin_user(db: AsyncSession):
    """
    Seeds an initial admin user if one doesn't exist.
    """
    admin_email = "admin@example.com"
    existing_admin = await user_crud.get_by_email(db, admin_email)

    if not existing_admin:
        admin_user_data = UserCreate(
            email=admin_email,
            password="adminpassword", # CHANGE THIS IN PRODUCTION
            full_name="Super Admin"
        )
        admin_user = await auth_service.register_user(db, admin_user_data) # Use auth_service to hash password and create
        admin_user.is_verified = True # Admin is auto-verified for simplicity
        await db.commit()
        await db.refresh(admin_user)

        admin_role = await role_crud.get_by_name(db, "admin")
        if admin_role:
            await user_crud.set_user_roles(db, admin_user, [admin_role])
            logger.info(f"Admin user '{admin_email}' created and assigned 'admin' role.")
        else:
            logger.warning("Admin role not found, admin user created without admin role.")
    else:
        logger.info(f"Admin user '{admin_email}' already exists.")
        # Ensure existing admin user has 'admin' role and is_verified
        if not existing_admin.is_verified:
            existing_admin.is_verified = True
            await db.commit()
            await db.refresh(existing_admin)
            logger.info(f"Existing admin user '{admin_email}' marked as verified.")

        admin_role = await role_crud.get_by_name(db, "admin")
        if admin_role and admin_role not in existing_admin.roles:
            await user_crud.add_roles_to_user(db, existing_admin, [admin_role])
            logger.info(f"Admin user '{admin_email}' ensured to have 'admin' role.")

async def main():
    """
    Main function to run seeding operations.
    """
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
        await seed_admin_user(session)
        # Optional: Clean up old tokens regularly
        # await pwd_reset_token_crud.clean_expired_and_used_tokens(session)
        # await email_verify_token_crud.clean_expired_and_used_tokens(session)
    logger.info("Database seeding completed.")

if __name__ == "__main__":
    # Load environment variables for local execution if not using docker-compose exec
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="../.env") # Adjust path if necessary

    # Import settings after dotenv is loaded
    from app.core.config import settings # noqa: F811

    # Before running seeding, ensure the database is initialized (tables created)
    # This might be redundant if alembic upgrade head is run first,
    # but good for a fresh start/testing.
    asyncio.run(init_db())
    asyncio.run(main())
```