```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import io
import pandas as pd
import os

from backend.app.crud.crud_dataset import dataset as crud_dataset
from backend.app.schemas.dataset import DatasetCreate
from backend.app.core.config import settings

@pytest.mark.asyncio
async def test_upload_dataset(client: AsyncClient, normal_user_token_headers: dict):
    csv_content = b"col1,col2\n1,a\n2,b\n3,c"
    files = {"file": ("test_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    
    response = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "test_dataset"
    assert data["row_count"] == 3
    assert data["column_info"] == {"col1": "int64", "col2": "object"}
    assert "file_path" in data
    assert os.path.exists(os.path.join(settings.DATA_STORAGE_PATH, data["file_path"]))

@pytest.mark.asyncio
async def test_upload_dataset_invalid_file_type(client: AsyncClient, normal_user_token_headers: dict):
    txt_content = b"just some text"
    files = {"file": ("test.txt", io.BytesIO(txt_content), "text/plain")}
    
    response = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    
    assert response.status_code == 400
    assert "Only CSV files are supported" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_datasets(client: AsyncClient, normal_user_token_headers: dict, db_session: AsyncSession, test_user):
    # Create a dataset for the test_user
    csv_content = b"x,y\n1,10\n2,20"
    file_path = f"datasets/{test_user.id}/another_dataset.csv"
    await client.app.dependency_overrides[client.app.state.storage_manager].save_file(csv_content, file_path) # Direct access for setup

    dataset_in = DatasetCreate(name="another_dataset", description="desc", column_info={"x":"int64", "y":"int64"}, row_count=2)
    await crud_dataset.create_with_owner(db_session, obj_in=dataset_in, owner_id=test_user.id, file_path=file_path)

    response = await client.get(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Check that only normal_user's datasets are returned, not test_user's
    assert "another_dataset" not in [d["name"] for d in response.json()]

    # Upload one for the normal_user
    csv_content = b"a,b\n1,2"
    files = {"file": ("normal_user_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    
    response = await client.get(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    datasets = response.json()
    assert len(datasets) >= 1
    assert "normal_user_dataset" in [d["name"] for d in datasets]


@pytest.mark.asyncio
async def test_read_dataset_detail(client: AsyncClient, normal_user_token_headers: dict):
    csv_content = b"colA,colB\n10,foo\n20,bar"
    files = {"file": ("detail_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    upload_res = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    dataset_id = upload_res.json()["id"]

    response = await client.get(
        f"{settings.API_V1_STR}/datasets/{dataset_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "detail_dataset"
    assert data["row_count"] == 2

@pytest.mark.asyncio
async def test_read_dataset_detail_not_found(client: AsyncClient, normal_user_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/datasets/999", headers=normal_user_token_headers
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_dataset_preview(client: AsyncClient, normal_user_token_headers: dict):
    csv_content = b"feature1,feature2,target\n1,a,0\n2,b,1\n3,c,0\n4,d,1\n5,e,0\n6,f,1"
    files = {"file": ("preview_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    upload_res = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    dataset_id = upload_res.json()["id"]

    response = await client.get(
        f"{settings.API_V1_STR}/datasets/{dataset_id}/preview?rows=3", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    preview_data = response.json()
    assert preview_data["columns"] == ["feature1", "feature2", "target"]
    assert len(preview_data["data"]) == 3
    assert preview_data["data"][0] == {"feature1": 1, "feature2": "a", "target": 0}
    assert preview_data["total_rows"] == 6

@pytest.mark.asyncio
async def test_update_dataset(client: AsyncClient, normal_user_token_headers: dict):
    csv_content = b"x,y\n1,10\n2,20"
    files = {"file": ("update_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    upload_res = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    dataset_id = upload_res.json()["id"]

    update_payload = {"description": "Updated description for dataset"}
    response = await client.put(
        f"{settings.API_V1_STR}/datasets/{dataset_id}", headers=normal_user_token_headers, json=update_payload
    )
    assert response.status_code == 200
    updated_dataset = response.json()
    assert updated_dataset["description"] == "Updated description for dataset"

@pytest.mark.asyncio
async def test_delete_dataset(client: AsyncClient, normal_user_token_headers: dict):
    csv_content = b"x,y\n1,10\n2,20"
    files = {"file": ("delete_dataset.csv", io.BytesIO(csv_content), "text/csv")}
    upload_res = await client.post(
        f"{settings.API_V1_STR}/datasets/", headers=normal_user_token_headers, files=files
    )
    dataset_id = upload_res.json()["id"]
    file_path = upload_res.json()["file_path"]

    # Verify file exists before deletion
    assert os.path.exists(os.path.join(settings.DATA_STORAGE_PATH, file_path))

    response = await client.delete(
        f"{settings.API_V1_STR}/datasets/{dataset_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    deleted_dataset = response.json()
    assert deleted_dataset["id"] == dataset_id
    
    # Verify file is deleted from storage
    assert not os.path.exists(os.path.join(settings.DATA_STORAGE_PATH, file_path))

    # Verify dataset is deleted from DB
    response = await client.get(
        f"{settings.API_V1_STR}/datasets/{dataset_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 404
```