```python
import pytest
import json
from app.models.post import Post
from app.models.user import User, UserRole

def test_get_all_posts_success(client, init_database):
    response = client.get('/api/posts/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 3 # From init_database

    # Check structure and cached value
    assert client.application.cache.get('all_posts') is not None
    assert data[0]['title'] == "Admin's First Post" # Assuming latest created or by ID order in seed

def test_get_single_post_success(client, init_database):
    post = Post.query.filter_by(title="Admin's First Post").first()
    response = client.get(f'/api/posts/{post.id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == "Admin's First Post"
    assert data['author']['username'] == 'testadmin'
    assert 'comments' in data
    
    assert client.application.cache.get(f'post_{post.id}') is not None

def test_get_single_post_not_found(client, init_database):
    response = client.get('/api/posts/99999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'Post not found' in data['message']

def test_create_post_success_editor(client, init_database, auth_tokens):
    editor_token = auth_tokens['editor']['access_token']
    response = client.post('/api/posts/', json={
        'title': 'New Post by Editor',
        'content': 'This is new content from an editor.'
    }, headers={'Authorization': f'Bearer {editor_token}'})
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == 'New Post by Editor'
    assert data['author']['username'] == 'testeditor'
    assert client.application.cache.get('all_posts') is None # Cache cleared

def test_create_post_success_admin(client, init_database, auth_tokens):
    admin_token = auth_tokens['admin']['access_token']
    response = client.post('/api/posts/', json={
        'title': 'New Post by Admin',
        'content': 'This is new content from an admin.'
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == 'New Post by Admin'
    assert data['author']['username'] == 'testadmin'

def test_create_post_forbidden_user(client, init_database, auth_tokens):
    user_token = auth_tokens['user']['access_token']
    response = client.post('/api/posts/', json={
        'title': 'User Post',
        'content': 'User content.'
    }, headers={'Authorization': f'Bearer {user_token}'})
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'Insufficient permissions' in data['message']

def test_create_post_unauthorized(client, init_database):
    response = client.post('/api/posts/', json={
        'title': 'Unauthorized Post',
        'content': 'Unauthorized content.'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Missing or invalid token' in data['message']

def test_update_post_success_owner(client, init_database, auth_tokens):
    user_token = auth_tokens['user']['access_token']
    user_id = auth_tokens['user']['user_id']
    post_by_user = Post.query.filter_by(author_id=user_id).first()
    
    response = client.put(f'/api/posts/{post_by_user.id}', json={
        'title': 'Updated User Review',
        'content': 'This review has been updated.'
    }, headers={'Authorization': f'Bearer {user_token}'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Updated User Review'
    assert data['content'] == 'This review has been updated.'
    assert client.application.cache.get(f'post_{post_by_user.id}') is None # Cache cleared

def test_update_post_success_admin(client, init_database, auth_tokens):
    admin_token = auth_tokens['admin']['access_token']
    post_by_editor = Post.query.filter_by(title="Editor's Article").first()

    response = client.put(f'/api/posts/{post_by_editor.id}', json={
        'title': 'Admin Updated Editor Article'
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Admin Updated Editor Article'

def test_update_post_forbidden_not_owner(client, init_database, auth_tokens):
    user_token = auth_tokens['user']['access_token']
    admin_post = Post.query.filter_by(title="Admin's First Post").first()
    
    response = client.put(f'/api/posts/{admin_post.id}', json={
        'title': 'User tries to update admin post'
    }, headers={'Authorization': f'Bearer {user_token}'})
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'You do not have permission' in data['message']

def test_update_post_admin_changes_author_id(client, init_database, auth_tokens):
    admin_token = auth_tokens['admin']['access_token']
    admin_id = auth_tokens['admin']['user_id']
    editor_id = auth_tokens['editor']['user_id']
    post = Post.query.filter_by(author_id=admin_id).first()

    response = client.put(f'/api/posts/{post.id}', json={
        'author_id': editor_id
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['author_id'] == editor_id

def test_update_post_user_tries_to_change_author_id(client, init_database, auth_tokens):
    user_token = auth_tokens['user']['access_token']
    user_id = auth_tokens['user']['user_id']
    admin_id = auth_tokens['admin']['user_id']
    post = Post.query.filter_by(author_id=user_id).first()

    response = client.put(f'/api/posts/{post.id}', json={
        'author_id': admin_id
    }, headers={'Authorization': f'Bearer {user_token}'})
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'Only administrators can change post author' in data['message']

def test_delete_post_success_owner(client, init_database, auth_tokens):
    editor_token = auth_tokens['editor']['access_token']
    editor_id = auth_tokens['editor']['user_id']
    post_to_delete = Post.query.filter_by(author_id=editor_id).first()
    
    response = client.delete(f'/api/posts/{post_to_delete.id}', headers={
        'Authorization': f'Bearer {editor_token}'
    })
    assert response.status_code == 204
    assert Post.query.get(post_to_delete.id) is None
    assert client.application.cache.get(f'post_{post_to_delete.id}') is None # Cache cleared

def test_delete_post_success_admin(client, init_database, auth_tokens):
    admin_token = auth_tokens['admin']['access_token']
    user_id = auth_tokens['user']['user_id']
    post_to_delete = Post.query.filter_by(author_id=user_id).first()

    response = client.delete(f'/api/posts/{post_to_delete.id}', headers={
        'Authorization': f'Bearer {admin_token}'
    })
    assert response.status_code == 204
    assert Post.query.get(post_to_delete.id) is None

def test_delete_post_forbidden_not_owner(client, init_database, auth_tokens):
    user_token = auth_tokens['user']['access_token']
    admin_post = Post.query.filter_by(title="Admin's First Post").first()

    response = client.delete(f'/api/posts/{admin_post.id}', headers={
        'Authorization': f'Bearer {user_token}'
    })
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'You do not have permission' in data['message']

def test_delete_post_unauthorized(client, init_database):
    post = Post.query.first()
    response = client.delete(f'/api/posts/{post.id}')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Missing or invalid token' in data['message']

def test_rate_limiting(client, init_database):
    # This test might be flaky depending on exact rate limit and test runner speed.
    # It demonstrates the concept. The global limit is 200/day, 50/hour.
    # Login endpoint has 10/minute. Let's hit register more aggressively.
    for i in range(6): # Exceeds 5 per minute limit for /auth/register
        client.post('/api/auth/register', json={
            'username': f'ratelimituser{i}',
            'email': f'ratelimit{i}@test.com',
            'password': 'password123'
        })
    
    response = client.post('/api/auth/register', json={
        'username': 'ratelimituser_final',
        'email': 'ratelimit_final@test.com',
        'password': 'password123'
    })
    assert response.status_code == 429 # Too Many Requests
    data = json.loads(response.data)
    assert 'Too many registration attempts' in data['message']
```