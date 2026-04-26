```python
from typing import Annotated, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints import deps
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.schemas.msg import Msg
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.core.logging import logger

router = APIRouter()

@router.get("/", response_model=List[UserInDB], summary="Retrieve all users (Admin only)")
async def read_users(
    db: Annotated[Session, Depends(deps.get_db)],
    current_admin: Annotated[UserInDB, Depends(deps.get_current_admin)], # Admin role required
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve multiple users. Requires Admin role.
    """
    logger.info("Admin accessing all users list", admin_id=current_admin.id)
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(deps.get_db)],
    current_admin: Annotated[UserInDB, Depends(deps.get_current_admin)], # Admin role required
):
    """
    Create a new user. This endpoint allows an admin to create users, including other admins.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        logger.warning("Admin attempted to create user with existing email",
                       admin_id=current_admin.id, target_email=user_in.email)
        raise ConflictException(detail="Email already registered")
    
    user = crud_user.create(db, obj_in=user_in)
    logger.info("Admin created new user", admin_id=current_admin.id, target_user_id=user.id, target_email=user.email, target_role=user.role)
    return user

@router.get("/me", response_model=UserInDB, summary="Retrieve current user's details")
async def read_user_me(
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
):
    """
    Get current active user's details.
    """
    logger.info("Current user accessed 'me' endpoint", user_id=current_user.id)
    return current_user

@router.put("/me", response_model=UserInDB, summary="Update current user's details")
async def update_user_me(
    user_in: UserUpdate,
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
    db: Annotated[Session, Depends(deps.get_db)],
):
    """
    Update current active user's details. Users can only update their own profile.
    They cannot change their role or active status via this endpoint.
    """
    update_data = user_in.dict(exclude_unset=True)
    # Prevent users from changing their role or active status via this endpoint
    if "role" in update_data:
        del update_data["role"]
        logger.warning("User attempted to change role via /me endpoint", user_id=current_user.id)
    if "is_active" in update_data:
        del update_data["is_active"]
        logger.warning("User attempted to change active status via /me endpoint", user_id=current_user.id)
        
    user = crud_user.update(db, db_obj=current_user, obj_in=update_data)
    logger.info("Current user updated their profile", user_id=current_user.id)
    return user

@router.get("/{user_id}", response_model=UserInDB, summary="Retrieve user by ID (Admin only)")
async def read_user_by_id(
    user_id: int,
    db: Annotated[Session, Depends(deps.get_db)],
    current_admin: Annotated[UserInDB, Depends(deps.get_current_admin)], # Admin role required
):
    """
    Retrieve a specific user by ID. Requires Admin role.
    """
    user = crud_user.get_by_id(db, id=user_id)
    if not user:
        logger.warning("Admin attempted to access non-existent user",
                       admin_id=current_admin.id, target_user_id=user_id)
        raise NotFoundException(detail="User not found")
    logger.info("Admin accessed user by ID", admin_id=current_admin.id, target_user_id=user_id)
    return user

@router.put("/{user_id}", response_model=UserInDB, summary="Update user by ID (Admin only)")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Annotated[Session, Depends(deps.get_db)],
    current_admin: Annotated[UserInDB, Depends(deps.get_current_admin)], # Admin role required
):
    """
    Update a user's details by ID. Requires Admin role.
    Admins can change any user property, including role and active status.
    """
    user = crud_user.get_by_id(db, id=user_id)
    if not user:
        logger.warning("Admin attempted to update non-existent user",
                       admin_id=current_admin.id, target_user_id=user_id)
        raise NotFoundException(detail="User not found")
    
    # An admin should not be able to deactivate or change the role of another admin, or themselves.
    if current_admin.id == user_id and (user_in.role == "user" or user_in.is_active is False):
        logger.warning("Admin attempted to modify their own critical properties (role/active status)",
                       admin_id=current_admin.id, user_id=user_id, proposed_role=user_in.role, proposed_active=user_in.is_active)
        raise ForbiddenException("Admins cannot modify their own role or active status via this endpoint.")
    
    if user.role == "admin" and current_admin.id != user_id and (user_in.role == "user" or user_in.is_active is False):
        logger.warning("Admin attempted to modify another admin's critical properties (role/active status)",
                       admin_id=current_admin.id, target_user_id=user_id, proposed_role=user_in.role, proposed_active=user_in.is_active)
        raise ForbiddenException("Admins cannot modify another admin's role or active status.")

    updated_user = crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info("Admin updated user by ID", admin_id=current_admin.id, target_user_id=user_id,
                updated_fields=user_in.dict(exclude_unset=True))
    return updated_user

@router.delete("/{user_id}", response_model=Msg, summary="Delete user by ID (Admin only)")
async def delete_user(
    user_id: int,
    db: Annotated[Session, Depends(deps.get_db)],
    current_admin: Annotated[UserInDB, Depends(deps.get_current_admin)], # Admin role required
):
    """
    Delete a user by ID. Requires Admin role.
    An admin cannot delete themselves.
    """
    user = crud_user.get_by_id(db, id=user_id)
    if not user:
        logger.warning("Admin attempted to delete non-existent user",
                       admin_id=current_admin.id, target_user_id=user_id)
        raise NotFoundException(detail="User not found")

    if user.id == current_admin.id:
        logger.warning("Admin attempted to delete themselves", admin_id=current_admin.id)
        raise ForbiddenException("You cannot delete your own account.")
    
    if user.role == "admin":
         logger.warning("Admin attempted to delete another admin", admin_id=current_admin.id, target_user_id=user_id)
         raise ForbiddenException("You cannot delete another admin account.")

    crud_user.remove(db, id=user_id)
    logger.info("Admin deleted user by ID", admin_id=current_admin.id, target_user_id=user_id)
    return Msg(message="User deleted successfully")
```