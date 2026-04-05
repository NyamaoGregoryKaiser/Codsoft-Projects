from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.user import user as crud_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_current_user_payload
from app.schemas.token import TokenData
from app.models.user import UserRole
from app.middleware.error_handler import CustomBusinessException
from fastapi_limiter.depends import RateLimiter
from loguru import logger

router = APIRouter(prefix="/users", tags=["Users"])

# Dependency to check for admin role
async def verify_admin_role(current_user: TokenData = Depends(get_current_user_payload)):
    if current_user.role != UserRole.ADMIN:
        logger.warning(f"Unauthorized access attempt by user {current_user.id} (role: {current_user.role}) to admin resource.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Admin privilege required."
        )
    return current_user

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(verify_admin_role)],
             description="Create a new user (Admin only)")
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user with admin privileges.
    """
    db_user = await crud_user.get_by_email(db, email=user_in.email)
    if db_user:
        raise CustomBusinessException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    new_user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"Admin created new user: {new_user.email}")
    return new_user

@router.get("/", response_model=List[User], 
            dependencies=[Depends(verify_admin_role)],
            description="Retrieve a list of all users (Admin only)")
@RateLimiter(times=5, seconds=60) # Limit to 5 requests per minute
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve multiple users.
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.get("/me", response_model=User, 
             description="Retrieve current authenticated user's profile")
async def read_users_me(
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the current authenticated user.
    """
    user_id = current_user_payload.id
    db_user = await crud_user.get(db, id=user_id)
    if not db_user:
        logger.error(f"User {user_id} not found, despite valid token.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.get("/{user_id}", response_model=User, 
             dependencies=[Depends(verify_admin_role)],
             description="Retrieve a user by ID (Admin only)")
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a user by ID.
    """
    db_user = await crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.put("/{user_id}", response_model=User, 
            dependencies=[Depends(verify_admin_role)],
            description="Update a user by ID (Admin only)")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user.
    """
    db_user = await crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    updated_user = await crud_user.update(db, db_obj=db_user, obj_in=user_in)
    logger.info(f"Admin updated user: {updated_user.email}")
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, 
               dependencies=[Depends(verify_admin_role)],
               description="Delete a user by ID (Admin only)")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user.
    """
    db_user = await crud_user.delete(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    logger.info(f"Admin deleted user: {db_user.email}")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

```