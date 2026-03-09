from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.result import ScrapedData
from app.schemas.result import ScrapedDataCreate

class CRUDScrapedData(CRUDBase[ScrapedData, ScrapedDataCreate, dict]):
    async def get_results_by_job(
        self, db: AsyncSession, *, job_id: int, skip: int = 0, limit: int = 100
    ) -> List[ScrapedData]:
        """Retrieve scraped data for a specific job."""
        stmt = (
            select(self.model)
            .where(self.model.job_id == job_id)
            .offset(skip)
            .limit(limit)
            .order_by(self.model.scraped_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_results_by_scraper(
        self, db: AsyncSession, *, scraper_id: int, skip: int = 0, limit: int = 100
    ) -> List[ScrapedData]:
        """Retrieve scraped data for a specific scraper."""
        stmt = (
            select(self.model)
            .where(self.model.scraper_id == scraper_id)
            .offset(skip)
            .limit(limit)
            .order_by(self.model.scraped_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()


scraped_data = CRUDScrapedData(ScrapedData)
```
---