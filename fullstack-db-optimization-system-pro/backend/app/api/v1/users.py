from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import User, UserCreate, UserUpdate
from app.db.session import get_async_session
from app.services.user_service import user_service
from app.api.v1.dependencies import get_current_active_user, get_current_admin_user, DBSession, CurrentUser, AdminUser
from loguru import logger

router = APIRouter()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_new_user(
    user_in: UserCreate,
    db: DBSession,
    current_user: AdminUser # Requires admin privileges
) -> Any:
    """
    Create a new user with provided details.
    Only accessible by administrators.
    """
    return await user_service.create_user(db, user_in, current_user)

@router.get("/", response_model=List[User], summary="Retrieve all users (Admin only)")
async def read_users(
    db: DBSession,
    current_user: AdminUser, # Requires admin privileges
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve all users.
    Only accessible by administrators.
    """
    return await user_service.get_all_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=User, summary="Retrieve a user by ID (Admin or Self)")
async def read_user_by_id(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser # Any active user can access their own or admin can access any
) -> Any:
    """
    Retrieve a specific user by ID.
    Accessible by administrators for any user, or by the user themselves for their own profile.
    """
    # Authorization logic inside service to check if current_user can view user_id
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this user's profile."
        )
    return await user_service.get_user(db, user_id)

@router.put("/{user_id}", response_model=User, summary="Update a user by ID (Admin or Self)")
async def update_existing_user(
    user_id: int,
    user_in: UserUpdate,
    db: DBSession,
    current_user: CurrentUser # Any active user can update their own or admin can update any
) -> Any:
    """
    Update details of an existing user.
    Accessible by administrators for any user, or by the user themselves for their own profile.
    Users cannot change their own admin status or role.
    """
    return await user_service.update_user(db, user_id, user_in, current_user)

@router.delete("/{user_id}", response_model=User, summary="Delete a user by ID (Admin only)")
async def delete_existing_user(
    user_id: int,
    db: DBSession,
    current_user: AdminUser # Requires admin privileges
) -> Any:
    """
    Delete a user.
    Only accessible by administrators.
    Admins cannot delete their own account.
    """
    return await user_service.delete_user(db, user_id, current_user)