```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Product, User, Review
from app.schemas.review import ReviewCreate, ReviewUpdate

def test_create_review(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 5, "comment": "Great product!"}
    response = client.post(
        f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data
    )
    assert response.status_code == 201
    review = response.json()
    assert review["product_id"] == test_product.id
    assert review["user_id"] == test_user.id
    assert review["rating"] == 5
    assert review["comment"] == "Great product!"

def test_create_review_duplicate_product_user(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 4, "comment": "First review."}
    client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)

    review_data_duplicate = {"product_id": test_product.id, "rating": 3, "comment": "Second review."}
    response = client.post(
        f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data_duplicate
    )
    assert response.status_code == 400
    assert "You have already reviewed this product." in response.json()["detail"]

def test_get_reviews_for_product(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 5, "comment": "Excellent!"}
    client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)

    response = client.get(
        f"{settings.API_V1_STR}/reviews/product/{test_product.id}"
    )
    assert response.status_code == 200
    reviews = response.json()
    assert isinstance(reviews, list)
    assert len(reviews) >= 1
    assert reviews[0]["product_id"] == test_product.id
    assert reviews[0]["user"]["email"] == test_user.email # Check eager loading of user

def test_get_review_by_id(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 5, "comment": "Love it!"}
    create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)
    review_id = create_response.json()["id"]

    response = client.get(
        f"{settings.API_V1_STR}/reviews/{review_id}"
    )
    assert response.status_code == 200
    review = response.json()
    assert review["id"] == review_id
    assert review["comment"] == "Love it!"

def test_update_review_owner(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 4, "comment": "Good product."}
    create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)
    review_id = create_response.json()["id"]

    update_data = {"rating": 5, "comment": "Actually, it's amazing!"}
    response = client.put(
        f"{settings.API_V1_STR}/reviews/{review_id}", headers=normal_user_token_headers, json=update_data
    )
    assert response.status_code == 200
    updated_review = response.json()
    assert updated_review["id"] == review_id
    assert updated_review["rating"] == 5
    assert updated_review["comment"] == "Actually, it's amazing!"

def test_update_review_other_user_forbidden(client: TestClient, normal_user_token_headers: dict, superuser_token_headers: dict, test_user: User, superuser: User, test_product: Product):
    # Create review by normal user
    review_data = {"product_id": test_product.id, "rating": 4, "comment": "Good product."}
    create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)
    review_id = create_response.json()["id"]

    # Superuser tries to update normal user's review (should be forbidden if not superuser updating *any* review)
    # The endpoint `update_review` is written such that only the owner can update.
    # Superuser check is only for deletion.
    update_data = {"rating": 1, "comment": "Bad product."}
    response = client.put(
        f"{settings.API_V1_STR}/reviews/{review_id}", headers=superuser_token_headers, json=update_data
    )
    assert response.status_code == 403 # Superuser cannot update other's review via this endpoint

def test_delete_review_owner(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 4, "comment": "Good product."}
    create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)
    review_id = create_response.json()["id"]

    response = client.delete(
        f"{settings.API_V1_STR}/reviews/{review_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 204
    # Verify review is deleted
    get_response = client.get(f"{settings.API_V1_STR}/reviews/{review_id}")
    assert get_response.status_code == 404

def test_delete_review_superuser(client: TestClient, superuser_token_headers: dict, normal_user_token_headers: dict, test_user: User, test_product: Product):
    review_data = {"product_id": test_product.id, "rating": 4, "comment": "Good product."}
    create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=normal_user_token_headers, json=review_data)
    review_id = create_response.json()["id"]

    # Superuser deletes normal user's review
    response = client.delete(
        f"{settings.API_V1_STR}/reviews/{review_id}", headers=superuser_token_headers
    )
    assert response.status_code == 204
    # Verify review is deleted
    get_response = client.get(f"{settings.API_V1_STR}/reviews/{review_id}")
    assert get_response.status_code == 404

def test_delete_review_other_user_forbidden(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Create a product for superuser to review
    superuser_prod = client.post(f"{settings.API_V1_STR}/products/", headers=superuser_token_headers(client, test_user), json={
        "name": "Superuser Product", "description": "...", "price": 100.0, "stock": 5
    }).json()

    # Superuser creates a review
    superuser_review_data = {"product_id": superuser_prod["id"], "rating": 5, "comment": "Superuser review."}
    superuser_create_response = client.post(f"{settings.API_V1_STR}/reviews/", headers=superuser_token_headers(client, test_user), json=superuser_review_data)
    superuser_review_id = superuser_create_response.json()["id"]

    # Normal user tries to delete superuser's review
    response = client.delete(
        f"{settings.API_V1_STR}/reviews/{superuser_review_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403

```

#### Frontend (Flask as API client)