from locust import HttpUser, task, between
import json

class WebScrapingUser(HttpUser):
    wait_time = between(1, 5)  # Users wait between 1 and 5 seconds between tasks
    host = "http://localhost:8000" # Change this if your backend is on a different host/port

    # Store user and scraper IDs for chained requests
    user_id = None
    scraper_id = None
    job_id = None
    auth_token = None

    def on_start(self):
        """Called when a user starts a new test run"""
        self.login()

    def login(self):
        """Logs in a test user and stores the auth token."""
        # For simplicity, we'll register a unique user for each locust user
        # In a real scenario, you'd use a pool of existing users.
        email = f"locust_user_{self.environment.stats.num_requests}@example.com"
        password = "locustpassword"

        self.environment.runner.logger.info(f"Attempting to register and login user: {email}")

        # Register user
        reg_response = self.client.post("/api/v1/auth/register", json={"email": email, "password": password}, name="/auth/register [register]")
        if reg_response.status_code == 201 or (reg_response.status_code == 409 and "already exists" in reg_response.text):
            self.environment.runner.logger.info(f"User {email} registered or already exists.")
        else:
            self.environment.runner.logger.error(f"Failed to register user {email}: {reg_response.text}")
            reg_response.raise_for_status()


        # Login
        login_data = {"username": email, "password": password}
        login_response = self.client.post("/api/v1/auth/login", data=login_data, name="/auth/login [login]")
        if login_response.status_code == 200:
            self.auth_token = login_response.json()["access_token"]
            self.environment.runner.logger.info(f"Logged in user: {email}")
        else:
            self.environment.runner.logger.error(f"Failed to login user {email}: {login_response.text}")
            login_response.raise_for_status()

    @task(3) # Higher weight, more frequent
    def get_scrapers(self):
        """Gets a list of all scrapers for the user."""
        if not self.auth_token:
            return self.login()

        with self.client.get("/api/v1/scrapers/", headers={"Authorization": f"Bearer {self.auth_token}"}, catch_response=True, name="/scrapers/ [list]") as response:
            if response.status_code == 200:
                scrapers = response.json()
                if scrapers:
                    self.scraper_id = scrapers[0]["id"] # Store first scraper ID for later use
                response.success()
            elif response.status_code == 401:
                self.environment.runner.logger.warning("Auth token expired or invalid, re-logging in.")
                response.failure("Unauthorized, re-logging")
                self.login()
            else:
                response.failure(f"Failed to get scrapers: {response.text}")

    @task(2)
    def create_scraper(self):
        """Creates a new scraper."""
        if not self.auth_token:
            return self.login()
        
        scraper_name = f"Locust Scraper {self.environment.stats.num_requests}"
        scraper_data = {
            "name": scraper_name,
            "description": "Scraper created by Locust test",
            "target_url": f"http://quotes.toscrape.com/page/{self.environment.stats.num_requests % 10 + 1}", # Rotate target URLs
            "parse_rules": {
                "data_fields": {
                    "text": "span.text::text",
                    "author": "small.author::text",
                    "tags": "div.tags a.tag::text"
                },
                "item_selector": "div.quote"
            }
        }
        with self.client.post("/api/v1/scrapers/", json=scraper_data, headers={"Authorization": f"Bearer {self.auth_token}"}, catch_response=True, name="/scrapers/ [create]") as response:
            if response.status_code == 201:
                self.scraper_id = response.json()["id"]
                response.success()
            else:
                response.failure(f"Failed to create scraper: {response.text}")

    @task(1) # Lower weight, less frequent
    def trigger_job(self):
        """Triggers a scraping job for an existing scraper."""
        if not self.auth_token or not self.scraper_id:
            self.environment.runner.logger.warning("Skipping job trigger: No auth token or scraper_id.")
            return

        with self.client.post(f"/api/v1/jobs/{self.scraper_id}/trigger", headers={"Authorization": f"Bearer {self.auth_token}"}, catch_response=True, name="/jobs/{id}/trigger [trigger]") as response:
            if response.status_code == 202:
                self.job_id = response.json()["id"]
                response.success()
            else:
                response.failure(f"Failed to trigger job for scraper {self.scraper_id}: {response.text}")

    @task(1)
    def get_job_results(self):
        """Gets results for a triggered job."""
        if not self.auth_token or not self.job_id:
            self.environment.runner.logger.warning("Skipping get job results: No auth token or job_id.")
            return

        with self.client.get(f"/api/v1/results/jobs/{self.job_id}/", headers={"Authorization": f"Bearer {self.auth_token}"}, catch_response=True, name="/results/jobs/{id}/ [list]") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get job results for job {self.job_id}: {response.text}")

```
---