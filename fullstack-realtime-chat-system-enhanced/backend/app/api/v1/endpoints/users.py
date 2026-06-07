```python
import logging
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_active_admin, get_current_active_user
from app.core.database import get_db_session
from app.crud.user import user as crud_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.auth_service import auth_service # For password hashing if updating password

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[User], summary="Retrieve multiple users (Admin only)")
async def read_users(
    db: AsyncSession = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_admin), # Admin access required
) -> Any:
    """
    Retrieve users with pagination. Requires admin privileges.

    Args:
        db (AsyncSession): The asynchronous database session.
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.
        current_user (User): The authenticated admin user.

    Returns:
        List[User]: A list of user objects.
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    logger.info(f"Admin user {current_user.id} retrieved {len(users)} users.")
    return users


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED, summary="Create new user (Admin only)")
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_admin), # Admin access required
) -> Any:
    """
    Create a new user. Requires admin privileges.

    Args:
        user_in (UserCreate): The Pydantic schema for new user data.
        db (AsyncSession): The asynchronous database session.
        current_user (User): The authenticated admin user.

    Returns:
        User: The created user object.

    Raises:
        HTTPException: If email or username already exists.
    """
    existing_user_by_email = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    existing_user_by_username = await crud_user.get_by_username(db, username=user_in.username)
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    
    hashed_password = auth_service.get_password_hash(user_in.password)
    user = await crud_user.create_with_hashed_password(db, obj_in=user_in, hashed_password=hashed_password)
    logger.info(f"Admin user {current_user.id} created new user {user.username} (ID: {user.id}).")
    return user


@router.get("/{user_id}", response_model=User, summary="Retrieve a user by ID (Admin or Self)")
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user), # Any active user
) -> Any:
    """
    Retrieve a specific user by their ID.
    Allows admin to view any user, and a user to view their own profile.

    Args:
        user_id (int): The ID of the user to retrieve.
        db (AsyncSession): The asynchronous database session.
        current_user (User): The authenticated user.

    Returns:
        User: The user object.

    Raises:
        HTTPException: If user not found or not authorized.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Authorization check: only admin or the user themselves can view this profile
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's profile"
        )
    
    logger.debug(f"User {current_user.id} retrieved user {user_id} details.")
    return user


@router.put("/{user_id}", response_model=User, summary="Update a user by ID (Admin or Self)")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user), # Any active user
) -> Any:
    """
    Update a specific user's information.
    Allows admin to update any user, and a user to update their own profile.

    Args:
        user_id (int): The ID of the user to update.
        user_in (UserUpdate): The Pydantic schema with update data.
        db (AsyncSession): The asynchronous database session.
        current_user (User): The authenticated user.

    Returns:
        User: The updated user object.

    Raises:
        HTTPException: If user not found or not authorized.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Authorization check: only admin or the user themselves can update this profile
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's profile"
        )
    
    # Admin can change is_active/is_admin for others, but users can't change their own
    if not current_user.is_admin and (user_in.is_active is not None or user_in.is_admin is not None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to change active or admin status"
        )

    # Handle password update separately if provided
    if user_in.password:
        hashed_password = auth_service.get_password_hash(user_in.password)
        user_in.password = hashed_password # Replace plain password with hashed one in obj_in
        await crud_user.update_password(db, user=user, hashed_password=hashed_password)
        # Clear password from user_in to avoid attempting to set it again in generic update
        user_in.password = None

    updated_user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"User {current_user.id} updated user {user_id} details.")
    return updated_user


@router.delete("/{user_id}", response_model=User, summary="Delete a user by ID (Admin only)")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_admin), # Admin access required
) -> Any:
    """
    Delete a user by their ID. Requires admin privileges.

    Args:
        user_id (int): The ID of the user to delete.
        db (AsyncSession): The asynchronous database session.
        current_user (User): The authenticated admin user.

    Returns:
        User: The deleted user object.

    Raises:
        HTTPException: If user not found.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account via this endpoint.")

    deleted_user = await crud_user.remove(db, id=user_id)
    logger.warning(f"Admin user {current_user.id} deleted user {user_id} ({deleted_user.username}).")
    return deleted_user

```