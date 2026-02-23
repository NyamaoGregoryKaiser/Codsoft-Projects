```python
import pytest
from backend.app.auth.services import AuthService
from backend.app.services.data_source import DataSourceService
from backend.app.services.visualization import VisualizationService
from backend.app.services.dashboard import DashboardService
from backend.app.models import User, Role, DataSource, Visualization, Dashboard
from werkzeug.exceptions import Conflict, NotFound, BadRequest, Unauthorized, InternalServerError

# --- AuthService Tests ---

def test_register_user_success(session):
    user = AuthService.register_user('newuser', 'new@example.com', 'password123')
    assert user.id is not None
    assert user.username == 'newuser'
    assert user.email == 'new@example.com'
    assert user.check_password('password123')
    assert 'user' in user.roles

def test_register_user_with_roles_success(session):
    editor_role = Role.query.filter_by(name='editor').first()
    assert editor_role # Assumes conftest setup
    user = AuthService.register_user('devuser', 'dev@example.com', 'password123', ['editor'])
    assert user.id is not None
    assert 'editor' in user.roles

def test_register_user_duplicate_username(session):
    AuthService.register_user('existing', 'exist@example.com', 'pass')
    with pytest.raises(Conflict, match="Username already exists."):
        AuthService.register_user('existing', 'another@example.com', 'pass')

def test_register_user_duplicate_email(session):
    AuthService.register_user('user1', 'email@example.com', 'pass')
    with pytest.raises(Conflict, match="Email already registered."):
        AuthService.register_user('user2', 'email@example.com', 'pass')

def test_login_user_success(session):
    user = AuthService.register_user('loginuser', 'login@example.com', 'securepass')
    auth_data = AuthService.login_user('loginuser', 'securepass')
    assert 'access_token' in auth_data
    assert 'refresh_token' in auth_data
    assert auth_data['user']['username'] == 'loginuser'

def test_login_user_invalid_credentials(session):
    AuthService.register_user('badlogin', 'bad@example.com', 'correctpass')
    with pytest.raises(Unauthorized, match="Invalid credentials."):
        AuthService.login_user('badlogin', 'wrongpass')
    with pytest.raises(Unauthorized, match="Invalid credentials."):
        AuthService.login_user('nonexistent', 'anypass')

# --- DataSourceService Tests ---

def test_create_data_source_success(session, auth_users):
    editor = auth_users['editor']
    ds = DataSourceService.create_data_source(editor.id, 'My Test DB', 'postgresql', 'some_conn_string')
    assert ds.id is not None
    assert ds.name == 'My Test DB'
    assert ds.user_id == editor.id

def test_create_data_source_duplicate_name(session, auth_users):
    editor = auth_users['editor']
    DataSourceService.create_data_source(editor.id, 'Duplicate DS', 'postgresql', 'conn1')
    with pytest.raises(Conflict, match="A data source with the name 'Duplicate DS' already exists"):
        DataSourceService.create_data_source(editor.id, 'Duplicate DS', 'mysql', 'conn2')

def test_get_data_source_by_id_success(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor)
    retrieved_ds = DataSourceService.get_data_source_by_id(ds.id, editor.id)
    assert retrieved_ds.id == ds.id

def test_get_data_source_by_id_not_found(session, auth_users):
    editor = auth_users['editor']
    with pytest.raises(NotFound, match="Data source not found"):
        DataSourceService.get_data_source_by_id(999, editor.id)

def test_get_data_source_by_id_unauthorized(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    viewer = auth_users['user']
    ds = create_test_data_source(user=editor)
    with pytest.raises(NotFound, match="Data source not found or you do not have permission."):
        DataSourceService.get_data_source_by_id(ds.id, viewer.id)

def test_update_data_source_success(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor, name='Old Name')
    updated_ds = DataSourceService.update_data_source(ds.id, editor.id, name='New Name', type='mysql')
    assert updated_ds.name == 'New Name'
    assert updated_ds.type == 'mysql'
    assert updated_ds.updated_at > ds.created_at # Ensure timestamp updated

def test_delete_data_source_success(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor)
    result = DataSourceService.delete_data_source(ds.id, editor.id)
    assert "deleted successfully" in result['message']
    assert DataSource.query.get(ds.id) is None

# --- VisualizationService Tests ---

def test_create_visualization_success(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor)
    viz = VisualizationService.create_visualization(
        editor.id, 'Sales Bar Chart', 'Description', 'bar', {'query_string': 'Q1'}, {'chart_title': 'Sales'}, ds.id
    )
    assert viz.id is not None
    assert viz.name == 'Sales Bar Chart'
    assert viz.data_source_id == ds.id

def test_create_visualization_invalid_config(session, create_test_data_source, auth_users):
    editor = auth_users['editor']
    ds = create_test_data_source(user=editor)
    with pytest.raises(BadRequest, match="Query config and chart config must be JSON objects."):
        VisualizationService.create_visualization(
            editor.id, 'Invalid Viz', 'Desc', 'line', 'not a dict', {}, ds.id
        )

# --- DashboardService Tests ---

def test_create_dashboard_success(session, create_test_visualization, auth_users):
    editor = auth_users['editor']
    viz1 = create_test_visualization(user=editor, name='Viz 1')
    viz2 = create_test_visualization(user=editor, name='Viz 2')
    
    dash = DashboardService.create_dashboard(
        editor.id, 'My Analytics Dashboard', 'Summary', 
        [{'i': str(viz1.id), 'x': 0, 'y': 0, 'w': 6, 'h': 10}], 
        [viz1.id, viz2.id], 
        is_public=False
    )
    assert dash.id is not None
    assert dash.name == 'My Analytics Dashboard'
    assert len(dash.visualizations) == 2
    assert dash.visualizations[0].id == viz1.id
    assert dash.visualizations[1].id == viz2.id

def test_create_dashboard_with_non_owned_visualization(session, create_test_visualization, auth_users):
    editor = auth_users['editor']
    viewer = auth_users['user']
    viz_editor = create_test_visualization(user=editor, name='Editor Viz')
    
    # Try to create a dashboard for viewer using editor's viz
    with pytest.raises(BadRequest, match="One or more visualizations not found or not owned by user"):
        DashboardService.create_dashboard(
            viewer.id, 'Viewer Dash', 'My Summary', 
            [{'i': str(viz_editor.id), 'x': 0, 'y': 0, 'w': 6, 'h': 10}], 
            [viz_editor.id], 
            is_public=False
        )

def test_get_public_dashboard_success(session, create_test_dashboard, auth_users):
    editor = auth_users['editor']
    dash = create_test_dashboard(user=editor)
    dash.is_public = True
    dash.save()
    public_dash = DashboardService.get_public_dashboard_by_id(dash.id)
    assert public_dash is not None
    assert public_dash.id == dash.id

def test_get_public_dashboard_not_found_or_private(session, create_test_dashboard, auth_users):
    editor = auth_users['editor']
    private_dash = create_test_dashboard(user=editor) # is_public defaults to False

    with pytest.raises(NotFound, match="Public dashboard not found."):
        DashboardService.get_public_dashboard_by_id(private_dash.id)
    
    with pytest.raises(NotFound, match="Public dashboard not found."):
        DashboardService.get_public_dashboard_by_id(999)

def test_update_dashboard_visualization_list(session, create_test_dashboard, create_test_visualization, auth_users):
    editor = auth_users['editor']
    viz1 = create_test_visualization(user=editor, name='Viz A')
    viz2 = create_test_visualization(user=editor, name='Viz B')
    viz3 = create_test_visualization(user=editor, name='Viz C')

    dash = create_test_dashboard(user=editor, viz=viz1, name="My Dash")
    assert len(dash.visualizations) == 1
    assert dash.visualizations[0].id == viz1.id

    updated_dash = DashboardService.update_dashboard(dash.id, editor.id, visualization_ids=[viz2.id, viz3.id])
    assert len(updated_dash.visualizations) == 2
    assert set([v.id for v in updated_dash.visualizations]) == {viz2.id, viz3.id}

```