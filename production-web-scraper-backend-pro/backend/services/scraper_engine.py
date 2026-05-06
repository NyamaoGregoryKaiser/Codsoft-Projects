```python
import asyncio
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, BrowserContext
import json
from datetime import datetime
from sqlalchemy.orm import Session
from cachetools import cached, TTLCache

from backend.models.scraper import ScraperConfig
from backend.models.task import ScrapingTask, ScrapingResult, TaskStatus
from backend.models.proxy import Proxy
from backend.models.user_agent import UserAgent
from backend.schemas.scraper import SelectorConfig
from backend.services import crud
from backend.core.logger import logger
from backend.core.database import SessionLocal # Import for creating new sessions in async context

# Cache for proxies and user agents to avoid frequent DB hits
proxy_cache = TTLCache(maxsize=100, ttl=300) # Cache for 5 minutes
user_agent_cache = TTLCache(maxsize=100, ttl=300) # Cache for 5 minutes

@cached(cache=proxy_cache)
def get_available_proxies_from_db():
    with SessionLocal() as db:
        proxies = db.query(Proxy).filter(Proxy.enabled == True).order_by(Proxy.last_used).all()
        return [p for p in proxies if p.address and p.port]

@cached(cache=user_agent_cache)
def get_available_user_agents_from_db():
    with SessionLocal() as db:
        user_agents = db.query(UserAgent).filter(UserAgent.enabled == True).order_by(UserAgent.last_used).all()
        return [ua.agent_string for ua in user_agents if ua.agent_string]

async def _get_context_with_proxy_and_ua(browser, use_proxy: bool, use_user_agent: bool) -> BrowserContext:
    context_options = {}

    if use_proxy:
        proxies = get_available_proxies_from_db()
        if proxies:
            # Simple round-robin or select least recently used
            proxy = proxies[0]
            proxy_url = f"http://{proxy.address}:{proxy.port}"
            if proxy.username and proxy.password:
                proxy_url = f"http://{proxy.username}:{proxy.password}@{proxy.address}:{proxy.port}"
            context_options["proxy"] = {"server": proxy_url}
            # Update last_used for proxy (outside of cache to not block reads)
            with SessionLocal() as db_session:
                db_proxy = db_session.query(Proxy).filter(Proxy.id == proxy.id).first()
                if db_proxy:
                    db_proxy.last_used = datetime.utcnow()
                    db_session.add(db_proxy)
                    db_session.commit()
            logger.debug(f"Using proxy: {proxy_url}")
        else:
            logger.warning("No enabled proxies available, continuing without proxy.")

    if use_user_agent:
        user_agents = get_available_user_agents_from_db()
        if user_agents:
            user_agent = user_agents[0] # Simple round-robin
            context_options["user_agent"] = user_agent
            # Update last_used for user agent
            with SessionLocal() as db_session:
                db_user_agent = db_session.query(UserAgent).filter(UserAgent.agent_string == user_agent).first()
                if db_user_agent:
                    db_user_agent.last_used = datetime.utcnow()
                    db_session.add(db_user_agent)
                    db_session.commit()
            logger.debug(f"Using user agent: {user_agent}")
        else:
            logger.warning("No enabled user agents available, continuing without user agent.")
            
    return await browser.new_context(**context_options)

async def _extract_element(page: Page, selector_config: SelectorConfig) -> Any:
    elements = await page.query_selector_all(selector_config.selector)
    if not elements:
        return None

    if selector_config.type == "list":
        results = []
        for el in elements:
            item_data = {}
            for field in selector_config.fields or []:
                # For list items, relative selectors are applied from the 'el'
                if not field.selector: # If sub-selector is empty, it refers to the element itself
                    sub_element_or_none = el
                else:
                    sub_element_or_none = await el.query_selector(field.selector)

                if sub_element_or_none:
                    if field.type == "text":
                        item_data[field.name] = await sub_element_or_none.text_content()
                    elif field.type == "html":
                        item_data[field.name] = await sub_element_or_none.inner_html()
                    elif field.type == "attribute" and field.attribute:
                        item_data[field.name] = await sub_element_or_none.get_attribute(field.attribute)
                    else:
                        logger.warning(f"Unsupported field type '{field.type}' or missing attribute for list item '{field.name}' in {selector_config.name}")
                else:
                    item_data[field.name] = None
            results.append(item_data)
        return results
    elif selector_config.type == "text":
        return await elements[0].text_content()
    elif selector_config.type == "html":
        return await elements[0].inner_html()
    elif selector_config.type == "attribute" and selector_config.attribute:
        return await elements[0].get_attribute(selector_config.attribute)
    elif selector_config.type == "screenshot":
        # This would usually save to a file/S3. For simplicity, we just return a placeholder.
        # In a real app, this would involve binary data handling.
        # await elements[0].screenshot(path=f"screenshot_{selector_config.name}.png")
        return f"Screenshot taken for {selector_config.name}"
    else:
        logger.warning(f"Unsupported selector type: {selector_config.type} for {selector_config.name}")
        return None


async def scrape_website(task_id: int):
    """
    Main scraping logic, run as a background task.
    Updates the ScrapingTask and stores ScrapingResult.
    """
    db_session: Optional[Session] = None
    task: Optional[ScrapingTask] = None
    try:
        # Create a new session for this async task
        db_session = SessionLocal()
        task = db_session.query(ScrapingTask).filter(ScrapingTask.id == task_id).first()

        if not task:
            logger.error(f"Task with ID {task_id} not found.")
            return

        config: ScraperConfig = task.config
        if not config:
            logger.error(f"ScraperConfig not found for task ID {task_id}. Aborting.")
            task.status = TaskStatus.FAILED
            task.log = "Scraper configuration not found."
            task.end_time = datetime.utcnow()
            db_session.add(task)
            db_session.commit()
            return

        task.status = TaskStatus.RUNNING
        task.start_time = datetime.utcnow()
        task.log = "Scraping started."
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task) # Refresh to get latest state

        logger.info(f"Starting scraping task {task_id} for '{config.name}' from {config.start_url}")

        extracted_data_list = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=config.headless)
            context = await _get_context_with_proxy_and_ua(browser, config.use_proxy, config.use_user_agent)
            page = await context.new_page()

            try:
                await page.goto(str(config.start_url), wait_until="domcontentloaded", timeout=60000)
                # await page.wait_for_load_state('networkidle') # Wait for network to be idle, can be slow

                selectors: List[SelectorConfig] = [SelectorConfig(**s) for s in json.loads(config.selectors_json)]

                for selector_config in selectors:
                    logger.info(f"Extracting '{selector_config.name}' using selector '{selector_config.selector}'")
                    extracted_value = await _extract_element(page, selector_config)
                    
                    if extracted_value is not None:
                        # If it's a list, extend the main data list, otherwise add as a single item
                        if selector_config.type == "list":
                            # If we expect a list of dictionaries, each dict is a result item
                            if isinstance(extracted_value, list) and all(isinstance(item, dict) for item in extracted_value):
                                extracted_data_list.extend(extracted_value)
                            else:
                                # Handle cases where a list of non-dicts (e.g., list of texts) is returned
                                extracted_data_list.append({selector_config.name: extracted_value})
                        else:
                            # For single items, create a dict
                            extracted_data_list.append({selector_config.name: extracted_value})

            except Exception as e:
                task.status = TaskStatus.FAILED
                task.log += f"\nError during scraping: {str(e)}"
                logger.error(f"Scraping task {task_id} failed: {e}", exc_info=True)
            finally:
                await browser.close()

        if extracted_data_list:
            # Store each extracted data item as a separate result, especially if we have lists of items
            results_stored_count = 0
            for item_data in extracted_data_list:
                result_obj_in = ScrapingResult(
                    scraping_task_id=task.id,
                    data=item_data
                )
                db_session.add(result_obj_in)
                results_stored_count += 1
            task.result_count = results_stored_count
            task.status = TaskStatus.COMPLETED
            task.log += f"\nScraping completed. Stored {results_stored_count} results."
            logger.info(f"Scraping task {task_id} completed. Stored {results_stored_count} results.")
        else:
            task.status = TaskStatus.COMPLETED
            task.log += "\nScraping completed, but no data was extracted."
            logger.info(f"Scraping task {task_id} completed, no data extracted.")

    except Exception as e:
        if task:
            task.status = TaskStatus.FAILED
            task.log += f"\nCritical error in task runner: {str(e)}"
        logger.error(f"Critical error in scrape_website for task {task_id}: {e}", exc_info=True)
    finally:
        if task:
            task.end_time = datetime.utcnow()
            if db_session:
                db_session.add(task)
                db_session.commit()
        if db_session:
            db_session.close()

```