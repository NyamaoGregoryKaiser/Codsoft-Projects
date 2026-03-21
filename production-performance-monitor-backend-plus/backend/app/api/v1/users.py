from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.database.session import get_db_session
from app.schemas.user import UserBase, UserCreate, UserUpdate
from app.database.models import User
from app.api.deps import get_current_active_user, get_current_active_admin
from app.services.user_service import user_service
from app.core.exceptions import NotFoundException
from app.core.rate_limit import hundred_per_hour
from app.core.logging_config import logger


router = APIRouter()


@router.get("/me", response_model=UserBase, dependencies=[Depends(hundred_per_hour)])
async def read_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve current authenticated user's details.
    """
    logger.debug(f"Retrieving details for current user: {current_user.email}")
    return current_user


@router.put("/me", response_model=UserBase, dependencies=[Depends(hundred_per_hour)])
async def update_current_user(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current authenticated user's details.
    """
    logger.info(f"Updating details for current user: {current_user.email}")
    updated_user = await user_service.update_user(db, current_user.id, user_in)
    logger.info(f"User {current_user.email} (ID: {current_user.id}) updated successfully.")
    return updated_user


@router.get("/", response_model=List[UserBase], dependencies=[Depends(get_current_active_admin)])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Retrieve multiple users (Admin only).
    """
    logger.debug(f"Admin retrieving list of users (skip={skip}, limit={limit}).")
    users = await user_service.get_users(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=UserBase, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_active_admin)])
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Create a new user (Admin only).
    """
    logger.info(f"Admin creating new user: {user_in.email}")
    user = await user_service.create_user(db, user_in)
    logger.info(f"Admin created user {user.email} with ID: {user.id}.")
    return user


@router.get("/{user_id}", response_model=UserBase, dependencies=[Depends(get_current_active_admin)])
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Retrieve a user by ID (Admin only).
    """
    logger.debug(f"Admin retrieving user with ID: {user_id}")
    user = await user_service.get_user(db, user_id=user_id)
    if not user:
        logger.warning(f"Admin tried to retrieve non-existent user with ID: {user_id}")
        raise NotFoundException("User not found")
    return user


@router.put("/{user_id}", response_model=UserBase, dependencies=[Depends(get_current_active_admin)])
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update a user by ID (Admin only).
    """
    logger.info(f"Admin updating user with ID: {user_id}")
    updated_user = await user_service.update_user(db, user_id, user_in)
    logger.info(f"Admin updated user ID: {user_id}.")
    return updated_user


@router.delete("/{user_id}", response_model=UserBase, dependencies=[Depends(get_current_active_admin)])
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete a user by ID (Admin only).
    """
    logger.warning(f"Admin attempting to delete user with ID: {user_id}")
    deleted_user = await user_service.delete_user(db, user_id)
    logger.info(f"Admin deleted user ID: {user_id}.")
    return deleted_user