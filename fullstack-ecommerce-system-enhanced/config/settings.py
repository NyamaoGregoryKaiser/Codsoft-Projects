```python
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, EmailStr

class Settings(BaseSettings):
    # Model configuration
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application details
    APP_NAME: str = "E-commerce System"
    APP_DESCRIPTION: str = "A comprehensive e-commerce platform built with FastAPI."
    APP_VERSION: str = "1.0.0"

    # Database settings
    DATABASE_URL: str = Field(..., env="DATABASE_URL") # Must be provided

    # Security settings
    SECRET_KEY: str = Field(..., env="SECRET_KEY") # Must be provided
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Admin user credentials for initial seeding/testing
    ADMIN_EMAIL: EmailStr = "admin@example.com"
    ADMIN_PASSWORD: str = "admin_password"

    # Caching settings (optional, for Redis)
    REDIS_URL: str | None = None # "redis://redis:6379/0"
    CACHE_TTL_SECONDS: int = 300 # Default TTL for cached responses

    # Logging settings
    LOG_LEVEL: str = "INFO" # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # Rate Limiting (optional, requires Redis and fastapi-limiter)
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_RULES: str = "5/minute,100/hour" # Example: "5/minute,100/hour"

settings = Settings()
```