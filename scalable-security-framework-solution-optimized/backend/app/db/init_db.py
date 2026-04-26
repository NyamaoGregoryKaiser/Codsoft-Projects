```python
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.crud.user import crud_user
from app.schemas.user import UserCreate
from app.core.config import settings
from app.core.logging import logger

def init_db(db: Session) -> None:
    """
    Initializes the database with a default admin user if one doesn't exist.
    """
    # Create superuser
    admin_user = crud_user.get_by_email(db, email="admin@example.com")
    if not admin_user:
        logger.info("Creating initial admin user...")
        user_in = UserCreate(
            email="admin@example.com",
            password="adminpassword", # In production, this would be from secure env
            full_name="Admin User",
            is_active=True,
            role="admin",
        )
        crud_user.create(db, obj_in=user_in)
        logger.info("Admin user created successfully.")
    else:
        logger.info("Admin user already exists. Skipping creation.")

    # Create a regular user if not exists
    regular_user = crud_user.get_by_email(db, email="user@example.com")
    if not regular_user:
        logger.info("Creating initial regular user...")
        user_in = UserCreate(
            email="user@example.com",
            password="userpassword",
            full_name="Regular User",
            is_active=True,
            role="user",
        )
        crud_user.create(db, obj_in=user_in)
        logger.info("Regular user created successfully.")
    else:
        logger.info("Regular user already exists. Skipping creation.")
```