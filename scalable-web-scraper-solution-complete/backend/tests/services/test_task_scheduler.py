import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone
from app.models.task import TaskStatus, ScrapingTask
from app.crud.task import task as crud_task
from app.crud.result import result as crud_result
from app.services.task_scheduler import TaskScheduler, celery_app, scrape_task_by_id
from app.services.scraper_service import scraper_service
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.result import ScrapingResultCreate

# Mock Celery tasks for testing
@pytest.fixture(autouse=True)
def mock_celery_task_delay():
    with patch.object(scrape_task_by_id, 'delay', autospec=True) as mock_delay, \
         patch.object(scrape_task_by_id, 'apply_async', autospec=True) as mock_apply_async:
        yield mock_delay, mock_apply_async

@pytest.fixture
def task_scheduler_instance():
    return TaskScheduler()

@pytest.mark.asyncio
async def test_schedule_scrape_task_immediate(task_scheduler_instance: TaskScheduler, mock_celery_task_delay):
    mock_delay, _ = mock_celery_task_delay
    task_id = 1
    task_scheduler_instance.schedule_scrape_task(task_id)
    mock_delay.assert_called_once_with(task_id)

@pytest.mark.asyncio
async def test_schedule_scrape_task_eta(task_scheduler_instance: TaskScheduler, mock_celery_task_delay):
    _, mock_apply_async = mock_celery_task_delay
    task_id = 2
    eta_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    task_scheduler_instance.schedule_scrape_task(task_id, eta=eta_time)
    mock_apply_async.assert_called_once_with(args=[task_id], eta=eta_time)

@pytest.mark.asyncio
@patch('app.services.scraper_service.scraper_service.scrape')
async def test_celery_scrape_task_success(mock_scraper_scrape, db_session: AsyncSession, create_task, regular_user):
    # Setup mock scraper response
    mock_scraper_scrape.return_value = {
        "data": {"title": "Mocked Title"},
        "status_code": 200,
        "error_message": None
    }

    # Create a task in the DB
    task = await create_task(owner_id=regular_user.id, name="Celery Test Task", target_url="http://mock.com")
    
    # Run the Celery task function directly
    # Note: For actual Celery integration testing, you'd use celery.contrib.testing.tasks
    # But for unit testing the task logic, calling the inner async function via asyncio.run is sufficient
    result = await scrape_task_by_id.__wrapped__(task.id) # Access the wrapped async function

    # Assertions on task status and result
    db_task = await crud_task.get(db_session, id=task.id)
    assert db_task.status == TaskStatus.COMPLETED
    assert db_task.last_run_at is not None
    assert db_task.next_run_at is not None
    assert db_task.next_run_at > datetime.now(timezone.utc)

    # Assertions on created result
    db_results = await crud_result.get_results_by_task(db_session, task_id=task.id)
    assert len(db_results) == 1
    assert db_results[0].data == {"title": "Mocked Title"}
    assert db_results[0].status_code == 200
    assert db_results[0].error_message is None

    # Assert on the return value of the task
    assert result["status"] == "completed"
    assert result["task_id"] == task.id
    assert result["result"]["data"]["title"] == "Mocked Title"

@pytest.mark.asyncio
@patch('app.services.scraper_service.scraper_service.scrape')
async def test_celery_scrape_task_failure_then_retry(mock_scraper_scrape, db_session: AsyncSession, create_task, regular_user):
    # Simulate a scrape failure
    mock_scraper_scrape.side_effect = [
        {"data": {}, "status_code": 500, "error_message": "Internal Server Error"}, # First attempt fails
        {"data": {"title": "Retried Success"}, "status_code": 200, "error_message": None} # Second attempt succeeds
    ]

    task = await create_task(owner_id=regular_user.id, name="Failing Task", target_url="http://fail.com")

    # Mock Celery's self.retry method
    mock_celery_task_self = MagicMock()
    mock_celery_task_self.retry.side_effect = Exception("Simulated retry") # Raise to stop execution after retry is called

    # First run (should fail and trigger retry)
    with pytest.raises(Exception, match="Simulated retry"):
        await scrape_task_by_id.__wrapped__(mock_celery_task_self, task.id)

    db_task_after_first_run = await crud_task.get(db_session, id=task.id)
    assert db_task_after_first_run.status == TaskStatus.FAILED
    mock_celery_task_self.retry.assert_called_once()
    
    # Simulate the retry attempt (manually set task status back to PENDING if necessary, but here we just re-run)
    # The actual Celery worker would handle the retry and re-execute.
    # For this test, we re-run the "task function" and it will use the next side_effect.
    
    # Reset mock_celery_task_self for the "retry" attempt
    mock_celery_task_self.reset_mock()
    mock_celery_task_self.retry.side_effect = Exception("Simulated retry")

    # Second run (should succeed)
    result = await scrape_task_by_id.__wrapped__(mock_celery_task_self, task.id)
    
    db_task_after_second_run = await crud_task.get(db_session, id=task.id)
    assert db_task_after_second_run.status == TaskStatus.COMPLETED
    assert result["status"] == "completed"
    assert result["result"]["data"]["title"] == "Retried Success"
    assert mock_celery_task_self.retry.call_count == 0 # No retry on success

    db_results = await crud_result.get_results_by_task(db_session, task_id=task.id)
    assert len(db_results) == 2 # One for each run
    assert db_results[0].data["title"] == "Retried Success"
    assert db_results[1].error_message == "Internal Server Error"


@pytest.mark.asyncio
@patch('app.services.task_scheduler.task_scheduler.schedule_scrape_task')
async def test_check_and_schedule_due_tasks(mock_schedule_task, db_session: AsyncSession, create_task, regular_user):
    # Task 1: Due now, active
    task1 = await create_task(owner_id=regular_user.id, name="Due Active Task", is_active=True)
    task1.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.add(task1)

    # Task 2: Not due yet, active
    task2 = await create_task(owner_id=regular_user.id, name="Not Due Active Task", is_active=True)
    task2.next_run_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db_session.add(task2)

    # Task 3: Due now, but inactive
    task3 = await create_task(owner_id=regular_user.id, name="Due Inactive Task", is_active=False)
    task3.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.add(task3)
    
    # Task 4: Due now, status RUNNING (should be ignored for new schedule)
    task4 = await create_task(owner_id=regular_user.id, name="Running Due Task", is_active=True, status=TaskStatus.RUNNING)
    task4.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.add(task4)


    await db_session.commit()
    await db_session.refresh(task1)
    await db_session.refresh(task2)
    await db_session.refresh(task3)
    await db_session.refresh(task4)


    scheduler = TaskScheduler()
    await scheduler.check_and_schedule_due_tasks()

    # Only task1 should have been scheduled
    mock_schedule_task.assert_called_once_with(task1.id)
    
    # Verify task1's status updated
    db_task1 = await crud_task.get(db_session, id=task1.id)
    assert db_task1.status == TaskStatus.PENDING # Updated by scheduler
    assert db_task1.next_run_at == task1.next_run_at # Next run calculation is inside Celery task.
```