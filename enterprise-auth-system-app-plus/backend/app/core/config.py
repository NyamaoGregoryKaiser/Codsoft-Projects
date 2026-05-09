```python
from typing import Optional

from pydantic import Field, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "SecureAuthService"
    ENV: str = "development" # development, testing, production

    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_HOURS: int = 24
    REFRESH_TOKEN_DB_ENABLED: bool = True # Set to false to rely solely on client-side refresh logic and token expiration

    ADMIN_EMAIL: EmailStr = "admin@example.com"
    ADMIN_PASSWORD: str = "admin_password"

    # Database settings
    DB_HOST: str = "db"
    DB_PORT: str = "5432"
    DB_USER: str = "user"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "secureauth_db"

    # Redis settings
    REDIS_HOST: str = "redis"
    REDIS_PORT: str = "6379"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self):
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
```