import pytest
from httpx import AsyncClient
from app.schemas.scraper import ScraperCreate
from app.schemas.job import Job
from unittest.mock import patch

@pytest.mark.asyncio
async def test_trigger_job(client: AsyncClient, auth_headers: dict, test_user):
    # Create a scraper first
    scraper_data = ScraperCreate(
        name="Job Test Scraper",
        target_url="http://example.com/jobtest",
        parse_rules={"data_fields": {"heading": "h1"}}
    )
    create_scraper_res = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data.model_dump(),
        headers=auth_headers,
    )
    assert create_scraper_res.status_code == 201
    scraper_id = create_scraper_res.json()["id"]

    with patch('app.worker.tasks.run_scraper_task.delay') as mock_delay:
        trigger_job_res = await client.post(
            f"/api/v1/jobs/{scraper_id}/trigger",
            headers=auth_headers,
        )
        assert trigger_job_res.status_code == 202
        job_data = trigger_job_res.json()
        assert job_data["scraper_id"] == scraper_id
        assert job_data["owner_id"] == test_user.id
        assert job_data["status"] == "PENDING"
        mock_delay.assert_called_once()
        args, kwargs = mock_delay.call_args
        assert args[0] == job_data["id"] # Job ID
        assert args[1] == str(scraper_data.target_url) # Target URL
        assert args[2] == scraper_data.parse_rules # Parse rules

@pytest.mark.asyncio
async def test_trigger_job_scraper_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/jobs/999/trigger", # Non-existent scraper ID
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert "Scraper with ID 999 not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_jobs(client: AsyncClient, auth_headers: dict, test_user):
    # Create a scraper and trigger a job
    scraper_data = ScraperCreate(
        name="List Job Scraper",
        target_url="http://example.com/listjobs",
        parse_rules={"data_fields": {"test": "span"}}
    )
    create_scraper_res = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data.model_dump(),
        headers=auth_headers,
    )
    scraper_id = create_scraper_res.json()["id"]

    with patch('app.worker.tasks.run_scraper_task.delay'): # Mock for this test
        await client.post(
            f"/api/v1/jobs/{scraper_id}/trigger",
            headers=auth_headers,
        )

    response = await client.get(
        "/api/v1/jobs/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    jobs = response.json()
    assert any(job["scraper_id"] == scraper_id for job in jobs)

@pytest.mark.asyncio
async def test_read_job_by_id(client: AsyncClient, auth_headers: dict, test_user):
    # Create a scraper and trigger a job
    scraper_data = ScraperCreate(
        name="Specific Job Scraper",
        target_url="http://example.com/specificjob",
        parse_rules={"data_fields": {"data": "div"}}
    )
    create_scraper_res = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data.model_dump(),
        headers=auth_headers,
    )
    scraper_id = create_scraper_res.json()["id"]

    with patch('app.worker.tasks.run_scraper_task.delay'): # Mock for this test
        trigger_job_res = await client.post(
            f"/api/v1/jobs/{scraper_id}/trigger",
            headers=auth_headers,
        )
        job_id = trigger_job_res.json()["id"]

    response = await client.get(
        f"/api/v1/jobs/{job_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["id"] == job_id
    assert response.json()["scraper_id"] == scraper_id

@pytest.mark.asyncio
async def test_read_job_by_id_forbidden(client: AsyncClient, auth_headers: dict, test_user, test_superuser):
    # Create a scraper by superuser
    scraper_data = ScraperCreate(
        name="Forbidden Job Scraper",
        target_url="http://example.com/forbiddenjob",
        parse_rules={"data_fields": {"f": "h2"}}
    )
    superuser_headers_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": test_superuser.email, "password": "superpassword"},
    )
    superuser_auth_headers = {"Authorization": f"Bearer {superuser_headers_resp.json()['access_token']}"}

    create_scraper_res = await client.post(
        "/api/v1/scrapers/",
        json=scraper_data.model_dump(),
        headers=superuser_auth_headers,
    )
    superuser_scraper_id = create_scraper_res.json()["id"]

    with patch('app.worker.tasks.run_scraper_task.delay'):
        trigger_job_res = await client.post(
            f"/api/v1/jobs/{superuser_scraper_id}/trigger",
            headers=superuser_auth_headers,
        )
        superuser_job_id = trigger_job_res.json()["id"]

    # Try to access superuser's job with regular user's token
    response = await client.get(
        f"/api/v1/jobs/{superuser_job_id}",
        headers=auth_headers, # Regular user's headers
    )
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

```
---