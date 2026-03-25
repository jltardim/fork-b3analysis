"""WebSocket JWT authentication from query parameter."""

import jwt
from fastapi import WebSocket, WebSocketException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import async_session
from app.models import User


async def authenticate_ws(websocket: WebSocket) -> User:
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    email = payload.get("email")
    if not email:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        return user
