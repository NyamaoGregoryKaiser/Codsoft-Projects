import logging
from typing import List, Dict, Any, Optional

from playwright.async_api import async_playwright, BrowserContext, Page, TimeoutError as PlaywrightTimeoutError

from app.core.config import settings
from app.core.exceptions import ScraperRunError
from app.schemas.scraper import ParsingRule

logger = logging.getLogger(__name__)

async def extract_data_from_page(page: Page, parsing_rules: ParsingRule) -> List[Dict[str, Any]]:
    """Extracts data from the current page based on parsing rules."""
    scraped_items = []
    
    # Ensure parsing_rules is an instance of ParsingRule
    if isinstance(parsing_rules, dict):
        parsing_rules = ParsingRule(**parsing_rules)

    await page.wait_for_selector(parsing_rules.item_selector, timeout=settings.PLAYWRIGHT_TIMEOUT)
    item_elements = await page.query_selector_all(parsing_rules.item_selector)

    if not item_elements:
        logger.warning(f"No items found with selector: {parsing_rules.item_selector} on {page.url}")
        return []

    for item_el in item_elements:
        item_data: Dict[str, Any] = {}
        for field_name, selector in parsing_rules.fields.items():
            # Try to get text content, fall back to attribute if selector implies it (e.g., img src)
            element = await item_el.query_selector(selector)
            if element:
                if "::attr(" in selector: # Basic check for attribute extraction
                    attr_name = selector.split("::attr(")[1].rstrip(")")
                    value = await element.get_attribute(attr_name)
                else:
                    value = await element.text_content()
                item_data[field_name] = value.strip() if value else None
            else:
                item_data[field_name] = None
        scraped_items.append({"data": item_data, "source_url": page.url})
    return scraped_items

async def run_scraper_logic(
    scraper_id: int, 
    start_url: str, 
    parsing_rules_dict: Dict[str, Any], 
    user_id: int # Not directly used here, but could be for logging/auditing
) -> List[Dict[str, Any]]:
    """
    Main asynchronous function to run the web scraper using Playwright.
    """
    all_scraped_data: List[Dict[str, Any]] = []
    
    try:
        parsing_rules = ParsingRule(**parsing_rules_dict)
    except Exception as e:
        raise ScraperRunError(f"Invalid parsing rules format: {e}")

    logger.info(f"Scraper {scraper_id}: Launching Playwright for {start_url}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=settings.PLAYWRIGHT_HEADLESS)
        context: BrowserContext = await browser.new_context(
            user_agent=settings.DEFAULT_USER_AGENT,
            viewport={"width": 1280, "height": 720},
            ignore_https_errors=True,
            java_script_enabled=True
        )
        context.set_default_timeout(settings.PLAYWRIGHT_TIMEOUT)
        page: Page = await context.new_page()

        try:
            current_url = start_url
            while True:
                logger.info(f"Scraper {scraper_id}: Navigating to {current_url}")
                await page.goto(current_url, wait_until="domcontentloaded")
                await page.wait_for_load_state("networkidle")

                page_data = await extract_data_from_page(page, parsing_rules)
                all_scraped_data.extend(page_data)

                if parsing_rules.next_page_selector:
                    next_button = await page.query_selector(parsing_rules.next_page_selector)
                    if next_button and await next_button.is_enabled():
                        current_url_before_click = page.url
                        await next_button.click()
                        await page.wait_for_timeout(2000) # Wait a bit for navigation
                        if page.url == current_url_before_click: # Check if navigation actually happened
                            logger.info(f"Scraper {scraper_id}: Next page button clicked, but URL didn't change. Assuming end of pagination.")
                            break
                        current_url = page.url
                    else:
                        logger.info(f"Scraper {scraper_id}: No next page button found or it's disabled. Ending pagination.")
                        break
                else:
                    logger.info(f"Scraper {scraper_id}: No next_page_selector defined. Single page scrape complete.")
                    break
        except PlaywrightTimeoutError as e:
            raise ScraperRunError(f"Playwright timeout during navigation or element waiting: {e}")
        except Exception as e:
            logger.error(f"Scraper {scraper_id} encountered an error: {e}")
            raise ScraperRunError(f"Scraping failed: {e}")
        finally:
            await browser.close()
    
    logger.info(f"Scraper {scraper_id}: Finished. Total items scraped: {len(all_scraped_data)}")
    return all_scraped_data