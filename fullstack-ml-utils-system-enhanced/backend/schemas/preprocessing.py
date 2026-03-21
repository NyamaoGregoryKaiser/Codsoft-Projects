```python
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Define available preprocessing steps and their parameters
class ImputationConfig(BaseModel):
    strategy: str = Field(..., description="Strategy for imputation: 'mean', 'median', 'mode', 'constant'")
    fill_value: Optional[Any] = Field(None, description="Value to use for 'constant' strategy")
    target_columns: Optional[List[str]] = Field(None, description="Columns to apply imputation to. If None, apply to all applicable columns.")

class ScalingConfig(BaseModel):
    strategy: str = Field(..., description="Strategy for scaling: 'standard', 'minmax'")
    target_columns: Optional[List[str]] = Field(None, description="Columns to apply scaling to. If None, apply to all numerical columns.")

class EncodingConfig(BaseModel):
    strategy: str = Field(..., description="Strategy for encoding: 'onehot', 'label'")
    target_columns: Optional[List[str]] = Field(None, description="Columns to apply encoding to. If None, apply to all categorical columns.")

class DropColumnConfig(BaseModel):
    columns: List[str] = Field(..., description="Columns to drop from the dataset.")

class PreprocessingStepConfig(BaseModel):
    imputation: Optional[ImputationConfig] = None
    scaling: Optional[ScalingConfig] = None
    encoding: Optional[EncodingConfig] = None
    drop_columns: Optional[DropColumnConfig] = None

class ApplyPreprocessingRequest(BaseModel):
    dataset_id: int
    new_dataset_name: str
    config: PreprocessingStepConfig
    description: Optional[str] = None

class PreprocessingResult(BaseModel):
    message: str
    new_dataset_id: int
    new_dataset_name: str
```