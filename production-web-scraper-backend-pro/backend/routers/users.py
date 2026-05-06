```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.core.dependencies import get_current_active_admin_user, get_current_user
from backend.services import crud, security
from backend.schemas.user import UserCreate, UserUpdate, UserInDB
from backend.schemas.common import PaginatedResponse
from backend.models.user import User
from backend.core.logger import logger

router = APIRouter()

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Create a new user. Only administrators can perform this action.
    """
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = security.get_password_hash(user_in.password)
    user = crud.user.create(db, user_in, hashed_password=hashed_password)
    logger.info(f"Admin {current_user.username} created user {user.username}.")
    return UserInDB.model_validate(user)

@router.get("/", response_model=PaginatedResponse[UserInDB], summary="Get all users (Admin only)")
async def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve all users with pagination. Only administrators can perform this action.
    """
    users, total = crud.user.get_multi_with_count(db, skip=skip, limit=limit)
    logger.info(f"Admin {current_user.username} retrieved {len(users)} users.")
    return PaginatedResponse(total=total, page=skip // limit + 1, page_size=limit, items=[UserInDB.model_validate(u) for u in users])

@router.get("/{user_id}", response_model=UserInDB, summary="Get user by ID (Admin only)")
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve a specific user by ID. Only administrators can perform this action.
    """
    user = crud.user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    logger.info(f"Admin {current_user.username} retrieved user {user_id}.")
    return UserInDB.model_validate(user)

@router.put("/{user_id}", response_model=UserInDB, summary="Update a user (Admin only)")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Update an existing user by ID. Only administrators can perform this action.
    The `password` field will be automatically hashed if provided.
    """
    user = crud.user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_in.password:
        user_in.password = security.get_password_hash(user_in.password)
    
    updated_user = crud.user.update(db, user, user_in)
    logger.info(f"Admin {current_user.username} updated user {user_id}.")
    return UserInDB.model_validate(updated_user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a user (Admin only)")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Delete a user by ID. Only administrators can perform this action.
    """
    user = crud.user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")

    crud.user.remove(db, user_id)
    logger.info(f"Admin {current_user.username} deleted user {user_id}.")
    return
```