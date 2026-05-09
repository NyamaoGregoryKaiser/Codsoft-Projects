```python
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema, UserPublic
from app.core.dependencies import get_db, get_current_active_user, get_current_admin_user
from app.services.user_service import get_user_by_id_service, get_all_users_service, \
    create_user_service, update_user_service, delete_user_service
from app.core.exceptions import ForbiddenException, NotFoundException

router = APIRouter()


@router.get(
    "/me",
    response_model=UserSchema,
    summary="Get current user",
    description="Retrieve details of the currently authenticated user.",
)
async def read_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the details of the currently authenticated user.
    Requires an active access token.
    """
    return current_user


@router.put(
    "/me",
    response_model=UserSchema,
    summary="Update current user",
    description="Update details of the currently authenticated user.",
)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db)
):
    """
    Updates the details of the currently authenticated user.
    Users can update their own `first_name`, `last_name`, `email`, and `password`.
    Admin flags cannot be changed by users themselves.
    """
    # Prevent users from changing their admin status or active status directly
    user_update_dict = user_update.model_dump(exclude_unset=True)
    if "is_admin" in user_update_dict:
        logger.warning(f"User {current_user.id} attempted to change is_admin status.")
        user_update_dict.pop("is_admin")
    if "is_active" in user_update_dict:
        logger.warning(f"User {current_user.id} attempted to change is_active status.")
        user_update_dict.pop("is_active")

    # Reconstruct Pydantic model
    user_update_filtered = UserUpdate(**user_update_dict)

    updated_user = await update_user_service(db_session, current_user.id, user_update_filtered)
    return updated_user


@router.get(
    "/",
    response_model=List[UserPublic],
    summary="Get all users (Admin only)",
    description="Retrieve a list of all users. Requires administrator privileges.",
)
async def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db_session: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Returns a list of all registered users. This endpoint is restricted to administrators.
    - `skip`: Number of records to skip for pagination.
    - `limit`: Maximum number of records to return.
    """
    users = await get_all_users_service(db_session, skip=skip, limit=limit)
    return users


@router.post(
    "/",
    response_model=UserSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user (Admin only)",
    description="Create a new user by an administrator. Allows setting admin/active status.",
)
async def create_new_user(
    user_in: UserCreate,
    db_session: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Creates a new user. This endpoint is restricted to administrators.
    Allows creation of admin users or inactive users directly.
    """
    new_user = await create_user_service(db_session, user_in)
    return new_user


@router.get(
    "/{user_id}",
    response_model=UserPublic,
    summary="Get user by ID (Admin or self)",
    description="Retrieve a user's details by their ID. Accessible by admin or the user themselves.",
)
async def read_user_by_id(
    user_id: int,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves a user's details by their ID.
    - If `current_user` is an admin, they can access any user's profile.
    - If `current_user` is not an admin, they can only access their own profile.
    """
    if not current_user.is_admin and current_user.id != user_id:
        raise ForbiddenException(detail="Not authorized to access this user's profile.")
    
    user = await get_user_by_id_service(db_session, user_id)
    return user


@router.put(
    "/{user_id}",
    response_model=UserSchema,
    summary="Update user by ID (Admin only)",
    description="Update a user's details by their ID. Requires administrator privileges.",
)
async def update_user_by_id(
    user_id: int,
    user_update: UserUpdate,
    db_session: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Updates a user's details by ID. This endpoint is restricted to administrators.
    Administrators can modify any user's `email`, `first_name`, `last_name`, `password`, `is_active`, and `is_admin` status.
    """
    updated_user = await update_user_service(db_session, user_id, user_update)
    return updated_user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user by ID (Admin only)",
    description="Delete a user by their ID. Requires administrator privileges.",
)
async def delete_user_by_id(
    user_id: int,
    db_session: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Deletes a user by ID. This endpoint is restricted to administrators.
    """
    await delete_user_service(db_session, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

```