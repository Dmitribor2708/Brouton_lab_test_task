from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import Field, field_validator
import os
from dotenv import load_dotenv

# Загружаем .env вручную
env_path = os.path.join(os.path.dirname(__file__), '..', 'app.env')
load_dotenv(env_path)

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://user:Password123@localhost:5432/audio_notes",
        description="Database connection URL"
    )

    # RabbitMQ
    #RABBITMQ_URL: str = Field(
    #    description="RabbitMQ connection URL"
    #)

    # Yandex Cloud S3 Configuration
    S3_ENDPOINT_URL: str = Field(
        default=os.getenv("S3_ENDPOINT_URL", "https://storage.yandexcloud.net"),
        description="Yandex Cloud Object Storage endpoint"
    )


    S3_ACCESS_KEY: Optional[str] = Field(
        default=os.getenv("S3_ACCESS_KEY"),
        description="Yandex Cloud Access Key ID"
    )

    S3_SECRET_KEY: Optional[str] = Field(
        default=os.getenv("S3_SECRET_KEY"),
        description="Yandex Cloud Secret Access Key"
    )

    S3_BUCKET_NAME: str = Field(
        default=os.getenv("S3_BUCKET_NAME", "audio-notes-bucket"),
        description="Yandex Cloud bucket name"
    )

    S3_REGION: str = Field(
        default=os.getenv("S3_REGION", "ru-central1"),
        description="Yandex Cloud region"
    )

    # Преобразуем MultiHostUrl в обычную строку для SQLAlchemy
    @field_validator('DATABASE_URL')
    def convert_db_url_to_string(cls, v):
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Игнорируем дополнительные поля


# Создаем экземпляр с обработкой ошибок
try:
    settings = Settings()
    print("Configuration loaded successfully")
except Exception as e:
    print(f"Configuration error: {e}")
    # Создаем с дефолтными значениями для разработки
    settings = Settings(
        S3_ACCESS_KEY="dummy_key",
        S3_SECRET_KEY="dummy_secret"
    )