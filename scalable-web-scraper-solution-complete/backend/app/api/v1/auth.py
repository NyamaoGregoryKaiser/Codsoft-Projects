from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.crud.user import user as crud_user
from app.schemas.token import Token
from app.schemas.user import UserCreate, User
from app.core.config import settings
from app.middleware.error_handler import CustomBusinessException
from loguru import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = await crud_user.get_by_email(db, email=user_in.email)
    if db_user:
        raise CustomBusinessException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"User registered: {new_user.email}")
    return new_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login to get an access token.
    """
    db_user = await crud_user.get_by_email(db, email=form_data.username)
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "id": db_user.id, "role": db_user.role},
        expires_delta=access_token_expires
    )
    
    # Refresh token generation (optional, if implementing refresh token flow)
    # refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    # refresh_token = create_refresh_token(
    #     data={"sub": db_user.email, "id": db_user.id, "role": db_user.role},
    #     expires_delta=refresh_token_expires
    # )
    
    logger.info(f"User logged in: {db_user.email}")
    return Token(access_token=access_token, token_type="bearer", expires_in=access_token_expires.total_seconds())

```