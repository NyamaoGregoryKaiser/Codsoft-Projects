```python
import logging
from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserPublic, UserCreate, UserUpdate
from app.crud.crud_user import get_user, get_users, create_user, update_user, delete_user, get_user_by_email
from app.utils.dependencies import get_current_admin_user, get_current_user

logger = logging.getLogger("ecommerce_system")

router = APIRouter()

@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[UserPublic, Depends(get_current_admin_user)] = None # Only admin can create new users directly via this endpoint
):
    """
    Admin: Creates a new user.
    """
    if current_admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create users."
        )

    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        logger.warning(f"Admin tried to create user with existing email: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists."
        )
    user = await create_user(db, user_in)
    logger.info(f"Admin {current_admin.email} created new user: {user.email}")
    return user

@router.get("/", response_model=List[UserPublic])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[UserPublic, Depends(get_current_admin_user)] = None
):
    """
    Admin: Retrieve a list of all users.
    """
    if current_admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list users."
        )
    users = await get_users(db, skip=skip, limit=limit)
    logger.debug(f"Admin {current_admin.email} retrieved {len(users)} users.")
    return users

@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[UserPublic, Depends(get_current_user)] = None
):
    """
    Admin: Retrieve a specific user by ID.
    User: Retrieve their own profile by ID.
    """
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Allow user to see their own profile, or admin to see any profile
    if current_user.id == user.id or current_user.is_admin:
        logger.debug(f"User {current_user.email} fetched profile for user ID: {user_id}")
        return user
    else:
        logger.warning(f"User {current_user.email} attempted to access unauthorized user profile: {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user's profile")

@router.put("/{user_id}", response_model=UserPublic)
async def update_existing_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[UserPublic, Depends(get_current_user)] = None
):
    """
    Admin: Updates any user's details.
    User: Updates their own details.
    """
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check authorization
    if not (current_user.id == user.id or current_user.is_admin):
        logger.warning(f"User {current_user.email} attempted to update unauthorized user profile: {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this user's profile")

    # Admins can update 'is_admin' status, regular users cannot.
    if not current_user.is_admin and user_in.is_admin is not None and user_in.is_admin != user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Regular users cannot change admin status."
        )
    
    updated_user = await update_user(db, user, user_in)
    logger.info(f"User {current_user.email} updated user ID {user_id}.")
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[UserPublic, Depends(get_current_admin_user)] = None
):
    """
    Admin: Deletes a user.
    """
    if current_admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete users."
        )

    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent admin from deleting themselves (or enforce policy)
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot delete their own account via this endpoint."
        )

    await delete_user(db, user_id)
    logger.info(f"Admin {current_admin.email} deleted user ID {user_id}.")
    return None # FastAPI automatically converts None to 204 No Content

```