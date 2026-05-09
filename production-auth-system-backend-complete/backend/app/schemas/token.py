from datetime import datetime
from pydantic import BaseModel

class PasswordResetTokenBase(BaseModel):
    token: str
    user_id: int
    expires_at: datetime
    is_used: bool = False

class PasswordResetTokenCreate(PasswordResetTokenBase):
    pass

class PasswordResetTokenRead(PasswordResetTokenBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EmailVerificationTokenBase(BaseModel):
    token: str
    user_id: int
    expires_at: datetime
    is_used: bool = False

class EmailVerificationTokenCreate(EmailVerificationTokenBase):
    pass

class EmailVerificationTokenRead(EmailVerificationTokenBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```