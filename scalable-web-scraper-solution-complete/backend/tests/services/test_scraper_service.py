import pytest
from httpx import Response, Request
from httpx_mock import HTTPXMock
from app.services.scraper_service import ScraperService

@pytest.fixture
def scraper_service_instance():
    return ScraperService()

@pytest.mark.asyncio
async def test_fetch_page_success(httpx_mock: HTTPXMock, scraper_service_instance: ScraperService):
    test_url = "http://example.com"
    test_html = "<h1>Test Title</h1>"
    httpx_mock.add_response(url=test_url, text=test_html, status_code=200)

    response = await scraper_service_instance.fetch_page(test_url)
    assert response.status_code == 200
    assert response.text == test_html

@pytest.mark.asyncio
async def test_fetch_page_http_error(httpx_mock: HTTPXMock, scraper_service_instance: ScraperService):
    test_url = "http://example.com/404"
    httpx_mock.add_response(url=test_url, status_code=404)

    with pytest.raises(httpx.HTTPStatusError) as excinfo:
        await scraper_service_instance.fetch_page(test_url)
    assert excinfo.value.response.status_code == 404

@pytest.mark.asyncio
async def test_parse_html_by_css_single_selector(scraper_service_instance: ScraperService):
    html_content = """
    <html><body>
        <h1>Title 1</h1>
        <p>Paragraph text</p>
        <h1>Title 2</h1>
    </body></html>
    """
    results = await scraper_service_instance.parse_html_by_css(html_content, "h1")
    assert len(results) == 2
    assert results[0]["text"] == "Title 1"
    assert results[1]["text"] == "Title 2"

@pytest.mark.asyncio
async def test_parse_html_by_css_multiple_selectors(scraper_service_instance: ScraperService):
    html_content = """
    <html><body>
        <div class="quote"><span class="text">Quote 1</span><small class="author">Author 1</small></div>
        <div class="quote"><span class="text">Quote 2</span><small class="author">Author 2</small></div>
    </body></html>
    """
    results = await scraper_service_instance.parse_html_by_css(html_content, "span.text, small.author")
    assert len(results) == 4
    texts = [item["text"] for item in results]
    assert "Quote 1" in texts
    assert "Author 1" in texts
    assert "Quote 2" in texts
    assert "Author 2" in texts

@pytest.mark.asyncio
async def test_parse_html_by_css_no_selector_entire_body(scraper_service_instance: ScraperService):
    html_content = """
    <html><body>
        <h1>Title</h1>
        <p>Some text content.</p>
    </body></html>
    """
    results = await scraper_service_instance.parse_html_by_css(html_content, "")
    assert len(results) == 1
    assert "text_content" in results[0]
    assert "Title Some text content." in results[0]["text_content"]

@pytest.mark.asyncio
async def test_scrape_success(httpx_mock: HTTPXMock, scraper_service_instance: ScraperService):
    test_url = "http://test.com/page"
    test_html = "<div><p class='content'>Hello Scraper</p><a href='/link'>Link</a></div>"
    httpx_mock.add_response(url=test_url, text=test_html, status_code=200)

    result = await scraper_service_instance.scrape(test_url, "p.content, a")
    assert result["status_code"] == 200
    assert result["error_message"] is None
    assert "scraped_items" in result["data"]
    scraped_items = result["data"]["scraped_items"]
    assert len(scraped_items) == 2
    assert scraped_items[0]["text"] == "Hello Scraper"
    assert scraped_items[1]["href"] == "/link"

@pytest.mark.asyncio
async def test_scrape_http_error_handling(httpx_mock: HTTPXMock, scraper_service_instance: ScraperService):
    test_url = "http://test.com/error"
    httpx_mock.add_response(url=test_url, status_code=500)

    result = await scraper_service_instance.scrape(test_url, "div")
    assert result["status_code"] == 500
    assert "HTTP status error" in result["error_message"]
    assert result["data"] == {} # No data scraped on error

@pytest.mark.asyncio
async def test_scrape_request_error_handling(httpx_mock: HTTPXMock, scraper_service_instance: ScraperService):
    test_url = "http://nonexistent-domain.com"
    # httpx_mock.add_exception(httpx.RequestError("DNS lookup failed")) # This is hard to mock for arbitrary domain

    # Instead of mocking a DNS error, we can mock a connection error for a valid URL
    httpx_mock.add_exception(httpx.ConnectError("Connection refused"), url=test_url)

    result = await scraper_service_instance.scrape(test_url, "div")
    assert result["status_code"] is None # No HTTP status received
    assert "An error occurred while requesting" in result["error_message"]
    assert result["data"] == {}

```