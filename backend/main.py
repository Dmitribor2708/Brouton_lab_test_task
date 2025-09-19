from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Notes API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация БД с обработкой ошибок
@app.on_event("startup")
async def startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

# Подключаем роутеры
from api import notes, websockets

app.include_router(notes.router, prefix="/api/v1", tags=["notes"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])

@app.get("/")
async def root():
    return {"message": "Audio Notes API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}