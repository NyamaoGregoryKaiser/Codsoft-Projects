```python
import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.db.session import SessionLocal
from backend.app.db.init_db import init_db
from backend.app.core.config import settings
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate
from backend.app.crud.crud_user import user as crud_user

async def seed_data():
    db = SessionLocal()
    try:
        print("Ensuring initial database setup...")
        # This will create a superuser if one doesn't exist
        await init_db(db)

        # Check if the superuser already exists
        superuser_email = settings.FIRST_SUPERUSER_EMAIL
        existing_superuser = await crud_user.get_by_email(db, email=superuser_email)

        if not existing_superuser:
            print(f"Creating initial superuser: {superuser_email}")
            user_in = UserCreate(
                username=settings.FIRST_SUPERUSER_USERNAME,
                email=superuser_email,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True
            )
            await crud_user.create(db, obj_in=user_in)
        else:
            print(f"Superuser '{superuser_email}' already exists.")

        # You can add more seed data here, e.g., regular users, default datasets, etc.
        # Example for a regular user:
        regular_user_email = "user@example.com"
        existing_regular_user = await crud_user.get_by_email(db, email=regular_user_email)
        if not existing_regular_user:
            print(f"Creating initial regular user: {regular_user_email}")
            user_in = UserCreate(
                username="regularuser",
                email=regular_user_email,
                password="password",
                is_superuser=False
            )
            await crud_user.create(db, obj_in=user_in)
        else:
            print(f"Regular user '{regular_user_email}' already exists.")

        print("Seed data process complete.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        # Optionally, re-raise or log for better error visibility in a real app
    finally:
        await db.close()

if __name__ == "__main__":
    # Ensure environment variables are loaded if running directly
    from dotenv import load_dotenv
    load_dotenv(override=True)
    asyncio.run(seed_data())

```