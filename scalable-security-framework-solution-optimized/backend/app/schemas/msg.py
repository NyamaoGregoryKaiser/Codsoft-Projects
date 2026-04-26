```python
from pydantic import BaseModel, Field

class Msg(BaseModel):
    message: str = Field(..., example="Operation successful")
```