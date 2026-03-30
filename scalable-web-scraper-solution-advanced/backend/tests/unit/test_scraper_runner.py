import pytest
from unittest.mock import AsyncMock, MagicMock
from app.schemas.scraper import ParsingRule
from app.services.scraper_runner import extract_data_from_page
from app.core.config import settings

@pytest.mark.asyncio
async def test_extract_data_from_page():
    # Mock a Playwright Page object
    mock_page = AsyncMock()
    mock_page.url = "http://mock.com/page1"

    # Mock item_elements and their sub-elements
    mock_item_el1 = AsyncMock()
    mock_item_el1.query_selector.side_effect = [
        AsyncMock(text_content=AsyncMock(return_value="Quote 1 Text")),
        AsyncMock(text_content=AsyncMock(return_value="Author 1 Name"))
    ]
    mock_item_el2 = AsyncMock()
    mock_item_el2.query_selector.side_effect = [
        AsyncMock(text_content=AsyncMock(return_value="Quote 2 Text")),
        AsyncMock(text_content=AsyncMock(return_value="Author 2 Name"))
    ]

    mock_page.query_selector_all.return_value = [mock_item_el1, mock_item_el2]
    mock_page.wait_for_selector.return_value = None # Assume selector is found

    parsing_rules = ParsingRule(
        item_selector=".quote",
        fields={
            "text": "span.text",
            "author": "small.author"
        }
    )

    scraped_data = await extract_data_from_page(mock_page, parsing_rules)

    assert len(scraped_data) == 2
    assert scraped_data[0]["data"]["text"] == "Quote 1 Text"
    assert scraped_data[0]["data"]["author"] == "Author 1 Name"
    assert scraped_data[0]["source_url"] == "http://mock.com/page1"
    assert scraped_data[1]["data"]["text"] == "Quote 2 Text"
    assert scraped_data[1]["data"]["author"] == "Author 2 Name"
    assert scraped_data[1]["source_url"] == "http://mock.com/page1"

    mock_page.wait_for_selector.assert_called_once_with(parsing_rules.item_selector, timeout=settings.PLAYWRIGHT_TIMEOUT)
    mock_page.query_selector_all.assert_called_once_with(parsing_rules.item_selector)
    mock_item_el1.query_selector.assert_any_call("span.text")
    mock_item_el1.query_selector.assert_any_call("small.author")


@pytest.mark.asyncio
async def test_extract_data_from_page_no_items_found():
    mock_page = AsyncMock()
    mock_page.url = "http://mock.com/empty"
    mock_page.query_selector_all.return_value = [] # No items found
    mock_page.wait_for_selector.return_value = None

    parsing_rules = ParsingRule(
        item_selector=".nonexistent-quote",
        fields={"text": "span.text"}
    )

    scraped_data = await extract_data_from_page(mock_page, parsing_rules)
    assert len(scraped_data) == 0

    mock_page.wait_for_selector.assert_called_once()
    mock_page.query_selector_all.assert_called_once()

@pytest.mark.asyncio
async def test_extract_data_from_page_with_missing_fields():
    mock_page = AsyncMock()
    mock_page.url = "http://mock.com/partial"

    mock_item_el = AsyncMock()
    mock_item_el.query_selector.side_effect = [
        AsyncMock(text_content=AsyncMock(return_value="Partial Quote")), # text field
        None # author field will not be found
    ]
    mock_page.query_selector_all.return_value = [mock_item_el]
    mock_page.wait_for_selector.return_value = None

    parsing_rules = ParsingRule(
        item_selector=".item",
        fields={
            "text": ".text",
            "author": ".nonexistent-author"
        }
    )

    scraped_data = await extract_data_from_page(mock_page, parsing_rules)
    assert len(scraped_data) == 1
    assert scraped_data[0]["data"]["text"] == "Partial Quote"
    assert scraped_data[0]["data"]["author"] is None