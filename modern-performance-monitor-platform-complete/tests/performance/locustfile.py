```python
from locust import HttpUser, task, between, events
import jwt
import os
import time
import random

# Load environment variables for configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:80/api")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeyforperfometrics")

# Global variable to store admin token and service details
ADMIN_AUTH_TOKEN = None
SERVICE_API_KEY = None
SERVICE_ID = None

# Function to get an admin token
def get_admin_token(environment):
    global ADMIN_AUTH_TOKEN
    if ADMIN_AUTH_TOKEN:
        try:
            # Check if token is expired (simple check, full validation might be too much for load test setup)
            decoded = jwt.decode(ADMIN_AUTH_TOKEN, algorithms=["HS256"], options={"verify_signature": False})
            if decoded.get("exp", 0) > time.time() + 60: # Ensure at least 60 seconds left
                return ADMIN_AUTH_TOKEN
        except jwt.PyJWTError:
            pass # Token invalid, need a new one

    environment.runner.logger.info("Admin token expired or not found, fetching new one...")
    response = environment.web_ui_client.post(
        f"{API_BASE_URL}/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        ADMIN_AUTH_TOKEN = response.json().get("token")
        environment.runner.logger.info("Successfully fetched new admin token.")
        return ADMIN_AUTH_TOKEN
    else:
        environment.runner.logger.error(f"Failed to get admin token: {response.text}")
        environment.runner.quit() # Stop the test if we can't authenticate
        return None

# Function to ensure a service exists and get its API key
def ensure_service_and_api_key(environment):
    global SERVICE_API_KEY, SERVICE_ID
    if SERVICE_API_KEY and SERVICE_ID:
        return SERVICE_API_KEY, SERVICE_ID

    admin_token = get_admin_token(environment)
    if not admin_token:
        environment.runner.logger.error("Admin token not available for service creation.")
        environment.runner.quit()
        return None, None

    service_name = f"LocustTestService_{int(time.time())}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": service_name, "description": "Service for Locust performance tests"}

    try:
        # First, try to list services to see if one already exists
        list_response = environment.web_ui_client.get(f"{API_BASE_URL}/services", headers=headers)
        list_response.raise_for_status()
        services = list_response.json()
        for service in services:
            if service.get("name") == service_name: # Simple check if service already exists
                SERVICE_API_KEY = service["api_key"]
                SERVICE_ID = service["id"]
                environment.runner.logger.info(f"Using existing service: {service_name} (ID: {SERVICE_ID})")
                return SERVICE_API_KEY, SERVICE_ID

        # If not found, create a new one
        create_response = environment.web_ui_client.post(f"{API_BASE_URL}/services", headers=headers, json=payload)
        create_response.raise_for_status()
        service_data = create_response.json()
        SERVICE_API_KEY = service_data["api_key"]
        SERVICE_ID = service_data["id"]
        environment.runner.logger.info(f"Created new service: {service_name} (ID: {SERVICE_ID}, API Key: {SERVICE_API_KEY[:8]}...)")
        return SERVICE_API_KEY, SERVICE_ID
    except Exception as e:
        environment.runner.logger.error(f"Failed to ensure service and API key: {e}")
        environment.runner.quit()
        return None, None

# Event hook to run before the test starts
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    environment.runner.logger.info("Performance test started. Initializing...")
    # Get admin token and service API key once for the entire test run
    get_admin_token(environment)
    ensure_service_and_api_key(environment)
    environment.runner.logger.info("Initialization complete.")

class PerfoMetricsUser(HttpUser):
    wait_time = between(1, 3) # Users wait between 1 and 3 seconds between tasks
    host = API_BASE_URL

    @task(10) # Higher weight for metric ingestion
    def ingest_metric(self):
        if not SERVICE_API_KEY:
            self.environment.runner.logger.error("SERVICE_API_KEY not set. Skipping ingest_metric.")
            return

        metric_types = ["CPU_USAGE", "MEMORY_USAGE", "REQUEST_LATENCY", "ERROR_RATE"]
        metric_type = random.choice(metric_types)
        value = random.uniform(0.1, 100.0) # Varies greatly by metric type
        tags = {"env": "test", "host": f"node-{random.randint(1, 5)}", "app": "test-app"}

        payload = {
            "metric_type": metric_type,
            "value": value,
            "tags": tags
        }
        headers = {"X-API-KEY": SERVICE_API_KEY, "Content-Type": "application/json"}
        self.client.post("/metrics", json=payload, headers=headers, name="/metrics [ingest]")

    @task(5) # Lower weight for batch ingestion
    def ingest_batch_metrics(self):
        if not SERVICE_API_KEY:
            self.environment.runner.logger.error("SERVICE_API_KEY not set. Skipping ingest_batch_metrics.")
            return

        num_metrics = random.randint(5, 20)
        metrics = []
        metric_types = ["CPU_USAGE", "MEMORY_USAGE", "REQUEST_LATENCY", "ERROR_RATE"]

        for _ in range(num_metrics):
            metric_type = random.choice(metric_types)
            value = random.uniform(0.1, 100.0)
            tags = {"env": "test", "host": f"node-{random.randint(1, 10)}", "app": "test-app"}
            metrics.append({
                "metric_type": metric_type,
                "value": value,
                "tags": tags
            })

        payload = {"metrics": metrics}
        headers = {"X-API-KEY": SERVICE_API_KEY, "Content-Type": "application/json"}
        self.client.post("/metrics", json=payload, headers=headers, name="/metrics [batch ingest]")

    @task(3) # Querying metrics (requires auth)
    def query_metrics(self):
        if not SERVICE_ID:
            self.environment.runner.logger.error("SERVICE_ID not set. Skipping query_metrics.")
            return
        if not ADMIN_AUTH_TOKEN:
            self.environment.runner.logger.error("ADMIN_AUTH_TOKEN not set. Skipping query_metrics.")
            return

        metric_type = random.choice(["CPU_USAGE", "MEMORY_USAGE", "REQUEST_LATENCY", "ERROR_RATE", None])
        params = {"limit": random.randint(10, 100)}
        if metric_type:
            params["metric_type"] = metric_type
        
        # Query for last 5 minutes
        end_time = int(time.time())
        start_time = end_time - 300 # 5 minutes ago
        params["start_time"] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(start_time))
        params["end_time"] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(end_time))

        headers = {"Authorization": f"Bearer {ADMIN_AUTH_TOKEN}"}
        self.client.get(f"/metrics/{SERVICE_ID}", params=params, headers=headers, name="/metrics/{service_id} [query]")

    @task(1) # Get all services (less frequent)
    def get_services(self):
        if not ADMIN_AUTH_TOKEN:
            self.environment.runner.logger.error("ADMIN_AUTH_TOKEN not set. Skipping get_services.")
            return
        headers = {"Authorization": f"Bearer {ADMIN_AUTH_TOKEN}"}
        self.client.get("/services", headers=headers, name="/services [get_all]")

```