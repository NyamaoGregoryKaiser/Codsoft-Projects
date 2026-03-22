from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr, Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AuthSys API"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000", # Frontend dev server
    ]

    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "authsys_db"
    DATABASE_URL: Optional[str] = None # Will be constructed if not provided

    # JWT
    SECRET_KEY: str = Field(..., env="SECRET_KEY") # Required env variable
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # Password Reset
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1 # 1 hour
    FRONTEND_RESET_PASSWORD_URL: str = "http://localhost:3000/reset-password"

    # Email Verification
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24 # 24 hours
    FRONTEND_VERIFY_EMAIL_URL: str = "http://localhost:3000/verify-email"

    # Admin User
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "supersecret"
    FIRST_SUPERUSER_FIRST_NAME: str = "Admin"
    FIRST_SUPERUSER_LAST_NAME: str = "User"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra='ignore' # Allow other env vars not explicitly defined
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
                f"{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )

settings = Settings()
```