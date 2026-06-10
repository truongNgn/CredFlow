from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    database_url: str = "postgresql+asyncpg://credflow:credflow_secret@localhost:5432/credflow_db"
    jwt_secret: str = "development-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    app_env: str = "development"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"])
    payment_success_rate: float = 0.9

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("payment_success_rate")
    @classmethod
    def validate_payment_success_rate(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("PAYMENT_SUCCESS_RATE must be between 0 and 1")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
