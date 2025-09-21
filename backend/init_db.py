import asyncio
from core.database import engine
from core.config import settings
from models.base_model import BaseModel
from models.note import AudioNote
from models.processing import NoteProcessing
from models.audio_file import AudioFile


import logging
import sys
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    logger.info(f"Database URL: {settings.DATABASE_URL}")

    try:
        async with engine.begin() as conn:
            logger.info("Creating tables...")
            await conn.run_sync(AudioNote.__table__.create)
            logger.info("Created audio_notes table")

            # 2. Таблицы с foreign keys (после родительских)
            await conn.run_sync(NoteProcessing.__table__.create)
            logger.info("Created note_processing table")

            await conn.run_sync(AudioFile.__table__.create)
            logger.info("Created audio_files table")

            '''
            await conn.run_sync(BaseModel.metadata.create_all)

            result = await conn.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            )
            tables = await result.scalars().all()
            logger.info("Tables created successfully!")
            '''

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(init_database())