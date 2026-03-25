"""User profile (analysis quality tier) endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import User
from app.schemas import ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["profile"])

VALID_PROFILES = {"quality", "balanced", "budget"}


@router.get("")
async def get_profile(user: User = Depends(get_current_user)):
    return {"profile": user.profile}


@router.put("")
async def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.profile not in VALID_PROFILES:
        raise HTTPException(status_code=400, detail=f"Invalid profile. Must be one of: {VALID_PROFILES}")
    user.profile = body.profile
    await db.commit()
    return {"profile": user.profile}
