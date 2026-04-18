```python
import requests
import pytest
import os
import time

# Base URL for the API (Nginx proxy)
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:80/api")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123") # Default from db/init.sql
VIEWER_USERNAME = os.getenv("VIEWER_USERNAME", "viewer")
VIEWER_PASSWORD = os.getenv("VIEWER_PASSWORD", "viewer123") # Default from db/init.sql

# Fixture to wait for the API to be ready
@pytest.fixture(scope="session", autouse=True)
def wait_for_api():
    retries = 10
    while retries > 0:
        try:
            response = requests.get(f"{BASE_URL}/", timeout=5)
            if response.status_code == 200:
                print("\nAPI is ready!")
                return
        except requests.exceptions.ConnectionError:
            pass
        print(f"Waiting for API to be ready... ({retries} retries left)")
        time.sleep(5)
        retries -= 1
    pytest.fail("API did not become ready in time.")

# Fixture for admin token
@pytest.fixture(scope="session")
def admin_token():
    payload = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    response.raise_for_status()
    return response.json()["token"]

# Fixture for viewer token
@pytest.fixture(scope="session")
def viewer_token():
    payload = {"username": VIEWER_USERNAME, "password": VIEWER_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    response.raise_for_status()
    return response.json()["token"]

# Test for successful login
def test_login_success():
    payload = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 200
    assert "token" in response.json()
    assert response.json()["username"] == ADMIN_USERNAME
    assert response.json()["role"] == "admin"

# Test for invalid login
def test_login_failure():
    payload = {"username": "wronguser", "password": "wrongpassword"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert response.status_code == 401
    assert "error" in response.json()

# Test creating a service (Admin only)
def test_create_service_admin(admin_token):
    service_name = f"TestService_{int(time.time())}"
    payload = {"name": service_name, "description": "A service for API testing"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.post(f"{BASE_URL}/services", headers=headers, json=payload)
    assert response.status_code == 201
    assert "id" in response.json()
    assert response.json()["name"] == service_name
    assert "api_key" in response.json()

    # Clean up (optional, or rely on test teardown strategy)
    # In a real scenario, you'd have a DELETE endpoint or specific test-cleanup.

def test_create_service_viewer_forbidden(viewer_token):
    service_name = f"ViewerService_{int(time.time())}"
    payload = {"name": service_name, "description": "Attempt by viewer"}
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = requests.post(f"{BASE_URL}/services", headers=headers, json=payload)
    assert response.status_code == 403 # Forbidden
    assert "error" in response.json()

# Test getting all services (Admin and Viewer)
def test_get_all_services_admin(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/services", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1 # At least the seed data services

def test_get_all_services_viewer(viewer_token):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = requests.get(f"{BASE_URL}/services", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1

def test_get_all_services_unauthorized():
    response = requests.get(f"{BASE_URL}/services")
    assert response.status_code == 401

# Helper to get an existing service's API key
@pytest.fixture(scope="session")
def existing_service_api_key(admin_token):
    # Ensure a service exists and get its API key
    service_name = f"ExistingService_{int(time.time())}"
    payload = {"name": service_name, "description": "An existing service"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.post(f"{BASE_URL}/services", headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["api_key"], response.json()["id"]

# Test metric ingestion
def test_ingest_single_metric(existing_service_api_key):
    api_key, service_id = existing_service_api_key
    payload = {
        "metric_type": "CPU_USAGE",
        "value": 0.75,
        "tags": {"host": "server1", "region": "us-east-1"}
    }
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/metrics", headers=headers, json=payload)
    assert response.status_code == 202
    assert response.json()["message"] == "Metrics ingested successfully."

def test_ingest_batch_metrics(existing_service_api_key):
    api_key, service_id = existing_service_api_key
    payload = {
        "metrics": [
            {"metric_type": "MEMORY_USAGE", "value": 0.5, "tags": {"host": "server2"}},
            {"metric_type": "REQUEST_LATENCY", "value": 120.5, "tags": {"endpoint": "/users"}},
        ]
    }
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/metrics", headers=headers, json=payload)
    assert response.status_code == 202
    assert response.json()["message"] == "Metrics ingested successfully."

def test_ingest_metric_invalid_api_key():
    payload = {"metric_type": "CPU_USAGE", "value": 0.1}
    headers = {"X-API-KEY": "invalid-api-key", "Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/metrics", headers=headers, json=payload)
    assert response.status_code == 403
    assert "error" in response.json()

def test_ingest_metric_missing_api_key():
    payload = {"metric_type": "CPU_USAGE", "value": 0.1}
    headers = {"Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/metrics", headers=headers, json=payload)
    assert response.status_code == 400
    assert "error" in response.json()

def test_query_metrics_for_service(admin_token, existing_service_api_key):
    api_key, service_id = existing_service_api_key
    headers = {"Authorization": f"Bearer {admin_token}"}

    # First, ingest a metric to ensure there's data to query
    payload = {
        "metric_type": "ERROR_RATE",
        "value": 0.01,
        "tags": {"environment": "prod"}
    }
    ingest_headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    ingest_response = requests.post(f"{BASE_URL}/metrics", headers=ingest_headers, json=payload)
    ingest_response.raise_for_status()
    time.sleep(1) # Give DB a moment to process

    # Now query it
    response = requests.get(f"{BASE_URL}/metrics/{service_id}", headers=headers, params={"metric_type": "ERROR_RATE"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(m["metric_type"] == "ERROR_RATE" for m in data)

def test_query_metrics_with_time_filters(admin_token, existing_service_api_key):
    api_key, service_id = existing_service_api_key
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Ingest metrics with specific timestamps for testing time filters
    # (This requires the backend to accept timestamps, which it currently doesn't for ingestion.
    # We'll rely on current server-side timestamping and query based on a recent window).
    time.sleep(1) # Ensure distinct timestamp
    requests.post(f"{BASE_URL}/metrics", headers={"X-API-KEY": api_key}, json={"metric_type": "CPU_USAGE", "value": 0.8})
    time.sleep(1)
    requests.post(f"{BASE_URL}/metrics", headers={"X-API-KEY": api_key}, json={"metric_type": "CPU_USAGE", "value": 0.9})
    time.sleep(1)

    end_time = requests.get("http://worldtimeapi.org/api/timezone/Etc/UTC").json()["datetime"] # Get current UTC time
    time.sleep(1) # Ensure query is for metrics *before* this time

    # Query metrics from a recent past until now
    params = {
        "metric_type": "CPU_USAGE",
        "start_time": (requests.get("http://worldtimeapi.org/api/timezone/Etc/UTC").json()["datetime"][:-10] + "00:00:00Z"), # Start of day
        "end_time": end_time
    }
    response = requests.get(f"{BASE_URL}/metrics/{service_id}", headers=headers, params=params)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert all(m["metric_type"] == "CPU_USAGE" for m in data)
```