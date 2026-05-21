from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.auth.security import create_access_token, get_current_user
from app.crud.user import user as crud_user
from app.core.config import settings
from app.core.exceptions import CustomHTTPException
from app.schemas.user import Token, User, UserCreate, UserInDB
from app.schemas.msg import Msg

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token, summary="Authenticate and get JWT token")
async def login_access_token(
    db: Annotated[AsyncSession, Depends(get_db)], form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
            error_code="LOGIN_INVALID_CREDENTIALS"
        )
    if not user.is_active:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
            error_code="INACTIVE_USER"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            data={"id": user.id}, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_in: UserCreate
) -> User:
    """
    Register a new user.
    """
    existing_user_by_email = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user_by_email:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
            error_code="EMAIL_ALREADY_EXISTS"
        )
    existing_user_by_username = await crud_user.get_by_username(db, username=user_in.username)
    if existing_user_by_username:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
            error_code="USERNAME_ALREADY_EXISTS"
        )

    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=User, summary="Get current user details")
async def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Get current active user.
    """
    return current_user

@router.post("/test-token", response_model=User, summary="Test if token is valid")
async def test_token(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Test access token.
    """
    return current_user