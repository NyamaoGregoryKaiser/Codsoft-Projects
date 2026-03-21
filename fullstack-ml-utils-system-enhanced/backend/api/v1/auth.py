```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.auth import LoginRequest, RegisterRequest, Token
from backend.schemas.user import User as UserSchema
from backend.services.auth_service import AuthService
from backend.dependencies import get_current_active_user
from backend.models import User as DBUser
from backend.core.exception_handlers import UserAlreadyExistsError, UnauthorizedAccessError
from loguru import logger

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(
    register_data: RegisterRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a new user.
    """
    try:
        user = auth_service.register_user(db, user_data=register_data)
        logger.info(f"User '{user.email}' registered successfully.")
        return user
    except UserAlreadyExistsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Error during user registration: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred during registration.")

@router.post("/token", response_model=Token)
def login_for_access_token(
    login_data: LoginRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    try:
        user = auth_service.authenticate_user(db, login_data)
        token = auth_service.create_token_for_user(user)
        logger.info(f"User '{user.email}' logged in successfully.")
        return token
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail, headers={"WWW-Authenticate": "Bearer"})
    except Exception as e:
        logger.error(f"Error during user login: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred during login.")

@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: Annotated[DBUser, Depends(get_current_active_user)]
):
    """
    Get current active user.
    """
    return current_user
```