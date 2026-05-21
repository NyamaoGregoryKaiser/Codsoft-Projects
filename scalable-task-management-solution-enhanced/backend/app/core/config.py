from typing import List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore extra fields not defined in the model
    )

    PROJECT_NAME: str = "Task Management System"
    API_V1_STR: str = "/api/v1"
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    # Database settings
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "task_db"
    DATABASE_URL: Optional[PostgresDsn] = None # Will be constructed if not provided

    # JWT settings
    SECRET_KEY: str = Field("YOUR_SUPER_SECRET_KEY", min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300  # 5 hours

    # Redis settings for caching and rate limiting
    REDIS_URL: RedisDsn = "redis://redis:6379/0"

    # Admin user credentials for initial setup
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "supersecret"
    FIRST_SUPERUSER_USERNAME: str = "admin"

    # Logging level
    LOG_LEVEL: str = "INFO"

    @property
    def ASYNC_DATABASE_URL(self) -> PostgresDsn:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=5432,
            path=f"/{self.POSTGRES_DB or ''}",
        )

settings = Settings()