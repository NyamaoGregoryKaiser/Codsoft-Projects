```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Web Scraping Orchestrator"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "admin_password" # TODO: Change default in production

    LOG_LEVEL: str = "INFO"

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "5/minute" # Example: 5 requests per minute

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        extra='ignore' # allow additional env vars not defined here
    )

settings = Settings()
```