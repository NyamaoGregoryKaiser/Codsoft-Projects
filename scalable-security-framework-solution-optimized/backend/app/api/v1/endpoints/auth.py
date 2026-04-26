```python
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.v1.endpoints import deps

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.crud.user import crud_user
from app.schemas.token import Token, TokenPayload
from app.schemas.user import UserCreate, UserInDB
from app.schemas.msg import Msg
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ConflictException
from app.core.logging import logger

router = APIRouter()

@router.post("/register", response_model=UserInDB, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    user_in: UserCreate, db: Annotated[Session, Depends(deps.get_db)]
):
    """
    Register a new user.
    - **email**: Unique email address.
    - **password**: Secure password (min 8 chars).
    - **full_name**: Optional full name.
    - **role**: Optional role ('user' or 'admin'). Defaults to 'user'.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        logger.warning("Attempted registration with existing email", email=user_in.email)
        raise ConflictException(detail="Email already registered")
    
    # Ensure regular users cannot register as admin directly
    if user_in.role == "admin":
        user_in.role = "user"
        logger.warning("Attempted to register as admin role, changed to user", email=user_in.email)

    user = crud_user.create(db, obj_in=user_in)
    logger.info("New user registered", user_id=user.id, email=user.email, role=user.role)
    return user

@router.post("/login", response_model=Token, summary="Authenticate user and get JWT tokens")
async def login_for_access_token(
    db: Annotated[Session, Depends(deps.get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """
    Authenticate user with username (email) and password to get JWT access and refresh tokens.
    """
    user = crud_user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt", email=form_data.username)
        raise UnauthorizedException(detail="Incorrect username or password")
    
    if not user.is_active:
        logger.warning("Attempted login with inactive user", user_id=user.id, email=user.email)
        raise UnauthorizedException(detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "access"}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "type": "refresh"}
    )

    logger.info("User logged in successfully", user_id=user.id, email=user.email)

    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        expires_in=int(access_token_expires.total_seconds())
    )

@router.post("/refresh", response_model=Token, summary="Refresh access token using a refresh token")
async def refresh_access_token(
    db: Annotated[Session, Depends(deps.get_db)],
    refresh_token_str: Annotated[str, Depends(deps.oauth2_scheme)] # Expect refresh token in Authorization header
):
    """
    Use a refresh token to obtain a new access token.
    The refresh token itself should be sent in the Authorization: Bearer header.
    """
    payload = decode_token(refresh_token_str)
    if not payload:
        logger.warning("Invalid refresh token provided", token_prefix=refresh_token_str[:10])
        raise UnauthorizedException(detail="Invalid refresh token")
    
    token_payload = TokenPayload(**payload)
    if token_payload.type != "refresh":
        logger.warning("Provided token is not a refresh token", user_id=token_payload.sub)
        raise UnauthorizedException(detail="Invalid token type, expected refresh token")

    user = crud_user.get_by_id(db, id=token_payload.sub)
    if not user or not user.is_active:
        logger.warning("User not found or inactive for refresh token", user_id=token_payload.sub)
        raise UnauthorizedException(detail="User not found or inactive")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": str(user.id), "type": "access"}, expires_delta=access_token_expires
    )
    
    logger.info("Access token refreshed", user_id=user.id)

    # Note: For full security, refresh tokens should ideally be single-use and invalidated after use.
    # This example keeps the refresh token alive until its expiry.
    # A more advanced implementation would use a database or Redis to blacklist used refresh tokens.
    
    return Token(
        access_token=new_access_token,
        token_type="bearer",
        refresh_token=refresh_token_str, # Return the same refresh token, or generate a new one
        expires_in=int(access_token_expires.total_seconds())
    )

@router.post("/logout", response_model=Msg, summary="Log out the current user")
async def logout(
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
    db: Annotated[Session, Depends(deps.get_db)] # db is not strictly needed here for stateless JWT
):
    """
    Log out the current user.
    For stateless JWTs, "logout" primarily means the client discarding the token.
    To enforce server-side logout, access tokens would need to be blacklisted.
    For simplicity, this endpoint only confirms the user is authenticated.
    """
    logger.info("User logged out (client-side token discard)", user_id=current_user.id)
    return Msg(message="Successfully logged out (client should discard tokens)")
```