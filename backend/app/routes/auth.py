"""Auth verification endpoint — creates user on first login."""

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import User
from app.schemas import TokenVerify, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/verify", response_model=UserResponse)
async def verify_token(body: TokenVerify, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(body.token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    name = payload.get("name")
    picture = payload.get("picture")
    sub = payload.get("sub", "")

    if not email:
        raise HTTPException(status_code=401, detail="Token missing email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            provider="oauth",
            provider_id=sub,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
