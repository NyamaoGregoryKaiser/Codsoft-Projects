from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.database.session import get_db_session
from app.schemas.metric_data import MetricDataBatchCreate, MetricDataAggregation, MetricDataPointResponse
from app.database.models import User
from app.api.deps import get_current_active_user
from app.services.metric_data_service import metric_data_service
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.rate_limit import metric_data_rate_limit # Custom rate limit for data ingestion
from app.core.logging_config import logger


router = APIRouter()


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(metric_data_rate_limit)])
async def ingest_metric_data(
    batch_in: MetricDataBatchCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Endpoint for external applications to submit batches of metric data.
    Authentication is done via `api_key` in the request body.
    """
    logger.info(f"Received {len(batch_in.data_points)} metric data points for API key: {batch_in.api_key[:8]}...")
    try:
        result = await metric_data_service.ingest_metric_data_batch(db, batch_in)
        logger.debug(f"Successfully ingested data for API key: {batch_in.api_key[:8]}...")
        return result
    except NotFoundException as e:
        logger.warning(f"Ingestion failed for API key {batch_in.api_key[:8]}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during ingestion for API key {batch_in.api_key[:8]}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during data ingestion.")


@router.get("/latest/{metric_id}", response_model=Optional[MetricDataPointResponse], dependencies=[Depends(metric_data_rate_limit)])
async def get_latest_metric_value(
    metric_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve the latest data point for a specific metric.
    User must own the associated application or be an admin.
    """
    logger.debug(f"User {current_user.email} requesting latest data for metric ID: {metric_id}")
    data_point = await metric_data_service.get_latest_metric_data_point(
        db, metric_id, current_user.id, current_user.is_admin
    )
    if not data_point:
        raise NotFoundException("No data found for this metric.")
    return data_point


@router.get("/aggregated/{metric_id}", response_model=List[MetricDataAggregation], dependencies=[Depends(metric_data_rate_limit)])
async def get_aggregated_metric_values(
    metric_id: int,
    start_time: datetime = Query(..., description="Start of the time range (UTC)."),
    end_time: datetime = Query(..., description="End of the time range (UTC)."),
    interval_seconds: int = Query(300, ge=60, le=86400, description="Aggregation interval in seconds (min 60s, max 1 day)."),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve aggregated metric data (average, min, max, count) for a specific metric
    within a time range, grouped by a specified interval.
    User must own the associated application or be an admin.
    """
    logger.debug(f"User {current_user.email} requesting aggregated data for metric ID: {metric_id} from {start_time} to {end_time} with interval {interval_seconds}s")
    
    if start_time >= end_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_time must be before end_time")
    
    interval = timedelta(seconds=interval_seconds)
    
    aggregated_data = await metric_data_service.get_aggregated_metric_data(
        db, metric_id, start_time, end_time, interval, current_user.id, current_user.is_admin
    )
    
    return aggregated_data