"""Auth verification and login endpoints."""

import hashlib
import secrets

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import User
from app.schemas import TokenVerify, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    """Hash password with PBKDF2-SHA256."""
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash."""
    salt, stored_hash = password_hash.split(":")
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return h.hex() == stored_hash


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


@router.post("/verify", response_model=UserResponse)
async def verify_token(body: TokenVerify, db: AsyncSession = Depends(get_db)):
    try:
        payload = pyjwt.decode(body.token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except pyjwt.InvalidTokenError:
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


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password. Returns JWT token."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = pyjwt.encode(
        {"email": user.email, "name": user.name, "sub": str(user.id)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    return LoginResponse(token=token, user=UserResponse.model_validate(user))
