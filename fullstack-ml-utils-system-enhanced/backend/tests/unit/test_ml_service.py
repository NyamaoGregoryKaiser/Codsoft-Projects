```python
import pytest
from unittest.mock import MagicMock, patch
import pandas as pd
import numpy as np
import os
import joblib

from backend.services.ml_service import MLService
from backend.services.dataset_service import DatasetService
from backend.schemas.ml_model import MLModelCreate, PredictionRequest
from backend.schemas.preprocessing import PreprocessingStepConfig, ImputationConfig, ScalingConfig, EncodingConfig, DropColumnConfig
from backend.models import MLModel as DBMLModel, Dataset as DBDataset, User as DBUser
from backend.core.exception_handlers import ResourceNotFoundError, UnauthorizedAccessError
from fastapi import HTTPException
from sqlalchemy.orm import Session


# Fixtures for mock objects
@pytest.fixture
def mock_dataset_service():
    return MagicMock(spec=DatasetService)

@pytest.fixture
def ml_service(mock_dataset_service: MagicMock):
    return MLService(dataset_service=mock_dataset_service)

@pytest.fixture
def mock_db_session():
    return MagicMock(spec=Session)

@pytest.fixture
def mock_user():
    user = MagicMock(spec=DBUser)
    user.id = 1
    user.is_superuser = False
    return user

@pytest.fixture
def mock_dataset():
    dataset = MagicMock(spec=DBDataset)
    dataset.id = 101
    dataset.owner_id = 1
    dataset.name = "test_dataset"
    dataset.file_path = "/tmp/test.csv"
    return dataset

@pytest.fixture
def sample_dataframe():
    return pd.DataFrame({
        'feature_num_a': [1.0, 2.0, np.nan, 4.0, 5.0],
        'feature_num_b': [10, 20, 30, 40, 50],
        'feature_cat': ['A', 'B', 'A', 'C', 'B'],
        'target_clf': [0, 1, 0, 1, 0],
        'target_reg': [10.1, 20.2, 30.3, 40.4, 50.5],
        'extra_col': [1,2,3,4,5] # An extra column not used as feature
    })

# --- ML Service Tests ---

def test_train_model_success_classification(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    # Mock dependencies
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    # Mock joblib.dump to prevent actual file writing during test
    with patch('joblib.dump'):
        model_create = MLModelCreate(
            name="TestClfModel",
            description="A test classification model",
            dataset_id=mock_dataset.id,
            target_column="target_clf",
            features=['feature_num_a', 'feature_num_b', 'feature_cat'],
            model_type="classification",
            algorithm="logistic_regression",
            hyperparameters={"solver": "liblinear"}
        )

        db_ml_model = ml_service.train_model(mock_db_session, mock_user, model_create)

        assert db_ml_model.name == model_create.name
        assert db_ml_model.model_type == model_create.model_type
        assert db_ml_model.algorithm == model_create.algorithm
        assert db_ml_model.target_column == model_create.target_column
        assert 'accuracy' in db_ml_model.metrics
        assert db_ml_model.model_path is not None
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        mock_db_session.refresh.assert_called_once_with(db_ml_model)

def test_train_model_success_regression(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    with patch('joblib.dump'):
        model_create = MLModelCreate(
            name="TestRegModel",
            description="A test regression model",
            dataset_id=mock_dataset.id,
            target_column="target_reg",
            features=['feature_num_a', 'feature_num_b', 'feature_cat'],
            model_type="regression",
            algorithm="linear_regression"
        )

        db_ml_model = ml_service.train_model(mock_db_session, mock_user, model_create)

        assert db_ml_model.name == model_create.name
        assert db_ml_model.model_type == model_create.model_type
        assert db_ml_model.algorithm == model_create.algorithm
        assert 'rmse' in db_ml_model.metrics
        assert db_ml_model.model_path is not None

def test_train_model_unauthorized_dataset(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset):
    mock_dataset.owner_id = 999 # Different owner
    ml_service.dataset_service.get_dataset.return_value = mock_dataset

    model_create = MLModelCreate(
        name="TestModel", dataset_id=mock_dataset.id, target_column="target",
        model_type="classification", algorithm="logistic_regression"
    )

    with pytest.raises(UnauthorizedAccessError):
        ml_service.train_model(mock_db_session, mock_user, model_create)

def test_train_model_invalid_target_column(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    model_create = MLModelCreate(
        name="TestModel", dataset_id=mock_dataset.id, target_column="non_existent_target",
        model_type="classification", algorithm="logistic_regression"
    )

    with pytest.raises(HTTPException, match="Target column 'non_existent_target' not found in dataset"):
        ml_service.train_model(mock_db_session, mock_user, model_create)

def test_train_model_unsupported_algorithm(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    model_create = MLModelCreate(
        name="TestModel", dataset_id=mock_dataset.id, target_column="target_clf",
        model_type="classification", algorithm="unsupported_algo"
    )

    with pytest.raises(HTTPException, match="Unsupported algorithm 'unsupported_algo' for model type 'classification'"):
        ml_service.train_model(mock_db_session, mock_user, model_create)

def test_make_predictions_success(ml_service: MLService, mock_db_session: Session, mock_user: DBUser):
    mock_model = MagicMock(spec=DBMLModel)
    mock_model.id = 201
    mock_model.owner_id = 1
    mock_model.model_path = "/tmp/mock_model.joblib"
    mock_model.features = ['feature_num_a', 'feature_num_b', 'feature_cat']
    mock_model.model_type = 'classification'

    # Mock the loaded pipeline (a simple mock that returns fixed predictions)
    mock_pipeline = MagicMock()
    mock_pipeline.predict.return_value = [0, 1]

    # Patch joblib.load and cache_service.get to return our mock pipeline
    with patch('joblib.load', return_value=mock_pipeline), \
         patch('backend.services.cache_service.cache_service.get', return_value=None), \
         patch('backend.services.cache_service.cache_service.set'):
        
        ml_service.get_model = MagicMock(return_value=mock_model) # Mock the get_model internal call

        prediction_request = PredictionRequest(
            model_id=mock_model.id,
            data=[
                {'feature_num_a': 1.0, 'feature_num_b': 10, 'feature_cat': 'A'},
                {'feature_num_a': 2.0, 'feature_num_b': 20, 'feature_cat': 'B'}
            ]
        )

        response = ml_service.make_predictions(mock_db_session, mock_user, prediction_request)

        assert response.model_id == mock_model.id
        assert response.predictions == [0, 1]
        assert mock_pipeline.predict.called
        # Check if the input dataframe for predict was correctly aligned
        call_args, _ = mock_pipeline.predict.call_args
        passed_df = call_args[0]
        pd.testing.assert_series_equal(passed_df.columns, pd.Series(mock_model.features), check_names=False)


def test_apply_preprocessing_imputation_scaling(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    # Patch os.path.getsize and pd.DataFrame.to_parquet
    with patch('os.path.getsize', return_value=1024), \
         patch('pandas.DataFrame.to_parquet'):

        config = PreprocessingStepConfig(
            imputation=ImputationConfig(strategy='mean'),
            scaling=ScalingConfig(strategy='standard'),
            drop_columns=DropColumnConfig(columns=['extra_col']) # Drop an existing column
        )

        new_dataset_name = "preprocessed_dataset"
        db_new_dataset = ml_service.apply_preprocessing(
            db=mock_db_session,
            user=mock_user,
            dataset_id=mock_dataset.id,
            new_dataset_name=new_dataset_name,
            config=config,
            description="test preprocessing"
        )

        assert db_new_dataset.name == new_dataset_name
        assert db_new_dataset.is_preprocessed is True
        assert db_new_dataset.original_dataset_id == mock_dataset.id
        assert 'extra_col' not in db_new_dataset.column_count # Should be dropped (needs check on actual df processing)

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        mock_db_session.refresh.assert_called_once_with(db_new_dataset)

def test_apply_preprocessing_no_valid_steps(ml_service: MLService, mock_db_session: Session, mock_user: DBUser, mock_dataset: DBDataset, sample_dataframe: pd.DataFrame):
    ml_service.dataset_service.get_dataset.return_value = mock_dataset
    ml_service.dataset_service.get_dataset_dataframe.return_value = sample_dataframe

    config = PreprocessingStepConfig() # Empty config

    with pytest.raises(HTTPException, match="No valid preprocessing steps configured."):
        ml_service.apply_preprocessing(
            db=mock_db_session,
            user=mock_user,
            dataset_id=mock_dataset.id,
            new_dataset_name="empty_config_dataset",
            config=config,
            description="empty config"
        )

```