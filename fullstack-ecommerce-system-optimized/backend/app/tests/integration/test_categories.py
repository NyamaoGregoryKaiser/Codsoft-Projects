```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Category
from app.schemas.category import CategoryCreate

def test_create_category_superuser(client: TestClient, superuser_token_headers: dict):
    category_data = {"name": "Test Category", "description": "Description for test category"}
    response = client.post(
        f"{settings.API_V1_STR}/categories/", headers=superuser_token_headers, json=category_data
    )
    assert response.status_code == 201
    assert response.json()["name"] == category_data["name"]

def test_create_category_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict):
    category_data = {"name": "Forbidden Category", "description": "Should not be created"}
    response = client.post(
        f"{settings.API_V1_STR}/categories/", headers=normal_user_token_headers, json=category_data
    )
    assert response.status_code == 403

def test_read_categories(client: TestClient, test_category: Category):
    response = client.get(f"{settings.API_V1_STR}/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert any(c["name"] == test_category.name for c in categories)

def test_read_category_by_id(client: TestClient, test_category: Category):
    response = client.get(f"{settings.API_V1_STR}/categories/{test_category.id}")
    assert response.status_code == 200
    category_data = response.json()
    assert category_data["name"] == test_category.name

def test_update_category_superuser(client: TestClient, superuser_token_headers: dict, test_category: Category):
    update_data = {"name": "Updated Category Name", "description": "New description"}
    response = client.put(
        f"{settings.API_V1_STR}/categories/{test_category.id}", headers=superuser_token_headers, json=update_data
    )
    assert response.status_code == 200
    updated_category = response.json()
    assert updated_category["name"] == update_data["name"]
    assert updated_category["description"] == update_data["description"]

def test_delete_category_superuser(client: TestClient, superuser_token_headers: dict, test_category: Category):
    response = client.delete(
        f"{settings.API_V1_STR}/categories/{test_category.id}", headers=superuser_token_headers
    )
    assert response.status_code == 204
    # Verify category is truly deleted
    response = client.get(f"{settings.API_V1_STR}/categories/{test_category.id}")
    assert response.status_code == 404

```