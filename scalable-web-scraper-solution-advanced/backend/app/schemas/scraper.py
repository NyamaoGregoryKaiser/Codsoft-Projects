from typing import Optional, Dict, Any

from pydantic import BaseModel, HttpUrl

class ParsingRule(BaseModel):
    item_selector: str
    fields: Dict[str, str] # e.g., {"title": ".title-class", "price": ".price-class"}
    next_page_selector: Optional[str] = None # For pagination

class ScraperBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_url: HttpUrl
    parsing_rules: ParsingRule # Use the defined ParsingRule schema

class ScraperCreate(ScraperBase):
    pass

class ScraperUpdate(ScraperBase):
    name: Optional[str] = None
    start_url: Optional[HttpUrl] = None
    parsing_rules: Optional[ParsingRule] = None

class ScraperInDBBase(ScraperBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class Scraper(ScraperInDBBase):
    pass