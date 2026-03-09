import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal

import httpx
from bs4 import BeautifulSoup
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

from app.core.database import get_db
from app.core.exceptions import UnprocessableEntityException
from app.crud.job import job as crud_job
from app.crud.result import scraped_data as crud_scraped_data
from app.crud.scraper import scraper as crud_scraper
from app.models.job import ScrapingJob
from app.models.scraper import Scraper
from app.schemas.job import JobUpdate
from app.schemas.result import ScrapedDataCreate
from app.schemas.scraper import ScraperCreate
from app.worker.tasks import run_scraper_task  # Import the Celery task

logger = logging.getLogger(__name__)

class ScraperService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def create_scraper(self, scraper_in: ScraperCreate, owner_id: int) -> Scraper:
        """Creates a new scraper."""
        # Add basic validation for parse rules
        if not scraper_in.parse_rules:
            raise UnprocessableEntityException(detail="Parse rules cannot be empty.")
        if not isinstance(scraper_in.parse_rules, dict):
            raise UnprocessableEntityException(detail="Parse rules must be a JSON object.")
        
        # Check if 'data_fields' is defined for structured data extraction
        if "data_fields" not in scraper_in.parse_rules or not isinstance(scraper_in.parse_rules["data_fields"], dict):
            raise UnprocessableEntityException(detail="Parse rules must contain a 'data_fields' dictionary.")

        return await crud_scraper.create(self.db, obj_in=scraper_in, owner_id=owner_id)

    async def trigger_scraping_job(self, scraper_id: int, owner_id: int) -> ScrapingJob:
        """Triggers an asynchronous scraping job via Celery."""
        scraper_db = await crud_scraper.get(self.db, id=scraper_id)
        if not scraper_db:
            raise UnprocessableEntityException(detail=f"Scraper with ID {scraper_id} not found.")
        if scraper_db.owner_id != owner_id:
            raise UnprocessableEntityException(detail=f"Scraper with ID {scraper_id} does not belong to user.")

        job_create_data = {"scraper_id": scraper_id, "owner_id": owner_id, "status": "PENDING"}
        job = await crud_job.create(self.db, obj_in=job_create_data) # owner_id is already in obj_in for job.create
        
        # Enqueue the scraping task
        run_scraper_task.delay(job.id, scraper_db.target_url, scraper_db.parse_rules)
        logger.info(f"Scraping job {job.id} for scraper {scraper_id} enqueued.")

        return job

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2), retry=retry_if_exception_type(httpx.RequestError))
    async def _fetch_page_content(self, url: str) -> str:
        """Fetches HTML content from a given URL."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()  # Raise an exception for HTTP errors
            return response.text

    async def execute_scraper(self, job_id: int, target_url: str, parse_rules: Dict[str, Any]):
        """
        Executes the scraping logic for a given job.
        This method is designed to be called by the Celery worker.
        """
        log_output = []
        try:
            logger.info(f"Starting scrape for job {job_id} at {target_url}")
            await crud_job.update(self.db, db_obj=await crud_job.get(self.db, id=job_id),
                                  obj_in=JobUpdate(status="RUNNING", started_at=datetime.now(timezone.utc)))
            log_output.append(f"[{datetime.now(timezone.utc)}] Job {job_id}: Started fetching {target_url}")

            html_content = await self._fetch_page_content(str(target_url))
            soup = BeautifulSoup(html_content, 'html.parser')
            log_output.append(f"[{datetime.now(timezone.utc)}] Job {job_id}: Successfully fetched content.")

            scraped_items: List[Dict[str, Any]] = self._parse_content(soup, parse_rules)
            log_output.append(f"[{datetime.now(timezone.utc)}] Job {job_id}: Found {len(scraped_items)} items.")

            scraper_id = (await crud_job.get(self.db, id=job_id)).scraper_id
            for item_data in scraped_items:
                await crud_scraped_data.create(self.db,
                                               obj_in=ScrapedDataCreate(
                                                   job_id=job_id,
                                                   scraper_id=scraper_id,
                                                   data=item_data,
                                               ))
            log_output.append(f"[{datetime.now(timezone.utc)}] Job {job_id}: Saved {len(scraped_items)} results.")

            await crud_job.update(self.db, db_obj=await crud_job.get(self.db, id=job_id),
                                  obj_in=JobUpdate(status="COMPLETED", completed_at=datetime.now(timezone.utc),
                                                   log_output="\n".join(log_output)))
            logger.info(f"Job {job_id} completed successfully.")

        except httpx.HTTPStatusError as e:
            error_msg = f"[{datetime.now(timezone.utc)}] Job {job_id}: HTTP error for {target_url}: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg, exc_info=True)
            log_output.append(error_msg)
            await crud_job.update(self.db, db_obj=await crud_job.get(self.db, id=job_id),
                                  obj_in=JobUpdate(status="FAILED", completed_at=datetime.now(timezone.utc),
                                                   log_output="\n".join(log_output)))
        except httpx.RequestError as e:
            error_msg = f"[{datetime.now(timezone.utc)}] Job {job_id}: Network error for {target_url}: {e}"
            logger.error(error_msg, exc_info=True)
            log_output.append(error_msg)
            await crud_job.update(self.db, db_obj=await crud_job.get(self.db, id=job_id),
                                  obj_in=JobUpdate(status="FAILED", completed_at=datetime.now(timezone.utc),
                                                   log_output="\n".join(log_output)))
        except Exception as e:
            error_msg = f"[{datetime.now(timezone.utc)}] Job {job_id}: An unexpected error occurred: {e}"
            logger.error(error_msg, exc_info=True)
            log_output.append(error_msg)
            await crud_job.update(self.db, db_obj=await crud_job.get(self.db, id=job_id),
                                  obj_in=JobUpdate(status="FAILED", completed_at=datetime.now(timezone.utc),
                                                   log_output="\n".join(log_output)))


    def _parse_content(self, soup: BeautifulSoup, parse_rules: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parses the BeautifulSoup object based on provided rules.
        Expected `parse_rules` structure:
        {
            "item_selector": "div.product", # Optional, if multiple items per page
            "data_fields": {
                "title": "h2.title",
                "price": "span.price::text", # ::text to get text content
                "link": "a.product-link::href" # ::attr_name to get attribute
            }
        }
        """
        data_fields = parse_rules.get("data_fields", {})
        item_selector = parse_rules.get("item_selector")

        if not data_fields:
            logger.warning("No data_fields defined in parse rules.")
            return []

        if item_selector:
            items = soup.select(item_selector)
        else:
            items = [soup] # Treat the whole page as a single item if no item_selector

        scraped_results = []
        for item in items:
            extracted_data = {}
            for field_name, selector_rule in data_fields.items():
                selector_parts = selector_rule.split("::")
                selector = selector_parts[0]
                attribute = selector_parts[1] if len(selector_parts) > 1 else None

                element = item.select_one(selector)
                if element:
                    if attribute == "text":
                        extracted_data[field_name] = element.get_text(strip=True)
                    elif attribute and element.has_attr(attribute):
                        extracted_data[field_name] = element.get(attribute)
                    else: # Default to text if no specific attribute requested or not found
                        extracted_data[field_name] = element.get_text(strip=True)
                else:
                    extracted_data[field_name] = None # Field not found

            if any(extracted_data.values()): # Only add if at least one field was extracted
                scraped_results.append(extracted_data)

        return scraped_results
```
---