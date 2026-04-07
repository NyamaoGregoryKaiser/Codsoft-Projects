from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise UnauthorizedException("Invalid token or expired token")

# Dependency to get current user based on token
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
```
This file will also contain the `get_current_active_user` dependency that uses `decode_access_token` and interacts with a user service, but it will be defined in `app/api/v1/dependencies.py` for better organization and to avoid circular imports.
```python
# (Continued from previous block for clarity, but this part would be in dependencies.py)
# import user_service
# async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_session)):
#     credentials_exception = UnauthorizedException()
#     try:
#         payload = decode_access_token(token)
#         user_id: str = payload.get("sub")
#         if user_id is None:
#             raise credentials_exception
#         token_data = TokenData(username=user_id) # Using a simple schema
#     except JWTError:
#         raise credentials_exception
#     user = await user_service.get_user_by_id(db, int(token_data.username)) # Assuming user_id is int
#     if user is None:
#         raise credentials_exception
#     return user

# async def get_current_active_user(current_user: User = Depends(get_current_user)):
#     if not current_user.is_active:
#         raise ForbiddenException("Inactive user")
#     return current_user

# async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
#     if not current_user.is_admin:
#         raise ForbiddenException("User does not have administrator privileges")
#     return current_user