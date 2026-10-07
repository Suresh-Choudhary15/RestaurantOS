from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application Settings loaded from environment variables."""
    PROJECT_NAME: str = "RestaurantOS AI Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    REDIS_URL: str = "redis://redis:6379"
    BACKEND_API_URL: str = "http://backend:4000"
    OCR_LANGUAGE: str = "eng"
    MODEL_CACHE_DIR: str = "./model_cache"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
