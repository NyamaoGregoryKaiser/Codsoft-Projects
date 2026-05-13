import os
from typing import List, Optional
from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PaymentProcessorAPI"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "payment_processor_db"
    POSTGRES_TEST_DB: str = "payment_processor_test_db" # For testing

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def TEST_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_TEST_DB}"
        )

    # Redis for Caching and Rate Limiting
    REDIS_SERVER: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_SERVER}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Celery (Task Queue)
    CELERY_BROKER_URL: str = Field(..., env="CELERY_BROKER_URL") # e.g., redis://localhost:6379/1
    CELERY_RESULT_BACKEND: str = Field(..., env="CELERY_RESULT_BACKEND") # e.g., redis://localhost:6379/2
    CELERY_MAX_RETRIES: int = 5
    CELERY_RETRY_DELAY_SECONDS: int = 60 # 1 minute

    # CORS
    BACKEND_CORS_ORIGINS: List[HttpUrl] = [] # e.g., ["http://localhost:3000", "https://yourfrontend.com"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE_PATH: Optional[str] = "logs/app.log"
    LOG_FORMAT: str = "json" # or "plain"

    # Admin User Defaults (for seed data)
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changeme" # CHANGE THIS IN PRODUCTION!

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore", # Allow other env vars not explicitly defined
    )

settings = Settings()

```

#### `payment_processor/app/core/security.py`
```python