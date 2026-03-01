import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.project import project as crud_project
from app.models.user import User

@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, regular_user: User, auth_regular_user_headers: dict):
    """Test creating a project as a regular user."""
    project_data = {"title": "My New Project", "description": "A test project description."}
    response = await client.post(
        f"{settings.API_V1_STR}/projects/",
        json=project_data,
        headers=auth_regular_user_headers
    )
    assert response.status_code == 201
    created_project = response.json()
    assert created_project["title"] == project_data["title"]
    assert created_project["owner_id"] == regular_user.id
    assert "id" in created_project

@pytest.mark.asyncio
async def test_read_projects_for_owner(client: AsyncClient, regular_user: User, auth_regular_user_headers: dict, db_session: AsyncSession):
    """Test retrieving projects owned by the regular user."""
    # Create some projects for the regular user
    project1 = await crud_project.create_with_owner(db_session, obj_in={"title": "User Project 1"}, owner_id=regular_user.id)
    project2 = await crud_project.create_with_owner(db_session, obj_in={"title": "User Project 2"}, owner_id=regular_user.id)
    await db_session.commit()

    response = await client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2 # May include other projects from previous tests, but should find at least these two
    assert any(p["id"] == project1.id for p in projects)
    assert any(p["id"] == project2.id for p in projects)
    assert all(p["owner_id"] == regular_user.id for p in projects if p["owner_id"] == regular_user.id)

@pytest.mark.asyncio
async def test_read_projects_admin(client: AsyncClient, admin_user: User, regular_user: User, auth_admin_headers: dict, db_session: AsyncSession):
    """Test retrieving all projects as an admin."""
    # Ensure there are projects from different owners
    project_admin = await crud_project.create_with_owner(db_session, obj_in={"title": "Admin Project"}, owner_id=admin_user.id)
    project_regular = await crud_project.create_with_owner(db_session, obj_in={"title": "Regular User Project"}, owner_id=regular_user.id)
    await db_session.commit()

    response = await client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=auth_admin_headers
    )
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2 # At least the two created here
    assert any(p["id"] == project_admin.id for p in projects)
    assert any(p["id"] == project_regular.id for p in projects)

@pytest.mark.asyncio
async def test_read_project_by_id_owner(client: AsyncClient, regular_user: User, auth_regular_user_headers: dict, db_session: AsyncSession):
    """Test retrieving a specific project by ID as its owner."""
    project = await crud_project.create_with_owner(db_session, obj_in={"title": "Owner Project"}, owner_id=regular_user.id)
    await db_session.commit()

    response = await client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 200
    project_data = response.json()
    assert project_data["id"] == project.id
    assert project_data["title"] == "Owner Project"
    assert project_data["owner_id"] == regular_user.id

@pytest.mark.asyncio
async def test_read_project_by_id_forbidden(client: AsyncClient, admin_user: User, regular_user: User, auth_regular_user_headers: dict, db_session: AsyncSession):
    """Test retrieving a project owned by another user (should be forbidden)."""
    project = await crud_project.create_with_owner(db_session, obj_in={"title": "Admin's Project"}, owner_id=admin_user.id)
    await db_session.commit()

    response = await client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions to access this project"

@pytest.mark.asyncio
async def test_update_project_owner(client: AsyncClient, regular_user: User, auth_regular_user_headers: dict, db_session: AsyncSession):
    """Test updating a project as its owner."""
    project = await crud_project.create_with_owner(db_session, obj_in={"title": "Old Title"}, owner_id=regular_user.id)
    await db_session.commit()

    update_data = {"title": "Updated Title", "description": "New description."}
    response = await client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        json=update_data,
        headers=auth_regular_user_headers
    )
    assert response.status_code == 200
    updated_project = response.json()
    assert updated_project["title"] == update_data["title"]
    assert updated_project["description"] == update_data["description"]

    project_in_db = await crud_project.get(db_session, id=project.id)
    assert project_in_db.title == update_data["title"]

@pytest.mark.asyncio
async def test_delete_project_owner(client: AsyncClient, regular_user: User, auth_regular_user_headers: dict, db_session: AsyncSession):
    """Test deleting a project as its owner."""
    project = await crud_project.create_with_owner(db_session, obj_in={"title": "Project to Delete"}, owner_id=regular_user.id)
    await db_session.commit()

    response = await client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 204

    project_in_db = await crud_project.get(db_session, id=project.id)
    assert project_in_db is None
```