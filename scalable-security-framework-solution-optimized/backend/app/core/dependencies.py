```python
from typing import Generator, Annotated, Optional
from datetime import datetime
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_token
from app.crud.user import crud_user
from app.schemas.user import UserInDB
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.logging import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db() -> Generator:
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)]
) -> UserInDB:
    """
    Dependency to get the current authenticated user from an access token.
    Raises UnauthorizedException if token is invalid or user not found.
    """
    payload = decode_token(token)
    if not payload:
        logger.warning("Invalid token provided", token_prefix=token[:10])
        raise UnauthorizedException(detail="Invalid authentication token")

    user_id: Optional[str] = payload.get("sub")
    token_type: Optional[str] = payload.get("type") # Check token type, e.g., 'access'

    if user_id is None or token_type != "access":
        logger.warning("Token missing user ID or incorrect type", user_id=user_id, token_type=token_type)
        raise UnauthorizedException(detail="Could not validate credentials")

    user = crud_user.get_by_id(db, id=int(user_id))
    if user is None:
        logger.warning("User not found for token", user_id=user_id)
        raise UnauthorizedException(detail="User not found")
    
    # Check if token is expired (JWT handles `exp` but good to have explicit check)
    if payload.get("exp") and datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
        logger.warning("Expired access token", user_id=user.id)
        raise UnauthorizedException(detail="Access token expired")

    return user

def require_role(required_role: str):
    """
    Dependency factory to check if the current user has the required role.
    """
    def role_checker(current_user: Annotated[UserInDB, Depends(get_current_user)]):
        if not current_user or current_user.role != required_role:
            logger.warning("User attempted unauthorized access",
                           user_id=current_user.id if current_user else "anonymous",
                           required_role=required_role,
                           user_role=current_user.role if current_user else "none")
            raise ForbiddenException(f"User does not have '{required_role}' role")
        return current_user
    return role_checker

# Specific role dependencies
get_current_admin = Annotated[UserInDB, Depends(require_role("admin"))]
get_current_active_user = Annotated[UserInDB, Depends(get_current_user)]
```