import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.user import UserCreate
from app.crud.user import user as crud_user
from app.crud.project import project as crud_project

@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project_data = {"title": "New Project", "description": "Description for new project"}
    response = await client.post(
        f"{settings.API_V1_STR}/projects/",
        json=project_data,
        headers=headers
    )
    assert response.status_code == 201
    created_project = response.json()
    assert created_project["title"] == project_data["title"]
    assert created_project["description"] == project_data["description"]
    assert created_project["owner_id"] == user.id
    assert created_project["owner"]["id"] == user.id

@pytest.mark.asyncio
async def test_read_projects_as_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project1_data = ProjectCreate(title="User1 Project 1", description="User1's first project")
    project2_data = ProjectCreate(title="User1 Project 2", description="User1's second project")
    await crud_project.create_with_owner(db_session, obj_in=project1_data, owner_id=user.id)
    await crud_project.create_with_owner(db_session, obj_in=project2_data, owner_id=user.id)

    # Create a project for another user
    another_user_in = UserCreate(email="test2@example.com", password="pass", full_name="User 2")
    another_user = await crud_user.create(db_session, obj_in=another_user_in)
    project3_data = ProjectCreate(title="User2 Project 1", description="User2's project")
    await crud_project.create_with_owner(db_session, obj_in=project3_data, owner_id=another_user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=headers
    )
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) == 2 # Should only see projects owned by current user
    assert all(p["owner_id"] == user.id for p in projects)
    assert any(p["title"] == "User1 Project 1" for p in projects)
    assert any(p["title"] == "User1 Project 2" for p in projects)

@pytest.mark.asyncio
async def test_read_projects_as_admin(client: AsyncClient, db_session: AsyncSession, superuser_token_headers: dict, normal_user_token_headers: tuple):
    _, user1 = normal_user_token_headers
    project1_data = ProjectCreate(title="Admin See Project 1", description="Owned by user1")
    await crud_project.create_with_owner(db_session, obj_in=project1_data, owner_id=user1.id)

    response = await client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 1 # At least the one created above
    assert any(p["title"] == "Admin See Project 1" for p in projects)
    # The superuser can also own projects, which would increase the count
    assert any(p["email"] == user1.email for p in [p["owner"] for p in projects])

@pytest.mark.asyncio
async def test_read_single_project_as_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project_data = ProjectCreate(title="Specific Project", description="Details for specific project")
    created_project = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/projects/{created_project.id}",
        headers=headers
    )
    assert response.status_code == 200
    project = response.json()
    assert project["id"] == created_project.id
    assert project["title"] == project_data["title"]

@pytest.mark.asyncio
async def test_read_single_project_as_non_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, owner_user = normal_user_token_headers
    headers_non_owner, _ = another_user_token_headers
    
    project_data = ProjectCreate(title="Owner Only Project", description="Only owner can see")
    created_project = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=owner_user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/projects/{created_project.id}",
        headers=headers_non_owner
    )
    assert response.status_code == 403
    assert "Not authorized to access this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_project_as_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project_data = ProjectCreate(title="Updatable Project", description="Old description")
    project_to_update = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=user.id)

    update_payload = {"description": "New description", "title": "Updated Title"}
    response = await client.put(
        f"{settings.API_V1_STR}/projects/{project_to_update.id}",
        json=update_payload,
        headers=headers
    )
    assert response.status_code == 200
    updated_project = response.json()
    assert updated_project["title"] == update_payload["title"]
    assert updated_project["description"] == update_payload["description"]

@pytest.mark.asyncio
async def test_update_project_as_non_owner_forbidden(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, owner_user = normal_user_token_headers
    headers_non_owner, _ = another_user_token_headers
    
    project_data = ProjectCreate(title="Immutable Project", description="Cannot be changed")
    project_to_update = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=owner_user.id)

    update_payload = {"description": "Attempt to change"}
    response = await client.put(
        f"{settings.API_V1_STR}/projects/{project_to_update.id}",
        json=update_payload,
        headers=headers_non_owner
    )
    assert response.status_code == 403
    assert "Not authorized to update this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_project_as_admin(client: AsyncClient, db_session: AsyncSession, superuser_token_headers: dict, normal_user_token_headers: tuple):
    _, user = normal_user_token_headers
    project_data = ProjectCreate(title="Deletable Project", description="Admin can delete")
    project_to_delete = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=user.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/projects/{project_to_delete.id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    deleted_project = response.json()
    assert deleted_project["id"] == project_to_delete.id

    # Verify project is truly deleted
    get_response = await client.get(
        f"{settings.API_V1_STR}/projects/{project_to_delete.id}",
        headers=superuser_token_headers
    )
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_delete_project_as_normal_user_forbidden(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project_data = ProjectCreate(title="User Deletes Project", description="Should be forbidden")
    project_to_delete = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=user.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/projects/{project_to_delete.id}",
        headers=headers
    )
    assert response.status_code == 403
    assert "Not authorized to delete this project" in response.json()["detail"]