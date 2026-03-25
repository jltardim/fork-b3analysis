"""Pydantic request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel


# --- Auth ---
class TokenVerify(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    avatar_url: str | None
    profile: str

    model_config = {"from_attributes": True}


# --- API Key ---
class ApiKeyCreate(BaseModel):
    api_key: str


class ApiKeyStatus(BaseModel):
    exists: bool
    key_prefix: str | None
    is_valid: bool


# --- Profile ---
class ProfileUpdate(BaseModel):
    profile: str  # quality / balanced / budget


# --- Reports ---
class ReportSummary(BaseModel):
    id: uuid.UUID
    type: str
    ticker: str | None
    tickers: list[str] | None
    profile_used: str | None
    status: str
    score: int | None
    signal: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ReportDetail(ReportSummary):
    report_data: dict | None
    raw_agents: dict | None


# --- WebSocket messages ---
class WsAnalyzeRequest(BaseModel):
    ticker: str
    date: str | None = None


class WsSwarmRequest(BaseModel):
    ticker: str
    date: str | None = None


class WsScreenRequest(BaseModel):
    tickers: list[str] | None = None
    sector: str | None = None


class WsPortfolioRequest(BaseModel):
    tickers: list[str]
    capital: float
    date: str | None = None


class WsProgress(BaseModel):
    wave: int | None = None
    agent: str | None = None
    status: str  # pending / running / completed / error
    detail: str | None = None
    total_agents: int | None = None
    completed_agents: int | None = None
