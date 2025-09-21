import asyncpg
import asyncio

async def test_connection():
    try:
        conn = await asyncpg.connect(
            user='user',
            password='Password123',
            database='audio_notes',
            host='localhost'
        )
        print("Connection successful!")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test_connection())