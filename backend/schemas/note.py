from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime


class NoteBase(BaseModel):
    title: str
    tags: List[str] = []
    notes: Optional[str] = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(NoteBase):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

    class Config:
        extra = "ignore"


class NoteResponse(NoteBase):
    id: UUID4
    audio_filename: str
    audio_path: Optional[str]
    transcription: Optional[str]
    summary: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True