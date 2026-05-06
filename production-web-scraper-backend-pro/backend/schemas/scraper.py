```python
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, Any, List
from backend.schemas.common import DateTimeBase

class SelectorConfig(BaseModel):
    # A list of dictionaries, each defining an element to extract
    # e.g., [{"name": "title", "selector": "h1", "type": "text"}, {"name": "price", "selector": ".price", "type": "text"}]
    # or {"name": "link", "selector": "a.product-link", "type": "attribute", "attribute": "href"}
    # More complex: {"name": "products", "selector": ".product-card", "type": "list", "fields": [{"name": "name", "selector": ".product-name"}, ...]}
    name: str
    selector: str
    type: str # text, html, attribute, list, screenshot
    attribute: Optional[str] = None # required if type is 'attribute'
    fields: Optional[List['SelectorConfig']] = None # required if type is 'list'

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "product_title",
                    "selector": "h1.product-name",
                    "type": "text"
                },
                {
                    "name": "product_price",
                    "selector": ".price-tag",
                    "type": "text"
                },
                {
                    "name": "product_image_url",
                    "selector": "img.product-image",
                    "type": "attribute",
                    "attribute": "src"
                },
                {
                    "name": "all_product_links",
                    "selector": "a.product-link",
                    "type": "list",
                    "fields": [
                        {"name": "text", "selector": "", "type": "text"}, # empty selector means select self
                        {"name": "href", "selector": "", "type": "attribute", "attribute": "href"}
                    ]
                },
                {
                    "name": "product_cards",
                    "selector": ".product-card",
                    "type": "list",
                    "fields": [
                        {"name": "name", "selector": ".card-title", "type": "text"},
                        {"name": "price", "selector": ".card-price", "type": "text"},
                        {"name": "detail_link", "selector": "a.card-link", "type": "attribute", "attribute": "href"}
                    ]
                }
            ]
        }
    }


class ScraperConfigBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    start_url: HttpUrl
    selectors: List[SelectorConfig] = Field(..., description="JSON array of selector configurations")
    schedule_cron: Optional[str] = Field(None, description="CRON string for scheduling, e.g., '0 0 * * *' for daily at midnight UTC")
    headless: bool = True
    use_proxy: bool = False
    use_user_agent: bool = False
    is_active: bool = True
    description: Optional[str] = None

class ScraperConfigCreate(ScraperConfigBase):
    pass

class ScraperConfigUpdate(ScraperConfigBase):
    name: Optional[str] = None
    start_url: Optional[HttpUrl] = None
    selectors: Optional[List[SelectorConfig]] = None
    schedule_cron: Optional[str] = None
    headless: Optional[bool] = None
    use_proxy: Optional[bool] = None
    use_user_agent: Optional[bool] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class ScraperConfigInDB(ScraperConfigBase, DateTimeBase):
    id: int
    owner_id: int
    start_url: str # Pydantic converts HttpUrl to str for JSON serialization
    selectors: List[SelectorConfig] # Ensure this is a list of SelectorConfig, not raw JSON
    # For representation, we might want to include the owner's username
    owner_username: Optional[str] = None

    class Config:
        from_attributes = True

# Required for recursive models like SelectorConfig
ScraperConfig.model_rebuild()
```