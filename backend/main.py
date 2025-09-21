from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import engine
from models.base_model import BaseModel
import logging
# Подключаем роутеры
from api import notes, websockets

logger = logging.getLogger(__name__)

app_api = FastAPI(title="Audio Notes API", version="0.1.0")

# CORS
app_api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Инициализация БД с обработкой ошибок
async def lifespan():
    # Startup logic
    try:
        # ининициализация БД
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
        logger.info("Database tables created successfully")

        # TODO - здесь подключение к брокеру
        # TODO - проверять тут коннект к S3, внешним LLM?
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

    yield  # Здесь приложение работает

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Адрес фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router, prefix="/api/v1", tags=["notes"])
app.include_router(websockets.router, tags=["websockets"])

@app.get("/")
async def root():
    return {"message": "Audio Notes API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}