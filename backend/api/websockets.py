from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.upload_service import UploadService
from core.database import get_db
import uuid

router = APIRouter()


@router.websocket("/ws/upload/{note_id}")
async def websocket_upload_audio(websocket: WebSocket, note_id: uuid.UUID):
    await websocket.accept()

    try:
        # Получаем сессию БД
        db_session_generator = get_db()
        db = await db_session_generator.__anext__()

        upload_service = UploadService(db)
        await upload_service.handle_upload(websocket, note_id)

    except WebSocketDisconnect:
        print(f"Client disconnected from note {note_id}")
    except Exception as e:
        await websocket.send_json({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        })
    finally:
        await websocket.close()