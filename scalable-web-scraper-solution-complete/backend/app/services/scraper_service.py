import httpx
from bs4 import BeautifulSoup
import json
from typing import List, Dict, Any, Optional

class ScraperService:
    def __init__(self, user_agent: str = "WebScraperSystem/1.0 (+http://yourdomain.com/)",
                 timeout: int = 10):
        self.headers = {"User-Agent": user_agent}
        self.timeout = timeout

    async def fetch_page(self, url: str) -> httpx.Response:
        """Fetches a web page using httpx."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, headers=self.headers, follow_redirects=True)
            response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
            return response

    async def parse_html_by_css(self, html_content: str, css_selector: str) -> List[Dict[str, Any]]:
        """Parses HTML content using BeautifulSoup and CSS selectors."""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        results = []
        
        if not css_selector:
            # If no specific selector, return the entire body text
            return [{"text_content": soup.body.get_text(separator=" ", strip=True)}]

        # Handle multiple selectors if separated by comma
        selectors = [s.strip() for s in css_selector.split(',') if s.strip()]

        for selector in selectors:
            elements = soup.select(selector)
            for i, element in enumerate(elements):
                # Basic extraction: text, href (if link), src (if image), and data attributes
                item_data = {
                    "selector": selector,
                    "index": i,
                    "text": element.get_text(strip=True)
                }
                if element.name == 'a':
                    item_data["href"] = element.get('href')
                if element.name == 'img':
                    item_data["src"] = element.get('src')
                
                # Extract common data attributes
                for attr, value in element.attrs.items():
                    if attr.startswith('data-'):
                        item_data[attr] = value
                
                results.append(item_data)
        
        return results

    async def scrape(self, url: str, css_selector: Optional[str] = None) -> Dict[str, Any]:
        """
        Main scraping method. Fetches page and extracts data based on CSS selector.
        Returns a dictionary with 'data', 'status_code', and 'error_message'.
        """
        response_data = {
            "data": {},
            "status_code": None,
            "error_message": None
        }
        try:
            response = await self.fetch_page(url)
            response_data["status_code"] = response.status_code
            
            if response.status_code == 200:
                scraped_items = await self.parse_html_by_css(response.text, css_selector)
                response_data["data"] = {"url": url, "scraped_items": scraped_items}
            else:
                response_data["error_message"] = f"HTTP Error: {response.status_code} - {response.reason_phrase}"

        except httpx.HTTPStatusError as e:
            response_data["status_code"] = e.response.status_code
            response_data["error_message"] = f"HTTP status error for {e.request.url}: {e.response.status_code} {e.response.reason_phrase}"
        except httpx.RequestError as e:
            response_data["error_message"] = f"An error occurred while requesting {e.request.url}: {e}"
        except Exception as e:
            response_data["error_message"] = f"An unexpected error occurred: {e}"
        
        return response_data

scraper_service = ScraperService()

if __name__ == "__main__":
    import asyncio
    
    async def run_test_scrape():
        print("Testing ScraperService...")
        
        # Example 1: Scrape a general page without specific selector (will get body text)
        print("\n--- Scraping without specific CSS selector ---")
        result1 = await scraper_service.scrape("http://quotes.toscrape.com/")
        print(f"Status Code: {result1['status_code']}")
        print(f"Error: {result1['error_message']}")
        # print(f"Data: {json.dumps(result1['data'], indent=2)}") # This can be very long

        # Example 2: Scrape specific elements
        print("\n--- Scraping specific CSS selectors (quotes and authors) ---")
        result2 = await scraper_service.scrape("http://quotes.toscrape.com/", "div.quote span.text, small.author")
        print(f"Status Code: {result2['status_code']}")
        print(f"Error: {result2['error_message']}")
        if result2['data']:
            print(f"Number of scraped items: {len(result2['data'].get('scraped_items', []))}")
            for item in result2['data'].get('scraped_items', [])[:5]: # Print first 5 items
                print(f"- {item.get('selector')}: {item.get('text')}")

        # Example 3: Scrape a non-existent page
        print("\n--- Scraping a non-existent page ---")
        result3 = await scraper_service.scrape("http://quotes.toscrape.com/non-existent")
        print(f"Status Code: {result3['status_code']}")
        print(f"Error: {result3['error_message']}")
        print(f"Data: {json.dumps(result3['data'], indent=2)}")

    asyncio.run(run_test_scrape())
```