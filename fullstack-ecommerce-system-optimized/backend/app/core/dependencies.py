```python
from typing import Generator, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.config import settings
from app.schemas.token import TokenPayload
from app.crud.user import crud_user
from app.db.models import User
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to provide a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    """
    Dependency to get the current authenticated user from the JWT token.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError) as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = crud_user.get_by_email(db, email=token_data.sub)
    if not user:
        logger.warning(f"User not found for token sub: {token_data.sub}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active (not inactive) user.
    """
    if not crud_user.is_active(current_user):
        logger.warning(f"Inactive user {current_user.email} attempted to access active-only endpoint.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active superuser.
    """
    if not crud_user.is_superuser(current_user):
        logger.warning(f"Non-superuser {current_user.email} attempted to access superuser-only endpoint.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user

```