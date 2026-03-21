from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user as crud_user
from app.schemas.user import UserCreate, UserRegister, UserUpdate
from app.database.models import User
from app.core.exceptions import HTTPException, NotFoundException
from app.core.security import verify_password


class UserService:
    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        return await crud_user.get_by_email(db, email=email)

    async def get_user(self, db: AsyncSession, user_id: int) -> Optional[User]:
        return await crud_user.get(db, id=user_id)

    async def get_users(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
        return await crud_user.get_multi(db, skip=skip, limit=limit)

    async def create_user(self, db: AsyncSession, user_in: UserCreate | UserRegister) -> User:
        existing_user = await self.get_user_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        return await crud_user.create_user(db, user_in=user_in)

    async def update_user(self, db: AsyncSession, user_id: int, user_in: UserUpdate) -> User:
        db_user = await crud_user.get(db, id=user_id)
        if not db_user:
            raise NotFoundException("User not found")
        return await crud_user.update_user(db, db_user=db_user, user_in=user_in)

    async def delete_user(self, db: AsyncSession, user_id: int) -> User:
        db_user = await crud_user.get(db, id=user_id)
        if not db_user:
            raise NotFoundException("User not found")
        await crud_user.delete(db, id=user_id)
        return db_user # Return the deleted user for confirmation


user_service = UserService()