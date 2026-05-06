```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.dependencies import get_current_active_admin_user
from backend.services import crud
from backend.schemas.user_agent import UserAgentCreate, UserAgentUpdate, UserAgentInDB
from backend.schemas.common import PaginatedResponse
from backend.models.user import User
from backend.models.user_agent import UserAgent
from backend.core.logger import logger

router = APIRouter()

@router.post("/", response_model=UserAgentInDB, status_code=status.HTTP_201_CREATED, summary="Create a new user agent (Admin only)")
async def create_user_agent(
    user_agent_in: UserAgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Create a new user agent string. Only administrators can perform this action.
    """
    existing_ua = db.query(UserAgent).filter(UserAgent.agent_string == user_agent_in.agent_string).first()
    if existing_ua:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User agent string already exists")

    ua = crud.user_agent.create(db, user_agent_in)
    logger.info(f"Admin {current_user.username} created user agent (ID: {ua.id}).")
    return UserAgentInDB.model_validate(ua)

@router.get("/", response_model=PaginatedResponse[UserAgentInDB], summary="Get all user agents (Admin only)")
async def read_user_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve all user agent strings with pagination. Only administrators can perform this action.
    """
    user_agents, total = crud.user_agent.get_multi_with_count(db, skip=skip, limit=limit)
    logger.info(f"Admin {current_user.username} retrieved {len(user_agents)} user agents.")
    return PaginatedResponse(total=total, page=skip // limit + 1, page_size=limit, items=[UserAgentInDB.model_validate(ua) for ua in user_agents])

@router.get("/{ua_id}", response_model=UserAgentInDB, summary="Get user agent by ID (Admin only)")
async def read_user_agent(
    ua_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve a specific user agent by ID. Only administrators can perform this action.
    """
    ua = crud.user_agent.get(db, ua_id)
    if not ua:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User agent not found")
    logger.info(f"Admin {current_user.username} retrieved user agent (ID: {ua.id}).")
    return UserAgentInDB.model_validate(ua)

@router.put("/{ua_id}", response_model=UserAgentInDB, summary="Update a user agent (Admin only)")
async def update_user_agent(
    ua_id: int,
    user_agent_in: UserAgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Update an existing user agent by ID. Only administrators can perform this action.
    """
    ua = crud.user_agent.get(db, ua_id)
    if not ua:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User agent not found")

    updated_ua = crud.user_agent.update(db, ua, user_agent_in)
    logger.info(f"Admin {current_user.username} updated user agent (ID: {updated_ua.id}).")
    return UserAgentInDB.model_validate(updated_ua)

@router.delete("/{ua_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a user agent (Admin only)")
async def delete_user_agent(
    ua_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Delete a user agent by ID. Only administrators can perform this action.
    """
    ua = crud.user_agent.get(db, ua_id)
    if not ua:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User agent not found")
    
    crud.user_agent.remove(db, ua_id)
    logger.info(f"Admin {current_user.username} deleted user agent (ID: {ua_id}).")
    return
```