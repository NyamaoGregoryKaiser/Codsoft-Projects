```python
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.crud.crud_user import user as crud_user
from backend.app.auth.security import decode_access_token
from backend.app.core.exceptions import UnauthorizedException
from backend.app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{base_url}/auth/login" if "base_url" in globals() else "/api/v1/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    token_data = decode_access_token(token)
    user = await crud_user.get(db, id=token_data.sub)
    if not user:
        raise UnauthorizedException()
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user")
    return current_user

async def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise UnauthorizedException("The user doesn't have enough privileges")
    return current_user
```