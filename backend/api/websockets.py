from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.audio_service import audio_service
from core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import json
import asyncio
import uuid

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_message(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/audio")
async def websocket_audio_upload(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        # Получаем метаданные
        metadata = await websocket.receive_json()
        title = metadata.get("title", "Untitled")
        tags = metadata.get("tags", [])
        notes = metadata.get("notes", "")
        filename = metadata.get("filename", "audio.webm")

        await websocket.send_json({"status": "ready_for_audio"})

        # Получаем аудио данные
        audio_data = await websocket.receive_bytes()

        # Сохраняем аудио файл
        audio_path = await audio_service.save_audio_file(audio_data, filename)

        # Создаем запись в БД
        async for session in get_db():
            note = await audio_service.create_audio_note(
                session, title, tags, notes, filename, audio_path
            )

            # TODO: Отправляем задачу в RabbitMQ для обработки
            # await queue_service.send_transcription_task(note.id)

            await websocket.send_json({
                "status": "success",
                "message": "Audio uploaded and processing started",
                "note_id": str(note.id)
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await websocket.send_json({"status": "disconnected"})
    except json.JSONDecodeError:
        await websocket.send_json({"status": "error", "message": "Invalid JSON"})
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
        manager.disconnect(websocket)


@router.websocket("/ws/status")
async def websocket_status(websocket: WebSocket):
    """WebSocket для отслеживания статуса обработки"""
    await manager.connect(websocket)

    try:
        while True:
            # Здесь можно реализовать подписку на статусы обработки
            await asyncio.sleep(1)
            await websocket.send_json({"status": "connected"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)