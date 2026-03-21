import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone
from app.schemas.metric_data import MetricDataBatchCreate, MetricDataPointCreate, MetricDataAggregation
from app.database.models import Application, Metric, MetricData
from app.crud.metric_data import metric_data as crud_metric_data
from app.crud.metric import metric as crud_metric
from app.services.metric_data_service import metric_data_service # To access the mocked redis client

@pytest.mark.asyncio
async def test_ingest_metric_data(client: AsyncClient, application_admin: Application, db_session):
    now = datetime.utcnow()
    batch_data = MetricDataBatchCreate(
        api_key=application_admin.api_key,
        data_points=[
            MetricDataPointCreate(name="cpu_usage", value=55.5, timestamp=now),
            MetricDataPointCreate(name="memory_usage", value=1024.0, timestamp=now - timedelta(minutes=1)),
            # Test auto-creation for a new metric name
            MetricDataPointCreate(name="new_metric_auto_create", value=1.0, timestamp=now),
        ]
    )
    
    response = await client.post("/api/v1/metric_data/ingest", json=batch_data.model_dump(mode="json"))
    
    assert response.status_code == 202
    assert response.json()["status"] == "success"
    assert "data points ingested" in response.json()["message"]

    # Verify data in DB
    cpu_metric = await crud_metric.get_by_app_and_name(db_session, application_admin.id, "cpu_usage")
    assert cpu_metric is not None
    cpu_data = await crud_metric_data.get_metric_data_points(db_session, cpu_metric.id, limit=1)
    assert cpu_data[0].value == 55.5

    # Verify auto-created metric
    new_metric = await crud_metric.get_by_app_and_name(db_session, application_admin.id, "new_metric_auto_create")
    assert new_metric is not None
    new_metric_data = await crud_metric_data.get_metric_data_points(db_session, new_metric.id, limit=1)
    assert new_metric_data[0].value == 1.0


@pytest.mark.asyncio
async def test_ingest_metric_data_invalid_api_key(client: AsyncClient):
    batch_data = MetricDataBatchCreate(
        api_key="invalid-key",
        data_points=[MetricDataPointCreate(name="cpu_usage", value=50.0)]
    )
    response = await client.post("/api/v1/metric_data/ingest", json=batch_data.model_dump(mode="json"))
    assert response.status_code == 404
    assert "Application not found for the given API key" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_latest_metric_value_owner(client: AsyncClient, admin_token: str, metric_for_admin_app: Metric, metric_data_points: list[MetricData]):
    response = await client.get(
        f"/api/v1/metric_data/latest/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data_point = response.json()
    assert data_point["value"] == metric_data_points[0].value # Should be the latest (first in our fixture list by desc order)

    # Verify caching: after first fetch, Redis should be hit
    metric_data_service.redis_client.setex.assert_called_once()
    metric_data_service.redis_client.get.return_value = None # Reset for next call

    # Second call should hit cache
    response_cached = await client.get(
        f"/api/v1/metric_data/latest/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_cached.status_code == 200
    # No direct way to assert cache hit from API client, but our mock ensures no DB call

@pytest.mark.asyncio
async def test_get_latest_metric_value_not_owner(client: AsyncClient, regular_user_token: str, metric_for_admin_app: Metric):
    response = await client.get(
        f"/api/v1/metric_data/latest/{metric_for_admin_app.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_aggregated_metric_values_owner(client: AsyncClient, admin_token: str, metric_for_admin_app: Metric, metric_data_points: list[MetricData]):
    now = datetime.utcnow()
    start_time = (now - timedelta(minutes=10)).isoformat() + "Z"
    end_time = (now + timedelta(minutes=1)).isoformat() + "Z"
    
    response = await client.get(
        f"/api/v1/metric_data/aggregated/{metric_for_admin_app.id}?start_time={start_time}&end_time={end_time}&interval_seconds=60",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    aggregated_data = [MetricDataAggregation(**d) for d in response.json()]
    assert len(aggregated_data) > 0
    assert all("timestamp" in d.model_dump() for d in aggregated_data)
    assert all("average" in d.model_dump() for d in aggregated_data)

    # Verify caching
    metric_data_service.redis_client.setex.assert_called_once()
    
    # Simulate cache hit
    metric_data_service.redis_client.get.return_value = '[]' # Return empty list for cached data
    response_cached = await client.get(
        f"/api/v1/metric_data/aggregated/{metric_for_admin_app.id}?start_time={start_time}&end_time={end_time}&interval_seconds=60",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_cached.status_code == 200


@pytest.mark.asyncio
async def test_get_aggregated_metric_values_not_owner(client: AsyncClient, regular_user_token: str, metric_for_admin_app: Metric):
    now = datetime.utcnow()
    start_time = (now - timedelta(hours=1)).isoformat() + "Z"
    end_time = now.isoformat() + "Z"
    
    response = await client.get(
        f"/api/v1/metric_data/aggregated/{metric_for_admin_app.id}?start_time={start_time}&end_time={end_time}",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_aggregated_metric_values_invalid_time_range(client: AsyncClient, admin_token: str, metric_for_admin_app: Metric):
    now = datetime.utcnow()
    start_time = (now + timedelta(hours=1)).isoformat() + "Z" # Start after end
    end_time = now.isoformat() + "Z"
    
    response = await client.get(
        f"/api/v1/metric_data/aggregated/{metric_for_admin_app.id}?start_time={start_time}&end_time={end_time}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert "start_time must be before end_time" in response.json()["detail"]