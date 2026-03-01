import os
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl

class Settings(BaseSettings):
    # Pydantic-settings will load environment variables automatically
    # from .env file (if present) and then from actual environment.
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    FASTAPI_ENV: Literal["development", "production", "testing"] = "development"
    PROJECT_NAME: str = "Project Management System"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: AnyUrl = "postgresql+asyncpg://user:password@db:5432/app_db"

    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    REDIS_URL: AnyUrl = "redis://redis:6379/0"

    RATE_LIMIT_CALLS: int = 5
    RATE_LIMIT_PERIOD_SECONDS: int = 10

settings = Settings()

if not settings.SECRET_KEY or settings.SECRET_KEY == "your-super-secret-key-change-this-in-production":
    print("WARNING: SECRET_KEY is not set or is default. Please set a strong, random SECRET_KEY in your .env file for production.")
    if settings.FASTAPI_ENV == "production":
        raise ValueError("SECRET_KEY must be set to a strong, random value in production.")
```