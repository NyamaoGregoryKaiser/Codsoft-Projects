```python
import requests
import json
import os
import pytest
import time

# Base URL for the API
BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8080/api/v1')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'adminpass')
USER_USERNAME = os.getenv('USER_USERNAME', 'user')
USER_PASSWORD = os.getenv('USER_PASSWORD', 'userpass')

# Ensure API is running locally via docker-compose for these tests
# Run `docker-compose up -d` before running API tests

class TestProductAPI:
    admin_token = None
    user_token = None
    product_id = None # Store product ID for subsequent tests

    @classmethod
    def setup_class(cls):
        print(f"\n--- Running API tests against {BASE_URL} ---")
        # Authenticate admin user
        login_data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        cls.admin_token = response.json().get("token")
        assert cls.admin_token is not None, "Admin token not received."
        print(f"Admin token obtained: {cls.admin_token[:10]}...")

        # Authenticate regular user
        login_data = {"username": USER_USERNAME, "password": USER_PASSWORD}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 200, f"User login failed: {response.text}"
        cls.user_token = response.json().get("token")
        assert cls.user_token is not None, "User token not received."
        print(f"User token obtained: {cls.user_token[:10]}...")


    @pytest.fixture(scope="class")
    def auth_headers_admin(self):
        return {"Authorization": f"Bearer {self.admin_token}", "Content-Type": "application/json"}

    @pytest.fixture(scope="class")
    def auth_headers_user(self):
        return {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}

    @pytest.fixture(scope="class")
    def no_auth_headers(self):
        return {"Content-Type": "application/json"}

    @pytest.mark.run(order=1)
    def test_login_success(self):
        # Already done in setup_class, but can be a standalone test
        login_data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 200
        assert "token" in response.json()

    @pytest.mark.run(order=2)
    def test_login_failure_wrong_password(self):
        login_data = {"username": ADMIN_USERNAME, "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid username or password" in response.json().get("message")

    @pytest.mark.run(order=3)
    def test_create_product_admin_success(self, auth_headers_admin):
        product_data = {
            "name": f"API Test Product - {int(time.time())}",
            "description": "Product created via API test",
            "price": 100.50,
            "stock": 10,
            "category": "Test"
        }
        response = requests.post(f"{BASE_URL}/products", headers=auth_headers_admin, json=product_data)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == product_data["name"]
        TestProductAPI.product_id = data["id"]
        print(f"Created product with ID: {TestProductAPI.product_id}")

    @pytest.mark.run(order=4)
    def test_create_product_user_forbidden(self, auth_headers_user):
        product_data = {
            "name": f"API Test Product - Forbidden - {int(time.time())}",
            "description": "User attempting to create product",
            "price": 10.00,
            "stock": 1,
            "category": "Forbidden"
        }
        response = requests.post(f"{BASE_URL}/products", headers=auth_headers_user, json=product_data)
        assert response.status_code == 403 # Forbidden
        assert "Only administrators can create products" in response.json().get("message")

    @pytest.mark.run(order=5)
    def test_create_product_no_auth_unauthorized(self, no_auth_headers):
        product_data = {
            "name": f"API Test Product - NoAuth - {int(time.time())}",
            "description": "No auth product",
            "price": 5.00,
            "stock": 1,
            "category": "NoAuth"
        }
        response = requests.post(f"{BASE_URL}/products", headers=no_auth_headers, json=product_data)
        assert response.status_code == 401 # Unauthorized
        assert "Missing Authorization header" in response.json().get("message")

    @pytest.mark.run(order=6)
    def test_get_all_products_success(self, auth_headers_user): # User can view all products
        response = requests.get(f"{BASE_URL}/products", headers=auth_headers_user)
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert any(p["id"] == TestProductAPI.product_id for p in products)

    @pytest.mark.run(order=7)
    def test_get_product_by_id_success(self, auth_headers_user):
        assert TestProductAPI.product_id is not None, "Product ID not set from create test."
        response = requests.get(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_user)
        assert response.status_code == 200
        product = response.json()
        assert product["id"] == TestProductAPI.product_id
        assert product["name"].startswith("API Test Product")

    @pytest.mark.run(order=8)
    def test_get_product_by_id_not_found(self, auth_headers_user):
        response = requests.get(f"{BASE_URL}/products/non-existent-uuid", headers=auth_headers_user)
        assert response.status_code == 404
        assert "Product not found" in response.json().get("message")

    @pytest.mark.run(order=9)
    def test_update_product_admin_success(self, auth_headers_admin):
        assert TestProductAPI.product_id is not None, "Product ID not set from create test."
        update_data = {
            "price": 120.00,
            "stock": 15
        }
        response = requests.patch(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_admin, json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestProductAPI.product_id
        assert data["price"] == 120.00
        assert data["stock"] == 15

    @pytest.mark.run(order=10)
    def test_update_product_user_forbidden(self, auth_headers_user):
        assert TestProductAPI.product_id is not None, "Product ID not set from create test."
        update_data = {
            "price": 500.00
        }
        response = requests.patch(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_user, json=update_data)
        assert response.status_code == 403
        assert "Only administrators can update products" in response.json().get("message")

    @pytest.mark.run(order=11)
    def test_delete_product_user_forbidden(self, auth_headers_user):
        assert TestProductAPI.product_id is not None, "Product ID not set from create test."
        response = requests.delete(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_user)
        assert response.status_code == 403
        assert "Only administrators can delete products" in response.json().get("message")

    @pytest.mark.run(order=12)
    def test_delete_product_admin_success(self, auth_headers_admin):
        assert TestProductAPI.product_id is not None, "Product ID not set from create test."
        response = requests.delete(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_admin)
        assert response.status_code == 204 # No Content

        # Verify deletion
        response = requests.get(f"{BASE_URL}/products/{TestProductAPI.product_id}", headers=auth_headers_admin)
        assert response.status_code == 404
        assert "Product not found" in response.json().get("message")
```