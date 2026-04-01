```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ML Utilities System"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str
    REDIS_URL: str

    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword"
    FIRST_SUPERUSER_USERNAME: str = "admin"

    DATA_STORAGE_PATH: str = "/app/data/storage" # Path inside the docker container

    class Config:
        env_file = ".env"
        # For Pydantic V2, use model_config
        model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
```