```python
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from fastapi_cache.decorator import cache

from app.core.db import get_db
from app.crud.user import crud_user
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.models.user import User
from app.dependencies.auth import get_current_active_user, get_current_admin_user
from app.exceptions.custom_exceptions import EntityNotFoundException, ForbiddenException

router = APIRouter()

@router.get("/", response_model=List[UserSchema], dependencies=[Depends(get_current_admin_user)])
@cache(expire=60) # Cache for 60 seconds
async def read_users(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve all users (admin only).
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
async def create_user_by_admin(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create new user (admin only).
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"Admin created user: {user.email}")
    return user

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current active user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update current active user.
    """
    if user_in.email and user_in.email != current_user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists.",
            )
    
    # Non-admin users cannot change their role
    if user_in.role is not None and user_in.role != current_user.role and current_user.role != "admin":
        raise ForbiddenException("Not authorized to change user role.")

    user = await crud_user.update(db, db_obj=current_user, obj_in=user_in)
    logger.info(f"User updated their profile: {user.email}")
    return user

@router.get("/{user_id}", response_model=UserSchema, dependencies=[Depends(get_current_admin_user)])
async def read_user_by_id(
    user_id: int, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific user by ID (admin only).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User not found")
    return user

@router.put("/{user_id}", response_model=UserSchema, dependencies=[Depends(get_current_admin_user)])
async def update_user_by_id(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update a specific user by ID (admin only).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User not found")
    
    if user_in.email and user_in.email != user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists.",
            )

    updated_user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"Admin updated user: {updated_user.email} (ID: {updated_user.id})")
    return updated_user

@router.delete("/{user_id}", response_model=UserSchema, dependencies=[Depends(get_current_admin_user)])
async def delete_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Delete a specific user by ID (admin only).
    """
    user = await crud_user.remove(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User not found")
    logger.info(f"Admin deleted user: {user.email} (ID: {user.id})")
    return user
```