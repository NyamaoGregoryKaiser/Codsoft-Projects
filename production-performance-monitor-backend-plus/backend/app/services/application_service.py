from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.application import application as crud_application
from app.database.models import Application, User
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.core.exceptions import HTTPException, ForbiddenException, NotFoundException


class ApplicationService:
    async def get_application(self, db: AsyncSession, app_id: int) -> Optional[Application]:
        return await crud_application.get(db, id=app_id)

    async def get_application_by_api_key(self, db: AsyncSession, api_key: str) -> Optional[Application]:
        return await crud_application.get_by_api_key(db, api_key=api_key)

    async def get_applications_by_owner(
        self, db: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Application]:
        return await crud_application.get_multi(db, filters={"owner_id": owner_id}, skip=skip, limit=limit)

    async def create_application(self, db: AsyncSession, app_in: ApplicationCreate, owner: User) -> Application:
        existing_app = await crud_application.get_by_name(db, name=app_in.name)
        if existing_app:
            raise HTTPException(status_code=400, detail="Application with this name already exists")
        return await crud_application.create_application(db, app_in=app_in, owner_id=owner.id)

    async def update_application(self, db: AsyncSession, app_id: int, app_in: ApplicationUpdate, current_user: User) -> Application:
        db_app = await self.get_application(db, app_id=app_id)
        if not db_app:
            raise NotFoundException("Application not found")
        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to update this application")
        return await crud_application.update_application(db, db_app=db_app, app_in=app_in)

    async def delete_application(self, db: AsyncSession, app_id: int, current_user: User) -> Application:
        db_app = await self.get_application(db, app_id=app_id)
        if not db_app:
            raise NotFoundException("Application not found")
        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to delete this application")
        await crud_application.delete(db, id=app_id)
        return db_app


application_service = ApplicationService()