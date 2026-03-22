from typing import List, Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_user import user as crud_user
from app.schemas.user import User as UserSchema, UserUpdate
from app.dependencies import (
    get_db,
    get_current_active_user,
    get_current_active_superuser,
)
from app.models.user import User as UserModel
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: Annotated[UserModel, Depends(get_current_active_user)],
):
    """
    Get current active user.
    """
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_in: UserUpdate,
    current_user: Annotated[UserModel, Depends(get_current_active_user)],
):
    """
    Update current active user.
    """
    # Prevent changing email to an already existing one (unless it's their own)
    if user_in.email and user_in.email != current_user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise ConflictException(detail="Email already registered by another user.")

    user = await crud_user.update(db, db_obj=current_user, obj_in=user_in)
    logger.info(f"User {user.id} updated their profile.")
    return user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserModel, Depends(get_current_active_superuser)],
):
    """
    Get a specific user by ID (requires superuser).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found.")
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: int,
    user_in: UserUpdate,
    current_user: Annotated[UserModel, Depends(get_current_active_superuser)],
):
    """
    Update a user (requires superuser).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found.")
    
    # Prevent changing email to an already existing one (unless it's the target user's own)
    if user_in.email and user_in.email != user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user.id:
            raise ConflictException(detail="Email already registered by another user.")

    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"Superuser {current_user.id} updated user {user.id}.")
    return user


@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
    current_user: Annotated[UserModel, Depends(get_current_active_superuser)],
):
    """
    Retrieve users (requires superuser).
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserModel, Depends(get_current_active_superuser)],
):
    """
    Delete a user (requires superuser).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found.")
    if user.id == current_user.id:
        raise ForbiddenException(detail="Cannot delete your own superuser account.")
    
    await crud_user.remove(db, id=user_id)
    logger.info(f"Superuser {current_user.id} deleted user {user_id}.")
    return {"message": "User deleted successfully."}
```