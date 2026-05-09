from typing import Annotated, List

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_active_admin_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, UserRoleAssignment, Message
from app.services.users import user_service

router = APIRouter()

@router.get("/users", response_model=List[UserRead])
async def get_all_users(
    _: Annotated[User, Depends(get_current_active_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """
    Retrieve all users (Admin only).
    """
    users = await user_service.get_all_users(db, skip=skip, limit=limit)
    return users

@router.get("/users/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: int,
    _: Annotated[User, Depends(get_current_active_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve a specific user by ID (Admin only).
    """
    user = await user_service.get_user_profile(db, user_id) # Reuse user_service.get_user_profile
    return user

@router.put("/users/{user_id}", response_model=UserRead)
async def update_user_by_id(
    user_id: int,
    user_update: UserUpdate,
    _: Annotated[User, Depends(get_current_active_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update a specific user's profile by ID (Admin only).
    """
    user = await user_service.get_user_profile(db, user_id) # Check if user exists
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated_user = await user_service.update_user_profile(db, user_id, user_update)
    return updated_user

@router.delete("/users/{user_id}", response_model=Message)
async def delete_user_by_id(
    user_id: int,
    _: Annotated[User, Depends(get_current_active_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Delete a specific user by ID (Admin only).
    """
    response = await user_service.delete_user(db, user_id)
    return response

@router.post("/users/{user_id}/roles", response_model=UserRead)
async def assign_user_roles(
    user_id: int,
    role_assignment: UserRoleAssignment,
    _: Annotated[User, Depends(get_current_active_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Assign roles to a user (Admin only).
    This replaces all existing roles with the new set.
    """
    user = await user_service.assign_roles_to_user(db, user_id, role_assignment.role_ids)
    return user
```