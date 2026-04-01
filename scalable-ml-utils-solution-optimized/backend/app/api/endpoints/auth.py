```python
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.auth.security import verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.core.exceptions import UnauthorizedException
from backend.app.crud.crud_user import user as crud_user
from backend.app.db.session import get_db
from backend.app.schemas.token import Token
from backend.app.schemas.user import UserCreate, User
from backend.app.auth.auth_bearer import get_current_user
from backend.app.core.logging_config import logger

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await crud_user.get_by_email(db, email=form_data.username) # Using username as email
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise UnauthorizedException(detail="Incorrect email or password")
    if not user.is_active:
        raise UnauthorizedException(detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"user_id": user.id}, expires_delta=access_token_expires
    )
    logger.info(f"User {user.email} logged in.")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user_by_username = await crud_user.get_by_username(db, username=user_in.username)
    if user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )

    user_in.is_superuser = False # Ensure regular users cannot register as superusers
    new_user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"New user {new_user.email} registered.")
    return new_user

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user.
    """
    return current_user
```