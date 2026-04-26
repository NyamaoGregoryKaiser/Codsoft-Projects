```python
from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str = Field(..., description="JWT Access Token")
    token_type: str = Field("bearer", description="Type of the token, typically 'bearer'")
    refresh_token: str = Field(..., description="JWT Refresh Token")
    expires_in: int = Field(..., description="Time in seconds until the access token expires")

class TokenPayload(BaseModel):
    sub: int = Field(..., description="User ID (subject) encoded in the token")
    type: str = Field("access", description="Token type: 'access' or 'refresh'")
```