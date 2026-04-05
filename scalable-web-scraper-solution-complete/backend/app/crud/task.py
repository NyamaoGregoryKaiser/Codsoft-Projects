from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.task import ScrapingTask, TaskStatus
from app.schemas.task import ScrapingTaskCreate, ScrapingTaskUpdate

class CRUDScrapingTask(CRUDBase[ScrapingTask, ScrapingTaskCreate, ScrapingTaskUpdate]):
    async def get_tasks_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[ScrapingTask]:
        """Retrieve scraping tasks for a specific owner."""
        result = await db.execute(
            select(self.model)
            .filter(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_active_tasks(self, db: AsyncSession) -> List[ScrapingTask]:
        """Retrieve all active tasks that need to be run."""
        result = await db.execute(
            select(self.model)
            .filter(
                self.model.is_active == True,
                self.model.status.in_([TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.FAILED]) # Allow re-running failed tasks
            )
        )
        return result.scalars().all()

    async def get_tasks_due_for_run(self, db: AsyncSession) -> List[ScrapingTask]:
        """Retrieve active tasks whose next_run_at is now or in the past."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(self.model)
            .filter(
                self.model.is_active == True,
                self.model.next_run_at <= now
            )
        )
        return result.scalars().all()

task = CRUDScrapingTask(ScrapingTask)
```