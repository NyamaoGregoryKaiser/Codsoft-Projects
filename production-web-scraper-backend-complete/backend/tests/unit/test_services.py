import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import UnprocessableEntityException
from app.models.scraper import Scraper
from app.schemas.scraper import ScraperCreate
from app.services.scraper_service import ScraperService

@pytest.mark.asyncio
async def test_create_scraper_valid_rules(async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    scraper_in = ScraperCreate(
        name="Valid Scraper",
        target_url="http://example.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await scraper_service.create_scraper(scraper_in, test_user.id)
    assert scraper.name == scraper_in.name
    assert scraper.owner_id == test_user.id

@pytest.mark.asyncio
async def test_create_scraper_invalid_empty_rules(async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    scraper_in = ScraperCreate(
        name="Invalid Scraper",
        target_url="http://example.com",
        parse_rules={}
    )
    with pytest.raises(UnprocessableEntityException) as exc_info:
        await scraper_service.create_scraper(scraper_in, test_user.id)
    assert "Parse rules cannot be empty" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_create_scraper_missing_data_fields(async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    scraper_in = ScraperCreate(
        name="Invalid Scraper",
        target_url="http://example.com",
        parse_rules={"some_other_rule": "value"}
    )
    with pytest.raises(UnprocessableEntityException) as exc_info:
        await scraper_service.create_scraper(scraper_in, test_user.id)
    assert "Parse rules must contain a 'data_fields' dictionary" in str(exc_info.value.detail)

@pytest.mark.asyncio
@patch('app.worker.tasks.run_scraper_task.delay')
async def test_trigger_scraping_job(mock_delay, async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    scraper_in = ScraperCreate(
        name="Test Scraper",
        target_url="http://example.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await scraper_service.create_scraper(scraper_in, test_user.id)

    job = await scraper_service.trigger_scraping_job(scraper.id, test_user.id)
    assert job.scraper_id == scraper.id
    assert job.owner_id == test_user.id
    assert job.status == "PENDING"
    mock_delay.assert_called_once_with(job.id, str(scraper.target_url), scraper.parse_rules)

@pytest.mark.asyncio
async def test_trigger_scraping_job_scraper_not_found(async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    with pytest.raises(UnprocessableEntityException) as exc_info:
        await scraper_service.trigger_scraping_job(999, test_user.id)
    assert "Scraper with ID 999 not found" in str(exc_info.value.detail)

@pytest.mark.asyncio
@patch('httpx.AsyncClient.get')
async def test_execute_scraper_success(mock_get, async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    
    # Mock httpx response
    mock_response = AsyncMock()
    mock_response.text = "<html><body><h1>Test Title</h1><span class='price'>$19.99</span><a class='link' href='/product'>Link</a></body></html>"
    mock_response.raise_for_status.return_value = None
    mock_get.return_value.__aenter__.return_value = mock_response

    # Create a scraper and a job
    scraper_in = ScraperCreate(
        name="Mock Scraper",
        target_url="http://mock.com",
        parse_rules={
            "data_fields": {
                "title": "h1::text",
                "price": "span.price::text",
                "product_link": "a.link::href"
            }
        }
    )
    scraper = await scraper_service.create_scraper(scraper_in, test_user.id)
    job = await scraper_service.trigger_scraping_job(scraper.id, test_user.id) # This will create a PENDING job

    # Directly call execute_scraper as it's meant for the worker
    await scraper_service.execute_scraper(job.id, str(scraper.target_url), scraper.parse_rules)

    updated_job = await scraper_service.db.get(job.__class__, job.id)
    assert updated_job.status == "COMPLETED"
    assert updated_job.completed_at is not None
    assert "Saved 1 results." in updated_job.log_output

    results = await scraper_service.db.execute(
        scraper_service.db.query(scraper_service.db.ScrapedData).filter_by(job_id=job.id)
    )
    scraped_data_list = results.scalars().all()
    assert len(scraped_data_list) == 1
    assert scraped_data_list[0].data["title"] == "Test Title"
    assert scraped_data_list[0].data["price"] == "$19.99"
    assert scraped_data_list[0].data["product_link"] == "/product"

@pytest.mark.asyncio
@patch('httpx.AsyncClient.get', side_effect=httpx.HTTPStatusError("404 Not Found", request=httpx.Request("GET", "http://mock.com"), response=httpx.Response(404)))
async def test_execute_scraper_http_error(mock_get, async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    
    scraper_in = ScraperCreate(
        name="Mock Scraper",
        target_url="http://mock.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await scraper_service.create_scraper(scraper_in, test_user.id)
    job = await scraper_service.trigger_scraping_job(scraper.id, test_user.id)

    await scraper_service.execute_scraper(job.id, str(scraper.target_url), scraper.parse_rules)

    updated_job = await scraper_service.db.get(job.__class__, job.id)
    assert updated_job.status == "FAILED"
    assert "HTTP error" in updated_job.log_output

@pytest.mark.asyncio
@patch('httpx.AsyncClient.get', side_effect=httpx.RequestError("DNS lookup failed", request=httpx.Request("GET", "http://mock.com")))
async def test_execute_scraper_network_error(mock_get, async_test_session: AsyncSession, test_user):
    scraper_service = ScraperService(async_test_session)
    
    scraper_in = ScraperCreate(
        name="Mock Scraper",
        target_url="http://mock.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await scraper_service.create_scraper(scraper_in, test_user.id)
    job = await scraper_service.trigger_scraping_job(scraper.id, test_user.id)

    await scraper_service.execute_scraper(job.id, str(scraper.target_url), scraper.parse_rules)

    updated_job = await scraper_service.db.get(job.__class__, job.id)
    assert updated_job.status == "FAILED"
    assert "Network error" in updated_job.log_output
```
---