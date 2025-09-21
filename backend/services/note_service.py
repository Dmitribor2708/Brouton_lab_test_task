from typing import Optional, Sequence, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from db_layer.note_db_interaction import NoteDBInteraction
from models.note import AudioNote
from schemas.note import NoteCreate, NoteUpdate


class NoteService:
    def __init__(self, db: AsyncSession):
        self.repository = NoteDBInteraction(db)

    async def get_notes(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> Sequence[AudioNote]:
        # бизнес логика получения всех заметок
        query_result = await self.repository.get_all(skip, limit, filters)
        return query_result

    async def get_note(self, note_id: uuid.UUID) -> Optional[AudioNote]:
        # бизнес логика получения заметки по id
        return await self.repository.get_by_id(note_id)

    async def create_note(self, note_data: NoteCreate) -> AudioNote:
        # бизнес-логика создания заметок
        db_note_data = {
            "title": note_data.title,
            "tags": note_data.tags,
            "notes": note_data.notes,
            "audio_filename": "pending_upload.webm",
            "status": "pending"
        }

        return await self.repository.create(db_note_data)

    async def update_note(self, note_id: uuid.UUID, update_data: NoteUpdate) -> Optional[AudioNote]:
        # бизнес-логика обновления заметок
        update_dict = update_data.model_dump(exclude_unset=True)
        return await self.repository.update(note_id, update_dict)

    async def delete_note(self, note_id: uuid.UUID) -> bool:
        # бизнес-логика удаления заметок
        return await self.repository.delete(note_id)

    async def get_note_status(self, note_id: uuid.UUID) -> str:
        # получить статус заметки
        return await self.repository.get_note_status(note_id)

    async def get_note_transcription(self, note_id: uuid.UUID) -> str:
        # получить статус транскрибации заметки
        return await self.repository.get_note_transcription(note_id)

    async def get_note_summarization(self, note_id: uuid.UUID) -> str:
        # получить статус суммаризации заметки
        return await self.repository.get_note_summarization(note_id)

    # нижние методы для брокера сообщений
    async def update_note_status(self, note_id: uuid.UUID, status: str) -> Optional[AudioNote]:
        # смена статуса  замето
        return await self.repository.update(note_id, {"status": status})

    async def update_transcription_status(self, note_id: uuid.UUID, transcription: str) -> Optional[AudioNote]:
        # смена транскрибации заметки
        return await self.repository.update(note_id, {
            "transcription": transcription,
            "status": "pending_summarization"
        })

    async def update_summary_status(self, note_id: uuid.UUID, summary: str) -> Optional[AudioNote]:
        # смена суммаризации заметки
        return await self.repository.update(note_id, {
            "summary": summary,
            "status": "completed"
        })