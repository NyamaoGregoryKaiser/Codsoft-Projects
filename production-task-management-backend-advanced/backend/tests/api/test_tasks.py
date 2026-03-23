import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.project import ProjectCreate
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.user import UserCreate
from app.db.models import TaskStatus, TaskPriority
from app.crud.user import user as crud_user
from app.crud.project import project as crud_project
from app.crud.task import task as crud_task
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, creator_user = normal_user_token_headers
    project_data = ProjectCreate(title="Task Project", description="For task testing")
    project = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=creator_user.id)

    assignee_user_data = UserCreate(email="assignee@example.com", password="pass", full_name="Assignee User")
    assignee_user = await crud_user.create(db_session, obj_in=assignee_user_data)

    task_data = {
        "title": "New Task",
        "description": "Task description",
        "project_id": project.id,
        "assignee_id": assignee_user.id,
        "status": TaskStatus.OPEN.value,
        "priority": TaskPriority.HIGH.value,
        "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat()
    }
    response = await client.post(
        f"{settings.API_V1_STR}/tasks/",
        json=task_data,
        headers=headers
    )
    assert response.status_code == 201
    created_task = response.json()
    assert created_task["title"] == task_data["title"]
    assert created_task["project_id"] == project.id
    assert created_task["creator"]["id"] == creator_user.id
    assert created_task["assignee"]["id"] == assignee_user.id
    assert created_task["status"] == TaskStatus.OPEN.value

@pytest.mark.asyncio
async def test_create_task_unauthorized_project(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, owner_user = normal_user_token_headers
    headers_creator, _ = another_user_token_headers # This user will try to create a task in owner_user's project
    
    project_data = ProjectCreate(title="Restricted Project", description="Cannot create tasks here")
    project = await crud_project.create_with_owner(db_session, obj_in=project_data, owner_id=owner_user.id)

    task_data = {
        "title": "Unauthorized Task",
        "project_id": project.id,
        "description": "Attempt to create a task in a project not owned by user"
    }
    response = await client.post(
        f"{settings.API_V1_STR}/tasks/",
        json=task_data,
        headers=headers_creator
    )
    assert response.status_code == 403
    assert "Not authorized to create tasks in this project" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_tasks_as_creator_and_assignee(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_user1, user1 = normal_user_token_headers
    headers_user2, user2 = another_user_token_headers

    # Project owned by user1
    project1_data = ProjectCreate(title="User1 Project for Tasks", description="Owned by user1")
    project1 = await crud_project.create_with_owner(db_session, obj_in=project1_data, owner_id=user1.id)

    # Task created by user1, assigned to user2 in project1
    task1_data = TaskCreate(title="Task by User1, to User2", project_id=project1.id, assignee_id=user2.id, creator_id=user1.id)
    await crud_task.create_with_creator(db_session, obj_in=task1_data, creator_id=user1.id)

    # Task created by user2, assigned to user1 in project1
    task2_data = TaskCreate(title="Task by User2, to User1", project_id=project1.id, assignee_id=user1.id, creator_id=user2.id)
    await crud_task.create_with_creator(db_session, obj_in=task2_data, creator_id=user2.id)

    # Project owned by user2
    project2_data = ProjectCreate(title="User2 Project for Tasks", description="Owned by user2")
    project2 = await crud_project.create_with_owner(db_session, obj_in=project2_data, owner_id=user2.id)

    # Task created by user2, assigned to user2 in project2
    task3_data = TaskCreate(title="Task by User2, to User2 in Project2", project_id=project2.id, assignee_id=user2.id, creator_id=user2.id)
    await crud_task.create_with_creator(db_session, obj_in=task3_data, creator_id=user2.id)

    # Test as user1 (owner of project1, assignee of task2)
    response = await client.get(f"{settings.API_V1_STR}/tasks/", headers=headers_user1)
    assert response.status_code == 200
    tasks_user1 = response.json()
    assert len(tasks_user1) == 2 # task1 (project owner), task2 (assignee)
    assert any(t["title"] == "Task by User1, to User2" for t in tasks_user1)
    assert any(t["title"] == "Task by User2, to User1" for t in tasks_user1)
    assert not any(t["title"] == "Task by User2, to User2 in Project2" for t in tasks_user1)

    # Test as user2 (creator of task2 and task3, assignee of task1 and task3, owner of project2)
    response = await client.get(f"{settings.API_V1_STR}/tasks/", headers=headers_user2)
    assert response.status_code == 200
    tasks_user2 = response.json()
    assert len(tasks_user2) == 3 # task1 (assignee), task2 (creator), task3 (creator, assignee, project owner)
    assert any(t["title"] == "Task by User1, to User2" for t in tasks_user2)
    assert any(t["title"] == "Task by User2, to User1" for t in tasks_user2)
    assert any(t["title"] == "Task by User2, to User2 in Project2" for t in tasks_user2)

@pytest.mark.asyncio
async def test_read_task_by_id_access_control(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_user1, user1 = normal_user_token_headers
    headers_user2, user2 = another_user_token_headers

    project_by_user1 = await crud_project.create_with_owner(db_session, ProjectCreate(title="User1 Project"), owner_id=user1.id)
    task_by_user1_assigned_to_user1 = await crud_task.create_with_creator(db_session, TaskCreate(title="Task 1", project_id=project_by_user1.id, assignee_id=user1.id, creator_id=user1.id), creator_id=user1.id)
    task_by_user1_assigned_to_user2 = await crud_task.create_with_creator(db_session, TaskCreate(title="Task 2", project_id=project_by_user1.id, assignee_id=user2.id, creator_id=user1.id), creator_id=user1.id)

    # User1 (creator, assignee, project owner) can read Task 1
    response = await client.get(f"{settings.API_V1_STR}/tasks/{task_by_user1_assigned_to_user1.id}", headers=headers_user1)
    assert response.status_code == 200

    # User1 (creator, project owner) can read Task 2
    response = await client.get(f"{settings.API_V1_STR}/tasks/{task_by_user1_assigned_to_user2.id}", headers=headers_user1)
    assert response.status_code == 200

    # User2 (assignee) can read Task 2
    response = await client.get(f"{settings.API_V1_STR}/tasks/{task_by_user1_assigned_to_user2.id}", headers=headers_user2)
    assert response.status_code == 200

    # User2 cannot read Task 1 (not creator, not assignee, not project owner)
    response = await client.get(f"{settings.API_V1_STR}/tasks/{task_by_user1_assigned_to_user1.id}", headers=headers_user2)
    assert response.status_code == 403
    assert "Not authorized to access this task." in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_task_as_creator(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, creator_user = normal_user_token_headers
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Project for Update"), owner_id=creator_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task to Update", project_id=project.id, creator_id=creator_user.id), creator_id=creator_user.id)

    update_payload = {"title": "Updated Task Title", "status": TaskStatus.IN_PROGRESS.value}
    response = await client.put(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        json=update_payload,
        headers=headers
    )
    assert response.status_code == 200
    updated_task = response.json()
    assert updated_task["title"] == update_payload["title"]
    assert updated_task["status"] == update_payload["status"]

@pytest.mark.asyncio
async def test_update_task_as_assignee(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_creator, creator_user = normal_user_token_headers
    headers_assignee, assignee_user = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Assignee Project"), owner_id=creator_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Assignee Task", project_id=project.id, creator_id=creator_user.id, assignee_id=assignee_user.id), creator_id=creator_user.id)

    update_payload = {"status": TaskStatus.REVIEW.value}
    response = await client.put(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        json=update_payload,
        headers=headers_assignee
    )
    assert response.status_code == 200
    updated_task = response.json()
    assert updated_task["status"] == update_payload["status"]

@pytest.mark.asyncio
async def test_update_task_unauthorized(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_creator, creator_user = normal_user_token_headers
    headers_unauthorized, _ = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Secure Project"), owner_id=creator_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Secure Task", project_id=project.id, creator_id=creator_user.id), creator_id=creator_user.id)

    update_payload = {"status": TaskStatus.DONE.value}
    response = await client.put(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        json=update_payload,
        headers=headers_unauthorized
    )
    assert response.status_code == 403
    assert "Not authorized to update this task." in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_task_as_project_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, superuser_token_headers: dict):
    # Use superuser to delete, as regular user cannot
    headers_owner, project_owner = normal_user_token_headers # This user owns the project
    
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Project to Delete Task"), owner_id=project_owner.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task to Be Deleted", project_id=project.id, creator_id=project_owner.id), creator_id=project_owner.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        headers=superuser_token_headers # Superuser can delete any task
    )
    assert response.status_code == 200
    deleted_task = response.json()
    assert deleted_task["id"] == task.id

    # Verify task is deleted
    get_response = await client.get(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        headers=superuser_token_headers
    )
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_delete_task_unauthorized(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, project_owner = normal_user_token_headers
    headers_unauthorized, unauthorized_user = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Protected Project"), owner_id=project_owner.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Protected Task", project_id=project.id, creator_id=project_owner.id), creator_id=project_owner.id)

    # Unauthorized user tries to delete task
    response = await client.delete(
        f"{settings.API_V1_STR}/tasks/{task.id}",
        headers=headers_unauthorized
    )
    assert response.status_code == 403
    assert "Not authorized to delete this task." in response.json()["detail"]