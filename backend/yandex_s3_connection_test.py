# scripts/check_s3_connection.py
import asyncio
from core.s3_client import s3_client


async def test_s3_connection():
    print("Testing Yandex Cloud S3 connection...")

    if await s3_client.check_connection():
        print("Successfully connected to Yandex Cloud S3!")

        # Загрузка и удаление
        try:
            test_data = b"test audio content"
            file_key = await s3_client.upload_file(test_data, "test.txt")
            print(f"Test upload successful: {file_key}")

            #  Загрузка, получение урла
            url = await s3_client.generate_presigned_url(file_key)
            print(f"Presigned URL: {url}")

            # Cleanup
            await s3_client.delete_file(file_key)
            print("Test cleanup successful")

        except Exception as e:
            print(f"Test operations failed: {e}")
    else:
        print("Failed to connect to Yandex Cloud S3")


if __name__ == "__main__":
    asyncio.run(test_s3_connection())