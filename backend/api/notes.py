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

from services.note_service import NoteService

router = APIRouter()


@router.get("/notes", response_model=List[NoteResponse])
async def get_notes(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        status_filter: Optional[str] =  Query(None),
        tags: Optional[List[str]] = Query(None),
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное получение списка заметок с фильтрацией
    try:
        note_service = NoteService(db)

        # Подготавливаем фильтры
        filters = {}
        if search:
            filters['search'] = search
        if status_filter:
            filters['status'] = status_filter
        if tags:
            filters['tags'] = tags

        notes = await note_service.get_notes(skip, limit, filters)
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
        note_service = NoteService(db)
        note_to_return = await note_service.get_note(note_id)
        if note_to_return is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        return note_to_return

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
        note_service = NoteService(db)
        created_note = await note_service.create_note(note)
        return created_note
        '''
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
    '''
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating note: {str(e)}"
        )


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
        note_id: uuid.UUID,
        note_update_data: NoteUpdate,
        db: AsyncSession = Depends(get_db)
):
    # Асинхронное обновление заметки
    try:
        note_service = NoteService(db)
        note_to_edit = await note_service.get_note(note_id)
        if note_to_edit is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

        updated_note = await note_service.update_note(note_to_edit.id, note_update_data)
        return updated_note
        '''
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
        '''
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
        note_service = NoteService(db)
        note_to_edit = await note_service.get_note(note_id)
        if note_to_edit is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

        await note_service.delete_note(note_id)
        return None # TODO <-- 200 или 204??
        '''
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
        '''
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
    # Получение транскрибации заметки  TODO - в бизнес-логику
    note_service = NoteService(db)

    #note_transcription = await note
    '''
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
    '''


@router.get("/notes/{note_id}/summary", response_model=dict)
async def get_summary(
        note_id: uuid.UUID,
        db: AsyncSession = Depends(get_db)
):
    # Получение суммаризации заметки TODO - в бизнес-логику
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