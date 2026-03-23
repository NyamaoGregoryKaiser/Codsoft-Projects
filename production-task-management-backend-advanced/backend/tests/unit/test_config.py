import os
from app.core.config import Settings

def test_settings_load_from_env_file(tmp_path):
    """Test that settings load correctly from a .env file."""
    # Create a dummy .env file
    env_content = """
    POSTGRES_SERVER=test_db_server
    POSTGRES_USER=test_db_user
    POSTGRES_PASSWORD=test_db_password
    POSTGRES_DB=test_db_name
    SECRET_KEY=test_secret_key
    FIRST_SUPERUSER_EMAIL=test@example.com
    FIRST_SUPERUSER_PASSWORD=test_password
    REDIS_HOST=test_redis_host
    REDIS_PORT=6380
    DEBUG=False
    """
    env_file = tmp_path / ".env"
    env_file.write_text(env_content)

    # Temporarily change the current working directory to where the .env file is
    original_cwd = os.getcwd()
    os.chdir(tmp_path)
    
    try:
        settings = Settings()
        assert settings.POSTGRES_SERVER == "test_db_server"
        assert settings.POSTGRES_USER == "test_db_user"
        assert settings.POSTGRES_PASSWORD == "test_db_password"
        assert settings.POSTGRES_DB == "test_db_name"
        assert settings.SECRET_KEY == "test_secret_key"
        assert settings.FIRST_SUPERUSER_EMAIL == "test@example.com"
        assert settings.FIRST_SUPERUSER_PASSWORD == "test_password"
        assert settings.REDIS_HOST == "test_redis_host"
        assert settings.REDIS_PORT == 6380
        assert settings.DEBUG is False
        assert settings.DATABASE_URL == "postgresql+asyncpg://test_db_user:test_db_password@test_db_server/test_db_name"
    finally:
        os.chdir(original_cwd)

def test_settings_defaults():
    """Test that default values are used when not specified in env."""
    # Clear environment variables (or ensure they're not set)
    old_env = os.environ.copy()
    for key in [
        "POSTGRES_SERVER", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB",
        "SECRET_KEY", "FIRST_SUPERUSER_EMAIL", "FIRST_SUPERUSER_PASSWORD",
        "REDIS_HOST", "REDIS_PORT", "DEBUG"
    ]:
        if key in os.environ:
            del os.environ[key]

    try:
        # Provide minimal required environment variables (e.g., via temporary .env or directly)
        os.environ["POSTGRES_SERVER"] = "default_server"
        os.environ["POSTGRES_USER"] = "default_user"
        os.environ["POSTGRES_PASSWORD"] = "default_password"
        os.environ["POSTGRES_DB"] = "default_db"
        os.environ["SECRET_KEY"] = "default_secret"
        os.environ["FIRST_SUPERUSER_EMAIL"] = "default@example.com"
        os.environ["FIRST_SUPERUSER_PASSWORD"] = "defaultpass"

        settings = Settings()
        assert settings.PROJECT_NAME == "Task Management System"
        assert settings.API_V1_STR == "/api/v1"
        assert settings.ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
        assert settings.REDIS_HOST == "redis" # Default from model
        assert settings.REDIS_PORT == 6379   # Default from model
        assert settings.DEBUG is False # Default from model (if not set in env)
    finally:
        os.environ.clear()
        os.environ.update(old_env)

def test_database_url_generation():
    """Test that DATABASE_URL is correctly generated."""
    # Ensure env vars are set
    os.environ["POSTGRES_SERVER"] = "testserver"
    os.environ["POSTGRES_USER"] = "testuser"
    os.environ["POSTGRES_PASSWORD"] = "testpass"
    os.environ["POSTGRES_DB"] = "testdb"
    os.environ["SECRET_KEY"] = "xyz"
    os.environ["FIRST_SUPERUSER_EMAIL"] = "f@e.com"
    os.environ["FIRST_SUPERUSER_PASSWORD"] = "fp"
    
    settings = Settings()
    expected_url = "postgresql+asyncpg://testuser:testpass@testserver/testdb"
    assert settings.DATABASE_URL == expected_url

    # Test with DATABASE_URL explicitly provided
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://custom:url@host/db"
    settings_custom_url = Settings()
    assert settings_custom_url.DATABASE_URL == "postgresql+asyncpg://custom:url@host/db"
    
    # Clean up
    del os.environ["POSTGRES_SERVER"]
    del os.environ["POSTGRES_USER"]
    del os.environ["POSTGRES_PASSWORD"]
    del os.environ["POSTGRES_DB"]
    del os.environ["SECRET_KEY"]
    del os.environ["FIRST_SUPERUSER_EMAIL"]
    del os.environ["FIRST_SUPERUSER_PASSWORD"]
    del os.environ["DATABASE_URL"]