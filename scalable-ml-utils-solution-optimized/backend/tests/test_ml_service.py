```python
import pytest
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.services.ml_service import MLService
from backend.app.services.dataset_service import DatasetService
from backend.app.schemas.model import ModelCreate
from backend.app.core.exceptions import BadRequestException, NotFoundException, InternalServerError
from backend.app.crud.crud_dataset import dataset as crud_dataset
from backend.app.crud.crud_model import model as crud_model
from backend.app.crud.crud_experiment import experiment as crud_experiment
from backend.app.schemas.dataset import DatasetCreate
from backend.app.core.config import settings
import os
import io

# Mock storage for MLService if needed, but conftest already sets DATA_STORAGE_PATH to /tmp
ml_service_instance = MLService()
dataset_service_instance = DatasetService()

@pytest.mark.asyncio
async def test_preprocess_dataframe_numeric_imputation():
    data = {
        'feature1': [1, 2, np.nan, 4],
        'feature2': [5, np.nan, 7, 8],
        'target': [0, 1, 0, 1]
    }
    df = pd.DataFrame(data)
    
    processed_df = await ml_service_instance.preprocess_dataframe(df, ['feature1', 'feature2'], 'target')
    
    assert processed_df['feature1'].isnull().sum() == 0
    assert processed_df['feature2'].isnull().sum() == 0
    # Median for [1,2,nan,4] is 2 (if sorted [1,2,4], median is 2)
    # Median for [5,nan,7,8] is 7 (if sorted [5,7,8], median is 7)
    # The SimpleImputer strategy='median' for an odd number of non-NaN values
    # will pick the middle. For even, it's average of two middle.
    # Let's check for specific imputed values
    assert processed_df['feature1'].iloc[2] == 2.0 # (1,2,4) median is 2
    assert processed_df['feature2'].iloc[1] == 7.0 # (5,7,8) median is 7


@pytest.mark.asyncio
async def test_preprocess_dataframe_categorical_encoding_and_imputation():
    data = {
        'feature1': ['A', 'B', np.nan, 'A'],
        'feature2': [1, 2, 3, 4],
        'target': ['X', 'Y', 'X', 'Y']
    }
    df = pd.DataFrame(data)
    
    processed_df = await ml_service_instance.preprocess_dataframe(df, ['feature1', 'feature2'], 'target')
    
    assert processed_df['feature1'].isnull().sum() == 0
    assert processed_df['target'].isnull().sum() == 0
    
    # Check if 'feature1' and 'target' are numerical after encoding
    assert pd.api.types.is_numeric_dtype(processed_df['feature1'])
    assert pd.api.types.is_numeric_dtype(processed_df['target'])
    
    # For 'feature1', mode is 'A'. So NaN should be replaced by 'A' and then encoded.
    # Original: ['A', 'B', nan, 'A'] -> Imputed: ['A', 'B', 'A', 'A']
    # Encoded values should be 0s and 1s, and consistent.
    # Exact values depend on LabelEncoder order, just check type and non-null.

@pytest.mark.asyncio
async def test_train_classification_model(db_session: AsyncSession, test_user):
    csv_content = b"feature1,feature2,target\n1,10,0\n2,11,0\n3,12,1\n4,13,1\n5,14,0\n6,15,1"
    
    # 1. Create a mock dataset in DB
    file_path = f"datasets/{test_user.id}/train_cls_dataset.csv"
    await ml_service_instance.storage.save_file(csv_content, file_path)
    dataset_in = DatasetCreate(name="train_cls_dataset", description="desc", column_info={"feature1":"int64", "feature2":"int64", "target":"int64"}, row_count=6)
    db_dataset = await crud_dataset.create_with_owner(db_session, obj_in=dataset_in, owner_id=test_user.id, file_path=file_path)

    # 2. Load the dataset into a DataFrame
    df = await dataset_service_instance.get_dataset_df(db_session, db_dataset.id, test_user.id)

    # 3. Define model creation schema
    model_create_in = ModelCreate(
        name="test_classifier",
        model_type="classification",
        dataset_id=db_dataset.id,
        target_column="target",
        features=["feature1", "feature2"]
    )

    # 4. Train the model
    training_result = await ml_service_instance.train_model(db_session, df, model_create_in, test_user.id)
    
    db_model = training_result["model"]
    db_experiment = training_result["experiment"]
    metrics = training_result["metrics"]

    assert db_model.id is not None
    assert db_model.name == "test_classifier"
    assert db_model.model_type == "classification"
    assert db_model.artifact_path is not None
    assert db_model.owner_id == test_user.id

    assert db_experiment.id is not None
    assert db_experiment.model_id == db_model.id
    assert db_experiment.status == "completed"
    assert "accuracy" in metrics
    assert metrics["accuracy"] >= 0 and metrics["accuracy"] <= 1

    # Verify model artifact exists
    assert os.path.exists(os.path.join(settings.DATA_STORAGE_PATH, db_model.artifact_path))

@pytest.mark.asyncio
async def test_train_regression_model(db_session: AsyncSession, test_user):
    csv_content = b"feature_a,feature_b,value\n1,5,10.5\n2,6,12.1\n3,7,14.0\n4,8,15.5\n5,9,17.0"
    
    file_path = f"datasets/{test_user.id}/train_reg_dataset.csv"
    await ml_service_instance.storage.save_file(csv_content, file_path)
    dataset_in = DatasetCreate(name="train_reg_dataset", description="desc", column_info={"feature_a":"int64", "feature_b":"int64", "value":"float64"}, row_count=5)
    db_dataset = await crud_dataset.create_with_owner(db_session, obj_in=dataset_in, owner_id=test_user.id, file_path=file_path)

    df = await dataset_service_instance.get_dataset_df(db_session, db_dataset.id, test_user.id)

    model_create_in = ModelCreate(
        name="test_regressor",
        model_type="regression",
        dataset_id=db_dataset.id,
        target_column="value",
        features=["feature_a", "feature_b"]
    )

    training_result = await ml_service_instance.train_model(db_session, df, model_create_in, test_user.id)
    
    db_model = training_result["model"]
    db_experiment = training_result["experiment"]
    metrics = training_result["metrics"]

    assert db_model.id is not None
    assert db_model.model_type == "regression"
    assert "mse" in metrics
    assert "r2_score" in metrics

    # Verify model artifact exists
    assert os.path.exists(os.path.join(settings.DATA_STORAGE_PATH, db_model.artifact_path))

@pytest.mark.asyncio
async def test_train_model_missing_columns(db_session: AsyncSession, test_user):
    csv_content = b"feature1,target\n1,0\n2,1" # Missing feature2
    
    file_path = f"datasets/{test_user.id}/missing_col_dataset.csv"
    await ml_service_instance.storage.save_file(csv_content, file_path)
    dataset_in = DatasetCreate(name="missing_col_dataset", description="desc", column_info={"feature1":"int64", "target":"int64"}, row_count=2)
    db_dataset = await crud_dataset.create_with_owner(db_session, obj_in=dataset_in, owner_id=test_user.id, file_path=file_path)

    df = await dataset_service_instance.get_dataset_df(db_session, db_dataset.id, test_user.id)

    model_create_in = ModelCreate(
        name="bad_model",
        model_type="classification",
        dataset_id=db_dataset.id,
        target_column="target",
        features=["feature1", "feature2"] # Requesting non-existent feature2
    )

    with pytest.raises(BadRequestException) as excinfo:
        await ml_service_instance.train_model(db_session, df, model_create_in, test_user.id)
    assert "Missing columns in dataset: feature2" in str(excinfo.value.detail)

@pytest.mark.asyncio
async def test_prediction_service(db_session: AsyncSession, test_user):
    # This test requires a trained model, so we combine training and prediction.
    # For independent testing, you'd mock the `load_model` method.
    
    csv_content = b"f1,f2,target\n1,10,0\n2,11,0\n3,12,1\n4,13,1\n5,14,0\n6,15,1\n7,16,0\n8,17,1\n9,18,0\n10,19,1"
    
    file_path = f"datasets/{test_user.id}/pred_cls_dataset.csv"
    await ml_service_instance.storage.save_file(csv_content, file_path)
    dataset_in = DatasetCreate(name="pred_cls_dataset", description="desc", column_info={"f1":"int64", "f2":"int64", "target":"int64"}, row_count=10)
    db_dataset = await crud_dataset.create_with_owner(db_session, obj_in=dataset_in, owner_id=test_user.id, file_path=file_path)

    df = await dataset_service_instance.get_dataset_df(db_session, db_dataset.id, test_user.id)

    model_create_in = ModelCreate(
        name="test_predictor",
        model_type="classification",
        dataset_id=db_dataset.id,
        target_column="target",
        features=["f1", "f2"]
    )

    training_result = await ml_service_instance.train_model(db_session, df, model_create_in, test_user.id)
    db_model = training_result["model"]

    # Now use the prediction service
    from backend.app.services.prediction_service import prediction_service

    predict_data = {
        "model_id": db_model.id,
        "data": [
            {"f1": 11, "f2": 20},
            {"f1": 1, "f2": 5}
        ]
    }
    
    from backend.app.schemas.model import ModelPredictRequest
    request_obj = ModelPredictRequest(**predict_data)

    predictions = await prediction_service.predict(db_session, request_obj, test_user.id)

    assert isinstance(predictions, list)
    assert len(predictions) == 2
    assert all(isinstance(p, (int, float)) for p in predictions) # Predictions are int/float for classification/regression
```