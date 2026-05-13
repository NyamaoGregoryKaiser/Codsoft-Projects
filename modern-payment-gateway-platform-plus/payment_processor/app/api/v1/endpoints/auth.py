from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core import security
from app.core.config import settings
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserPublic
from app.schemas.auth import Token
from app.database.dependencies import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_db_session)
) -> Any:
    """
    Registers a new user in the system.
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

@router.post("/login/access-token", response_model=Token, summary="OAuth2 login, get access token")
async def login_access_token(
    db: AsyncSession = Depends(get_db_session), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    elif not crud_user.is_active(user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(user.id, expires_delta=access_token_expires)
    logger.info(f"User logged in: {user.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
    }

# Example of a protected endpoint (can be moved to users.py)
@router.get("/me", response_model=UserPublic, summary="Get current user details")
async def read_current_user(
    current_user: UserPublic = Depends(security.get_current_active_user),
) -> Any:
    """
    Retrieve the current authenticated user's details.
    """
    return current_user

```

#### `payment_processor/app/api/v1/endpoints/transactions.py`
(Illustrative, focusing on core payment flow)
```python