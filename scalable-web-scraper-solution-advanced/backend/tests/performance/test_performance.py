# locustfile.py
from locust import HttpUser, task, between
import json

class WebScrapingSystemUser(HttpUser):
    wait = between(1, 2.5) # Users wait between 1 and 2.5 seconds between tasks

    host = "http://localhost:8000" # Replace with your backend URL for actual testing
    
    # Store token for subsequent requests
    token = None
    scraper_id = None

    def on_start(self):
        """
        Called when a Locust user starts. Authenticate and get a token.
        """
        self.login()
        if self.token:
            self.create_test_scraper()

    def login(self):
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "testadmin@example.com", "password": "testpassword"},
            name="/auth/login"
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.client.headers = {"Authorization": f"Bearer {self.token}"}
            print(f"Logged in, token: {self.token[:10]}...")
        else:
            print(f"Login failed: {response.status_code}, {response.text}")
            self.environment.runner.quit() # Stop if login fails

    def create_test_scraper(self):
        scraper_data = {
            "name": "Perf Test Scraper",
            "description": "Scrapes a simple page for performance testing",
            "start_url": "http://quotes.toscrape.com/",
            "parsing_rules": {
                "item_selector": ".quote",
                "fields": {"text": "span.text", "author": "small.author"},
                "next_page_selector": "li.next > a"
            }
        }
        response = self.client.post(
            "/api/v1/scrapers/",
            json=scraper_data,
            name="/scrapers/create"
        )
        if response.status_code == 200:
            self.scraper_id = response.json()["id"]
            print(f"Test scraper created with ID: {self.scraper_id}")
        else:
            print(f"Failed to create scraper: {response.status_code}, {response.text}")

    @task(3) # 3 times more likely to run than task(1)
    def list_scrapers(self):
        self.client.get("/api/v1/scrapers/", name="/scrapers/list")

    @task(2)
    def read_scraper(self):
        if self.scraper_id:
            self.client.get(f"/api/v1/scrapers/{self.scraper_id}", name="/scrapers/{id}")

    @task(1)
    def run_scraper(self):
        if self.scraper_id:
            self.client.post(f"/api/v1/scrapers/{self.scraper_id}/run", name="/scrapers/{id}/run")
    
    @task(1)
    def list_jobs(self):
        self.client.get("/api/v1/jobs/", name="/jobs/list")
    
    @task(1)
    def list_scraped_data(self):
        if self.scraper_id:
            self.client.get(f"/api/v1/data/?scraper_id={self.scraper_id}", name="/data/list_by_scraper")

# To run this locustfile:
# 1. Make sure your Docker Compose setup is running (db, redis, backend, celery_worker, celery_flower)
# 2. cd into `web-scraping-system/backend`
# 3. `pip install locust`
# 4. `locust -f tests/performance/test_performance.py`
# 5. Open your browser to http://localhost:8089 (default Locust UI)
# 6. Start the test with desired number of users and spawn rate.