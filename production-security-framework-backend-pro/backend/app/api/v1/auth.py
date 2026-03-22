```python
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.db import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.config import settings
from app.crud.user import crud_user
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.token import Token, TokenData
from app.schemas.msg import Msg
from app.dependencies.auth import get_current_user, block_token

router = APIRouter()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"User registered: {user.email}")
    return user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 login endpoint to get an access token and a refresh token.
    """
    user = await crud_user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    access_token_data = {"user_id": user.id, "email": user.email, "role": user.role}
    refresh_token_data = {"user_id": user.id, "email": user.email, "role": user.role}

    access_token = create_access_token(access_token_data, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(refresh_token_data, expires_delta=refresh_token_expires)
    
    logger.info(f"User logged in: {user.email}")
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_token: str, db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.
    """
    try:
        token_data: TokenData = verify_token(refresh_token, token_type="refresh")
    except HTTPException as e:
        logger.warning(f"Refresh token verification failed: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await crud_user.get(db, id=token_data.user_id)
    if not user or not user.is_active:
        logger.warning(f"User not found or inactive for refresh token: {token_data.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_data = {"user_id": user.id, "email": user.email, "role": user.role}
    new_access_token = create_access_token(access_token_data, expires_delta=access_token_expires)
    
    logger.info(f"Access token refreshed for user: {user.email}")
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout", response_model=Msg)
async def logout(
    current_user: UserSchema = Depends(get_current_user),
    token: str = Depends(oauth2_scheme)
):
    """
    Log out the current user by revoking the access token.
    Note: For simplicity, this blocks the *current* access token.
    A more robust system would also handle refresh token revocation.
    """
    token_data: TokenData = verify_token(token, token_type="access")
    await block_token(token, expires_at=token_data.exp)
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}
```