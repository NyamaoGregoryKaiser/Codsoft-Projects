```python
import pytest
import json
from backend.app.models import User, DataSource, Visualization, Dashboard

# --- Auth API Tests ---

def test_register_api_success(client, session):
    resp = client.post('/api/register', json={
        'username': 'apiuser',
        'email': 'apiuser@test.com',
        'password': 'apipass'
    })
    assert resp.status_code == 201
    assert 'username' in resp.json
    assert resp.json['username'] == 'apiuser'
    assert User.query.filter_by(username='apiuser').first() is not None

def test_register_api_missing_data(client, session):
    resp = client.post('/api/register', json={'username': 'no_pass'})
    assert resp.status_code == 400
    assert 'password are required' in resp.json['msg']

def test_login_api_success(client, session):
    AuthService.register_user('loginapi', 'loginapi@test.com', 'loginpass')
    resp = client.post('/api/login', json={
        'username': 'loginapi',
        'password': 'loginpass'
    })
    assert resp.status_code == 200
    assert 'access_token' in resp.json
    assert 'refresh_token' in resp.json

def test_login_api_invalid_credentials(client, session):
    resp = client.post('/api/login', json={
        'username': 'nonexistent',
        'password': 'wrongpass'
    })
    assert resp.status_code == 401
    assert 'Invalid credentials' in resp.json['msg']

def test_protected_api_access(client, get_auth_headers):
    headers = get_auth_headers() # Logs in test_user
    resp = client.get('/api/protected', headers=headers)
    assert resp.status_code == 200
    assert 'logged_in_as' in resp.json
    assert 'roles' in resp.json

def test_protected_api_no_token(client):
    resp = client.get('/api/protected')
    assert resp.status_code == 401
    assert 'Missing Authorization Header' in resp.json['msg']

# --- Data Sources API Tests ---

def test_get_data_sources_api(auth_client, create_test_data_source, auth_users):
    editor_client = auth_client('test_editor', 'testpass')
    create_test_data_source(user=auth_users['editor'], name='Editor DS 1')
    create_test_data_source(user=auth_users['editor'], name='Editor DS 2')

    resp = editor_client.get('/api/data_sources')
    assert resp.status_code == 200
    assert len(resp.json) == 2
    assert resp.json[0]['name'] == 'Editor DS 1' or resp.json[0]['name'] == 'Editor DS 2'

def test_create_data_source_api_success(auth_client, auth_users):
    editor_client = auth_client('test_editor', 'testpass')
    new_ds_data = {
        'name': 'New API DS',
        'type': 'postgresql',
        'connection_string': 'new_conn_string'
    }
    resp = editor_client.post('/api/data_sources', json=new_ds_data)
    assert resp.status_code == 201
    assert resp.json['name'] == 'New API DS'
    assert DataSource.query.filter_by(name='New API DS').first() is not None

def test_create_data_source_api_unauthorized_role(auth_client):
    user_client = auth_client('test_user', 'testpass') # Normal user without 'editor' role
    new_ds_data = {
        'name': 'Unauthorized DS',
        'type': 'postgresql',
        'connection_string': 'new_conn_string'
    }
    resp = user_client.post('/api/data_sources', json=new_ds_data)
    assert resp.status_code == 403 # Forbidden
    assert 'Role not authorized' in resp.json['msg']

def test_update_data_source_api_success(auth_client, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor, name='DS to update')
    editor_client = auth_client('test_editor', 'testpass')
    
    update_data = {'name': 'Updated DS Name', 'type': 'mysql'}
    resp = editor_client.put(f'/api/data_sources/{ds.id}', json=update_data)
    assert resp.status_code == 200
    assert resp.json['name'] == 'Updated DS Name'
    assert DataSource.query.get(ds.id).name == 'Updated DS Name'

def test_delete_data_source_api_success(auth_client, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor, name='DS to delete')
    editor_client = auth_client('test_editor', 'testpass')

    resp = editor_client.delete(f'/api/data_sources/{ds.id}')
    assert resp.status_code == 200
    assert 'deleted successfully' in resp.json['message']
    assert DataSource.query.get(ds.id) is None

# --- Visualizations API Tests ---

def test_create_visualization_api_success(auth_client, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor)
    editor_client = auth_client('test_editor', 'testpass')

    new_viz_data = {
        'name': 'API Bar Chart',
        'description': 'A chart created via API',
        'chart_type': 'bar',
        'query_config': {'query_string': 'SELECT x,y FROM data'},
        'chart_config': {'title': 'API Chart'},
        'data_source_id': ds.id
    }
    resp = editor_client.post('/api/visualizations', json=new_viz_data)
    assert resp.status_code == 201
    assert resp.json['name'] == 'API Bar Chart'
    assert Visualization.query.filter_by(name='API Bar Chart').first() is not None

def test_get_visualization_data_api(mocker, auth_client, create_test_visualization, auth_users):
    editor = auth_users['editor']
    viz = create_test_visualization(user=editor)
    editor_client = auth_client('test_editor', 'testpass')

    # Mock the DataProcessingService.execute_query to avoid actual DB connection
    mocker.patch('backend.app.data_processing.services.DataProcessingService.execute_query',
                 return_value=[{'column_a': 1, 'column_b': 'value'}])

    resp = editor_client.get(f'/api/visualizations/{viz.id}/data')
    assert resp.status_code == 200
    assert len(resp.json) == 1
    assert resp.json[0]['column_a'] == 1

# --- Dashboards API Tests ---

def test_create_dashboard_api_success(auth_client, create_test_visualization, auth_users):
    editor = auth_users['editor']
    viz1 = create_test_visualization(user=editor, name='Dashboard Viz 1')
    viz2 = create_test_visualization(user=editor, name='Dashboard Viz 2')
    editor_client = auth_client('test_editor', 'testpass')

    new_dash_data = {
        'name': 'API Dashboard',
        'description': 'A dashboard created via API',
        'layout': [{'i': str(viz1.id), 'x': 0, 'y': 0, 'w': 6, 'h': 10}],
        'visualization_ids': [viz1.id, viz2.id],
        'is_public': True
    }
    resp = editor_client.post('/api/dashboards', json=new_dash_data)
    assert resp.status_code == 201
    assert resp.json['name'] == 'API Dashboard'
    assert len(resp.json['visualizations']) == 2
    assert Dashboard.query.filter_by(name='API Dashboard').first() is not None

def test_get_public_dashboard_api(auth_client, create_test_dashboard, auth_users):
    editor = auth_users['editor']
    dash = create_test_dashboard(user=editor, name='Public Dash API')
    dash.is_public = True
    dash.save()

    # Access without auth
    resp = auth_client(username=None, password=None).get(f'/api/dashboards/public/{dash.id}')
    assert resp.status_code == 200
    assert resp.json['name'] == 'Public Dash API'
    assert resp.json['is_public'] is True

def test_get_public_dashboard_api_private_fails(auth_client, create_test_dashboard, auth_users):
    editor = auth_users['editor']
    dash = create_test_dashboard(user=editor, name='Private Dash API')
    dash.is_public = False # Explicitly private

    resp = auth_client(username=None, password=None).get(f'/api/dashboards/public/{dash.id}')
    assert resp.status_code == 404
    assert 'Public dashboard not found' in resp.json['msg']

```