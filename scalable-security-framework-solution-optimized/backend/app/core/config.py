```python
from typing import List, Union
import json
from pydantic import AnyHttpUrl, BaseSettings, Field, PostgresDsn, RedisDsn


class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureSphere"
    PROJECT_VERSION: str = "1.0.0"
    DEBUG: bool = Field(True, env="DEBUG")
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    HOST: str = Field("0.0.0.0", env="HOST")
    PORT: int = Field(8000, env="PORT")

    # Database
    DATABASE_URL: PostgresDsn
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_HOURS: int = 24 * 7 # 7 days
    JWT_AUDIENCE: str = "securesphere"
    JWT_ISSUER: str = "securesphere.com"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: RedisDsn = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:8080"],
        env="BACKEND_CORS_ORIGINS",
        description="Comma-separated list or JSON array of CORS origins.",
    )

    class Config:
        env_file = ".env"
        # Custom logic to parse BACKEND_CORS_ORIGINS from a string
        @classmethod
        def customise_sources(
            cls,
            init_settings,
            env_settings,
            file_secret_settings,
        ):
            return (
                init_settings,
                env_settings,
                file_secret_settings,
                cls._parse_cors_origins,
            )

        @classmethod
        def _parse_cors_origins(cls, settings_cls):
            raw_origins = settings_cls.env_vars.get("BACKEND_CORS_ORIGINS")
            if raw_origins:
                try:
                    # Attempt to parse as JSON list
                    parsed = json.loads(raw_origins)
                    if isinstance(parsed, list):
                        return {"BACKEND_CORS_ORIGINS": [AnyHttpUrl(o) for o in parsed]}
                except json.JSONDecodeError:
                    # Fallback to comma-separated string
                    return {"BACKEND_CORS_ORIGINS": [AnyHttpUrl(o.strip()) for o in raw_origins.split(",") if o.strip()]}
            return {}


settings = Settings()
```