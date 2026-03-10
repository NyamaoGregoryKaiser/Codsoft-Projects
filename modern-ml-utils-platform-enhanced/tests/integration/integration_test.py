```python
import pytest
import requests
import time
import os
import jwt
from datetime import datetime, timedelta, timezone

# Configuration
BASE_URL = os.environ.get("MLOPS_CORE_SERVICE_URL", "http://localhost:18080")
JWT_SECRET = os.environ.get("MLOPS_JWT_SECRET", "your_super_secret_jwt_key_here_for_prod_use_a_strong_one_and_env_var")

@pytest.fixture(scope="module")
def api_client():
    """Fixture to ensure the API service is running and provides a requests session."""
    print(f"Waiting for MLOps Core Service at {BASE_URL}...")
    # Health check loop
    for _ in range(30):
        try:
            response = requests.get(f"{BASE_URL}/health_check", timeout=1)
            if response.status_code == 200:
                print("MLOps Core Service is up!")
                break
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    else:
        pytest.fail(f"MLOps Core Service did not start at {BASE_URL}")

    session = requests.Session()
    yield session

@pytest.fixture(scope="module")
def admin_token():
    """Generates an admin JWT token."""
    payload = {
        "user_id": 1,
        "role": "admin",
        "iss": "mlops-core-service",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

@pytest.fixture(scope="module")
def predictor_token():
    """Generates a predictor JWT token."""
    payload = {
        "user_id": 2,
        "role": "predictor",
        "iss": "mlops-core-service",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

@pytest.fixture(scope="module")
def viewer_token():
    """Generates a viewer JWT token."""
    payload = {
        "user_id": 3,
        "role": "viewer",
        "iss": "mlops-core-service",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture(scope="function", autouse=True)
def cleanup_db(api_client, auth_headers):
    """Cleans up the database before each test run."""
    # This is a basic cleanup. For a real production system,
    # you might snapshot/restore the DB or use a dedicated test DB instance.
    # In C++, the test DB is created in `data/test_mlops.db` and is wiped
    # before each `pytest` run by `scripts/db/full`.
    # So, this fixture is mostly for robustness check or if running without a full reset.
    # For now, we trust the `scripts/db/full` run in CI.
    pass


# --- Test Cases ---

def test_health_check(api_client):
    response = api_client.get(f"{BASE_URL}/health_check")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

# --- Model CRUD Operations (Admin only) ---

def test_create_model(api_client, auth_headers):
    model_data = {
        "name": "IntegrationTestModel",
        "description": "Model created during integration tests"
    }
    response = api_client.post(f"{BASE_URL}/api/v1/models", json=model_data, headers=auth_headers)
    assert response.status_code == 201
    created_model = response.json()
    assert created_model["name"] == "IntegrationTestModel"
    assert "id" in created_model
    assert "created_at" in created_model
    assert "updated_at" in created_model
    pytest.global_model_id = created_model["id"] # Store for later tests

def test_create_model_unauthorized(api_client):
    model_data = {
        "name": "UnauthorizedModel",
        "description": "Should fail"
    }
    response = api_client.post(f"{BASE_URL}/api/v1/models", json=model_data) # No auth header
    assert response.status_code == 401

def test_create_model_forbidden(api_client, viewer_token):
    model_data = {
        "name": "ForbiddenModel",
        "description": "Should fail"
    }
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = api_client.post(f"{BASE_URL}/api/v1/models", json=model_data, headers=headers)
    assert response.status_code == 403

def test_get_all_models(api_client, auth_headers):
    response = api_client.get(f"{BASE_URL}/api/v1/models", headers=auth_headers)
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    # Check if the model created in the previous test exists
    assert any(m["name"] == "IntegrationTestModel" for m in models)

def test_get_model_by_id(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers) # Create it if not already there
    
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}", headers=auth_headers)
    assert response.status_code == 200
    model = response.json()
    assert model["id"] == pytest.global_model_id
    assert model["name"] == "IntegrationTestModel"

def test_update_model(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers)
    
    updated_data = {
        "name": "IntegrationTestModel_Updated",
        "description": "Updated description for integration tests"
    }
    response = api_client.put(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}", json=updated_data, headers=auth_headers)
    assert response.status_code == 200
    updated_model = response.json()
    assert updated_model["id"] == pytest.global_model_id
    assert updated_model["name"] == "IntegrationTestModel_Updated"
    assert updated_model["description"] == "Updated description for integration tests"

# --- Model Version CRUD Operations (Admin only) ---

def test_create_model_version(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers)

    version_data = {
        "version_tag": "v1.0.0-test",
        "model_path": "./models/test_model_v1.0.0.json",
        "is_active": True,
        "parameters": {"intercept": 0.5, "coef_feature_x": 1.5},
        "notes": "Initial test version"
    }
    response = api_client.post(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions", json=version_data, headers=auth_headers)
    assert response.status_code == 201
    created_version = response.json()
    assert created_version["model_id"] == pytest.global_model_id
    assert created_version["version_tag"] == "v1.0.0-test"
    assert created_version["is_active"] is True
    assert created_version["parameters"]["intercept"] == 0.5
    pytest.global_version_id = created_version["id"]

def test_create_another_active_model_version(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers)
    
    # First, ensure there's an active version to be deactivated
    test_create_model_version(api_client, auth_headers)

    version_data = {
        "version_tag": "v1.1.0-test-active",
        "model_path": "./models/test_model_v1.1.0.json",
        "is_active": True,
        "parameters": {"intercept": 0.6, "coef_feature_x": 1.6},
        "notes": "Another active test version, should deactivate previous"
    }
    response = api_client.post(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions", json=version_data, headers=auth_headers)
    assert response.status_code == 201
    new_active_version = response.json()
    assert new_active_version["is_active"] is True

    # Verify previous version is now inactive
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions/{pytest.global_version_id}", headers=auth_headers)
    assert response.status_code == 200
    old_version = response.json()
    assert old_version["is_active"] is False

    pytest.global_version_id = new_active_version["id"] # Update to the newest active version for prediction tests

def test_get_model_versions(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers)
    if not hasattr(pytest, 'global_version_id'):
        test_create_model_version(api_client, auth_headers)

    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions", headers=auth_headers)
    assert response.status_code == 200
    versions = response.json()
    assert isinstance(versions, list)
    assert any(v["id"] == pytest.global_version_id for v in versions)

def test_update_model_version(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id') or not hasattr(pytest, 'global_version_id'):
        test_create_another_active_model_version(api_client, auth_headers)

    updated_version_data = {
        "is_active": False,
        "notes": "Updated notes for test version"
    }
    response = api_client.put(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions/{pytest.global_version_id}", json=updated_version_data, headers=auth_headers)
    assert response.status_code == 200
    updated_version = response.json()
    assert updated_version["id"] == pytest.global_version_id
    assert updated_version["is_active"] is False
    assert updated_version["notes"] == "Updated notes for test version"

# --- Prediction Service (Predictor/Admin only) ---

def test_predict_by_version_id(api_client, predictor_token):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, {"Authorization": f"Bearer {predictor_token}"}) # This will fail, but ensures model exists for subsequent creation
    if not hasattr(pytest, 'global_version_id'):
        # Ensure an active version exists, potentially creating it with admin token
        test_create_another_active_model_version(api_client, {"Authorization": f"Bearer {predictor_token}"})

    headers = {"Authorization": f"Bearer {predictor_token}"}
    prediction_input = {"feature_x": 10.0}
    
    # Get current active version parameters to predict manually
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions/{pytest.global_version_id}", headers={"Authorization": f"Bearer {predictor_token}"})
    assert response.status_code == 200
    active_version = response.json()
    intercept = active_version["parameters"]["intercept"]
    coef_x = active_version["parameters"]["coef_feature_x"]
    expected_output = intercept + coef_x * prediction_input["feature_x"]

    response = api_client.post(f"{BASE_URL}/api/v1/predict/{pytest.global_model_id}/{pytest.global_version_id}", json=prediction_input, headers=headers)
    assert response.status_code == 200
    output = response.json()
    assert "predicted_value" in output
    assert abs(output["predicted_value"] - expected_output) < 1e-6

def test_predict_by_version_tag(api_client, predictor_token):
    # Ensure an active version with a known tag exists
    test_create_another_active_model_version(api_client, {"Authorization": f"Bearer {predictor_token}"}) # Creates 'v1.1.0-test-active'

    headers = {"Authorization": f"Bearer {predictor_token}"}
    prediction_input = {"feature_x": 20.0}

    # Get current active version parameters to predict manually
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions", headers={"Authorization": f"Bearer {predictor_token}"})
    assert response.status_code == 200
    versions = response.json()
    active_version = next((v for v in versions if v["is_active"]), None)
    assert active_version is not None
    intercept = active_version["parameters"]["intercept"]
    coef_x = active_version["parameters"]["coef_feature_x"]
    expected_output = intercept + coef_x * prediction_input["feature_x"]

    response = api_client.post(f"{BASE_URL}/api/v1/predict/{pytest.global_model_id}/{active_version['version_tag']}", json=prediction_input, headers=headers)
    assert response.status_code == 200
    output = response.json()
    assert "predicted_value" in output
    assert abs(output["predicted_value"] - expected_output) < 1e-6

def test_predict_unauthorized(api_client):
    if not hasattr(pytest, 'global_model_id') or not hasattr(pytest, 'global_version_id'):
        test_create_another_active_model_version(api_client, auth_headers)

    prediction_input = {"feature_x": 10.0}
    response = api_client.post(f"{BASE_URL}/api/v1/predict/{pytest.global_model_id}/{pytest.global_version_id}", json=prediction_input)
    assert response.status_code == 401

def test_predict_inactive_version(api_client, predictor_token, auth_headers):
    # Create an active version first
    test_create_model_version(api_client, auth_headers) # This sets global_version_id to the active one
    active_version_id = pytest.global_version_id

    # Create another inactive version
    inactive_version_data = {
        "version_tag": "v_inactive",
        "model_path": "./models/test_model_inactive.json",
        "is_active": False,
        "parameters": {"intercept": 1.0, "coef_feature_x": 1.0},
        "notes": "Inactive version"
    }
    response = api_client.post(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions", json=inactive_version_data, headers=auth_headers)
    assert response.status_code == 201
    inactive_version = response.json()
    inactive_version_id = inactive_version["id"]

    headers = {"Authorization": f"Bearer {predictor_token}"}
    prediction_input = {"feature_x": 5.0}

    response = api_client.post(f"{BASE_URL}/api/v1/predict/{pytest.global_model_id}/{inactive_version_id}", json=prediction_input, headers=headers)
    assert response.status_code == 500 # Service should return 500 if internal logic throws for inactive model
    error_response = response.json()
    assert "error" in error_response
    assert "inactive" in error_response["message"].lower()

# --- Prediction Log Operations (Viewer/Admin only) ---

def test_get_prediction_logs(api_client, viewer_token):
    # Ensure there are some predictions
    test_predict_by_version_id(api_client, viewer_token) # Using viewer token as it has predictor rights
    test_predict_by_version_tag(api_client, viewer_token)

    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}/versions/{pytest.global_version_id}/logs", headers=headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) >= 2 # At least 2 predictions from the previous tests
    assert all("input_data" in log and "output_data" in log and "status" in log for log in logs)

# --- Cleanup (should be the last test) ---

def test_delete_model(api_client, auth_headers):
    if not hasattr(pytest, 'global_model_id'):
        test_create_model(api_client, auth_headers) # Ensure it exists

    response = api_client.delete(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify model is gone
    response = api_client.get(f"{BASE_URL}/api/v1/models/{pytest.global_model_id}", headers=auth_headers)
    assert response.status_code == 404
```