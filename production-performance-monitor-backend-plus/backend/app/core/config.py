from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env.example",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore extra fields not defined here
    )

    FASTAPI_ENV: str = Field("development", description="Environment (development, staging, production)")
    SECRET_KEY: SecretStr = Field(..., description="Secret key for JWT")
    ALGORITHM: str = Field("HS256", description="Algorithm for JWT encryption")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, description="Access token expiration in minutes")
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(10080, description="Refresh token expiration in minutes (7 days)")

    DATABASE_URL: str = Field(..., description="PostgreSQL database connection URL")
    REDIS_URL: str = Field(..., description="Redis connection URL")

    # Frontend related (for CORS, etc.) - though CORS is handled locally in main.py, useful for future.
    FRONTEND_URL: str = Field("http://localhost:3000", description="Frontend URL for CORS")

    # Logging
    LOG_LEVEL: str = Field("INFO", description="Global logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)")


settings = Settings()