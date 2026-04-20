from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.dashboard import dashboard as crud_dashboard
from app.models.dashboard import Dashboard
from app.schemas.dashboard import DashboardCreate, DashboardUpdate, Dashboard as DashboardSchema
from app.core.exceptions import HTTPException

class DashboardService:
    async def create_dashboard(self, db: AsyncSession, obj_in: DashboardCreate, owner_id: int) -> Dashboard:
        return await crud_dashboard.create(db, obj_in=obj_in, owner_id=owner_id)

    async def get_dashboard(self, db: AsyncSession, dashboard_id: int, owner_id: int) -> Optional[Dashboard]:
        db_dashboard = await crud_dashboard.get(db, dashboard_id)
        if not db_dashboard or db_dashboard.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Dashboard not found or unauthorized")
        return db_dashboard

    async def get_dashboard_with_charts(self, db: AsyncSession, dashboard_id: int, owner_id: int) -> Optional[Dashboard]:
        db_dashboard = await crud_dashboard.get_with_charts(db, dashboard_id)
        if not db_dashboard or db_dashboard.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Dashboard not found or unauthorized")
        return db_dashboard

    async def get_dashboards_by_owner(self, db: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100) -> List[Dashboard]:
        return await crud_dashboard.get_multi_by_owner(db, owner_id=owner_id, skip=skip, limit=limit)

    async def update_dashboard(self, db: AsyncSession, dashboard_id: int, obj_in: DashboardUpdate, owner_id: int) -> Dashboard:
        db_dashboard = await self.get_dashboard(db, dashboard_id, owner_id) # Ensures ownership check
        return await crud_dashboard.update(db, db_obj=db_dashboard, obj_in=obj_in)

    async def delete_dashboard(self, db: AsyncSession, dashboard_id: int, owner_id: int) -> Dashboard:
        db_dashboard = await self.get_dashboard(db, dashboard_id, owner_id) # Ensures ownership check
        deleted_dashboard = await crud_dashboard.delete(db, id=dashboard_id)
        if not deleted_dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        return deleted_dashboard

dashboard_service = DashboardService()