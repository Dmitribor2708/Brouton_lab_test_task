# TODO - МОДУЛЬ РАБОТЫ С RABBITMQ И ВНЕШНИМ LLM
import json
from typing import Dict, Any
from core.config import settings


class QueueService:
    def __init__(self):
        self.connection = None
        self.channel = None

    async def connect(self):
        # TODO - асинхронное подключение к RabbitMQ
        pass

    async def send_transcription_task(self, note_id: str, audio_path: str, audio_format: str = "webm"):
        # Отправка задачи на транскрибацию"""
        message = {
            "task_type": "trascribation",
            "note_id": note_id,
            "audio_path": audio_path,
            "audio_format": audio_format,
            "timestamp": "datetime"
        }

        await self._send_message("trascribation_queue", message)

    async def send_summarization_task(self, note_id: str, transcription_text: str):
        # Отправка задачи на суммаризацию
        message = {
            "task_type": "summarization",
            "note_id": note_id,
            "transcription_text": transcription_text,
            "timestamp": "date"
        }

        await self._send_message("summarization_queue", message)

    async def send_deletion_task(self, note_id: str, audio_path: str):
        # Отправка задачи на удаление
        message = {
            "task_type": "deletion",
            "note_id": note_id,
            "audio_path": audio_path,
            "timestamp": "date"
        }

        await self._send_message("deletion_queue", message)

    async def _send_message(self, queue_name: str, message: Dict[str, Any]):
        # Отправка сообщения в очередь
        pass

    async def close(self):
        # Закрытие соединения
        if self.connection:
            await self.connection.close()


# Глобальный экземпляр сервиса
queue_service = QueueService()