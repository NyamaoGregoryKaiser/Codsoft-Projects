```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Secure Task Management"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 43200 # 30 days
    # Password hashing algorithm details
    HASH_ALGORITHM: str = "bcrypt" # or pbkdf2_sha256

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [] # e.g. ["http://localhost:3000", "https://your-domain.com"]

    # Redis for Caching and Rate Limiting
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # Logging
    LOG_LEVEL: str = "INFO" # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # Initial Admin User (for seeding)
    INITIAL_ADMIN_EMAIL: str = "admin@example.com"
    INITIAL_ADMIN_PASSWORD: str = "admin_password"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS origins
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            self.BACKEND_CORS_ORIGINS = [
                str(origin).strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if str(origin).strip()
            ]

settings = Settings()
```