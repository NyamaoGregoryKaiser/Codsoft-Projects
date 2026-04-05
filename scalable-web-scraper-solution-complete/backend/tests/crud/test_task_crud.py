import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.task import task as crud_task
from app.schemas.task import ScrapingTaskCreate, ScrapingTaskUpdate
from app.models.task import TaskStatus
from datetime import datetime, timedelta, timezone

@pytest.mark.asyncio
async def test_create_task(db_session: AsyncSession, regular_user):
    task_in = ScrapingTaskCreate(
        name="Test Task",
        target_url="http://test.com",
        css_selector="div.item",
        frequency_seconds=3600
    )
    task = await crud_task.create(db_session, obj_in=task_in.model_dump(exclude_unset=True) | {"owner_id": regular_user.id})
    assert task.name == "Test Task"
    assert task.target_url == "http://test.com"
    assert task.owner_id == regular_user.id
    assert task.status == TaskStatus.PENDING

@pytest.mark.asyncio
async def test_get_tasks_by_owner(db_session: AsyncSession, regular_user, create_task):
    task1 = await create_task(name="User Task 1", owner_id=regular_user.id)
    task2 = await create_task(name="User Task 2", owner_id=regular_user.id)
    # Task for another user (should not be retrieved)
    await create_task(name="Other User Task", owner_id=regular_user.id + 1)

    user_tasks = await crud_task.get_tasks_by_owner(db_session, owner_id=regular_user.id)
    assert len(user_tasks) == 2
    assert task1 in user_tasks
    assert task2 in user_tasks
    assert all(t.owner_id == regular_user.id for t in user_tasks)

@pytest.mark.asyncio
async def test_update_task(db_session: AsyncSession, create_task):
    task = await create_task(name="Original Name")
    task_update_in = ScrapingTaskUpdate(name="Updated Name", status=TaskStatus.RUNNING)
    updated_task = await crud_task.update(db_session, db_obj=task, obj_in=task_update_in)
    
    assert updated_task.name == "Updated Name"
    assert updated_task.status == TaskStatus.RUNNING
    
    # Verify in DB
    retrieved_task = await crud_task.get(db_session, id=task.id)
    assert retrieved_task.name == "Updated Name"
    assert retrieved_task.status == TaskStatus.RUNNING

@pytest.mark.asyncio
async def test_get_tasks_due_for_run(db_session: AsyncSession, create_task):
    # Task due now
    task_due = await create_task(name="Due Task", is_active=True, frequency_seconds=60)
    task_due.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db_session.add(task_due)

    # Task not due yet
    task_not_due = await create_task(name="Not Due Task", is_active=True, frequency_seconds=3600)
    task_not_due.next_run_at = datetime.now(timezone.utc) + timedelta(minutes=60)
    db_session.add(task_not_due)

    # Inactive task
    task_inactive = await create_task(name="Inactive Task", is_active=False)
    task_inactive.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db_session.add(task_inactive)

    await db_session.commit()
    await db_session.refresh(task_due)
    await db_session.refresh(task_not_due)
    await db_session.refresh(task_inactive)

    due_tasks = await crud_task.get_tasks_due_for_run(db_session)
    assert len(due_tasks) == 1
    assert due_tasks[0].id == task_due.id
    assert due_tasks[0].name == "Due Task"
```