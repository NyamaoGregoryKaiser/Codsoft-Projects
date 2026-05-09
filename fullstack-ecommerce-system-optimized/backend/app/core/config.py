```python
from typing import List, Optional, Any
from pydantic import AnyHttpUrl, Field, PostgresDsn, RedisDsn, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "E-commerce API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- Database Settings ---
    POSTGRES_SERVER: str = Field(..., env="POSTGRES_SERVER")
    POSTGRES_USER: str = Field(..., env="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(..., env="POSTGRES_PASSWORD")
    POSTGRES_DB: str = Field(..., env="POSTGRES_DB")
    DATABASE_PORT: int = 5432

    # Assemble PostgreSQL connection string
    # Using PostgresDsn type for validation and better error messages
    SQLALCHEMY_DATABASE_URL: Optional[PostgresDsn] = None

    @classmethod
    def assemble_db_connection(cls, values: dict[str, Any]) -> str:
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("DATABASE_PORT"),
            path=f"{values.get('POSTGRES_DB') or ''}",
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8"
    )

    # Re-evaluate SQLALCHEMY_DATABASE_URL after all fields are loaded
    def model_post_init(self, __context: Any) -> None:
        if self.SQLALCHEMY_DATABASE_URL is None:
            self.SQLALCHEMY_DATABASE_URL = self.assemble_db_connection(self.model_dump())

    # --- CORS Settings ---
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    # --- Superuser Settings ---
    FIRST_SUPERUSER_EMAIL: EmailStr = Field("admin@example.com", env="FIRST_SUPERUSER_EMAIL")
    FIRST_SUPERUSER_PASSWORD: str = Field("adminpassword", env="FIRST_SUPERUSER_PASSWORD")

    # --- Redis Settings ---
    REDIS_SERVER: str = Field("localhost", env="REDIS_SERVER")
    REDIS_PORT: int = Field(6379, env="REDIS_PORT")
    REDIS_DB: int = Field(0, env="REDIS_DB")
    REDIS_PASSWORD: Optional[str] = Field(None, env="REDIS_PASSWORD")

    # Assemble Redis connection string
    REDIS_URL: Optional[RedisDsn] = None

    @classmethod
    def assemble_redis_connection(cls, values: dict[str, Any]) -> str:
        # Check if password is provided, otherwise build without it
        if values.get("REDIS_PASSWORD"):
            return RedisDsn.build(
                scheme="redis",
                username=None, # Redis often doesn't use username in URL, password goes into password field
                password=values.get("REDIS_PASSWORD"),
                host=values.get("REDIS_SERVER"),
                port=values.get("REDIS_PORT"),
                path=f"/{values.get('REDIS_DB')}",
            )
        else:
            return RedisDsn.build(
                scheme="redis",
                host=values.get("REDIS_SERVER"),
                port=values.get("REDIS_PORT"),
                path=f"/{values.get('REDIS_DB')}",
            )
    
    def model_post_init_second_pass(self, __context: Any) -> None:
        # Pydantic v2 calls model_post_init once. Use a second pass for inter-field dependencies.
        # This is not strictly necessary for Redis URL but demonstrates the pattern.
        if self.REDIS_URL is None:
            self.REDIS_URL = self.assemble_redis_connection(self.model_dump())


settings = Settings()

```