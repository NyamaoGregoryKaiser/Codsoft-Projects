import os
from typing import List, Union

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        extra="ignore"
    )

    APP_NAME: str = "WebScrapingSystem"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str = Field(..., min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = Field(..., pattern=r"postgresql\+psycopg2://.*")
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    REDIS_URL: str = Field(..., pattern=r"redis://.*")
    CELERY_BROKER_URL: str = Field(..., pattern=r"redis://.*")
    CELERY_RESULT_BACKEND: str = Field(..., pattern=r"redis://.*")

    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "supersecretpassword"

    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"] # Allow your frontend

    # Rate limiting (per minute)
    RATE_LIMIT_PER_MINUTE: str = "50/minute"

settings = Settings()
```
---