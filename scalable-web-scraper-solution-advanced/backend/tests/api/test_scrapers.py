import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import crud, schemas
from app.core.config import settings

@pytest.fixture(autouse=True)
def clear_scraper_cache_before_each_test():
    """Clear the alru_cache for scrapers before each test."""
    from app.api.v1.scrapers import get_scraper_from_cache
    get_scraper_from_cache.cache_clear()
    yield

def test_create_scraper(client: TestClient, normal_user_token_headers: dict):
    scraper_data = {
        "name": "Test Scraper",
        "description": "Scrapes test data",
        "start_url": "http://quotes.toscrape.com/",
        "parsing_rules": {
            "item_selector": ".quote",
            "fields": {"text": "span.text", "author": "small.author"},
            "next_page_selector": "li.next > a"
        }
    }
    response = client.post(f"{settings.API_V1_STR}/scrapers/", headers=normal_user_token_headers, json=scraper_data)
    assert response.status_code == 200
    created_scraper = response.json()
    assert created_scraper["name"] == "Test Scraper"
    assert created_scraper["start_url"] == "http://quotes.toscrape.com/"
    assert created_scraper["parsing_rules"]["item_selector"] == ".quote"

def test_read_scraper_by_id(client: TestClient, normal_user_token_headers: dict, db_session: Session, normal_user: schemas.User):
    scraper_in = schemas.ScraperCreate(
        name="Get Scraper",
        start_url="http://example.com",
        parsing_rules={"item_selector": ".item", "fields": {"title": ".title"}}
    )
    scraper = crud.scraper.create_with_owner(db_session, obj_in=scraper_in, owner_id=normal_user.id)

    response = client.get(f"{settings.API_V1_STR}/scrapers/{scraper.id}", headers=normal_user_token_headers)
    assert response.status_code == 200
    retrieved_scraper = response.json()
    assert retrieved_scraper["id"] == scraper.id
    assert retrieved_scraper["name"] == "Get Scraper"

def test_read_scraper_unauthorized_access(client: TestClient, superuser_token_headers: dict, db_session: Session, normal_user: schemas.User):
    scraper_in = schemas.ScraperCreate(
        name="Private Scraper",
        start_url="http://example.com",
        parsing_rules={"item_selector": ".item", "fields": {"title": ".title"}}
    )
    private_scraper = crud.scraper.create_with_owner(db_session, obj_in=scraper_in, owner_id=normal_user.id)

    # Superuser tries to access it (should be allowed)
    response_admin = client.get(f"{settings.API_V1_STR}/scrapers/{private_scraper.id}", headers=superuser_token_headers)
    assert response_admin.status_code == 200

    # Create another normal user
    other_user_email = "otheruser@example.com"
    other_user_password = "otherpassword"
    other_user_in = schemas.UserCreate(email=other_user_email, password=other_user_password, is_superuser=False)
    crud.user.create(db_session, obj_in=other_user_in)
    
    login_data = {"username": other_user_email, "password": other_user_password}
    r = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    other_user_token_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Other normal user tries to access private_scraper (should be forbidden)
    response_other_user = client.get(f"{settings.API_V1_STR}/scrapers/{private_scraper.id}", headers=other_user_token_headers)
    assert response_other_user.status_code == 403

def test_run_scraper_now(client: TestClient, normal_user_token_headers: dict, db_session: Session, normal_user: schemas.User):
    scraper_in = schemas.ScraperCreate(
        name="Run Scraper",
        start_url="http://quotes.toscrape.com/", # Use a real, simple page for testing, though Playwright is mocked here
        parsing_rules={"item_selector": ".quote", "fields": {"text": "span.text"}}
    )
    scraper = crud.scraper.create_with_owner(db_session, obj_in=scraper_in, owner_id=normal_user.id)

    response = client.post(f"{settings.API_V1_STR}/scrapers/{scraper.id}/run", headers=normal_user_token_headers)
    assert response.status_code == 200
    job = response.json()
    assert job["scraper_id"] == scraper.id
    assert job["owner_id"] == normal_user.id
    assert job["status"] == "pending" # Celery task is asynchronous, so it starts as pending

    # Verify job exists in DB
    job_in_db = crud.job.get(db_session, job["id"])
    assert job_in_db is not None
    assert job_in_db.status == "pending"

    # Test rate limiting (this assumes a real redis is running for the test client)
    # The fixture for redis_client doesn't integrate directly into TestClient for middleware
    # To truly test rate limiting, you'd need a functional Redis running during tests and 
    # the client to hit the actual FastAPI app, not just the mocked app.
    # For CI/CD, a real Redis in docker-compose for testing would be preferred.
    # For this example, we'll assume it would work if Redis was properly configured and client was making real requests.
    # For now, just test one successful run.