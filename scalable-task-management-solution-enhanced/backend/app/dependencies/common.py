from typing import Annotated

from fastapi import Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.auth.security import get_current_user

# Define common dependencies
DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

# Pagination parameters
def common_pagination_params(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
):
    return {"skip": skip, "limit": limit}

CommonPagination = Annotated[dict, Depends(common_pagination_params)]