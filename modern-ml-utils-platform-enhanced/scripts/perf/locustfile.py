```python
import os
import jwt
from datetime import datetime, timedelta, timezone
from locust import HttpUser, task, between, events
import logging

# Configure logging for Locust
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
# Use environment variables for sensitive data and dynamic URLs
BASE_URL = os.environ.get("LOCUST_HOST", "http://localhost:18080")
JWT_SECRET = os.environ.get("MLOPS_JWT_SECRET", "your_super_secret_jwt_key_here_for_prod_use_a_strong_one_and_env_var")

# Dummy data - In a real scenario, this would come from a data generator or DB
# For this example, we assume model_id=1, version_id=1, version_tag="v1.0.0-stable"
# are present from seed data, and there's a model with 'coef_marketing_spend', 'seasonal_factor'.
DUMMY_MODEL_ID = 1
DUMMY_VERSION_ID = 1
DUMMY_VERSION_TAG = "v1.0.0-stable" # Assuming this is an active version
DUMMY_PREDICTION_INPUT = {"marketing_spend": 10000.0, "seasonal_factor": 2.0}

class MLOpsUser(HttpUser):
    wait_time = between(1, 2.5) # Users wait between 1 and 2.5 seconds between tasks
    host = BASE_URL

    def on_start(self):
        """Called when a Locust user starts."""
        self.client.headers = {"Content-Type": "application/json"}
        self.admin_token = self._generate_jwt(1, "admin")
        self.predictor_token = self._generate_jwt(2, "predictor")
        self.viewer_token = self._generate_jwt(3, "viewer")
        
        # Optionally, create dummy models/versions if not seeding the DB before perf test
        # For simplicity, we assume DB is pre-seeded or managed external to Locust.
        # If running against an empty DB, uncomment and adapt these:
        # self._create_dummy_model_and_version()


    def _generate_jwt(self, user_id, role):
        payload = {
            "user_id": user_id,
            "role": role,
            "iss": "mlops-core-service",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60) # Token valid for 60 minutes
        }
        return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    # @task(1) # Lower weight as it's less frequent
    # def create_model(self):
    #     headers = {"Authorization": f"Bearer {self.admin_token}"}
    #     model_data = {
    #         "name": f"PerfTestModel_{self.environment.runner.stats.num_requests}",
    #         "description": "Model created by perf test"
    #     }
    #     self.client.post("/api/v1/models", json=model_data, headers=headers, name="/api/v1/models [POST]")

    @task(3) # Medium weight
    def get_all_models(self):
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        self.client.get("/api/v1/models", headers=headers, name="/api/v1/models [GET]")

    @task(5) # Highest weight - prediction serving is the core
    def predict_by_id(self):
        headers = {"Authorization": f"Bearer {self.predictor_token}"}
        # Randomize input slightly for more realistic load
        input_data = {
            "marketing_spend": DUMMY_PREDICTION_INPUT["marketing_spend"] + self.environment.rng.uniform(-1000, 1000),
            "seasonal_factor": DUMMY_PREDICTION_INPUT["seasonal_factor"] + self.environment.rng.uniform(-0.5, 0.5)
        }
        self.client.post(f"/api/v1/predict/{DUMMY_MODEL_ID}/{DUMMY_VERSION_ID}", json=input_data, headers=headers, name="/api/v1/predict/{model_id}/{version_id} [POST]")

    @task(4) # High weight
    def predict_by_tag(self):
        headers = {"Authorization": f"Bearer {self.predictor_token}"}
        input_data = {
            "marketing_spend": DUMMY_PREDICTION_INPUT["marketing_spend"] + self.environment.rng.uniform(-1000, 1000),
            "seasonal_factor": DUMMY_PREDICTION_INPUT["seasonal_factor"] + self.environment.rng.uniform(-0.5, 0.5)
        }
        self.client.post(f"/api/v1/predict/{DUMMY_MODEL_ID}/{DUMMY_VERSION_TAG}", json=input_data, headers=headers, name="/api/v1/predict/{model_id}/{version_tag} [POST]")

    @task(2) # Medium weight
    def get_prediction_logs(self):
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        self.client.get(f"/api/v1/models/{DUMMY_MODEL_ID}/versions/{DUMMY_VERSION_ID}/logs", headers=headers, name="/api/v1/models/{model_id}/versions/{version_id}/logs [GET]")

    @task(1) # Lower weight
    def get_model_version_details(self):
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        self.client.get(f"/api/v1/models/{DUMMY_MODEL_ID}/versions/{DUMMY_VERSION_ID}", headers=headers, name="/api/v1/models/{model_id}/versions/{version_id} [GET]")

    # Health check is not a regular task, but useful for startup verification
    def health_check(self):
        self.client.get("/health_check", name="/health_check")

# Optional: Hook to log start/stop of load test
@events.test_start.add_listener
def test_start(**kwargs):
    logger.info("Locust load test starting...")

@events.test_stop.add_listener
def test_stop(**kwargs):
    logger.info("Locust load test finished.")

# To run:
# 1. Start the mlops-core-service (e.g., using docker-compose up)
# 2. cd mlops-core-service
# 3. locust -f scripts/perf/locustfile.py --web-host localhost
# 4. Open your browser to http://localhost:8089 (default Locust UI port)
#    Set number of users, spawn rate, and host (e.g., http://localhost:18080)
# Or run headless:
# locust -f scripts/perf/locustfile.py --host=http://localhost:18080 --users 10 --spawn-rate 5 --run-time 60s --html report.html
```