```python
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_active_user
from app.core.database import get_db_session
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=Token, summary="Authenticate user and get access token")
async def login_access_token(
    db: AsyncSession = Depends(get_db_session), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.

    Args:
        db (AsyncSession): The asynchronous database session.
        form_data (OAuth2PasswordRequestForm): OAuth2 form data containing username and password.

    Returns:
        Token: An object containing the access token and token type.

    Raises:
        HTTPException: If authentication fails.
    """
    user = await auth_service.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect username or password")
    
    access_token = auth_service.create_token_for_user(user)
    logger.info(f"User {user.username} successfully logged in.")
    return Token(access_token=access_token)


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db_session)
) -> Any:
    """
    Register a new user.

    Args:
        user_in (UserCreate): The Pydantic schema for new user data.
        db (AsyncSession): The asynchronous database session.

    Returns:
        User: The created user object.

    Raises:
        HTTPException: If the username or email already exists.
    """
    try:
        user = await auth_service.register_user(db, user_in)
        return user
    except HTTPException as e:
        logger.warning(f"User registration failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )


@router.get("/me", response_model=User, summary="Get current authenticated user")
async def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve information about the current authenticated user.

    Args:
        current_user (User): The authenticated user object, provided by dependency.

    Returns:
        User: The current user's details.
    """
    logger.debug(f"Fetched current user details for ID: {current_user.id}")
    return current_user

```