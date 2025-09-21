import asyncio
import uuid
import json
from typing import Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect

from services.note_service import NoteService
from core.s3_client import s3_client
# TODO - rabbitmq
from datetime import datetime

class UploadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.note_service = NoteService(db)

    async def send_error(self, websocket: WebSocket, message: str):
        # отправка ошибки
        await websocket.send_json(
            {
                "status": "error",
                "message": message
            }
        )

    async def receive_metadata(self, websocket: WebSocket) -> Optional[dict]:
        # получение метаданных о файле аудиозаписи
        try:
            metadata_json = await asyncio.wait_for(
                websocket.receive_json(),
                timeout=10.0
            )
            return {
                "filename": metadata_json.get("filename", "audio.webm"), # todo - имя файла должно быть настраиваемым?
                "file_size": metadata_json.get("file_size", 0)
            }
        except asyncio.TimeoutError:
            await self.send_error(websocket, "Timeout waiting for metadata")
            return None
        except WebSocketDisconnect as e:
            return None
        except Exception as e:
            await self.send_error(websocket, f"Invalid metadata: {str(e)}")
            return None

    async def receive_audio_data(self, websocket: WebSocket, file_size: int) -> Optional[bytes]:
        # получение самой аудиозаписи
        audio_data = bytearray()
        total_bytes_received = 0
        try:
            await websocket.send_json({"status": "ready"})

            while total_bytes_received < file_size:
                data = await websocket.receive_bytes()
                audio_data.extend(data)
                total_bytes_received += len(data)

                # Отправляем прогресс
                progress = (total_bytes_received / file_size) * 100
                await websocket.send_json({
                    "status": "progress",
                    "progress": round(progress, 2),
                    "received": total_bytes_received
                })

            return bytes(audio_data)

        except Exception as e:
            await self.send_error(websocket, f"Error receiving audio: {str(e)}")
            return None

    async def process_upload(self, websocket: WebSocket, note_id: uuid.UUID,
                            audio_data: bytes, filename: str):
        # обработка загруженного аудио
        try:
            # загружаем в S3
            file_key = await s3_client.upload_file(audio_data, filename)
            audio_url = await s3_client.generate_presigned_url(file_key, 3600)

            # обновляем БД
            await self.note_service.repository.update(note_id, {
                "audio_filename": filename,
                "audio_path": file_key,
                "audio_url": audio_url,
                "status": "pending_transcription"
            })

            # отправляем задачу в RabbitMQ
            #await self.publish_transcription_task(note_id, file_key, audio_url)

            # уведомляем фронт об успехе
            await websocket.send_json({
                "status": "completed",
                "message": "Audio uploaded and processing started",
                "file_key": file_key,
                "audio_url": audio_url
            })

        except Exception as e:
            await self.note_service.update_note_status(note_id, "error")
            await self.send_error(websocket, f"Upload failed: {str(e)}")


    async def handle_upload(self, websocket: WebSocket, note_id: uuid.UUID):
        # обработка загрузки аудио через WebSocket
        # проверяем существование заметки
        note = await self.note_service.get_note(note_id)
        if not note:
            await self.send_error(websocket, "Note not found")
            return

        # обновляем статус
        await self.note_service.update_note_status(note_id, "uploading")

        # получаем метаданные
        metadata = await self.receive_metadata(websocket)
        if not metadata:
            return

        # принимаем аудио данные
        audio_data = await self.receive_audio_data(websocket, metadata['file_size'])
        if not audio_data:
            return

        # обрабатываем загрузку
        await self.process_upload(websocket, note_id, audio_data, metadata['filename'])