from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.job import ScrapingJob
from app.schemas.job import JobCreate, JobUpdate

class CRUDScrapingJob(CRUDBase[ScrapingJob, JobCreate, JobUpdate]):
    async def get_jobs_by_scraper(
        self, db: AsyncSession, *, scraper_id: int, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[ScrapingJob]:
        """Retrieve jobs for a specific scraper and owner."""
        stmt = (
            select(self.model)
            .where(self.model.scraper_id == scraper_id, self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .order_by(self.model.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

job = CRUDScrapingJob(ScrapingJob)
```
---