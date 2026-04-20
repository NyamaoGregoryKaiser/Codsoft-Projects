from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.crud.base import CRUDBase
from app.models.dashboard import Dashboard
from app.schemas.dashboard import DashboardCreate, DashboardUpdate

class CRUDDashboard(CRUDBase[Dashboard, DashboardCreate, DashboardUpdate]):
    async def get_with_charts(self, db: AsyncSession, dashboard_id: int) -> Optional[Dashboard]:
        stmt = select(self.model).options(selectinload(self.model.charts)).filter(self.model.id == dashboard_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Dashboard]:
        stmt = select(self.model).filter(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

dashboard = CRUDDashboard(Dashboard)