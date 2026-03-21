```python
import pytest
from app.core.config import Settings, settings

def test_settings_load_defaults():
    # Since settings are a singleton, we might need to reset or mock them
    # For simplicity, we'll test default values if not overridden by env.
    temp_settings = Settings()
    assert temp_settings.PROJECT_NAME == "VisuFlow"
    assert temp_settings.API_V1_STR == "/api/v1"
    assert temp_settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60 * 24 * 7
    assert temp_settings.LOG_LEVEL == "INFO"

def test_settings_env_override(monkeypatch):
    monkeypatch.setenv("PROJECT_NAME", "TestProject")
    monkeypatch.setenv("SECRET_KEY", "test_secret_key")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@host:5432/db")
    monkeypatch.setenv("REDIS_URL", "redis://host:6379/1")
    monkeypatch.setenv("TESTING", "True")

    # Reload settings after monkeypatching
    settings = Settings() 
    assert settings.PROJECT_NAME == "TestProject"
    assert settings.SECRET_KEY == "test_secret_key"
    assert settings.DATABASE_URL == "postgresql+asyncpg://user:pass@host:5432/db"
    assert settings.REDIS_URL == "redis://host:6379/1"
    assert settings.TESTING is True

def test_settings_cors_origins():
    temp_settings = Settings()
    assert "http://localhost:3000" in temp_settings.BACKEND_CORS_ORIGINS
    assert "http://localhost:8000" in temp_settings.BACKEND_CORS_ORIGINS
    assert isinstance(temp_settings.BACKEND_CORS_ORIGINS, list)

def test_database_url_type():
    temp_settings = Settings()
    assert isinstance(temp_settings.DATABASE_URL, str) # Pydantic converts Dsn to str during model_dump/access
    assert temp_settings.DATABASE_URL.startswith("postgresql+asyncpg://")

def test_superuser_credentials():
    temp_settings = Settings()
    assert temp_settings.FIRST_SUPERUSER_EMAIL == "admin@visuflow.com"
    assert temp_settings.FIRST_SUPERUSER_PASSWORD == "adminpassword!"

```