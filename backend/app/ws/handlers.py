"""WebSocket endpoint handlers for analysis streaming."""

import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.config import settings
from app.crypto import decrypt_api_key
from app.db import async_session
from app.models import ApiKey, Report
from app.orchestrator import AgentOrchestrator
from app.ws.auth import authenticate_ws

router = APIRouter()

_user_semaphores: dict[str, asyncio.Semaphore] = defaultdict(
    lambda: asyncio.Semaphore(settings.max_concurrent_analyses)
)


async def _get_orchestrator(user_id, profile: str) -> AgentOrchestrator:
    async with async_session() as db:
        result = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id, ApiKey.is_valid == True))
        key_row = result.scalar_one_or_none()
        if not key_row:
            raise ValueError("No valid API key found")
        api_key = decrypt_api_key(key_row.encrypted_key, settings.encryption_key)
    return AgentOrchestrator(api_key=api_key, profile=profile)


async def _save_report(user_id, result: dict, report_type: str):
    async with async_session() as db:
        report = Report(
            user_id=user_id,
            type=report_type,
            ticker=result.get("ticker"),
            tickers=result.get("tickers"),
            profile_used=result.get("profile"),
            status="completed",
            report_data={"report_text": result.get("report_text", ""), "disclaimer": result.get("disclaimer", "")},
            raw_agents=result.get("raw_agents"),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        return str(report.id)


@asynccontextmanager
async def _ws_session(websocket: WebSocket):
    """Shared context: authenticate, accept, keepalive, semaphore, error handling."""
    user = await authenticate_ws(websocket)
    await websocket.accept()

    async def keepalive():
        while True:
            await asyncio.sleep(30)
            try:
                await websocket.send_json({"status": "keepalive"})
            except Exception:
                break

    ping_task = asyncio.create_task(keepalive())
    try:
        sem = _user_semaphores[str(user.id)]
        async with sem:
            yield user
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"status": "error", "detail": str(e)})
        except Exception:
            pass
        await websocket.close()
    finally:
        ping_task.cancel()


@router.websocket("/api/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    async with _ws_session(websocket) as user:
        data = await websocket.receive_json()
        ticker = data.get("ticker", "")
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_analyze(ticker, date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "analyze")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})


@router.websocket("/api/ws/swarm")
async def ws_swarm(websocket: WebSocket):
    async with _ws_session(websocket) as user:
        data = await websocket.receive_json()
        ticker = data.get("ticker", "")
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_swarm(ticker, date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "swarm")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})


@router.websocket("/api/ws/screen")
async def ws_screen(websocket: WebSocket):
    async with _ws_session(websocket) as user:
        data = await websocket.receive_json()
        tickers = data.get("tickers", [])

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_screen(tickers, ws=websocket)
        report_id = await _save_report(user.id, result, "screen")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})


@router.websocket("/api/ws/portfolio")
async def ws_portfolio(websocket: WebSocket):
    async with _ws_session(websocket) as user:
        data = await websocket.receive_json()
        tickers = data.get("tickers", [])
        capital = data.get("capital", 10000)
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_portfolio(tickers, capital, date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "portfolio")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})


@router.websocket("/api/ws/macro")
async def ws_macro(websocket: WebSocket):
    async with _ws_session(websocket) as user:
        data = await websocket.receive_json()
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_macro(date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "macro")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
