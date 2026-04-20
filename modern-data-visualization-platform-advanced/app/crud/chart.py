from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.crud.base import CRUDBase
from app.models.chart import Chart
from app.schemas.chart import ChartCreate, ChartUpdate

class CRUDChart(CRUDBase[Chart, ChartCreate, ChartUpdate]):
    async def get_multi_by_dashboard(
        self, db: AsyncSession, *, dashboard_id: int, skip: int = 0, limit: int = 100
    ) -> List[Chart]:
        stmt = select(self.model).filter(self.model.dashboard_id == dashboard_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Chart]:
        stmt = select(self.model).filter(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

chart = CRUDChart(Chart)