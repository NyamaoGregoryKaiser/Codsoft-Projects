from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.suggestion import OptimizationSuggestion, OptimizationSuggestionCreate, OptimizationSuggestionUpdate
from app.db.session import get_async_session
from app.services.suggestion_service import suggestion_service
from app.api.v1.dependencies import CurrentUser, AdminUser, DBSession
from loguru import logger

router = APIRouter()

@router.post("/", response_model=OptimizationSuggestion, status_code=status.HTTP_201_CREATED, summary="Create a new optimization suggestion")
async def create_new_suggestion(
    suggestion_in: OptimizationSuggestionCreate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Create a new optimization suggestion. The `suggested_by_id` will be set to the current user's ID.
    The current user must own the target database.
    """
    return await suggestion_service.create_suggestion(db, suggestion_in, current_user)

@router.get("/{database_id}", response_model=List[OptimizationSuggestion], summary="Retrieve suggestions for a specific database")
async def read_database_suggestions(
    database_id: int,
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve optimization suggestions for a specific database.
    The current user must own the database.
    """
    return await suggestion_service.get_database_suggestions(db, database_id, current_user.id, skip=skip, limit=limit)

@router.post("/analyze/{database_id}", response_model=List[OptimizationSuggestion], status_code=status.HTTP_201_CREATED, summary="Analyze slow queries and generate suggestions")
async def analyze_db_slow_queries(
    database_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Analyzes recent slow queries for a given database and generates new optimization suggestions.
    The current user must own the database.
    """
    return await suggestion_service.analyze_slow_queries(db, database_id, current_user)

@router.put("/{suggestion_id}", response_model=OptimizationSuggestion, summary="Update an optimization suggestion by ID")
async def update_existing_suggestion(
    suggestion_id: int,
    suggestion_in: OptimizationSuggestionUpdate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Update details of an existing optimization suggestion.
    The current user must own the database associated with the suggestion.
    Only administrators can approve/disapprove suggestions.
    """
    return await suggestion_service.update_suggestion(db, suggestion_id, suggestion_in, current_user)

@router.delete("/{suggestion_id}", response_model=OptimizationSuggestion, summary="Delete an optimization suggestion by ID")
async def delete_existing_suggestion(
    suggestion_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Delete an optimization suggestion.
    The current user must own the database associated with the suggestion.
    Approved suggestions can only be deleted by an administrator.
    """
    return await suggestion_service.delete_suggestion(db, suggestion_id, current_user)