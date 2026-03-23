import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.project import ProjectCreate
from app.schemas.task import TaskCreate
from app.schemas.comment import CommentCreate
from app.schemas.user import UserCreate
from app.db.models import TaskStatus, TaskPriority
from app.crud.user import user as crud_user
from app.crud.project import project as crud_project
from app.crud.task import task as crud_task
from app.crud.comment import comment as crud_comment

@pytest.mark.asyncio
async def test_create_comment(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Project for Comment"), owner_id=user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task for Comment", project_id=project.id, creator_id=user.id), creator_id=user.id)

    comment_data = {"content": "This is a new comment.", "task_id": task.id}
    response = await client.post(
        f"{settings.API_V1_STR}/comments/",
        json=comment_data,
        headers=headers
    )
    assert response.status_code == 201
    created_comment = response.json()
    assert created_comment["content"] == comment_data["content"]
    assert created_comment["task_id"] == task.id
    assert created_comment["author"]["id"] == user.id

@pytest.mark.asyncio
async def test_create_comment_unauthorized_task(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, owner_user = normal_user_token_headers
    headers_unauthorized, _ = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Restricted Comment Project"), owner_id=owner_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Restricted Comment Task", project_id=project.id, creator_id=owner_user.id), creator_id=owner_user.id)

    comment_data = {"content": "Unauthorized comment attempt.", "task_id": task.id}
    response = await client.post(
        f"{settings.API_V1_STR}/comments/",
        json=comment_data,
        headers=headers_unauthorized
    )
    assert response.status_code == 403
    assert "Not authorized to comment on this task." in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_comments_by_task(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Comment List Project"), owner_id=user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task with Comments", project_id=project.id, creator_id=user.id), creator_id=user.id)

    comment1 = await crud_comment.create_with_author(db_session, CommentCreate(content="First comment", task_id=task.id), author_id=user.id)
    comment2 = await crud_comment.create_with_author(db_session, CommentCreate(content="Second comment", task_id=task.id), author_id=user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/comments/task/{task.id}/",
        headers=headers
    )
    assert response.status_code == 200
    comments = response.json()
    assert len(comments) == 2
    assert any(c["content"] == comment1.content for c in comments)
    assert any(c["content"] == comment2.content for c in comments)

@pytest.mark.asyncio
async def test_read_comments_unauthorized_task(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, owner_user = normal_user_token_headers
    headers_unauthorized, _ = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Private Task Project"), owner_id=owner_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Private Task", project_id=project.id, creator_id=owner_user.id), creator_id=owner_user.id)
    await crud_comment.create_with_author(db_session, CommentCreate(content="A comment", task_id=task.id), author_id=owner_user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/comments/task/{task.id}/",
        headers=headers_unauthorized
    )
    assert response.status_code == 403
    assert "Not authorized to access this task's comments." in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_comment_as_author(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Update Comment Project"), owner_id=user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task for Update Comment", project_id=project.id, creator_id=user.id), creator_id=user.id)
    comment = await crud_comment.create_with_author(db_session, CommentCreate(content="Original content", task_id=task.id), author_id=user.id)

    update_payload = {"content": "Updated content."}
    response = await client.put(
        f"{settings.API_V1_STR}/comments/{comment.id}",
        json=update_payload,
        headers=headers
    )
    assert response.status_code == 200
    updated_comment = response.json()
    assert updated_comment["content"] == update_payload["content"]

@pytest.mark.asyncio
async def test_update_comment_unauthorized(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_author, author_user = normal_user_token_headers
    headers_unauthorized, _ = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Unauthorized Comment Update Project"), owner_id=author_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Unauthorized Comment Update Task", project_id=project.id, creator_id=author_user.id), creator_id=author_user.id)
    comment = await crud_comment.create_with_author(db_session, CommentCreate(content="Original content", task_id=task.id), author_id=author_user.id)

    update_payload = {"content": "Attempt to update."}
    response = await client.put(
        f"{settings.API_V1_STR}/comments/{comment.id}",
        json=update_payload,
        headers=headers_unauthorized
    )
    assert response.status_code == 403
    assert "Not authorized to update this comment." in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_comment_as_author(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Delete Comment Project"), owner_id=user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task for Delete Comment", project_id=project.id, creator_id=user.id), creator_id=user.id)
    comment = await crud_comment.create_with_author(db_session, CommentCreate(content="Delete me", task_id=task.id), author_id=user.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/comments/{comment.id}",
        headers=headers
    )
    assert response.status_code == 200
    deleted_comment = response.json()
    assert deleted_comment["id"] == comment.id

    # Verify comment is deleted
    get_response = await client.get(
        f"{settings.API_V1_STR}/comments/task/{task.id}/",
        headers=headers
    )
    assert response.status_code == 200
    assert not any(c["id"] == comment.id for c in get_response.json())

@pytest.mark.asyncio
async def test_delete_comment_as_project_owner(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_owner, project_owner = normal_user_token_headers # This user owns the project
    headers_comment_author, comment_author = another_user_token_headers # This user authored the comment

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Project Owner Deletes Comment"), owner_id=project_owner.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Task for PO Delete Comment", project_id=project.id, creator_id=project_owner.id), creator_id=project_owner.id)
    comment = await crud_comment.create_with_author(db_session, CommentCreate(content="Comment to be deleted by PO", task_id=task.id), author_id=comment_author.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/comments/{comment.id}",
        headers=headers_owner # Project owner deletes comment
    )
    assert response.status_code == 200
    deleted_comment = response.json()
    assert deleted_comment["id"] == comment.id

@pytest.mark.asyncio
async def test_delete_comment_unauthorized(client: AsyncClient, db_session: AsyncSession, normal_user_token_headers: tuple, another_user_token_headers: tuple):
    headers_author, author_user = normal_user_token_headers
    headers_unauthorized, unauthorized_user = another_user_token_headers

    project = await crud_project.create_with_owner(db_session, ProjectCreate(title="Unauthorized Delete Comment Project"), owner_id=author_user.id)
    task = await crud_task.create_with_creator(db_session, TaskCreate(title="Unauthorized Delete Comment Task", project_id=project.id, creator_id=author_user.id), creator_id=author_user.id)
    comment = await crud_comment.create_with_author(db_session, CommentCreate(content="Comment to protect", task_id=task.id), author_id=author_user.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/comments/{comment.id}",
        headers=headers_unauthorized # Unauthorized user tries to delete
    )
    assert response.status_code == 403
    assert "Not authorized to delete this comment." in response.json()["detail"]