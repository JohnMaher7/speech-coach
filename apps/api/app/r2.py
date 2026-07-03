import asyncio
import os
import tempfile
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.config import settings

_client = boto3.client(
    "s3",
    endpoint_url=settings.r2_endpoint,
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)


def presign_put(content_type: str, expires_in: int = 600) -> tuple[str, str, datetime]:
    key = f"uploads/{uuid4()}"
    url = _client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.r2_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    return url, key, expires_at


def presign_get(key: str, expires_in: int = 600) -> str:
    return _client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket, "Key": key},
        ExpiresIn=expires_in,
    )


def audio_size(key: str) -> int | None:
    """Object size in bytes, or None if the object doesn't exist."""
    try:
        head = _client.head_object(Bucket=settings.r2_bucket, Key=key)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in {"404", "NotFound", "NoSuchKey"}:
            return None
        raise
    return int(head.get("ContentLength", 0))


@asynccontextmanager
async def download_to_tempfile(key: str) -> AsyncIterator[str]:
    f = tempfile.NamedTemporaryFile(delete=False)
    f.close()
    try:
        await asyncio.to_thread(
            _client.download_file, settings.r2_bucket, key, f.name
        )
        yield f.name
    finally:
        try:
            os.unlink(f.name)
        except FileNotFoundError:
            pass
