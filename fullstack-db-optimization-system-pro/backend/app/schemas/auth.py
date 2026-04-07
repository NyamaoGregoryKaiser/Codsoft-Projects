from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = Field(None, max_length=255)

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)