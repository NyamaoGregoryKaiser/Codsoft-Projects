from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.models import SuggestionType

class OptimizationSuggestionBase(BaseModel):
    suggestion_type: SuggestionType
    description: str = Field(min_length=10, max_length=1000)
    sql_command: Optional[str] = Field(None, max_length=5000)
    impact_estimate: Optional[str] = Field(None, max_length=50) # e.g., 'High', 'Medium', 'Low'
    is_approved: bool = False

class OptimizationSuggestionCreate(OptimizationSuggestionBase):
    database_id: int
    suggested_by_id: int # Should be current user's ID

class OptimizationSuggestionUpdate(BaseModel):
    suggestion_type: Optional[SuggestionType] = None
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    sql_command: Optional[str] = Field(None, max_length=5000)
    impact_estimate: Optional[str] = Field(None, max_length=50)
    is_approved: Optional[bool] = None

class OptimizationSuggestionInDBBase(OptimizationSuggestionBase):
    id: int
    database_id: int
    suggested_by_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OptimizationSuggestion(OptimizationSuggestionInDBBase):
    pass