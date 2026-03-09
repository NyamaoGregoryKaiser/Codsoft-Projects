from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.crud.user import user as crud_user
from app.models.user import User as DBUser
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(deps.get_current_active_superuser), # Only superusers can list all users
) -> List[User]:
    """
    Retrieve users.
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: DBUser = Depends(deps.get_current_active_superuser), # Only superusers can create users directly
) -> User:
    """
    Create new user.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_active_superuser),
) -> User:
    """
    Get a specific user by ID.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_active_superuser),
) -> User:
    """
    Update a user.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    
    # Check if updating email to an already existing one
    if user_in.email and user_in.email != user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The user with this email already exists in the system.",
            )

    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_active_superuser),
):
    """
    Delete a user.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found")
    if user.id == current_user.id:
        raise ForbiddenException(detail="Cannot delete yourself.")

    await crud_user.remove(db, id=user_id)
    return {"message": "User deleted successfully"}

```
---