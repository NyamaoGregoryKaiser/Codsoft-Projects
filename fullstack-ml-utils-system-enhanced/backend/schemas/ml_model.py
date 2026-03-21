```python
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class MLModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    dataset_id: int # The ID of the dataset used for training
    target_column: str # The column used as the target variable
    features: List[str] # List of columns used as features
    model_type: str # e.g., 'classification', 'regression'
    algorithm: str # e.g., 'logistic_regression', 'random_forest'
    model_path: Optional[str] = None # Path to the serialized model file
    preprocessor_path: Optional[str] = None # Path to the serialized preprocessor (if any)

class MLModelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    dataset_id: int
    target_column: str
    features: Optional[List[str]] = None # If None, use all other columns
    model_type: str = Field(..., pattern="^(classification|regression)$")
    algorithm: str = Field(..., pattern="^(logistic_regression|random_forest|svm_classifier|linear_regression|ridge_regression|lasso_regression|tree_regressor)$")
    hyperparameters: Optional[Dict[str, Any]] = None # JSON string of hyperparameters

class MLModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class MLModelInDBBase(MLModelBase):
    id: Optional[int] = None
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    hyperparameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None # Evaluation metrics

    class Config:
        from_attributes = True

class MLModel(MLModelInDBBase):
    pass

class PredictionRequest(BaseModel):
    data: List[Dict[str, Any]] # List of dictionaries, each dict is a row
    model_id: int

class PredictionResponse(BaseModel):
    predictions: List[Any]
    model_id: int
    message: str
```