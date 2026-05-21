import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, regular_user_token_headers):
    project_data = {"name": "My New Project", "description": "A description."}
    response = await client.post(f"{settings.API_V1_STR}/projects/", json=project_data, headers=regular_user_token_headers)
    assert response.status_code == 201
    created_project = response.json()
    assert created_project["name"] == project_data["name"]
    assert "id" in created_project
    assert "owner" in created_project # Ensure owner is returned
    assert created_project["owner"]["email"] == "test@example.com" # Default user email from fixture

@pytest.mark.asyncio
async def test_read_projects_regular_user(client: AsyncClient, regular_user_token_headers, create_project, create_user):
    user = await crud_user.get_by_email(await client.app.dependency_overrides[settings.API_V1_STR.split('/')[1] + '_db'](), email="test@example.com")
    
    # Create projects for the regular user
    proj1 = await create_project(name="User's Project 1", owner=user)
    proj2 = await create_project(name="User's Project 2", owner=user)

    # Create a project for a different user
    other_user = await create_user(username="otheruser", email="other@example.com")
    await create_project(name="Other User's Project", owner=other_user)

    response = await client.get(f"{settings.API_V1_STR}/projects/", headers=regular_user_token_headers)
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2 # Should get at least the two projects created for this user
    project_names = [p["name"] for p in projects]
    assert proj1.name in project_names
    assert proj2.name in project_names
    assert "Other User's Project" not in project_names # Should not see projects from other users

@pytest.mark.asyncio
async def test_read_projects_superuser(client: AsyncClient, superuser_token_headers, create_project, create_user):
    # Ensure there are diverse projects
    user1 = await create_user(username="user_a", email="user_a@example.com")
    user2 = await create_user(username="user_b", email="user_b@example.com")
    await create_project(name="UserA Project", owner=user1)
    await create_project(name="UserB Project", owner=user2)

    response = await client.get(f"{settings.API_V1_STR}/projects/", headers=superuser_token_headers)
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    assert len(projects) >= 2 # Should see all projects
    project_names = [p["name"] for p in projects]
    assert "UserA Project" in project_names
    assert "UserB Project" in project_names

@