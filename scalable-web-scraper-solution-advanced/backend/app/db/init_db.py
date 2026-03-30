from sqlalchemy.orm import Session
from app import crud, schemas
from app.core.config import settings
from app.db.base_class import Base # noqa
from app.models.user import User # noqa
from app.models.scraper import Scraper # noqa
from app.models.job import ScrapingJob # noqa
from app.models.scraped_item import ScrapedItem # noqa


def init_db(db: Session) -> None:
    # Create tables if not exists (handled by Alembic in prod, but good for local dev/testing)
    # This line is usually removed in a production setup with Alembic.
    # Base.metadata.create_all(bind=engine) # No, Alembic does this.

    user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            full_name="Admin User"
        )
        crud.user.create(db, obj_in=user_in)
        print("Superuser created!")
    else:
        print("Superuser already exists.")