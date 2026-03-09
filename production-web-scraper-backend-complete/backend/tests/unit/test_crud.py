import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.job import job as crud_job
from app.crud.result import scraped_data as crud_scraped_data
from app.crud.scraper import scraper as crud_scraper
from app.crud.user import user as crud_user
from app.schemas.job import JobCreate
from app.schemas.result import ScrapedDataCreate
from app.schemas.scraper import ScraperCreate
from app.schemas.user import UserCreate, UserUpdate


@pytest.mark.asyncio
async def test_create_user(async_test_session: AsyncSession, test_user_data: UserCreate):
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    assert user.email == test_user_data.email
    assert hasattr(user, "hashed_password")
    assert user.is_active is True
    assert user.is_superuser is False

@pytest.mark.asyncio
async def test_get_user(async_test_session: AsyncSession, test_user_data: UserCreate):
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    fetched_user = await crud_user.get(async_test_session, id=user.id)
    assert fetched_user.email == user.email

@pytest.mark.asyncio
async def test_get_user_by_email(async_test_session: AsyncSession, test_user_data: UserCreate):
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    fetched_user = await crud_user.get_by_email(async_test_session, email=user.email)
    assert fetched_user.id == user.id

@pytest.mark.asyncio
async def test_update_user(async_test_session: AsyncSession, test_user_data: UserCreate):
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    update_data = UserUpdate(email="new_test@example.com", is_active=False)
    updated_user = await crud_user.update(async_test_session, db_obj=user, obj_in=update_data)
    assert updated_user.email == "new_test@example.com"
    assert updated_user.is_active is False

@pytest.mark.asyncio
async def test_remove_user(async_test_session: AsyncSession, test_user_data: UserCreate):
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    removed_user = await crud_user.remove(async_test_session, id=user.id)
    assert removed_user.id == user.id
    assert await crud_user.get(async_test_session, id=user.id) is None

@pytest.mark.asyncio
async def test_create_scraper(async_test_session: AsyncSession, test_user):
    scraper_in = ScraperCreate(
        name="Test Scraper",
        target_url="http://example.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await crud_scraper.create(async_test_session, obj_in=scraper_in, owner_id=test_user.id)
    assert scraper.name == scraper_in.name
    assert scraper.owner_id == test_user.id

@pytest.mark.asyncio
async def test_update_scraper(async_test_session: AsyncSession, test_user):
    scraper_in = ScraperCreate(
        name="Test Scraper",
        target_url="http://example.com",
        parse_rules={"data_fields": {"title": "h1"}}
    )
    scraper = await crud_scraper.create(async_test_session, obj_in=scraper_in, owner_id=test_user.id)
    update_data = ScraperUpdate(name="Updated Scraper Name")
    updated_scraper = await crud_scraper.update(async_test_session, db_obj=scraper, obj_in=update_data)
    assert updated_scraper.name == "Updated Scraper Name"

@pytest.mark.asyncio
async def test_create_job(async_test_session: AsyncSession, test_user):
    scraper_in = ScraperCreate(name="Test Scraper", target_url="http://example.com", parse_rules={"data_fields": {"title": "h1"}})
    scraper = await crud_scraper.create(async_test_session, obj_in=scraper_in, owner_id=test_user.id)
    
    job_in = JobCreate(scraper_id=scraper.id)
    job = await crud_job.create(async_test_session, obj_in=job_in, owner_id=test_user.id)
    assert job.scraper_id == scraper.id
    assert job.owner_id == test_user.id
    assert job.status == "PENDING"

@pytest.mark.asyncio
async def test_create_scraped_data(async_test_session: AsyncSession, test_user):
    scraper_in = ScraperCreate(name="Test Scraper", target_url="http://example.com", parse_rules={"data_fields": {"title": "h1"}})
    scraper = await crud_scraper.create(async_test_session, obj_in=scraper_in, owner_id=test_user.id)
    job_in = JobCreate(scraper_id=scraper.id)
    job = await crud_job.create(async_test_session, obj_in=job_in, owner_id=test_user.id)

    data_in = ScrapedDataCreate(
        job_id=job.id,
        scraper_id=scraper.id,
        data={"title": "Example Title", "price": "10.99"}
    )
    scraped_data = await crud_scraped_data.create(async_test_session, obj_in=data_in)
    assert scraped_data.job_id == job.id
    assert scraped_data.data["title"] == "Example Title"

```
---