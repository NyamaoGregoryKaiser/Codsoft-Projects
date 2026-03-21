from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db_session
from app.database.models import User
from app.services.auth_service import auth_service


async def get_current_active_user(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(auth_service.get_current_user)
) -> User:
    """Dependency that provides the current active authenticated user."""
    return current_user


async def get_current_active_admin(
    current_user: User = Depends(auth_service.get_current_admin_user)
) -> User:
    """Dependency that provides the current active authenticated admin user."""
    return current_user