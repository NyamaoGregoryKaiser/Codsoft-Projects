from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.crud.user import user as crud_user
from app.core.exceptions import EntityNotFoundException, DuplicateEntryException
from app.services.cache import cache, invalidate_cache

router = APIRouter()

@router.get("/", response_model=List[User])
@cache(expire=30) # Cache user list for 30 seconds
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser),
) -> Any:
    """
    Retrieve users. (Admin/Superuser only)
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser),
) -> Any:
    """
    Create new user. (Admin/Superuser only)
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise DuplicateEntryException(f"User with this email '{user_in.email}' already exists.")
    user = await crud_user.create(db, obj_in=user_in)
    await invalidate_cache("read_users") # Invalidate cache for user list
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser),
) -> Any:
    """
    Update a user. (Admin/Superuser only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User", user_id)
    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    await invalidate_cache("read_users") # Invalidate cache for user list
    # If the current_user's own data is updated, it might be good to invalidate their session/token
    # Or, in this simple case, just let it update.
    return user

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser),
) -> Any:
    """
    Get a specific user by ID. (Admin/Superuser only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User", user_id)
    return user

@router.delete("/{user_id}", response_model=User)
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_superuser), # Only superuser can delete
) -> Any:
    """
    Delete a user. (Superuser only)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise EntityNotFoundException("User", user_id)
    if user.id == current_user.id:
        raise ForbiddenException("Cannot delete your own account.")
    await crud_user.remove(db, id=user_id)
    await invalidate_cache("read_users") # Invalidate cache for user list
    return user