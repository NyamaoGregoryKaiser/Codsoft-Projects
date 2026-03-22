```python
import pytest
from httpx import AsyncClient
from app.crud.project import crud_project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.dependencies.auth import get_current_active_user
from app.core.db import get_db

@pytest.fixture
async def create_project_data(db_session, test_user):
    project_in = ProjectCreate(title="Test Project 1", description="Description for test project")
    project = await crud_project.create_with_owner(db_session, obj_in=project_in, owner_id=test_user.id)
    return project

@pytest.mark.asyncio
async def test_create_project_success(authorized_client: AsyncClient):
    response = await authorized_client.post(
        "/api/v1/projects/",
        json={"title": "My New Project", "description": "This is a new project description"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My New Project"
    assert "id" in data
    assert "owner_id" in data

@pytest.mark.asyncio
async def test_read_projects_user(authorized_client: AsyncClient, create_project_data):
    response = await authorized_client.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["title"] == create_project_data.title

@pytest.mark.asyncio
async def test_read_projects_admin(admin_authorized_client: AsyncClient, create_project_data):
    response = await admin_authorized_client.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1 # Should see at least one project created by test_user

@pytest.mark.asyncio
async def test_read_project_by_id_owner(authorized_client: AsyncClient, create_project_data):
    response = await authorized_client.get(f"/api/v1/projects/{create_project_data.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == create_project_data.id
    assert data["title"] == create_project_data.title

@pytest.mark.asyncio
async def test_read_project_by_id_non_owner_forbidden(client: AsyncClient, create_project_data, test_admin_user, get_admin_access_token):
    # Log in as admin
    client.headers.update({"Authorization": f"Bearer {get_admin_access_token}"})
    
    response = await client.get(f"/api/v1/projects/{create_project_data.id}")
    assert response.status_code == 200 # Admin should be able to access

    # Now with a different regular user (not owner, not admin)
    user_in = UserCreate(email="other@example.com", password="otherpassword")
    other_user = await crud_user.create(client.app.dependency_overrides[get_db](), obj_in=user_in)
    other_access_token = create_access_token(data={"user_id": other_user.id, "email": other_user.email, "role": other_user.role})
    client.headers.update({"Authorization": f"Bearer {other_access_token}"})

    response = await client.get(f"/api/v1/projects/{create_project_data.id}")
    assert response.status_code == 403
    assert "Not authorized to access this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_project_owner(authorized_client: AsyncClient, create_project_data):
    update_data = {"title": "Updated Project Title", "description": "New description"}
    response = await authorized_client.put(f"/api/v1/projects/{create_project_data.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Project Title"
    assert data["description"] == "New description"

@pytest.mark.asyncio
async def test_update_project_non_owner_forbidden(client: AsyncClient, create_project_data, test_admin_user, get_admin_access_token):
    # Log in as admin
    client.headers.update({"Authorization": f"Bearer {get_admin_access_token}"})
    update_data = {"title": "Admin Updated Project Title"}
    response = await client.put(f"/api/v1/projects/{create_project_data.id}", json=update_data)
    assert response.status_code == 200 # Admin should be able to update

    # Now with a different regular user (not owner, not admin)
    user_in = UserCreate(email="another@example.com", password="anotherpassword")
    another_user = await crud_user.create(client.app.dependency_overrides[get_db](), obj_in=user_in)
    another_access_token = create_access_token(data={"user_id": another_user.id, "email": another_user.email, "role": another_user.role})
    client.headers.update({"Authorization": f"Bearer {another_access_token}"})

    response = await client.put(f"/api/v1/projects/{create_project_data.id}", json=update_data)
    assert response.status_code == 403
    assert "Not authorized to access this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_project_owner(authorized_client: AsyncClient, create_project_data):
    response = await authorized_client.delete(f"/api/v1/projects/{create_project_data.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == create_project_data.id

    # Verify project is deleted
    response_get = await authorized_client.get(f"/api/v1/projects/{create_project_data.id}")
    assert response_get.status_code == 404
```