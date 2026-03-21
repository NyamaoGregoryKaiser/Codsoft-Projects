from typing import Optional
from pydantic import Field

from app.schemas.base import BaseSchema


class ApplicationBase(BaseSchema):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    owner_id: int

    class Config:
        from_attributes = True


class ApplicationCreate(ApplicationBase):
    owner_id: Optional[int] = None # Will be set by current user


class ApplicationUpdate(ApplicationBase):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    owner_id: Optional[int] = None # Cannot change owner via update


class ApplicationResponse(ApplicationBase):
    api_key: str # Exposed for the owner to integrate with monitoring agent
    # owner: UserBase # Optional, if you want to embed owner details