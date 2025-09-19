import uuid
from pathlib import Path
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from models.note import AudioNote
import aiofiles
import asyncio


class AudioService:
    def __init__(self, storage_path: str = "uploads"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)

    async def save_audio_file(self, audio_data: bytes, filename: str) -> str:
        # Асинхронное сохранение аудио файла
        file_path = self.storage_path / f"{uuid.uuid4()}_{filename}"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(audio_data)
        return str(file_path)

    async def create_audio_note(
            self,
            session: AsyncSession,
            title: str,
            tags: list,
            notes: str,
            audio_filename: str,
            audio_path: str
    ) -> AudioNote:
        # Асинхронное создание записи в БД
        note = AudioNote(
            title=title,
            tags=tags,
            notes=notes,
            audio_filename=audio_filename,
            audio_path=audio_path,
            status="pending"
        )

        session.add(note)
        await session.commit()
        await session.refresh(note)
        return note


audio_service = AudioService()