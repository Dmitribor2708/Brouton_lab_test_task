#from json.decoder import JSONObject
from typing import Optional, List

from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from sqlalchemy.orm import  Mapped, mapped_column
from .base_model import BaseModel


class AudioNote(BaseModel):
    # сущность в БД для заметок
    __tablename__ = "audio_notes"

    # маппинг свойств сущности
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # user_id пока заглушка
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        default=uuid.uuid4
    )

    # базовая информация о заметке
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSONB, default=[])
    notes: Mapped[Optional[str]] =mapped_column(Text, nullable=True)

    # аудиофайл заметки
    audio_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    audio_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, server_default="pending")

    # статус заметки
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        server_default="pending",
        nullable=False
    )

    # пост-обработка
    transcription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # таймстампы
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)

    # TODO - processing task relationship

    '''
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    tags = Column(JSON, default=[])
    notes = Column(Text, nullable=True)
    audio_filename = Column(String(255), nullable=False)
    audio_path = Column(String(500), nullable=True)
    transcription = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, processing, completed, error
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    '''
    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "tags": self.tags,
            "notes": self.notes,
            "audio_filename": self.audio_filename,
            "audio_path": self.audio_path,
            "transcription": self.transcription,
            "summary": self.summary,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }