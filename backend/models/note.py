from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()


class AudioNote(Base):
    # сущность в БД для заметок
    __tablename__ = "audio_notes"

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