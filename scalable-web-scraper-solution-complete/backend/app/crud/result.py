from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.result import ScrapingResult
from app.schemas.result import ScrapingResultCreate, ScrapingResult

class CRUDScrapingResult(CRUDBase[ScrapingResult, ScrapingResultCreate, ScrapingResult]):
    async def get_results_by_task(
        self, db: AsyncSession, *, task_id: int, skip: int = 0, limit: int = 100
    ) -> List[ScrapingResult]:
        """Retrieve scraping results for a specific task."""
        result = await db.execute(
            select(self.model)
            .filter(self.model.task_id == task_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

result = CRUDScrapingResult(ScrapingResult)
```