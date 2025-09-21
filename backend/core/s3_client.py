import aioboto3
from botocore.exceptions import ClientError
from typing import Optional
import uuid
import os

from core.config import settings


class S3Client:
    def __init__(self):
        self.session = aioboto3.Session()
        self.bucket_name = settings.S3_BUCKET_NAME
        self.s3_config = {
            'endpoint_url': settings.S3_ENDPOINT_URL,
            'aws_access_key_id': settings.S3_ACCESS_KEY,
            'aws_secret_access_key': settings.S3_SECRET_KEY,
            'region_name': settings.S3_REGION
        }

    async def upload_file(self, file_data: bytes, filename: str) -> str:
        # асинхронная загрузка файла в Yandex Cloud S3
        try:
            async with self.session.client('s3', **self.s3_config) as s3:
                file_key = f"audio_notes/{uuid.uuid4()}_{filename}"
                await s3.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=file_data,
                    ContentType='audio/webm',
                    ACL='private'
                )

                return file_key

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                raise Exception(f"S3 bucket {self.bucket_name} does not exist")
            raise Exception(f"S3 upload error: {e}")

    async def download_file(self, file_key: str) -> bytes:
        # Асинхронное скачивание файла из Yandex Cloud S3
        async with self.session.client('s3', **self.s3_config) as s3:
            try:
                response = await s3.get_object(
                    Bucket=self.bucket_name,
                    Key=file_key
                )
                async with response['Body'] as stream:
                    return await stream.read()

            except ClientError as e:
                raise Exception(f"S3 download error: {e}")

    async def delete_file(self, file_key: str) -> bool:
        # асинхронное удаление файла из Yandex Cloud S3
        async with self.session.client('s3', **self.s3_config) as s3:
            try:
                await s3.delete_object(
                    Bucket=self.bucket_name,
                    Key=file_key
                )
                return True

            except ClientError as e:
                raise Exception(f"S3 delete error: {e}")

    async def generate_presigned_url(self, file_key: str, expiration: int = 3600) -> str:
        # генерация урла для доступа к файлу
        async with self.session.client('s3', **self.s3_config) as s3:
            try:
                url = await s3.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': self.bucket_name,
                        'Key': file_key
                    },
                    ExpiresIn=expiration
                )
                return url

            except ClientError as e:
                raise Exception(f"S3 presigned URL error: {e}")

    async def check_connection(self) -> bool:
        # проверка подключения к Yandex Cloud S3
        try:
            async with self.session.client('s3', **self.s3_config) as s3:
                response = await s3.list_buckets()
                buckets = [b['Name'] for b in response['Buckets']]
                print(f"Connected to Yandex Cloud S3. Available buckets: {buckets}")
                return True

        except Exception as e:
            print(f"S3 connection error: {e}")
            return False


# Глобальный экземпляр клиента
s3_client = S3Client()
