from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List, Optional
import uuid
from datetime import datetime

from core.database import get_db
from models.note import AudioNote
from schemas.note import NoteResponse, NoteCreate, NoteUpdate

router = APIRouter()


@router.get("/notes", response_model=List[NoteResponse])
async def get_notes(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное получение списка заметок с фильтрацией
    try:
        query = select(AudioNote).order_by(AudioNote.created_at.desc())

        # Фильтр по поиску
        if search:
            query = query.where(
                or_(
                    AudioNote.title.ilike(f"%{search}%"),
                    AudioNote.notes.ilike(f"%{search}%"),
                    AudioNote.transcription.ilike(f"%{search}%")
                )
            )

        # Фильтр по статусу
        if status_filter:
            query = query.where(AudioNote.status == status_filter)

        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        notes = result.scalars().all()
        return notes

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notes: {str(e)}"
        )


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
        note_id: uuid.UUID,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное получение конкретной заметки
    try:
        result = await db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        note = result.scalar_one_or_none()

        if note is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

        return note

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching note: {str(e)}"
        )


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
        note: NoteCreate,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное создание заметки
    try:
        db_note = AudioNote(
            title=note.title,
            tags=note.tags,
            notes=note.notes,
            audio_filename="pending_upload.webm",
            status="pending"
        )

        db.add(db_note)
        await db.commit()
        await db.refresh(db_note)

        return db_note

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating note: {str(e)}"
        )


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
        note_id: uuid.UUID,
        note_update: NoteUpdate,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное обновление заметки
    try:
        result = await db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        db_note = result.scalar_one_or_none()

        if db_note is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

        # Обновляем только переданные поля
        update_data = note_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_note, field, value)

        db_note.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(db_note)

        return db_note

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating note: {str(e)}"
        )


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
        note_id: uuid.UUID,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное удаление заметки
    try:
        result = await db.execute(
            select(AudioNote).where(AudioNote.id == note_id)
        )
        db_note = result.scalar_one_or_none()

        if db_note is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

        await db.delete(db_note)
        await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting note: {str(e)}"
        )


@router.get("/notes/{note_id}/transcription", response_model=dict)
async def get_transcription(
        note_id: uuid.UUID,
        db: AsyncSession = Depends(get_db)
):
    # Получение транскрибации заметки
    result = await db.execute(
        select(AudioNote.transcription).where(AudioNote.id == note_id)
    )
    transcription = result.scalar_one_or_none()

    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found or not processed yet"
        )

    return {"transcription": transcription}


@router.get("/notes/{note_id}/summary", response_model=dict)
async def get_summary(
        note_id: uuid.UUID,
        db: AsyncSession = Depends(get_db)
):
    # Получение суммаризации заметки
    result = await db.execute(
        select(AudioNote.summary).where(AudioNote.id == note_id)
    )
    summary = result.scalar_one_or_none()

    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not found or not processed yet"
        )

    return {"summary": summary}