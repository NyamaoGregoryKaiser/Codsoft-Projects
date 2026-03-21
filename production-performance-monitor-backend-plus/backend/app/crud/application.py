from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.database.models import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.core.security import generate_api_key


class CRUDApplication(CRUDBase[Application]):
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Application]:
        """Retrieve an application by its name."""
        stmt = select(self.model).where(self.model.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_api_key(self, db: AsyncSession, api_key: str) -> Optional[Application]:
        """Retrieve an application by its API key."""
        stmt = select(self.model).where(self.model.api_key == api_key)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_application(self, db: AsyncSession, app_in: ApplicationCreate, owner_id: int) -> Application:
        """Create a new application with a generated API key."""
        api_key = generate_api_key()
        db_app = self.model(
            name=app_in.name,
            description=app_in.description,
            owner_id=owner_id,
            api_key=api_key,
        )
        db.add(db_app)
        await db.commit()
        await db.refresh(db_app)
        return db_app

    async def update_application(self, db: AsyncSession, db_app: Application, app_in: ApplicationUpdate) -> Application:
        """Update an existing application."""
        update_data = app_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_app, field, value)

        await db.commit()
        await db.refresh(db_app)
        return db_app


application = CRUDApplication(Application)