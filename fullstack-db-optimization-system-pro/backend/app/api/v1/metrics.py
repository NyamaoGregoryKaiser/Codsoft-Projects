from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.metric import Metric, MetricCreate, MetricUpdate
from app.db.session import get_async_session
from app.services.metric_service import metric_service
from app.api.v1.dependencies import CurrentUser, DBSession
from loguru import logger

router = APIRouter()

@router.post("/", response_model=Metric, status_code=status.HTTP_201_CREATED, summary="Add new metric data for a database")
async def create_new_metric(
    metric_in: MetricCreate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Add new performance metric data for a registered database.
    The current user must own the database.
    """
    return await metric_service.create_metric(db, metric_in, current_user.id)

@router.get("/{database_id}", response_model=List[Metric], summary="Retrieve metrics for a specific database")
async def read_database_metrics(
    database_id: int,
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve performance metrics for a specific database.
    The current user must own the database.
    """
    return await metric_service.get_database_metrics(db, database_id, current_user.id, skip=skip, limit=limit)

@router.post("/generate_simulated/{database_id}", response_model=List[Metric], status_code=status.HTTP_201_CREATED, summary="Generate simulated metrics for a database")
async def generate_simulated_metrics_for_db(
    database_id: int,
    num_metrics: int = 10,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Generates a specified number of simulated performance metrics for a database.
    Useful for populating data for testing and demonstration.
    The current user must own the database.
    """
    return await metric_service.generate_simulated_metrics(db, database_id, current_user.id, num_metrics)


@router.put("/{metric_id}", response_model=Metric, summary="Update a metric by ID")
async def update_existing_metric(
    metric_id: int,
    metric_in: MetricUpdate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Update details of an existing metric entry.
    The current user must own the database associated with the metric.
    """
    return await metric_service.update_metric(db, metric_id, metric_in, current_user.id)

@router.delete("/{metric_id}", response_model=Metric, summary="Delete a metric by ID")
async def delete_existing_metric(
    metric_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Delete a metric entry.
    The current user must own the database associated with the metric.
    """
    return await metric_service.delete_metric(db, metric_id, current_user.id)