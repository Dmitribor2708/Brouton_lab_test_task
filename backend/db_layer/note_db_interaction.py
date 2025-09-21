from cgitb import reset

from sqlalchemy import or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Sequence, Dict, Any
import uuid
from models.note import AudioNote

class NoteDBInteraction:
    def __init__(self, db: AsyncSession):
        self.db = db

    # метод фильтрации
    def apply_filters(self, query, filters: Dict[str, Any]):
        conditions = []

        # Фильтр по поиску в title, notes, transcription
        if 'search' in filters and filters['search']:
            search_term = f"%{filters['search']}%"
            conditions.append(
                or_(
                    AudioNote.title.ilike(search_term),
                    AudioNote.notes.ilike(search_term),
                    AudioNote.transcription.ilike(search_term)
                )
            )

        # Фильтр по статусу
        if 'status' in filters and filters['status']:
            conditions.append(AudioNote.status == filters['status'])

        # Фильтр по тегам
        if 'tags' in filters and filters['tags']:
            # Для поиска по одному тегу
            if isinstance(filters['tags'], str):
                conditions.append(AudioNote.tags.contains([filters['tags']]))
            # Для поиска по нескольким тегам
            elif isinstance(filters['tags'], list):
                for tag in filters['tags']:
                    conditions.append(AudioNote.tags.contains([tag]))

        # Применяем все условия
        if conditions:
            query = query.where(and_(*conditions))

        return query

    # получить все заметки
    async  def get_all(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> Sequence[AudioNote]:

        query = select(AudioNote).order_by(AudioNote.created_at.desc())

        if filters:
            query = self.apply_filters(query, filters)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    # получить 1 заметку по uuid
    async def get_by_id(self, note_id: uuid.UUID) -> Optional[AudioNote]:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        return result.scalar_one_or_none()

    # создать заметку из набора параметров
    async def create(self, note_data: dict) -> AudioNote:
        note = AudioNote(**note_data)
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    # обновить заметку
    async def update(self, note_id: uuid.UUID, update_data: dict) -> Optional[AudioNote]:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        note = result.scalar_one_or_none()

        if note:
            for key, value in update_data.items():
                setattr(note, key, value)
            await self.db.commit()
            await self.db.refresh(note)

        return note

    # удалить заметку
    async def delete(self, note_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )

        note = result.scalar_one_or_none()

        if note:
            await self.db.delete(note)
            await self.db.commit()
            return True

        return False

    async def get_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[AudioNote]:
        result = await self.db.execute(
            select(AudioNote)
            .where(AudioNote.status == status)
            .order_by(AudioNote.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result

    async def get_note_status(self, note_id: uuid.UUID) -> str:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        note = result.scalar_one_or_none()
        if note:
            return note.status

        return '-----'

    async def get_note_transcription(self, note_id: uuid.UUID) -> str:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        note = result.scalar_one_or_none()
        if note:
            return note.transcription

        return '-----'

    async def get_note_summarization(self, note_id: uuid.UUID) -> str:
        result = await self.db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        note = result.scalar_one_or_none()
        if note:
            return note.summary

        return '-----'

