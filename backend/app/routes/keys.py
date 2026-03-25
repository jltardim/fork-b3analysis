"""API key management endpoints."""

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.crypto import decrypt_api_key, encrypt_api_key, extract_key_prefix
from app.db import get_db
from app.models import ApiKey, User
from app.schemas import ApiKeyCreate, ApiKeyStatus

router = APIRouter(prefix="/api/keys", tags=["keys"])


@router.post("", response_model=ApiKeyStatus)
async def save_api_key(
    body: ApiKeyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate key by making a minimal async API call
    try:
        client = anthropic.AsyncAnthropic(api_key=body.api_key)
        await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": "hi"}],
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=400, detail="Invalid API key")
    except Exception:
        pass  # Other errors (rate limit etc) mean key is valid

    encrypted = encrypt_api_key(body.api_key, settings.encryption_key)
    prefix = extract_key_prefix(body.api_key)

    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    existing = result.scalar_one_or_none()

    if existing:
        existing.encrypted_key = encrypted
        existing.key_prefix = prefix
        existing.is_valid = True
    else:
        db.add(ApiKey(user_id=user.id, encrypted_key=encrypted, key_prefix=prefix))

    await db.commit()
    return ApiKeyStatus(exists=True, key_prefix=prefix, is_valid=True)


@router.get("/status", response_model=ApiKeyStatus)
async def get_key_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    key = result.scalar_one_or_none()
    if not key:
        return ApiKeyStatus(exists=False, key_prefix=None, is_valid=False)
    return ApiKeyStatus(exists=True, key_prefix=key.key_prefix, is_valid=key.is_valid)


@router.delete("")
async def delete_api_key(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    key = result.scalar_one_or_none()
    if key:
        await db.delete(key)
        await db.commit()
    return {"status": "deleted"}
