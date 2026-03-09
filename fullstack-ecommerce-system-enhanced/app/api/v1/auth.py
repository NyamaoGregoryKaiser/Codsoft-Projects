```python
import logging
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserPublic
from app.schemas.token import Token
from app.crud.crud_user import get_user_by_email, create_user
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.utils.dependencies import get_current_user_optional, get_current_user

logger = logging.getLogger("ecommerce_system")

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Registers a new user in the system.
    """
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        logger.warning(f"Registration attempt for existing email: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = await create_user(db, user_in)
    logger.info(f"User registered successfully: {user.email}")
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)
):
    """
    Authenticates a user and returns JWT access and refresh tokens.
    """
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        logger.warning(f"Login attempt for inactive user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.email, "user_id": user.id, "is_admin": user.is_admin},
        expires_delta=refresh_token_expires
    )
    
    logger.info(f"User logged in successfully: {user.email}")
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    current_user: Annotated[UserPublic, Depends(get_current_user)] # Uses get_current_user to validate the refresh token
):
    """
    Refreshes an access token using a valid refresh token.
    The `get_current_user` dependency will validate the token passed in the Authorization header.
    If it's a valid refresh token, it will return the user, allowing us to generate new tokens.
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_access_token = create_access_token(
        data={"sub": current_user.email, "user_id": current_user.id, "is_admin": current_user.is_admin},
        expires_delta=access_token_expires
    )
    new_refresh_token = create_refresh_token(
        data={"sub": current_user.email, "user_id": current_user.id, "is_admin": current_user.is_admin},
        expires_delta=refresh_token_expires
    )

    logger.info(f"Access token refreshed for user: {current_user.email}")
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}


@router.get("/me", response_model=UserPublic)
async def read_users_me(
    current_user: Annotated[UserPublic, Depends(get_current_user)]
):
    """
    Retrieves the current authenticated user's information.
    """
    logger.debug(f"Fetching profile for user: {current_user.email}")
    return current_user

```