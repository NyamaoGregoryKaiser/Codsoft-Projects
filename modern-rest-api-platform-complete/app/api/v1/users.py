from typing import Any, List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_admin_user
from app.crud.user import user as crud_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.exceptions import NotFoundException, ConflictException
from app.core.cache import cached

router = APIRouter()

@router.get("/", response_model=List[User], summary="Retrieve all users (Admin only)")
@cached(key_prefix="users_all", ttl=60) # Cache for 60 seconds
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_admin_user), # Admin only
) -> Any:
    """
    Retrieve all users. Requires admin privileges.
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router..post("/", response_model=User, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_admin_user), # Admin only
) -> Any:
    """
    Create a new user without requiring current user context. Requires admin privileges.
    """
    existing_user = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise ConflictException(detail="The user with this email already exists.")
    
    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.get("/{user_id}", response_model=User, summary="Retrieve user by ID (Admin only)")
@cached(key_prefix="user_by_id", ttl=300) # Cache individual user for 5 minutes
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user), # Admin only
) -> Any:
    """
    Get a specific user by ID. Requires admin privileges.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    return user

@router.put("/{user_id}", response_model=User, summary="Update user by ID (Admin only)")
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_admin_user), # Admin only
) -> Any:
    """
    Update a user's information. Requires admin privileges.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    
    if user_in.email and user_in.email != user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise ConflictException(detail="Email already registered")

    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user by ID (Admin only)")
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_admin_user), # Admin only
) -> Any:
    """
    Delete a user. Requires admin privileges.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    await crud_user.remove(db, id=user_id)
    return {"message": "User deleted successfully"}

```