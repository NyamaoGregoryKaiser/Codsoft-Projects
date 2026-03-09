import asyncio
import logging

from app.core.celery import celery_app
from app.core.database import AsyncSessionLocal
from app.services.scraper_service import ScraperService

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="run_scraper_task", max_retries=3, default_retry_delay=60)
def run_scraper_task(self, job_id: int, target_url: str, parse_rules: dict):
    """
    Celery task to run a web scraper.
    This task will execute the actual scraping logic asynchronously.
    """
    logger.info(f"Celery task {self.request.id} received for job {job_id}")
    try:
        # We need to create a new async session for each task
        # as Celery tasks run in their own process and cannot share sessions.
        async def _run_scraper_async():
            async with AsyncSessionLocal() as db:
                scraper_service = ScraperService(db)
                await scraper_service.execute_scraper(job_id, target_url, parse_rules)

        # Run the async scraping logic
        asyncio.run(_run_scraper_async())
        logger.info(f"Celery task {self.request.id} completed for job {job_id}")

    except Exception as exc:
        logger.error(f"Celery task {self.request.id} failed for job {job_id} with error: {exc}", exc_info=True)
        # Handle retries
        try:
            self.retry(exc=exc, countdown=60) # Retry after 60 seconds
        except self.MaxRetriesExceededError:
            logger.error(f"Celery task {self.request.id} for job {job_id} exhausted all retries.")
            # Update job status to FAILED in DB if max retries exceeded
            async def _update_job_failed():
                async with AsyncSessionLocal() as db:
                    from app.crud.job import job as crud_job
                    from app.schemas.job import JobUpdate
                    from datetime import datetime, timezone
                    db_job = await crud_job.get(db, id=job_id)
                    if db_job and db_job.status != "COMPLETED": # Don't override if already completed
                        await crud_job.update(db, db_obj=db_job, 
                                            obj_in=JobUpdate(
                                                status="FAILED", 
                                                completed_at=datetime.now(timezone.utc),
                                                log_output=(db_job.log_output or "") + f"\n[{datetime.now(timezone.utc)}] Job failed after max retries: {exc}"
                                            ))
            asyncio.run(_update_job_failed())
```
---