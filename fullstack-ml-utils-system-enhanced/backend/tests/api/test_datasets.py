```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.models import User, Dataset
from backend.core.security import get_password_hash
from io import BytesIO
import pandas as pd
import os

@pytest.fixture
def mock_csv_file():
    # Create an in-memory CSV file
    csv_content = b"col1,col2\n1,a\n2,b\n3,c"
    return ("test.csv", BytesIO(csv_content), "text/csv")

@pytest.fixture
def mock_parquet_file():
    # Create an in-memory Parquet file
    df = pd.DataFrame({'col1': [1,2,3], 'col2': ['a','b','c']})
    buffer = BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    return ("test.parquet", buffer, "application/octet-stream")

def test_create_upload_dataset_csv_success(client: TestClient, test_user: User, auth_token: str, db_session: Session, mock_csv_file: tuple):
    file_name, file_content, file_type = mock_csv_file
    
    response = client.post(
        f"{settings.API_V1_STR}/datasets",
        headers={"Authorization": f"Bearer {auth_token}"},
        files={"file": (file_name, file_content, file_type)},
        data={"name": "My CSV Dataset", "description": "A test CSV file"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My CSV Dataset"
    assert data["owner_id"] == test_user.id
    assert data["row_count"] == 3
    assert data["column_count"] == 2
    assert os.path.exists(data["file_path"]) # Check if file was actually saved
    
    # Clean up created file
    if os.path.exists(data["file_path"]):
        os.remove(data["file_path"])

def test_create_upload_dataset_parquet_success(client: TestClient, test_user: User, auth_token: str, db_session: Session, mock_parquet_file: tuple):
    file_name, file_content, file_type = mock_parquet_file
    
    response = client.post(
        f"{settings.API_V1_STR}/datasets",
        headers={"Authorization": f"Bearer {auth_token}"},
        files={"file": (file_name, file_content, file_type)},
        data={"name": "My Parquet Dataset", "description": "A test Parquet file"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Parquet Dataset"
    assert data["owner_id"] == test_user.id
    assert data["row_count"] == 3
    assert data["column_count"] == 2
    assert os.path.exists(data["file_path"])
    
    if os.path.exists(data["file_path"]):
        os.remove(data["file_path"])

def test_create_upload_dataset_unauthorized(client: TestClient, mock_csv_file: tuple):
    file_name, file_content, file_type = mock_csv_file
    response = client.post(
        f"{settings.API_V1_STR}/datasets",
        files={"file": (file_name, file_content, file_type)},
        data={"name": "Unauthorized Dataset"}
    )
    assert response.status_code == 401

@pytest.fixture
def populated_dataset(db_session: Session, test_user: User, mock_csv_file: tuple):
    file_name, file_content, file_type = mock_csv_file
    file_path = os.path.join(settings.UPLOAD_DIRECTORY, f"test_data_{test_user.id}.csv")
    with open(file_path, "wb") as f:
        f.write(file_content.getvalue()) # Ensure file_content is read from start
    
    df = pd.read_csv(file_path)
    dataset = Dataset(
        name="Populated Dataset",
        owner_id=test_user.id,
        file_path=file_path,
        file_size_bytes=os.path.getsize(file_path),
        row_count=len(df),
        column_count=len(df.columns),
        description="A pre-existing dataset"
    )
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)
    return dataset

def test_read_datasets_success(client: TestClient, test_user: User, auth_token: str, populated_dataset: Dataset):
    response = client.get(
        f"{settings.API_V1_STR}/datasets",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == populated_dataset.name

def test_read_dataset_success(client: TestClient, test_user: User, auth_token: str, populated_dataset: Dataset):
    response = client.get(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == populated_dataset.id
    assert data["name"] == populated_dataset.name

def test_read_dataset_not_found(client: TestClient, auth_token: str):
    response = client.get(
        f"{settings.API_V1_STR}/datasets/999",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Dataset with ID 999 not found."

def test_read_dataset_unauthorized_owner(client: TestClient, db_session: Session, test_user: User, populated_dataset: Dataset):
    # Create another user and get their token
    unauthorized_user_email = "other@example.com"
    hashed_password = get_password_hash("otherpass")
    unauthorized_user = User(email=unauthorized_user_email, hashed_password=hashed_password, is_active=True)
    db_session.add(unauthorized_user)
    db_session.commit()
    db_session.refresh(unauthorized_user)

    login_data = {"username": unauthorized_user_email, "password": "otherpass"}
    response_token = client.post(f"{settings.API_V1_STR}/auth/token", data=login_data)
    unauthorized_token = response_token.json()["access_token"]

    response = client.get(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}",
        headers={"Authorization": f"Bearer {unauthorized_token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "You are not authorized to view this dataset."

def test_update_dataset_success(client: TestClient, auth_token: str, populated_dataset: Dataset):
    response = client.patch(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"name": "Updated Dataset Name", "description": "New description"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Dataset Name"
    assert data["description"] == "New description"

def test_delete_dataset_success(client: TestClient, auth_token: str, populated_dataset: Dataset):
    file_path = populated_dataset.file_path # Store path before deletion
    response = client.delete(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 204
    assert not os.path.exists(file_path) # Check if file was deleted
    
    # Check if dataset is gone from DB
    check_response = client.get(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert check_response.status_code == 404

def test_get_dataset_statistics_success(client: TestClient, auth_token: str, populated_dataset: Dataset):
    response = client.get(
        f"{settings.API_V1_STR}/datasets/{populated_dataset.id}/stats",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "columns" in data
    assert len(data["columns"]) == 2 # Based on mock_csv_file
    assert data["columns"][0]["name"] == "col1"
    assert "head" in data
    assert len(data["head"]) == 3 # Default head size
```