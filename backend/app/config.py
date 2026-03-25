"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://b3user:b3pass@localhost:5432/b3analysis"
    encryption_key: str = ""  # Base64-encoded 32-byte key
    frontend_url: str = "http://localhost:3000"
    jwt_secret: str = ""  # Must match NEXTAUTH_SECRET
    jwt_algorithm: str = "HS256"
    max_concurrent_analyses: int = 2

    model_config = {"env_file": [".env", "../.env"], "env_file_encoding": "utf-8"}


settings = Settings()
