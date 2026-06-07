```python
from pydantic import BaseModel

class Token(BaseModel):
    """
    Pydantic schema for an access token response.
    """
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """
    Pydantic schema for the payload expected within a JWT token.
    'sub' stands for subject, typically the user's ID.
    """
    sub: int
    exp: int # Expiration timestamp
    iat: int # Issued at timestamp
```