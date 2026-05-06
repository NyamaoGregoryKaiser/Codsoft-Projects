```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from sqlalchemy import select
import asyncio
import json
from datetime import datetime

from backend.models.scraper import ScraperConfig
from backend.models.task import ScrapingTask, TaskStatus
from backend.services import crud
from backend.services.scraper_engine import scrape_website
from backend.core.logger import logger
from backend.core.database import SessionLocal # Import for creating new sessions

scheduler = AsyncIOScheduler()

async def _run_scraper_job(scraper_config_id: int, user_id: int):
    """Function that the APScheduler will call."""
    # Ensure each scheduled job gets its own DB session
    db_session: Session = None
    try:
        db_session = SessionLocal()
        config = db_session.query(ScraperConfig).filter(ScraperConfig.id == scraper_config_id).first()

        if not config or not config.is_active:
            logger.warning(f"Scheduled job for scraper {scraper_config_id} skipped: config not found or inactive.")
            return

        # Create a new task entry in the database
        new_task = ScrapingTask(
            scraper_config_id=scraper_config_id,
            owner_id=user_id,
            status=TaskStatus.PENDING,
            log=f"Task created by scheduler for {config.name} at {datetime.utcnow().isoformat()}"
        )
        db_session.add(new_task)
        db_session.commit()
        db_session.refresh(new_task)

        logger.info(f"Scheduled task {new_task.id} for scraper '{config.name}' created. Starting scrape...")
        # Run the actual scraping in the background, not blocking the scheduler
        asyncio.create_task(scrape_website(new_task.id))

    except Exception as e:
        logger.error(f"Error in scheduled job for scraper {scraper_config_id}: {e}", exc_info=True)
    finally:
        if db_session:
            db_session.close()

def add_or_update_scheduler_job(db: Session, scraper_config: ScraperConfig):
    """Adds or updates a job in the scheduler based on ScraperConfig."""
    job_id = f"scraper_{scraper_config.id}"

    # Remove existing job if it exists
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Removed existing scheduler job for scraper {scraper_config.name} (ID: {scraper_config.id})")

    if scraper_config.is_active and scraper_config.schedule_cron:
        try:
            scheduler.add_job(
                _run_scraper_job,
                CronTrigger.from_crontab(scraper_config.schedule_cron),
                id=job_id,
                name=f"Scrape {scraper_config.name}",
                args=[scraper_config.id, scraper_config.owner_id]
            )
            logger.info(f"Added/Updated scheduler job for scraper {scraper_config.name} (ID: {scraper_config.id}) with cron: {scraper_config.schedule_cron}")
        except Exception as e:
            logger.error(f"Failed to add scheduler job for scraper {scraper_config.id} with cron '{scraper_config.schedule_cron}': {e}", exc_info=True)
    else:
        logger.info(f"Scraper {scraper_config.name} (ID: {scraper_config.id}) is inactive or has no schedule, no job added.")

def initialize_scheduler(db_session_factory: type[Session]):
    """Loads all active scraper configs from DB and adds them to the scheduler."""
    with db_session_factory() as db:
        active_scrapers = db.query(ScraperConfig).filter(ScraperConfig.is_active == True).all()
        for scraper in active_scrapers:
            if scraper.schedule_cron:
                add_or_update_scheduler_job(db, scraper)
    
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started and initialized with existing scraper jobs.")
    else:
        logger.info("APScheduler already running. Jobs reloaded.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down.")
```