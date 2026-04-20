from typing import Annotated, List, Dict, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.schemas.chart import Chart, ChartCreate, ChartUpdate
from app.models.user import User
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.services.chart_service import chart_service
from app.core.exceptions import HTTPException
from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/charts", tags=["Charts"])

@router.post("/", response_model=Chart, status_code=status.HTTP_201_CREATED)
async def create_new_chart(
    chart_in: ChartCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a new chart.
    """
    chart = await chart_service.create_chart(db, chart_in, current_user.id)
    logger.info(f"User {current_user.email} created chart: {chart.title} (ID: {chart.id})")
    return chart

@router.get("/", response_model=List[Chart])
async def read_charts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve all charts for the current user.
    """
    charts = await chart_service.get_charts_by_owner(db, current_user.id, skip=skip, limit=limit)
    return charts

@router.get("/{chart_id}", response_model=Chart)
async def read_chart(
    chart_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve a specific chart by ID.
    """
    chart = await chart_service.get_chart(db, chart_id, current_user.id)
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found or unauthorized")
    return chart

@router.put("/{chart_id}", response_model=Chart)
async def update_existing_chart(
    chart_id: int,
    chart_in: ChartUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update an existing chart.
    """
    chart = await chart_service.update_chart(db, chart_id, chart_in, current_user.id)
    logger.info(f"User {current_user.email} updated chart: {chart.title} (ID: {chart.id})")
    return chart

@router.delete("/{chart_id}", response_model=Chart)
async def delete_existing_chart(
    chart_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Delete an existing chart.
    """
    chart = await chart_service.delete_chart(db, chart_id, current_user.id)
    logger.info(f"User {current_user.email} deleted chart ID: {chart.id}")
    return chart

@router.get("/{chart_id}/data", response_model=Dict[str, Any], dependencies=[Depends(RateLimiter(times=5, seconds=10))])
async def get_chart_visualization_data(
    chart_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve data formatted for client-side visualization based on chart configuration.
    Includes rate limiting to prevent abuse.
    """
    data = await chart_service.get_chart_data(db, chart_id, current_user.id)
    return data