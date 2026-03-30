import logging
import asyncio
from datetime import datetime

from celery import Celery
from playwright.async_api import async_playwright, BrowserContext, Page, TimeoutError as PlaywrightTimeoutError

from app.core.config import settings
from app.core.exceptions import ScraperRunError
from app.db.session import SessionLocal
from app import crud, schemas
from app.services.scraper_runner import run_scraper_logic

logger = logging.getLogger(__name__)

celery_app = Celery(
    "web_scraping_system",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_track_started=True,
    task_time_limit=settings.PLAYWRIGHT_TIMEOUT * 2 / 1000, # Set Celery task timeout longer than Playwright timeout
    worker_concurrency=settings.MAX_CONCURRENT_SCRAPER_RUNS,
    worker_prefetch_multiplier=1
)

@celery_app.task(bind=True, name="scrape_task")
def scrape_task(self, job_id: int, scraper_id: int, user_id: int):
    """
    Celery task to run a specific web scraper.
    """
    logger.info(f"Starting Celery task for job {job_id}, scraper {scraper_id}")
    db = SessionLocal()
    job = crud.job.get(db, id=job_id)
    scraper = crud.scraper.get(db, id=scraper_id)

    if not job or not scraper:
        logger.error(f"Job {job_id} or Scraper {scraper_id} not found.")
        if job:
            crud.job.update(db, db_obj=job, obj_in={"status": "failed", "error_message": "Scraper or Job not found."})
        db.close()
        return

    # Update job status to running
    crud.job.update(db, db_obj=job, obj_in={"status": "running", "started_at": datetime.utcnow()})
    db.close() # Close session for this thread, new one for async

    try:
        # Run the actual Playwright logic in an async loop
        scraped_data_list = asyncio.run(run_scraper_logic(scraper_id, scraper.start_url, scraper.parsing_rules.model_dump(), user_id))

        # Reopen DB session for result processing
        db = SessionLocal()
        job = crud.job.get(db, id=job_id) # Refresh job object
        if not job:
            logger.error(f"Job {job_id} not found after scraping.")
            db.close()
            return

        for data_item in scraped_data_list:
            scraped_item_in = schemas.ScrapedItemCreate(
                scraper_id=scraper_id,
                job_id=job_id,
                data=data_item["data"],
                source_url=data_item.get("source_url")
            )
            crud.scraped_item.create(db, obj_in=scraped_item_in)
        
        crud.job.update(db, db_obj=job, obj_in={
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "result_count": len(scraped_data_list)
        })
        logger.info(f"Celery task for job {job_id} completed successfully. Scraped {len(scraped_data_list)} items.")

    except ScraperRunError as e:
        logger.error(f"Scraper run error for job {job_id}: {e}")
        db = SessionLocal() # Reopen session if needed
        job = crud.job.get(db, id=job_id)
        if job:
            crud.job.update(db, db_obj=job, obj_in={"status": "failed", "error_message": str(e)})
    except PlaywrightTimeoutError as e:
        logger.error(f"Playwright timeout error for job {job_id}: {e}")
        db = SessionLocal()
        job = crud.job.get(db, id=job_id)
        if job:
            crud.job.update(db, db_obj=job, obj_in={"status": "failed", "error_message": f"Playwright Timeout: {e}"})
    except Exception as e:
        logger.exception(f"Unhandled exception during scraping task for job {job_id}")
        db = SessionLocal()
        job = crud.job.get(db, id=job_id)
        if job:
            crud.job.update(db, db_obj=job, obj_in={"status": "failed", "error_message": f"Unhandled Error: {e}"})
    finally:
        db.close()