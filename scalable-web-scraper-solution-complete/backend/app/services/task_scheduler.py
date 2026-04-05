from celery import Celery
from datetime import datetime, timedelta, timezone
import asyncio
from typing import Dict, Any

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.crud.task import task as crud_task
from app.crud.result import result as crud_result
from app.schemas.result import ScrapingResultCreate
from app.models.task import TaskStatus
from app.services.scraper_service import scraper_service # Import the scraper service
from loguru import logger

# Initialize Celery app
celery_app = Celery(
    "web_scraper_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery to use UTC timezone
celery_app.conf.timezone = 'UTC'
celery_app.conf.enable_utc = True
celery_app.conf.broker_connection_retry_on_startup = True # Important for Docker setup

# Log configuration for Celery
logger.add("celery_tasks.log", rotation="500 MB", compression="zip", level="INFO")

@celery_app.task(name="scraper.scrape_task_by_id", bind=True, default_retry_delay=300, max_retries=3)
def scrape_task_by_id(self, task_id: int) -> Dict[str, Any]:
    """
    Celery task to perform web scraping for a given task ID.
    This function runs synchronously within the Celery worker process.
    """
    logger.info(f"Celery task received: scraping for task_id={task_id}")
    
    async def _async_scrape():
        async with AsyncSessionLocal() as db:
            db_task = await crud_task.get(db, id=task_id)
            if not db_task:
                logger.error(f"Task with ID {task_id} not found.")
                return {"status": "FAILED", "message": f"Task {task_id} not found"}

            if not db_task.is_active:
                logger.info(f"Task {task_id} is inactive. Skipping.")
                return {"status": "SKIPPED", "message": f"Task {task_id} is inactive"}

            # Update task status to RUNNING
            await crud_task.update(db, db_obj=db_task, obj_in={"status": TaskStatus.RUNNING, "last_run_at": datetime.now(timezone.utc)})
            
            try:
                # Perform the scraping
                scrape_result = await scraper_service.scrape(db_task.target_url, db_task.css_selector)
                
                # Save the result to the database
                result_create_schema = ScrapingResultCreate(
                    task_id=db_task.id,
                    data=scrape_result["data"],
                    status_code=scrape_result["status_code"],
                    error_message=scrape_result["error_message"]
                )
                await crud_result.create(db, obj_in=result_create_schema)

                if scrape_result["error_message"]:
                    new_status = TaskStatus.FAILED
                    log_message = f"Task {task_id} failed with error: {scrape_result['error_message']}"
                    logger.error(log_message)
                else:
                    new_status = TaskStatus.COMPLETED
                    log_message = f"Task {task_id} completed successfully."
                    logger.info(log_message)

                # Calculate next run time
                next_run = datetime.now(timezone.utc) + timedelta(seconds=db_task.frequency_seconds)
                await crud_task.update(db, db_obj=db_task, obj_in={"status": new_status, "next_run_at": next_run})
                
                return {"status": new_status.value, "task_id": task_id, "result": scrape_result}

            except Exception as e:
                logger.exception(f"Unhandled exception during scraping for task {task_id}: {e}")
                # Mark task as FAILED and attempt retry
                await crud_task.update(db, db_obj=db_task, obj_in={"status": TaskStatus.FAILED})
                raise self.retry(exc=e) # Celery will retry the task

    return asyncio.run(_async_scrape())


class TaskScheduler:
    """Manages scheduling and monitoring of scraping tasks."""
    def __init__(self):
        self.celery = celery_app

    def schedule_scrape_task(self, task_id: int, eta: Optional[datetime] = None) -> Any:
        """
        Schedules a scraping task to be executed by a Celery worker.
        'eta' (Estimated Time of Arrival) can be used to schedule for a future time.
        """
        if eta:
            logger.info(f"Scheduling task {task_id} with ETA: {eta}")
            return scrape_task_by_id.apply_async(args=[task_id], eta=eta)
        else:
            logger.info(f"Scheduling task {task_id} for immediate execution.")
            return scrape_task_by_id.delay(task_id)

    async def check_and_schedule_due_tasks(self):
        """
        Periodically checks for tasks that are due and schedules them.
        This function should be run as a background task in FastAPI or similar.
        """
        logger.info("Checking for due tasks to schedule...")
        async with AsyncSessionLocal() as db:
            due_tasks = await crud_task.get_tasks_due_for_run(db)
            for db_task in due_tasks:
                # If a task is due, schedule it immediately
                # If it's already running or completed but due again, re-schedule it.
                # Avoid scheduling if already in 'RUNNING' state (to prevent duplicates if worker is slow).
                if db_task.status != TaskStatus.RUNNING:
                    logger.info(f"Task {db_task.id} '{db_task.name}' is due. Scheduling...")
                    self.schedule_scrape_task(db_task.id)
                    # Optionally, set status to PENDING or update next_run_at here
                    await crud_task.update(db, db_obj=db_task, obj_in={"status": TaskStatus.PENDING})
                else:
                    logger.info(f"Task {db_task.id} is already RUNNING but due. Will wait for current run to complete.")

task_scheduler = TaskScheduler()

if __name__ == "__main__":
    # Example of running a Celery task manually (requires Celery worker running)
    print("This is meant to be run by Celery worker. To test:")
    print("1. Start redis: docker run -d --name redis-server -p 6379:6379 redis")
    print("2. Start Celery worker: celery -A app.services.task_scheduler.celery_app worker -l info -P eventlet")
    print("3. In a separate Python script or interpreter, import task_scheduler and call `task_scheduler.schedule_scrape_task`")
    print("Example: task_scheduler.schedule_scrape_task(123)")
```