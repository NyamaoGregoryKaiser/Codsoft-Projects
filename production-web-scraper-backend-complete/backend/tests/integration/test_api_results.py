import pytest
from httpx import AsyncClient
from app.schemas.scraper import ScraperCreate
from app.schemas.job import JobCreate
from app.schemas.result import ScrapedDataCreate
from app.crud.scraper import scraper as crud_scraper
from app.crud.job import job as crud_job
from app.crud.result import scraped_data as crud_scraped_data
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture(scope="function")
async def seeded_scraper_job_results(async_test_session: AsyncSession, test_user):
    # Create scraper
    scraper_in = ScraperCreate(
        name="Results Scraper",
        target_url="http://example.com/results",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await crud_scraper.create(async_test_session, obj_in=scraper_in, owner_id=test_user.id)

    # Create job
    job_in = JobCreate(scraper_id=scraper.id)
    job = await crud_job.create(async_test_session, obj_in=job_in, owner_id=test_user.id)

    # Create results
    results_data = [
        ScrapedDataCreate(job_id=job.id, scraper_id=scraper.id, data={"title": "Result 1"}),
        ScrapedDataCreate(job_id=job.id, scraper_id=scraper.id, data={"title": "Result 2"}),
    ]
    created_results = []
    for data in results_data:
        res = await crud_scraped_data.create(async_test_session, obj_in=data)
        created_results.append(res)
    
    await async_test_session.commit()
    await async_test_session.refresh(scraper)
    await async_test_session.refresh(job)
    for res in created_results:
        await async_test_session.refresh(res)

    return {"scraper": scraper, "job": job, "results": created_results}


@pytest.mark.asyncio
async def test_read_results_for_job(client: AsyncClient, auth_headers: dict, seeded_scraper_job_results):
    job_id = seeded_scraper_job_results["job"].id
    response = await client.get(
        f"/api/v1/results/jobs/{job_id}/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 2
    assert results[0]["data"]["title"] == "Result 2" # Sorted desc by scraped_at (default crud)
    assert results[1]["data"]["title"] == "Result 1"

@pytest.mark.asyncio
async def test_read_results_for_job_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.get(
        "/api/v1/results/jobs/999/",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "Scraping job not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_results_for_job_forbidden(client: AsyncClient, auth_headers: dict, seeded_scraper_job_results, test_superuser):
    job_id = seeded_scraper_job_results["job"].id

    # Try to access with superuser token, but the job belongs to test_user
    # This should still be allowed for superusers
    superuser_headers_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": test_superuser.email, "password": "superpassword"},
    )
    superuser_auth_headers = {"Authorization": f"Bearer {superuser_headers_resp.json()['access_token']}"}

    response = await client.get(
        f"/api/v1/results/jobs/{job_id}/",
        headers=superuser_auth_headers,
    )
    assert response.status_code == 200 # Superuser can access

    # Now, test with another regular user (who doesn't own the job)
    new_user_data = {"email": "another@example.com", "password": "anotherpassword"}
    await client.post("/api/v1/auth/register", json=new_user_data)
    another_user_login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": new_user_data["email"], "password": new_user_data["password"]},
    )
    another_user_auth_headers = {"Authorization": f"Bearer {another_user_login_resp.json()['access_token']}"}

    response = await client.get(
        f"/api/v1/results/jobs/{job_id}/",
        headers=another_user_auth_headers,
    )
    assert response.status_code == 403
    assert "Not authorized to access results for this job" in response.json()["detail"]


@pytest.mark.asyncio
async def test_read_results_for_scraper(client: AsyncClient, auth_headers: dict, seeded_scraper_job_results):
    scraper_id = seeded_scraper_job_results["scraper"].id
    response = await client.get(
        f"/api/v1/results/scrapers/{scraper_id}/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 2
    assert results[0]["data"]["title"] == "Result 2"
    assert results[1]["data"]["title"] == "Result 1"

@pytest.mark.asyncio
async def test_read_result_by_id(client: AsyncClient, auth_headers: dict, seeded_scraper_job_results):
    result_id = seeded_scraper_job_results["results"][0].id
    response = await client.get(
        f"/api/v1/results/{result_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == result_id
    assert result["data"]["title"] == "Result 1"

@pytest.mark.asyncio
async def test_read_result_by_id_forbidden(client: AsyncClient, auth_headers: dict, seeded_scraper_job_results):
    result_id = seeded_scraper_job_results["results"][0].id

    new_user_data = {"email": "another_user_for_forbidden@example.com", "password": "anotherpassword"}
    await client.post("/api/v1/auth/register", json=new_user_data)
    another_user_login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": new_user_data["email"], "password": new_user_data["password"]},
    )
    another_user_auth_headers = {"Authorization": f"Bearer {another_user_login_resp.json()['access_token']}"}

    response = await client.get(
        f"/api/v1/results/{result_id}",
        headers=another_user_auth_headers,
    )
    assert response.status_code == 403
    assert "Not authorized to access this scraped data" in response.json()["detail"]

```
---