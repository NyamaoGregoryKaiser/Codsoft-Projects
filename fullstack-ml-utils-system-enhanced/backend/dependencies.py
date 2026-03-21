```python
from typing import Annotated, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.core.security import decode_access_token
from backend.models import User
from backend.schemas.auth import TokenData
from backend.core.exception_handlers import UnauthorizedAccessError, ResourceNotFoundError
from loguru import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data: TokenData = decode_access_token(token)
    if token_data is None:
        logger.warning(f"Invalid token received: {token}")
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.username).first()
    if user is None:
        logger.warning(f"User '{token_data.username}' not found for token.")
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_superuser:
        raise UnauthorizedAccessError("The user doesn't have enough privileges")
    return current_user
```