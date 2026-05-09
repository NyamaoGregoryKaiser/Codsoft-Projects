```python
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_db
from app.core.dependencies import get_current_active_user, get_current_active_superuser
from app.crud.user import crud_user
from app.schemas.user import UserPublic, UserUpdate
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.get("/", response_model=List[UserPublic])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Retrieve users. Accessible only by superusers.
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    logger.info(f"Superuser {current_user.email} accessed all users list.")
    return users


@router.get("/me", response_model=UserPublic)
def read_user_me(
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Get current user.
    """
    logger.info(f"User {current_user.email} accessed their own profile.")
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Get a specific user by ID. Accessible only by superusers.
    """
    user = crud_user.get(db, id=user_id)
    if not user:
        logger.warning(f"User with ID {user_id} not found by superuser {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    logger.info(f"Superuser {current_user.email} accessed user with ID {user_id}.")
    return user


@router.put("/{user_id}", response_model=UserPublic)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Update a user. Accessible only by superusers.
    """
    user = crud_user.get(db, id=user_id)
    if not user:
        logger.warning(f"Attempted to update non-existent user with ID {user_id} by superuser {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this username does not exist in the system",
        )
    user = crud_user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"Superuser {current_user.email} updated user with ID {user_id}.")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Delete a user. Accessible only by superusers.
    """
    user = crud_user.get(db, id=user_id)
    if not user:
        logger.warning(f"Attempted to delete non-existent user with ID {user_id} by superuser {current_user.email}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    crud_user.remove(db, id=user_id)
    logger.info(f"Superuser {current_user.email} deleted user with ID {user_id}.")
    return {"message": "User deleted successfully"}

```