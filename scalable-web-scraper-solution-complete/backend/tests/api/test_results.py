import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import TaskStatus
from app.crud.result import result as crud_result

@pytest.mark.asyncio
async def test_get_results_for_task_owner(client: AsyncClient, regular_user, regular_user_token_headers: dict, create_task, create_result):
    task = await create_task(owner_id=regular_user.id)
    result1 = await create_result(task_id=task.id)
    result2 = await create_result(task_id=task.id)

    response = await client.get(f"/api/v1/results/task/{task.id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(r["id"] == result1.id for r in data)
    assert any(r["id"] == result2.id for r in data)

@pytest.mark.asyncio
async def test_get_results_for_task_not_owner_forbidden(client: AsyncClient, regular_user_token_headers: dict, create_task):
    task = await create_task(owner_id=999) # Task owned by another user
    response = await client.get(f"/api/v1/results/task/{task.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to access this task."

@pytest.mark.asyncio
async def test_get_scraping_result_owner(client: AsyncClient, regular_user, regular_user_token_headers: dict, create_task, create_result):
    task = await create_task(owner_id=regular_user.id)
    result = await create_result(task_id=task.id)

    response = await client.get(f"/api/v1/results/{result.id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == result.id
    assert data["task_id"] == task.id
    assert data["data"] == result.data

@pytest.mark.asyncio
async def test_get_scraping_result_not_owner_forbidden(client: AsyncClient, regular_user_token_headers: dict, create_task, create_result):
    task = await create_task(owner_id=999)
    result = await create_result(task_id=task.id)
    response = await client.get(f"/api/v1/results/{result.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to access this task."

@pytest.mark.asyncio
async def test_delete_scraping_result_owner(client: AsyncClient, db_session: AsyncSession, regular_user, regular_user_token_headers: dict, create_task, create_result):
    task = await create_task(owner_id=regular_user.id)
    result = await create_result(task_id=task.id)

    response = await client.delete(f"/api/v1/results/{result.id}", headers=regular_user_token_headers)
    assert response.status_code == 204
    
    db_result = await crud_result.get(db_session, id=result.id)
    assert db_result is None
```