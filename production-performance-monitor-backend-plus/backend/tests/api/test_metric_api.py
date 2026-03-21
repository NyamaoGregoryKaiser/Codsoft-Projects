import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.metric import MetricCreate, MetricUpdate, MetricResponse
from app.database.models import Application, User, MetricType
from app.crud.metric import metric as crud_metric

@pytest.mark.asyncio
async def test_create_metric_as_owner(client: AsyncClient, regular_user_token: str, application_user: Application):
    metric_data = {
        "name": "memory_usage",
        "unit": "MB",
        "metric_type": MetricType.GAUGE.value,
        "threshold_warning": 80.0,
        "threshold_critical": 95.0,
    }
    response = await client.post(
        f"/api/v1/metrics/app/{application_user.id}",
        json=metric_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    
    assert response.status_code == 201
    metric_response = MetricResponse(**response.json())
    assert metric_response.name == "memory_usage"
    assert metric_response.app_id == application_user.id
    assert metric_response.unit == "MB"

    db_metric = await crud_metric.get(db_session, metric_response.id)
    assert db_metric.name == "memory_usage"

@pytest.mark.asyncio
async def test_create_metric_not_owner(client: AsyncClient, regular_user_token: str, application_admin: Application):
    metric_data = {"name": "network_io", "unit": "bps", "metric_type": MetricType.COUNTER.value}
    response = await client.post(
        f"/api/v1/metrics/app/{application_admin.id}",
        json=metric_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_metric_duplicate_name(client: AsyncClient, regular_user_token: str, application_user: Application, metric_for_admin_app: Metric):
    # Create an initial metric for the user's app
    initial_metric_data = {"name": "test_metric", "unit": "count", "metric_type": MetricType.GAUGE.value}
    await client.post(
        f"/api/v1/metrics/app/{application_user.id}",
        json=initial_metric_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    
    # Try to create another metric with the same name for the same app
    response = await client.post(
        f"/api/v1/metrics/app/{application_user.id}",
        json=initial_metric_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 400
    assert "Metric with this name already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_read_metrics_for_application_owner(client: AsyncClient, regular_user_token: str, application_user: Application, metric_for_admin_app: Metric, db_session: AsyncSession):
    # Create another metric for application_user
    new_metric_data = {"name": "disk_io", "unit": "MB/s", "metric_type": MetricType.GAUGE.value}
    new_metric_resp = await client.post(
        f"/api/v1/metrics/app/{application_user.id}",
        json=new_metric_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert new_metric_resp.status_code == 201
    
    response = await client.get(
        f"/api/v1/metrics/app/{application_user.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 200
    metrics = [MetricResponse(**m) for m in response.json()]
    assert len(metrics) >= 1 # At least the one we just created
    assert any(m.name == "disk_io" for m in metrics)

@pytest.mark.asyncio
async def test_read_metrics_for_application_not_owner(client: AsyncClient, regular_user_token: str, application_admin: Application):
    response = await client.get(
        f"/api/v1/metrics/app/{application_admin.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_metric_owner(client: AsyncClient, admin_token: str, metric_for_admin_app: Metric):
    response = await client.get(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    metric_response = MetricResponse(**response.json())
    assert metric_response.id == metric_for_admin_app.id
    assert metric_response.name == metric_for_admin_app.name

@pytest.mark.asyncio
async def test_read_metric_not_owner(client: AsyncClient, regular_user_token: str, metric_for_admin_app: Metric):
    response = await client.get(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_metric_owner(client: AsyncClient, admin_token: str, metric_for_admin_app: Metric):
    update_data = {"unit": "MB", "threshold_warning": 85.0}
    response = await client.put(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    metric_response = MetricResponse(**response.json())
    assert metric_response.unit == update_data["unit"]
    assert metric_response.threshold_warning == update_data["threshold_warning"]

@pytest.mark.asyncio
async def test_update_metric_not_owner(client: AsyncClient, regular_user_token: str, metric_for_admin_app: Metric):
    update_data = {"unit": "GB"}
    response = await client.put(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_metric_owner(client: AsyncClient, db_session: AsyncSession, admin_token: str, metric_for_admin_app: Metric):
    response = await client.delete(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204
    
    deleted_metric = await crud_metric.get(db_session, metric_for_admin_app.id)
    assert deleted_metric is None

@pytest.mark.asyncio
async def test_delete_metric_not_owner(client: AsyncClient, regular_user_token: str, metric_for_admin_app: Metric):
    response = await client.delete(
        f"/api/v1/metrics/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]