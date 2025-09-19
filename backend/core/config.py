from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator


class Settings(BaseSettings):
    # Database - используем обычную строку и преобразуем
    DATABASE_URL: str = "postgresql+asyncpg://user:password123@192.168.0.137:5432/audio_notes"

    # RabbitMQ
    #RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    # Storage
    STORAGE_TYPE: str = "local"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None

    # Преобразуем MultiHostUrl в обычную строку для SQLAlchemy
    @field_validator('DATABASE_URL')
    def convert_db_url_to_string(cls, v):
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        env_file = ".env"


settings = Settings()