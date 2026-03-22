```python
import pytest
from httpx import AsyncClient
from app.crud.project import crud_project
from app.crud.task import crud_task
from app.schemas.project import ProjectCreate
from app.schemas.task import TaskCreate, TaskUpdate
from app.dependencies.auth import get_current_active_user
from app.core.db import get_db

@pytest.fixture
async def create_project_and_task_data(db_session, test_user):
    project_in = ProjectCreate(title="Test Project for Tasks", description="Project for task testing")
    project = await crud_project.create_with_owner(db_session, obj_in=project_in, owner_id=test_user.id)
    
    task_in = TaskCreate(title="First Task", description="Description for first task", project_id=project.id)
    task = await crud_task.create(db_session, obj_in=task_in)
    return project, task

@pytest.mark.asyncio
async def test_create_task_success(authorized_client: AsyncClient, create_project_and_task_data):
    project, _ = create_project_and_task_data
    response = await authorized_client.post(
        "/api/v1/tasks/",
        json={"title": "New Task", "description": "New task description", "project_id": project.id}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Task"
    assert data["project_id"] == project.id

@pytest.mark.asyncio
async def test_create_task_invalid_project(authorized_client: AsyncClient):
    response = await authorized_client.post(
        "/api/v1/tasks/",
        json={"title": "Orphan Task", "description": "No project", "project_id": 9999}
    )
    assert response.status_code == 404
    assert "Project not found" in response.json()["message"]

@pytest.mark.asyncio
async def test_create_task_forbidden_project(client: AsyncClient, create_project_and_task_data, test_admin_user, get_admin_access_token):
    project, _ = create_project_and_task_data
    
    # Create another user who is not owner or admin
    user_in = UserCreate(email="other_task_user@example.com", password="password")
    other_user = await crud_user.create(client.app.dependency_overrides[get_db](), obj_in=user_in)
    other_access_token = create_access_token(data={"user_id": other_user.id, "email": other_user.email, "role": other_user.role})
    client.headers.update({"Authorization": f"Bearer {other_access_token}"})

    response = await client.post(
        "/api/v1/tasks/",
        json={"title": "Forbidden Task", "description": "Should not be able to create", "project_id": project.id}
    )
    assert response.status_code == 403
    assert "Not authorized to create tasks for this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_tasks_by_project_owner(authorized_client: AsyncClient, create_project_and_task_data):
    project, task = create_project_and_task_data
    response = await authorized_client.get(f"/api/v1/tasks/by-project/{project.id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["title"] == task.title

@pytest.mark.asyncio
async def test_read_task_by_id_owner(authorized_client: AsyncClient, create_project_and_task_data):
    _, task = create_project_and_task_data
    response = await authorized_client.get(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["title"] == task.title

@pytest.mark.asyncio
async def test_read_task_by_id_assigned_user(client: AsyncClient, create_project_and_task_data, test_user, db_session):
    project, task = create_project_and_task_data
    # Create an assigned user
    assigned_user_in = UserCreate(email="assigned@example.com", password="assignedpassword")
    assigned_user = await crud_user.create(db_session, obj_in=assigned_user_in)
    
    # Update task to be assigned
    task_update_in = TaskUpdate(assigned_to_id=assigned_user.id)
    await crud_task.update(db_session, db_obj=task, obj_in=task_update_in)

    # Login as assigned user
    assigned_access_token = create_access_token(data={"user_id": assigned_user.id, "email": assigned_user.email, "role": assigned_user.role})
    client.headers.update({"Authorization": f"Bearer {assigned_access_token}"})

    response = await client.get(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["assigned_to_id"] == assigned_user.id

@pytest.mark.asyncio
async def test_update_task_owner(authorized_client: AsyncClient, create_project_and_task_data):
    _, task = create_project_and_task_data
    update_data = {"title": "Updated Task Title", "status": "in-progress"}
    response = await authorized_client.put(f"/api/v1/tasks/{task.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Task Title"
    assert data["status"] == "in-progress"

@pytest.mark.asyncio
async def test_delete_task_owner(authorized_client: AsyncClient, create_project_and_task_data):
    _, task = create_project_and_task_data
    response = await authorized_client.delete(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id

    # Verify task is deleted
    response_get = await authorized_client.get(f"/api/v1/tasks/{task.id}")
    assert response_get.status_code == 404

@pytest.mark.asyncio
async def test_delete_task_non_owner_forbidden(client: AsyncClient, create_project_and_task_data, db_session):
    _, task = create_project_and_task_data
    # Create an assigned user (who is not the owner)
    assigned_user_in = UserCreate(email="assigned_to_delete@example.com", password="password")
    assigned_user = await crud_user.create(db_session, obj_in=assigned_user_in)
    
    # Assign task
    task_update_in = TaskUpdate(assigned_to_id=assigned_user.id)
    await crud_task.update(db_session, db_obj=task, obj_in=task_update_in)

    # Login as assigned user
    assigned_access_token = create_access_token(data={"user_id": assigned_user.id, "email": assigned_user.email, "role": assigned_user.role})
    client.headers.update({"Authorization": f"Bearer {assigned_access_token}"})

    response = await client.delete(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 403
    assert "Not authorized to delete this task" in response.json()["detail"]
```