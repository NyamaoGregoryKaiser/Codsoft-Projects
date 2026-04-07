from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.db.models import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core import security
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from loguru import logger

class UserService:
    async def get_user(self, db: AsyncSession, user_id: int) -> User:
        user = await crud.user.get(db, user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        return user

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        return await crud.user.get_by_email(db, email)

    async def get_user_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        return await crud.user.get_by_username(db, username)

    async def get_all_users(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        return await crud.user.get_multi(db, skip=skip, limit=limit)

    async def create_user(self, db: AsyncSession, user_in: UserCreate, current_user: User) -> User:
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can create new users directly.")

        existing_user_email = await crud.user.get_by_email(db, email=user_in.email)
        if existing_user_email:
            raise ConflictException(f"User with email '{user_in.email}' already exists.")

        existing_user_username = await crud.user.get_by_username(db, username=user_in.username)
        if existing_user_username:
            raise ConflictException(f"User with username '{user_in.username}' already exists.")

        hashed_password = security.get_password_hash(user_in.password)
        new_user = await crud.user.create_with_hashed_password(db, obj_in=user_in, hashed_password=hashed_password)
        logger.info(f"Admin '{current_user.username}' created user: {new_user.username} (ID: {new_user.id})")
        return new_user

    async def update_user(self, db: AsyncSession, user_id: int, user_in: UserUpdate, current_user: User) -> User:
        db_user = await self.get_user(db, user_id)

        # Only admins can update other users, or a user can update themselves
        if current_user.id != user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You do not have permission to update this user.")

        # Admins can change roles and active status, regular users cannot change these for themselves
        if current_user.id == user_id and (user_in.is_admin is not None or user_in.role is not None):
            raise ForbiddenException("Users cannot change their own admin status or role.")
        
        # Prevent non-admins from changing other users' roles/active status
        if current_user.role != UserRole.ADMIN and current_user.id != user_id:
            if user_in.is_admin is not None or user_in.role is not None or user_in.is_active is not None:
                 raise ForbiddenException("Only administrators can update user roles or active status.")

        update_data = user_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))
        
        updated_user = await crud.user.update(db, db_user, update_data)
        logger.info(f"User '{current_user.username}' updated user ID: {updated_user.id}")
        return updated_user

    async def delete_user(self, db: AsyncSession, user_id: int, current_user: User) -> User:
        db_user = await self.get_user(db, user_id)

        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can delete users.")
        if current_user.id == user_id:
            raise ForbiddenException("You cannot delete your own user account.")

        deleted_user = await crud.user.remove(db, user_id)
        logger.info(f"Admin '{current_user.username}' deleted user: {deleted_user.username} (ID: {deleted_user.id})")
        return deleted_user

user_service = UserService()