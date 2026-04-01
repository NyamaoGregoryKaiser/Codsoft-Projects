```python
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.auth.auth_bearer import get_current_active_superuser
from backend.app.crud.crud_user import user as crud_user
from backend.app.db.session import get_db
from backend.app.schemas.user import User, UserCreate, UserUpdate
from backend.app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from backend.app.core.logging_config import logger

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Retrieve users. (Admin only)
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new user. (Admin only)
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise BadRequestException(detail="The user with this email already exists in the system.")
    user_by_username = await crud_user.get_by_username(db, username=user_in.username)
    if user_by_username:
        raise BadRequestException(detail="The user with this username already exists in the system.")

    new_user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"Admin {current_user.email} created user {new_user.email}.")
    return new_user

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Get a specific user by ID. (Admin only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="The user with this ID does not exist in the system.")
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update a user. (Admin only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="The user with this ID does not exist in the system.")
    if user_in.email and user_in.email != user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise BadRequestException(detail="The user with this email already exists in the system.")
    if user_in.username and user_in.username != user.username:
        existing_username_user = await crud_user.get_by_username(db, username=user_in.username)
        if existing_username_user and existing_username_user.id != user_id:
            raise BadRequestException(detail="The user with this username already exists in the system.")

    updated_user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"Admin {current_user.email} updated user {updated_user.email}.")
    return updated_user

@router.delete("/{user_id}", response_model=User)
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete a user. (Admin only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="The user with this ID does not exist in the system.")
    if user.id == current_user.id:
        raise BadRequestException(detail="You cannot delete yourself.")

    deleted_user = await crud_user.remove(db, id=user_id)
    logger.info(f"Admin {current_user.email} deleted user {user.email}.")
    return deleted_user
```