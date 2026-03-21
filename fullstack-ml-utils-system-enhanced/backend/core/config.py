```python
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=os.path.join(BASE_DIR, ".env"), extra="ignore")

    APP_NAME: str = "ML-Toolbox Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development" # development, production, testing

    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str = "" # This will be set dynamically

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # File Storage
    UPLOAD_DIRECTORY: str = "/tmp/ml_uploads"
    MODEL_DIRECTORY: str = "/tmp/ml_models"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.DATABASE_URL = (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        )

settings = Settings()

# Create directories if they don't exist
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(settings.MODEL_DIRECTORY, exist_ok=True)
```