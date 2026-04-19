import pytest
from app.models import User, Project, Task
from datetime import datetime, timedelta

# --- Auth Endpoints ---

def test_register_user(client, session):
    response = client.post('/api/v1/auth/register', json={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert 'User registered successfully' in response.json['message']
    assert User.query.filter_by(username='newuser').first() is not None

def test_register_existing_user(client, session, regular_user):
    response = client.post('/api/v1/auth/register', json={
        'username': regular_user.username,
        'email': 'another@example.com',
        'password': 'password123'
    })
    assert response.status_code == 409 # Conflict
    assert 'already exists' in response.json['message']

def test_login_user(client, session, regular_user):
    response = client.post('/api/v1/auth/login', json={
        'username': regular_user.username,
        'password': 'password'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'refresh_token' in response.json

def test_login_invalid_credentials(client, session, regular_user):
    response = client.post('/api/v1/auth/login', json={
        'username': regular_user.username,
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert 'Invalid username or password' in response.json['message']

def test_get_current_user(client, user_auth_headers):
    response = client.get('/api/v1/auth/me', headers=user_auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == 'testuser'

def test_logout_user(client, user_auth_headers):
    response = client.post('/api/v1/auth/logout', headers=user_auth_headers)
    assert response.status_code == 200
    assert 'Successfully logged out' in response.json['message']

    # Attempting to use the token after logout should fail
    response = client.get('/api/v1/auth/me', headers=user_auth_headers)
    assert response.status_code == 401
    assert 'Token has been revoked' in response.json['message'] # Or Signature verification failed if token expires fast


# --- User Endpoints ---

def test_get_all_users_admin_only(client, user_auth_headers):
    response = client.get('/api/v1/users/', headers=user_auth_headers)
    assert response.status_code == 403 # Forbidden for regular users

def test_get_all_users_admin(client, admin_auth_headers, session, regular_user, another_user):
    response = client.get('/api/v1/users/', headers=admin_auth_headers)
    assert response.status_code == 200
    assert len(response.json['users']) >= 3 # admin_user, regular_user, another_user
    assert any(u['username'] == regular_user.username for u in response.json['users'])

def test_get_user_self(client, user_auth_headers, regular_user):
    response = client.get(f'/api/v1/users/{regular_user.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == regular_user.username

def test_get_user_other_forbidden(client, user_auth_headers, admin_user):
    response = client.get(f'/api/v1/users/{admin_user.id}', headers=user_auth_headers)
    assert response.status_code == 403

def test_get_user_admin(client, admin_auth_headers, regular_user):
    response = client.get(f'/api/v1/users/{regular_user.id}', headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == regular_user.username

def test_update_user_self(client, user_auth_headers, regular_user, session):
    response = client.put(f'/api/v1/users/{regular_user.id}', headers=user_auth_headers, json={'username': 'updateduser'})
    assert response.status_code == 200
    assert response.json['username'] == 'updateduser'
    session.refresh(regular_user)
    assert regular_user.username == 'updateduser'

def test_update_user_other_forbidden(client, user_auth_headers, admin_user):
    response = client.put(f'/api/v1/users/{admin_user.id}', headers=user_auth_headers, json={'username': 'malicious'})
    assert response.status_code == 403

def test_update_user_admin_role_change(client, admin_auth_headers, regular_user, session):
    response = client.put(f'/api/v1/users/{regular_user.id}', headers=admin_auth_headers, json={'is_admin': True})
    assert response.status_code == 200
    assert response.json['is_admin'] is True
    session.refresh(regular_user)
    assert regular_user.is_admin is True

def test_delete_user_admin(client, admin_auth_headers, regular_user, session):
    response = client.delete(f'/api/v1/users/{regular_user.id}', headers=admin_auth_headers)
    assert response.status_code == 200
    assert User.query.get(regular_user.id) is None

def test_delete_user_self_forbidden(client, admin_auth_headers, admin_user):
    # Admins cannot delete their own account via this endpoint for safety
    response = client.delete(f'/api/v1/users/{admin_user.id}', headers=admin_auth_headers)
    assert response.status_code == 400
    assert 'cannot delete your own account' in response.json['message']


# --- Project Endpoints ---

def test_create_project(client, user_auth_headers, session):
    response = client.post('/api/v1/projects/', headers=user_auth_headers, json={
        'name': 'New User Project',
        'description': 'A fantastic project.'
    })
    assert response.status_code == 201
    assert response.json['name'] == 'New User Project'
    assert Project.query.filter_by(name='New User Project').first() is not None

def test_create_project_duplicate_name_same_owner(client, user_auth_headers, user_project):
    response = client.post('/api/v1/projects/', headers=user_auth_headers, json={
        'name': user_project.name, # Same name as existing project by same user
        'description': 'Another fantastic project.'
    })
    assert response.status_code == 409
    assert 'already have a project named' in response.json['message']

def test_get_all_projects_user(client, user_auth_headers, user_project, another_user_project):
    response = client.get('/api/v1/projects/', headers=user_auth_headers)
    assert response.status_code == 200
    assert len(response.json['projects']) == 1 # Regular user should only see their own projects by default
    assert response.json['projects'][0]['id'] == user_project.id

def test_get_all_projects_admin(client, admin_auth_headers, user_project, another_user_project, session, admin_user):
    admin_project = Project(name='Admin Project', owner=admin_user)
    session.add(admin_project)
    session.commit()

    response = client.get('/api/v1/projects/', headers=admin_auth_headers)
    assert response.status_code == 200
    assert len(response.json['projects']) >= 3 # Admin should see all projects
    assert any(p['id'] == user_project.id for p in response.json['projects'])
    assert any(p['id'] == another_user_project.id for p in response.json['projects'])
    assert any(p['id'] == admin_project.id for p in response.json['projects'])


def test_get_project_owner(client, user_auth_headers, user_project):
    response = client.get(f'/api/v1/projects/{user_project.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert response.json['name'] == user_project.name

def test_get_project_other_forbidden(client, user_auth_headers, another_user_project):
    response = client.get(f'/api/v1/projects/{another_user_project.id}', headers=user_auth_headers)
    assert response.status_code == 403

def test_update_project_owner(client, user_auth_headers, user_project, session):
    response = client.put(f'/api/v1/projects/{user_project.id}', headers=user_auth_headers, json={'name': 'Updated Project'})
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Project'
    session.refresh(user_project)
    assert user_project.name == 'Updated Project'

def test_delete_project_owner(client, user_auth_headers, user_project, session):
    response = client.delete(f'/api/v1/projects/{user_project.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert Project.query.get(user_project.id) is None


# --- Task Endpoints ---

def test_create_task(client, user_auth_headers, user_project, regular_user, session):
    due_date_str = (datetime.utcnow() + timedelta(days=7)).isoformat(timespec='seconds') + 'Z'
    response = client.post(f'/api/v1/tasks/project/{user_project.id}', headers=user_auth_headers, json={
        'title': 'New Task for Project',
        'description': 'Description for the new task',
        'assignee_id': regular_user.id,
        'status': 'todo',
        'priority': 'high',
        'due_date': due_date_str
    })
    assert response.status_code == 201
    assert response.json['title'] == 'New Task for Project'
    assert response.json['project_id'] == user_project.id
    assert response.json['assignee_id'] == regular_user.id
    assert Task.query.filter_by(title='New Task for Project').first() is not None

def test_create_task_invalid_status(client, user_auth_headers, user_project):
    response = client.post(f'/api/v1/tasks/project/{user_project.id}', headers=user_auth_headers, json={
        'title': 'Bad Status Task',
        'status': 'invalid-status'
    })
    assert response.status_code == 400
    assert 'Invalid status' in response.json['message']

def test_get_project_tasks_owner(client, user_auth_headers, user_project, user_task, session):
    # Add another task to the same project
    task2 = Task(title='Another Task in User Project', project=user_project, assignee=user_task.assignee)
    session.add(task2)
    session.commit()

    response = client.get(f'/api/v1/tasks/project/{user_project.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert len(response.json['tasks']) == 2
    assert any(t['id'] == user_task.id for t in response.json['tasks'])

def test_get_project_tasks_other_forbidden(client, user_auth_headers, another_user_project, another_user_task):
    response = client.get(f'/api/v1/tasks/project/{another_user_project.id}', headers=user_auth_headers)
    assert response.status_code == 403

def test_get_task_owner_of_project(client, user_auth_headers, user_task):
    response = client.get(f'/api/v1/tasks/{user_task.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert response.json['title'] == user_task.title

def test_get_task_assignee(client, client, user_auth_headers, another_user_project, another_user, session):
    # User 1 is assignee for a task in user 2's project
    task_for_user1 = Task(title='Task assigned to User1', project=another_user_project, assignee=client.get_fixture('regular_user'))
    session.add(task_for_user1)
    session.commit()

    response = client.get(f'/api/v1/tasks/{task_for_user1.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert response.json['title'] == 'Task assigned to User1'

def test_get_task_other_forbidden(client, user_auth_headers, another_user_task):
    response = client.get(f'/api/v1/tasks/{another_user_task.id}', headers=user_auth_headers)
    assert response.status_code == 403

def test_update_task_owner_of_project(client, user_auth_headers, user_task, session):
    response = client.put(f'/api/v1/tasks/{user_task.id}', headers=user_auth_headers, json={'status': 'completed'})
    assert response.status_code == 200
    assert response.json['status'] == 'completed'
    session.refresh(user_task)
    assert user_task.status == 'completed'

def test_delete_task_owner_of_project(client, user_auth_headers, user_task, session):
    response = client.delete(f'/api/v1/tasks/{user_task.id}', headers=user_auth_headers)
    assert response.status_code == 200
    assert Task.query.get(user_task.id) is None

# --- Global Tasks List ---

def test_get_all_tasks_user_access(client, user_auth_headers, user_task, another_user_task, session, another_user_project, regular_user):
    # Create a task in another_user_project, but assigned to regular_user
    task_assigned_to_regular = Task(title='Assigned to me', project=another_user_project, assignee=regular_user)
    session.add(task_assigned_to_regular)
    session.commit()

    response = client.get('/api/v1/tasks/', headers=user_auth_headers)
    assert response.status_code == 200
    # Should see user_task (owner of project), and task_assigned_to_regular (assignee)
    # Should NOT see another_user_task (neither owner nor assignee)
    assert len(response.json['tasks']) == 2
    task_titles = {t['title'] for t in response.json['tasks']}
    assert user_task.title in task_titles
    assert task_assigned_to_regular.title in task_titles
    assert another_user_task.title not in task_titles

def test_get_all_tasks_admin_access(client, admin_auth_headers, user_task, another_user_task, session, regular_user):
    # Admin should see all tasks
    response = client.get('/api/v1/tasks/', headers=admin_auth_headers)
    assert response.status_code == 200
    assert len(response.json['tasks']) >= 2 # At least user_task and another_user_task + any from setup
    task_titles = {t['title'] for t in response.json['tasks']}
    assert user_task.title in task_titles
    assert another_user_task.title in task_titles

def test_get_all_tasks_admin_filter_by_assignee(client, admin_auth_headers, user_task, regular_user):
    response = client.get(f'/api/v1/tasks/?assignee_id={regular_user.id}', headers=admin_auth_headers)
    assert response.status_code == 200
    # Should only contain tasks assigned to regular_user
    for task_data in response.json['tasks']:
        assert task_data['assignee_id'] == regular_user.id
```