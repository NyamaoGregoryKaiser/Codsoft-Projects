```python
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Shared properties
class ExperimentBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    run_id: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    status: Optional[str] = None # e.g., 'pending', 'running', 'completed', 'failed'

# Properties to receive via API on creation
class ExperimentCreate(ExperimentBase):
    name: str
    model_id: int
    run_id: str # Will be generated internally, but schema expects it.
    hyperparameters: Optional[Dict[str, Any]] = {}
    metrics: Optional[Dict[str, Any]] = {}
    status: str = "pending"

# Properties to receive via API on update
class ExperimentUpdate(ExperimentBase):
    pass

# Properties to return via API
class Experiment(ExperimentBase):
    id: int
    model_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```