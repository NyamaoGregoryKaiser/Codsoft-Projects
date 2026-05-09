from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, Message, UserPasswordChange
from app.services.users import user_service

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_current_user_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """
    Get current authenticated user's profile.
    """
    return current_user

@router.put("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update current authenticated user's profile.
    """
    updated_user = await user_service.update_user_profile(db, current_user.id, user_update)
    return updated_user

@router.put("/me/password", response_model=Message)
async def change_current_user_password(
    password_change: UserPasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Change current authenticated user's password.
    """
    await user_service.change_user_password(db, current_user, password_change)
    return {"message": "Password updated successfully"}
```