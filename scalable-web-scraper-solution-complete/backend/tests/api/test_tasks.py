import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.task import task as crud_task
from app.models.task import TaskStatus
from app.services.task_scheduler import task_scheduler # Import scheduler to mock it
from unittest.mock import MagicMock, patch

@pytest.mark.asyncio
@patch('app.services.task_scheduler.task_scheduler.schedule_scrape_task')
async def test_create_scraping_task(mock_schedule_task, client: AsyncClient, db_session: AsyncSession, regular_user, regular_user_token_headers: dict):
    task_data = {
        "name": "My First Task",
        "target_url": "http://example.com",
        "css_selector": "h1",
        "frequency_seconds": 300
    }
    response = await client.post(
        "/api/v1/tasks/",
        json=task_data,
        headers=regular_user_token_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == task_data["name"]
    assert data["owner_id"] == regular_user.id
    assert data["status"] == TaskStatus.PENDING.value
    assert data["next_run_at"] is not None
    mock_schedule_task.assert_called_once()
    assert mock_schedule_task.call_args.args[0] == data["id"]

@pytest.mark.asyncio
async def test_read_scraping_tasks_regular_user(client: AsyncClient, db_session: AsyncSession, regular_user, regular_user_token_headers: dict, create_task):
    task1 = await create_task(name="User Task 1", owner_id=regular_user.id)
    task2 = await create_task(name="User Task 2", owner_id=regular_user.id)
    # Task for another user (should not be visible)
    await create_task(name="Other User Task", owner_id=regular_user.id + 1) # Assuming next user id

    response = await client.get("/api/v1/tasks/", headers=regular_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2 # Only tasks owned by regular_user
    assert any(task["name"] == task1.name for task in data)
    assert any(task["name"] == task2.name for task in data)
    assert not any(task["name"] == "Other User Task" for task in data)

@pytest.mark.asyncio
async def test_read_scraping_task_owner(client: AsyncClient, regular_user, regular_user_token_headers: dict, create_task):
    task = await create_task(owner_id=regular_user.id)
    response = await client.get(f"/api/v1/tasks/{task.id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["name"] == task.name

@pytest.mark.asyncio
async def test_read_scraping_task_not_owner_forbidden(client: AsyncClient, regular_user_token_headers: dict, create_task):
    task = await create_task(name="Another User's Task", owner_id=999) # Assuming ID 999 is not regular_user.id
    response = await client.get(f"/api/v1/tasks/{task.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to access this task."

@pytest.mark.asyncio
async def test_update_scraping_task_owner(client: AsyncClient, regular_user, regular_user_token_headers: dict, create_task):
    task = await create_task(owner_id=regular_user.id)
    update_data = {"name": "Updated Task Name", "frequency_seconds": 600}
    response = await client.put(
        f"/api/v1/tasks/{task.id}",
        json=update_data,
        headers=regular_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["frequency_seconds"] == update_data["frequency_seconds"]

    db_task = await crud_task.get(db_session, id=task.id)
    assert db_task.name == update_data["name"]
    assert db_task.frequency_seconds == update_data["frequency_seconds"]

@pytest.mark.asyncio
async def test_delete_scraping_task_owner(client: AsyncClient, db_session: AsyncSession, regular_user, regular_user_token_headers: dict, create_task):
    task = await create_task(owner_id=regular_user.id)
    response = await client.delete(f"/api/v1/tasks/{task.id}", headers=regular_user_token_headers)
    assert response.status_code == 204
    
    db_task = await crud_task.get(db_session, id=task.id)
    assert db_task is None

@pytest.mark.asyncio
@patch('app.services.task_scheduler.task_scheduler.schedule_scrape_task')
async def test_trigger_scraping_task(mock_schedule_task, client: AsyncClient, regular_user, regular_user_token_headers: dict, create_task):
    task = await create_task(owner_id=regular_user.id, frequency_seconds=3600)
    response = await client.post(
        f"/api/v1/tasks/{task.id}/run",
        headers=regular_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["status"] == TaskStatus.PENDING.value # Or RUNNING depending on how it's handled immediately
    assert data["next_run_at"] is not None # Should be updated to reflect next scheduled run
    mock_schedule_task.assert_called_once()
    assert mock_schedule_task.call_args.args[0] == task.id
```