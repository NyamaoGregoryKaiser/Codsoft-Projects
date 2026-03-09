import pytest
from httpx import AsyncClient
from app.schemas.scraper import ScraperCreate, ScraperUpdate

@pytest.mark.asyncio
async def test_create_scraper(client: AsyncClient, auth_headers: dict):
    scraper_data = {
        "name": "Test Scraper",
        "target_url": "http://example.com",
        "parse_rules": {"data_fields": {"title": "h1.title"}}
    }
    response = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["name"] == scraper_data["name"]
    assert response.json()["target_url"] == scraper_data["target_url"]
    assert response.json()["owner_id"] is not None

@pytest.mark.asyncio
async def test_read_scrapers(client: AsyncClient, auth_headers: dict, test_user):
    scraper_data = {
        "name": "Test Scraper 2",
        "target_url": "http://example.com/page2",
        "parse_rules": {"data_fields": {"item": "div.item"}}
    }
    await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers=auth_headers,
    )
    response = await client.get(
        "/api/v1/scrapers/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1 # At least one scraper created by the test user

@pytest.mark.asyncio
async def test_read_scraper_by_id(client: AsyncClient, auth_headers: dict, test_user):
    scraper_data = {
        "name": "Single Scraper",
        "target_url": "http://example.com/single",
        "parse_rules": {"data_fields": {"product": ".product"}}
    }
    create_response = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers=auth_headers,
    )
    scraper_id = create_response.json()["id"]

    get_response = await client.get(
        f"/api/v1/scrapers/{scraper_id}",
        headers=auth_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json()["id"] == scraper_id
    assert get_response.json()["name"] == scraper_data["name"]

@pytest.mark.asyncio
async def test_update_scraper(client: AsyncClient, auth_headers: dict, test_user):
    scraper_data = {
        "name": "Scraper to Update",
        "target_url": "http://example.com/update",
        "parse_rules": {"data_fields": {"text": "p"}}
    }
    create_response = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers=auth_headers,
    )
    scraper_id = create_response.json()["id"]

    update_data = {
        "name": "Updated Scraper Name",
        "description": "This scraper has been updated."
    }
    update_response = await client.put(
        f"/api/v1/scrapers/{scraper_id}",
        json=update_data,
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == update_data["name"]
    assert update_response.json()["description"] == update_data["description"]

@pytest.mark.asyncio
async def test_delete_scraper(client: AsyncClient, auth_headers: dict, test_user):
    scraper_data = {
        "name": "Scraper to Delete",
        "target_url": "http://example.com/delete",
        "parse_rules": {"data_fields": {"data": "div"}}
    }
    create_response = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers=auth_headers,
    )
    scraper_id = create_response.json()["id"]

    delete_response = await client.delete(
        f"/api/v1/scrapers/{scraper_id}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204

    get_response = await client.get(
        f"/api/v1/scrapers/{scraper_id}",
        headers=auth_headers,
    )
    assert get_response.status_code == 404 # Should not be found after deletion

@pytest.mark.asyncio
async def test_scraper_forbidden_access(client: AsyncClient, auth_headers: dict, test_user, test_superuser):
    # Create a scraper by superuser
    scraper_data = {
        "name": "Superuser Scraper",
        "target_url": "http://example.com/superuser",
        "parse_rules": {"data_fields": {"content": "body"}}
    }
    superuser_headers = await client.post(
        "/api/v1/auth/login",
        data={"username": test_superuser.email, "password": test_superuser.hashed_password},
    )
    superuser_token = superuser_headers.json()["access_token"]
    
    create_response = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data,
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert create_response.status_code == 201
    superuser_scraper_id = create_response.json()["id"]

    # Try to access superuser's scraper with regular user's token
    get_response = await client.get(
        f"/api/v1/scrapers/{superuser_scraper_id}",
        headers=auth_headers, # Regular user's headers
    )
    assert get_response.status_code == 403
    assert "Not authorized" in get_response.json()["detail"]

```
---