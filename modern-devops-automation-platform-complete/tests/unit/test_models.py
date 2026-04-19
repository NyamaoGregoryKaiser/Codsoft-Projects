import pytest
from datetime import datetime, timedelta
from app.models import User, Project, Task

def test_user_creation(session):
    user = User('testuser', 'test@example.com', 'password123')
    session.add(user)
    session.commit()
    assert user.id is not None
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.check_password('password123')
    assert not user.is_admin
    assert user.is_active
    assert isinstance(user.created_at, datetime)

def test_user_password_hashing(session):
    user = User('secureuser', 'secure@example.com', 'strongpassword')
    session.add(user)
    session.commit()
    assert user.password_hash is not None
    assert user.check_password('strongpassword')
    assert not user.check_password('wrongpassword')

def test_project_creation(session, regular_user):
    project = Project(name='My Test Project', description='A brief description.', owner=regular_user)
    session.add(project)
    session.commit()
    assert project.id is not None
    assert project.name == 'My Test Project'
    assert project.description == 'A brief description.'
    assert project.owner_id == regular_user.id
    assert not project.is_completed
    assert isinstance(project.created_at, datetime)

def test_task_creation(session, user_project, regular_user):
    due_date = datetime.utcnow() + timedelta(days=5)
    task = Task(title='New Task', description='Task for testing.',
                project=user_project, assignee=regular_user,
                status='in-progress', priority='high', due_date=due_date)
    session.add(task)
    session.commit()
    assert task.id is not None
    assert task.title == 'New Task'
    assert task.project_id == user_project.id
    assert task.assignee_id == regular_user.id
    assert task.status == 'in-progress'
    assert task.priority == 'high'
    assert task.due_date.replace(microsecond=0) == due_date.replace(microsecond=0) # Compare ignoring microseconds
    assert isinstance(task.created_at, datetime)

def test_user_to_dict(session, regular_user):
    user_dict = regular_user.to_dict()
    assert isinstance(user_dict, dict)
    assert user_dict['id'] == regular_user.id
    assert user_dict['username'] == regular_user.username
    assert 'password_hash' not in user_dict # Password hash should not be exposed

def test_project_to_dict(session, user_project, regular_user):
    project_dict = user_project.to_dict()
    assert isinstance(project_dict, dict)
    assert project_dict['id'] == user_project.id
    assert project_dict['name'] == user_project.name
    assert project_dict['owner_id'] == regular_user.id
    assert project_dict['owner_username'] == regular_user.username
    assert project_dict['total_tasks'] == 0 # Initially no tasks

def test_task_to_dict(session, user_task, user_project, regular_user):
    task_dict = user_task.to_dict()
    assert isinstance(task_dict, dict)
    assert task_dict['id'] == user_task.id
    assert task_dict['title'] == user_task.title
    assert task_dict['project_id'] == user_project.id
    assert task_dict['project_name'] == user_project.name
    assert task_dict['assignee_id'] == regular_user.id
    assert task_dict['assignee_username'] == regular_user.username

def test_project_cascade_delete_tasks(session, regular_user):
    project = Project(name='Project with Tasks', owner=regular_user)
    session.add(project)
    session.commit()

    task1 = Task(title='Task 1', project=project, assignee=regular_user)
    task2 = Task(title='Task 2', project=project, assignee=regular_user)
    session.add_all([task1, task2])
    session.commit()

    assert Task.query.count() == 2

    session.delete(project)
    session.commit()

    assert Task.query.count() == 0 # Tasks should be deleted
    assert Project.query.count() == 0 # Project should be deleted
```