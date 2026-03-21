from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.database.session import get_db_session
from app.schemas.metric import MetricCreate, MetricUpdate, MetricResponse
from app.database.models import User
from app.api.deps import get_current_active_user
from app.services.metric_service import metric_service
from app.core.exceptions import NotFoundException
from app.core.rate_limit import hundred_per_hour
from app.core.logging_config import logger


router = APIRouter()


@router.get("/app/{app_id}", response_model=List[MetricResponse], dependencies=[Depends(hundred_per_hour)])
async def read_metrics_for_application(
    app_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all metrics for a specific application.
    User must own the application or be an admin.
    """
    logger.debug(f"User {current_user.email} requesting metrics for application ID: {app_id}")
    metrics = await metric_service.get_metrics_for_application(db, app_id, current_user, skip=skip, limit=limit)
    return metrics


@router.post("/app/{app_id}", response_model=MetricResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(hundred_per_hour)])
async def create_metric_for_application(
    app_id: int,
    metric_in: MetricCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new metric for a specific application.
    User must own the application or be an admin.
    """
    logger.info(f"User {current_user.email} creating metric '{metric_in.name}' for application ID: {app_id}")
    metric = await metric_service.create_metric(db, app_id, metric_in, current_user)
    logger.info(f"Metric {metric.name} (ID: {metric.id}) created for app ID: {app_id}.")
    return metric


@router.get("/{metric_id}", response_model=MetricResponse, dependencies=[Depends(hundred_per_hour)])
async def read_metric(
    metric_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve a specific metric by ID.
    User must own the associated application or be an admin.
    """
    logger.debug(f"User {current_user.email} requesting metric ID: {metric_id}")
    metric = await metric_service.get_metric(db, metric_id)
    if not metric:
        raise NotFoundException("Metric not found")
    # Authorization check is implicitly handled by `metric_service.get_metric` if it uses `application_service`
    # However, to be explicit, you would typically check ownership of the associated app here or in the service.
    # For now, let's assume `metric_service.get_metric` is permission-aware, or we rely on methods calling it
    # like `get_metrics_for_application` which *is* permission-aware.
    # For a direct `get_metric` endpoint, we need to manually check permissions.
    db_app = await metric_service.application_service.get_application(db, metric.app_id)
    if not db_app or (db_app.owner_id != current_user.id and not current_user.is_admin):
        raise ForbiddenException("You are not authorized to view this metric")
    return metric


@router.put("/{metric_id}", response_model=MetricResponse, dependencies=[Depends(hundred_per_hour)])
async def update_metric(
    metric_id: int,
    metric_in: MetricUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific metric by ID.
    User must own the associated application or be an admin.
    """
    logger.info(f"User {current_user.email} updating metric ID: {metric_id}")
    updated_metric = await metric_service.update_metric(db, metric_id, metric_in, current_user)
    logger.info(f"Metric ID: {metric_id} updated by user {current_user.email}.")
    return updated_metric


@router.delete("/{metric_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(hundred_per_hour)])
async def delete_metric(
    metric_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific metric by ID.
    User must own the associated application or be an admin.
    """
    logger.warning(f"User {current_user.email} attempting to delete metric ID: {metric_id}")
    await metric_service.delete_metric(db, metric_id, current_user)
    logger.info(f"Metric ID: {metric_id} deleted by user {current_user.email}.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)