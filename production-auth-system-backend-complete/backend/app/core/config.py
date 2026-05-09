from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr, Field
import os

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses Pydantic's BaseSettings for type-safe configuration.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database settings
    DATABASE_URL: str = Field(..., description="PostgreSQL database connection URL")

    # JWT settings
    SECRET_KEY: str = Field(..., min_length=32, description="Secret key for JWT signing")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email settings
    MAIL_USERNAME: EmailStr = Field(..., description="Email sender username")
    MAIL_PASSWORD: str = Field(..., description="Email sender password")
    MAIL_FROM_EMAIL: EmailStr = Field(..., description="Email address to send from")
    MAIL_FROM_NAME: str = "Auth System"
    MAIL_SERVER: str = "smtp.mailtrap.io"
    MAIL_PORT: int = 2525
    MAIL_USE_TLS: bool = True

    # Redis settings
    REDIS_URL: str = "redis://redis:6379/0"

    # Frontend URL for email links
    FRONTEND_URL: str = "http://localhost:3000"

    # Project settings
    PROJECT_NAME: str = "Enterprise Auth System"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

settings = Settings()
```