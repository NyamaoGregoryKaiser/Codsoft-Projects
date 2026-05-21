from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.common import CommonPagination, CurrentUser, DBSession
from app.crud.user import user as crud_user
from app.auth.security import get_current_active_superuser
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException
from app.services.cache import CacheService, get_cache_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[User], summary="Retrieve multiple users")
async def read_users(
    db: DBSession,
    pagination: CommonPagination,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> List[User]:
    """
    Retrieve users.
    Only superusers can see all users. Regular users can only see their own profile,
    which is handled by the `/me` endpoint.
    """
    if not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to view all users.")

    cache_key = f"users_all_skip_{pagination['skip']}_limit_{pagination['limit']}"
    cached_users = await cache_service.get(cache_key)
    if cached_users:
        return [User.model_validate(u) for u in cached_users]

    users = await crud_user.get_multi(db, skip=pagination["skip"], limit=pagination["limit"])

    await cache_service.set(cache_key, [u.model_dump() for u in users])
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED, summary="Create a new user")
async def create_user(
    *,
    db: DBSession,
    user_in: UserCreate,
    current_user: Annotated[User, Depends(get_current_active_superuser)], # Only superuser can create other users (and superusers)
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> User:
    """
    Create new user. (Superuser only)
    """
    existing_user_by_email = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user_by_email:
        raise ConflictException(detail="The user with this email already exists in the system.", error_code="EMAIL_ALREADY_EXISTS")
    existing_user_by_username = await crud_user.get_by_username(db, username=user_in.username)
    if existing_user_by_username:
        raise ConflictException(detail="The user with this username already exists in the system.", error_code="USERNAME_ALREADY_EXISTS")

    user = await crud_user.create(db, obj_in=user_in)
    await cache_service.delete_prefix("users_") # Invalidate user cache
    return user

@router.get("/{user_id}", response_model=User, summary="Retrieve a user by ID")
async def read_user_by_id(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> User:
    """
    Get a specific user by ID.
    Only superusers can view any user. Regular users can only view their own profile.
    """
    if user_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to view this user's profile.", error_code="NOT_AUTHORIZED")

    cache_key = f"user_{user_id}"
    cached_user = await cache_service.get(cache_key)
    if cached_user:
        return User.model_validate(cached_user)

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")

    await cache_service.set(cache_key, user.model_dump())
    return user

@router.put("/{user_id}", response_model=User, summary="Update a user")
async def update_user(
    *,
    db: DBSession,
    user_id: int,
    user_in: UserUpdate,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> User:
    """
    Update a user.
    Superusers can update any user. Regular users can only update their own profile.
    """
    if user_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to update this user's profile.", error_code="NOT_AUTHORIZED")

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")

    # Check for email conflict if email is being updated and is different from current
    if user_in.email and user_in.email != user.email:
        existing_user_by_email = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user_by_email and existing_user_by_email.id != user_id:
            raise ConflictException(detail="This email is already registered to another user.", error_code="EMAIL_IN_USE")

    # Check for username conflict if username is being updated and is different from current
    if user_in.username and user_in.username != user.username:
        existing_user_by_username = await crud_user.get_by_username(db, username=user_in.username)
        if existing_user_by_username and existing_user_by_username.id != user_id:
            raise ConflictException(detail="This username is already taken by another user.", error_code="USERNAME_IN_USE")

    # Only superuser can change `is_superuser` status of other users
    if not current_user.is_superuser and user_in.is_superuser is not None and user_in.is_superuser != user.is_superuser:
        raise ForbiddenException(detail="Not authorized to change superuser status.", error_code="NOT_AUTHORIZED")

    updated_user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    await cache_service.delete(f"user_{user_id}") # Invalidate specific user cache
    await cache_service.delete_prefix("users_") # Invalidate list cache
    return updated_user

@router.delete("/{user_id}", response_model=User, summary="Delete a user")
async def delete_user(
    *,
    db: DBSession,
    user_id: int,
    current_user: Annotated[User, Depends(get_current_active_superuser)], # Only superuser can delete users
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> User:
    """
    Delete a user. (Superuser only)
    """
    if user_id == current_user.id:
        raise BadRequestException(detail="Cannot delete your own user account.", error_code="SELF_DELETE_FORBIDDEN")

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")

    deleted_user = await crud_user.remove(db, id=user_id)
    await cache_service.delete(f"user_{user_id}")
    await cache_service.delete_prefix("users_")
    return deleted_user