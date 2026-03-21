import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.crud.application import application as crud_application
from app.database.models import User

@pytest.mark.asyncio
async def test_create_application_as_user(client: AsyncClient, regular_user: User, regular_user_token: str):
    app_data = {"name": "MyNewApp", "description": "Description of my new app."}
    response = await client.post(
        "/api/v1/applications/",
        json=app_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    
    assert response.status_code == 201
    app_response = ApplicationResponse(**response.json())
    assert app_response.name == "MyNewApp"
    assert app_response.owner_id == regular_user.id
    assert app_response.api_key is not None
    assert len(app_response.api_key) == 36 # UUID4 length

    # Verify application in DB
    db_app = await crud_application.get(db_session, app_response.id)
    assert db_app.name == "MyNewApp"

@pytest.mark.asyncio
async def test_create_application_duplicate_name(client: AsyncClient, application_user: Application, regular_user_token: str):
    app_data = {"name": application_user.name, "description": "Another app with same name"}
    response = await client.post(
        "/api/v1/applications/",
        json=app_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 400
    assert "Application with this name already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_user_applications(client: AsyncClient, regular_user: User, regular_user_token: str, application_user: Application, application_admin: Application):
    response = await client.get(
        "/api/v1/applications/",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 200
    apps = [ApplicationResponse(**app) for app in response.json()]
    assert len(apps) == 1
    assert apps[0].id == application_user.id
    assert apps[0].name == application_user.name

@pytest.mark.asyncio
async def test_read_application_by_id_owner(client: AsyncClient, regular_user_token: str, application_user: Application):
    response = await client.get(
        f"/api/v1/applications/{application_user.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 200
    app_response = ApplicationResponse(**response.json())
    assert app_response.id == application_user.id
    assert app_response.name == application_user.name

@pytest.mark.asyncio
async def test_read_application_by_id_not_owner(client: AsyncClient, regular_user_token: str, application_admin: Application):
    response = await client.get(
        f"/api/v1/applications/{application_admin.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_application_owner(client: AsyncClient, regular_user_token: str, application_user: Application):
    update_data = {"description": "Updated description for user app."}
    response = await client.put(
        f"/api/v1/applications/{application_user.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 200
    app_response = ApplicationResponse(**response.json())
    assert app_response.description == update_data["description"]

@pytest.mark.asyncio
async def test_update_application_not_owner(client: AsyncClient, regular_user_token: str, application_admin: Application):
    update_data = {"description": "Attempt to update admin app."}
    response = await client.put(
        f"/api/v1/applications/{application_admin.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_application_owner(client: AsyncClient, db_session: AsyncSession, regular_user_token: str, application_user: Application):
    response = await client.delete(
        f"/api/v1/applications/{application_user.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 204
    
    # Verify deletion in DB
    deleted_app = await crud_application.get(db_session, application_user.id)
    assert deleted_app is None

@pytest.mark.asyncio
async def test_delete_application_not_owner(client: AsyncClient, regular_user_token: str, application_admin: Application):
    response = await client.delete(
        f"/api/v1/applications/{application_admin.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_application_not_found(client: AsyncClient, regular_user_token: str):
    response = await client.delete(
        "/api/v1/applications/99999",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 404
    assert "Application not found" in response.json()["detail"]