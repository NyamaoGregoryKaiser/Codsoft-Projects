from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.crud.user import user as crud_user
from app.schemas.token import Token
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.exceptions import CredentialException, ConflictException, ForbiddenException

router = APIRouter()

@router.post("/login", response_model=Token, summary="Authenticate user and get JWT token")
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise CredentialException(detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )

@router.post("/register", response_model=User, summary="Register a new user")
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user. Default role is a regular user.
    """
    existing_user = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise ConflictException(detail="The user with this email already exists.")
    
    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=User, summary="Get current authenticated user's details")
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve details of the current authenticated user.
    """
    return current_user

@router.put("/me", response_model=User, summary="Update current authenticated user's details")
async def update_current_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update details of the current authenticated user.
    """
    if user_in.email and user_in.email != current_user.email:
        existing_user = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise ConflictException(detail="Email already registered")

    user = await crud_user.update(db, db_obj=current_user, obj_in=user_in)
    return user

```