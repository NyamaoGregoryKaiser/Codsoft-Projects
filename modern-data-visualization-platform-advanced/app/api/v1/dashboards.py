from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import Dashboard, DashboardCreate, DashboardUpdate
from app.models.user import User
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.services.dashboard_service import dashboard_service
from app.core.exceptions import HTTPException
from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/dashboards", tags=["Dashboards"])

@router.post("/", response_model=Dashboard, status_code=status.HTTP_201_CREATED)
async def create_new_dashboard(
    dashboard_in: DashboardCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a new dashboard.
    """
    dashboard = await dashboard_service.create_dashboard(db, dashboard_in, current_user.id)
    logger.info(f"User {current_user.email} created dashboard: {dashboard.title} (ID: {dashboard.id})")
    return dashboard

@router.get("/", response_model=List[Dashboard])
async def read_dashboards(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve all dashboards for the current user.
    """
    dashboards = await dashboard_service.get_dashboards_by_owner(db, current_user.id, skip=skip, limit=limit)
    return dashboards

@router.get("/{dashboard_id}", response_model=Dashboard)
async def read_dashboard(
    dashboard_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve a specific dashboard by ID, including its charts.
    """
    dashboard = await dashboard_service.get_dashboard_with_charts(db, dashboard_id, current_user.id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found or unauthorized")
    return dashboard

@router.put("/{dashboard_id}", response_model=Dashboard)
async def update_existing_dashboard(
    dashboard_id: int,
    dashboard_in: DashboardUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update an existing dashboard.
    """
    dashboard = await dashboard_service.update_dashboard(db, dashboard_id, dashboard_in, current_user.id)
    logger.info(f"User {current_user.email} updated dashboard: {dashboard.title} (ID: {dashboard.id})")
    return dashboard

@router.delete("/{dashboard_id}", response_model=Dashboard)
async def delete_existing_dashboard(
    dashboard_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Delete an existing dashboard. This will also delete all associated charts.
    """
    dashboard = await dashboard_service.delete_dashboard(db, dashboard_id, current_user.id)
    logger.info(f"User {current_user.email} deleted dashboard ID: {dashboard.id}")
    return dashboard