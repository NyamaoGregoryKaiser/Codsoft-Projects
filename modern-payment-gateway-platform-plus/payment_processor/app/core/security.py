from datetime import datetime, timedelta, timezone
from typing import Any, Union
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.auth import TokenPayload
from app.crud.user import crud_user
from app.crud.merchant import crud_merchant
from app.database.dependencies import get_db_session
from app.database.models import User, UserRole
from app.core.exceptions import NotAuthenticatedException, PermissionDeniedException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(
    user_id: UUID, expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(user_id)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    db: AsyncSession = Depends(get_db_session), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise NotAuthenticatedException("Could not validate credentials.")
    
    user = await crud_user.get(db, token_data.sub)
    if not user:
        raise NotAuthenticatedException("User not found.")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not crud_user.is_active(current_user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not crud_user.is_superuser(current_user):
        raise PermissionDeniedException("The user doesn't have enough privileges.")
    return current_user

async def get_current_active_merchant_user(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """
    Dependency to get the current authenticated user and ensure they are a merchant.
    Attaches the merchant object to the user object for convenience.
    """
    if not current_user.role == UserRole.MERCHANT:
        raise PermissionDeniedException("User is not a merchant.")
    
    merchant = await crud_merchant.get_by_user_id(db, current_user.id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant profile not found for this user.")
    
    # Attach merchant to user for easier access in endpoints
    # This is a common pattern, though technically modifies the user object
    # In Pydantic, this would be handled by a response model that includes MerchantPublic
    # For now, we'll ensure the `UserPublic` schema correctly renders this if it's there.
    # A cleaner approach for Pydantic would be to return a custom `MerchantUser` schema.
    setattr(current_user, "merchant", merchant) 
    return current_user

```
*(Other core files like `dependencies.py`, `exceptions.py`, `middleware.py`, `logger.py` would follow a similar pattern of structured logging, custom exceptions, and basic middleware.)*

#### `payment_processor/app/database/models.py`
```python