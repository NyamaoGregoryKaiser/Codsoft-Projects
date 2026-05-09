from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.users import user_crud
from app.crud.roles import role_crud
from app.models.user import User, Role
from app.schemas.user import UserUpdate, UserPasswordChange
from app.core.security import get_password_hash, verify_password
from app.utils.logger import logger

class UserService:
    """
    Service layer for user related business logic (excluding core auth).
    Handles user profile management and role assignment.
    """
    async def get_user_profile(self, db: AsyncSession, user_id: int) -> User:
        """
        Retrieves a user's profile by ID.
        """
        user = await user_crud.get_with_roles(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_user_profile(self, db: AsyncSession, user_id: int, user_update: UserUpdate) -> User:
        """
        Updates a user's profile.
        """
        user = await user_crud.get(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Prevent changing email through this endpoint if desired, or add verification flow
        if user_update.email and user_update.email != user.email:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email cannot be changed via this endpoint.")

        updated_user = await user_crud.update_user(db, user, user_update)
        logger.info(f"User {user.email} updated profile.")
        return updated_user

    async def change_user_password(self, db: AsyncSession, user: User, password_change: UserPasswordChange) -> User:
        """
        Changes an authenticated user's password.
        """
        if not verify_password(password_change.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect current password")

        if password_change.current_password == password_change.new_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password cannot be the same as current password")

        new_hashed_password = get_password_hash(password_change.new_password)
        updated_user = await user_crud.update(db, user, {"hashed_password": new_hashed_password})
        logger.info(f"User {user.email} changed their password.")
        return updated_user

    async def get_all_users(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Retrieves all users with pagination. (Admin only)
        """
        return await user_crud.get_multi_with_roles(db, skip=skip, limit=limit)

    async def delete_user(self, db: AsyncSession, user_id: int):
        """
        Deletes a user by ID. (Admin only)
        """
        user = await user_crud.get(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        await user_crud.delete(db, user_id)
        logger.info(f"Admin deleted user {user.email} (ID: {user_id}).")
        return {"message": "User deleted successfully"}

    async def assign_roles_to_user(self, db: AsyncSession, user_id: int, role_ids: List[int]) -> User:
        """
        Assigns a new set of roles to a user, replacing existing ones. (Admin only)
        """
        user = await user_crud.get_with_roles(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if not role_ids:
            # If no role_ids are provided, remove all roles
            updated_user = await user_crud.set_user_roles(db, user, [])
            logger.info(f"Admin removed all roles from user {user.email}.")
            return updated_user


        roles_to_assign = await role_crud.get_roles_by_ids(db, role_ids)
        if len(roles_to_assign) != len(role_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more role IDs are invalid")

        updated_user = await user_crud.set_user_roles(db, user, roles_to_assign)
        logger.info(f"Admin assigned roles {role_ids} to user {user.email}.")
        return updated_user

user_service = UserService()
```