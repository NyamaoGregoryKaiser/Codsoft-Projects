```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Shared properties
class ModelBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_type: Optional[str] = None # e.g., 'classification', 'regression'
    target_column: Optional[str] = None
    features: Optional[List[str]] = None

# Properties to receive via API on creation
class ModelCreate(ModelBase):
    name: str
    model_type: str
    dataset_id: int
    target_column: str
    features: List[str]

# Properties to receive via API on update
class ModelUpdate(ModelBase):
    pass

# Properties to return via API
class Model(ModelBase):
    id: int
    owner_id: int
    dataset_id: int
    artifact_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for prediction request
class ModelPredictRequest(BaseModel):
    data: List[dict] # List of dictionaries, each dict represents a row of features
    model_id: int # Explicitly include model_id in the request body
```