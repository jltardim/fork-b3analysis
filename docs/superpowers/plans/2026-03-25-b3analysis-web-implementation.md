# B3Analysis Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the B3Analysis CLI into a SaaS web app where users bring their own Claude API key and run stock analyses through a modern interface.

**Architecture:** Next.js 14 frontend with NextAuth OAuth + FastAPI Python backend that orchestrates 12 AI agents via Claude API, with PostgreSQL for users/keys/history and WebSocket for real-time progress streaming.

**Tech Stack:** Next.js 14 (App Router), FastAPI, PostgreSQL, SQLAlchemy async, Alembic, Anthropic SDK, NextAuth.js, WebSocket, AES-256-GCM encryption, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-03-25-b3analysis-web-design.md`

---

## File Map

### Backend (`backend/`)

| File | Responsibility |
|---|---|
| `backend/app/__init__.py` | Package init |
| `backend/app/main.py` | FastAPI app, CORS, router mounting |
| `backend/app/config.py` | Settings from env vars (pydantic-settings) |
| `backend/app/db.py` | Async SQLAlchemy engine + session factory |
| `backend/app/models.py` | SQLAlchemy ORM models (User, ApiKey, Report) |
| `backend/app/schemas.py` | Pydantic request/response schemas |
| `backend/app/crypto.py` | AES-256-GCM encrypt/decrypt for API keys |
| `backend/app/auth.py` | JWT validation middleware |
| `backend/app/routes/auth.py` | POST /api/auth/verify |
| `backend/app/routes/keys.py` | POST/GET/DELETE /api/keys |
| `backend/app/routes/profile.py` | GET/PUT /api/profile |
| `backend/app/routes/reports.py` | GET/DELETE /api/reports |
| `backend/app/routes/__init__.py` | Package init |
| `backend/app/ws/__init__.py` | Package init |
| `backend/app/ws/handlers.py` | WebSocket endpoint handlers (analyze, swarm, screen, portfolio, macro) |
| `backend/app/ws/auth.py` | WebSocket JWT auth from query param |
| `backend/app/orchestrator.py` | AgentOrchestrator class — core wave-based execution |
| `backend/app/agents.py` | Agent prompt loader + model selection |
| `backend/app/agents/*.md` | Agent prompt files (copied from original) |
| `backend/app/agents/synthesis.md` | Synthesis prompt for portfolio manager role (NEW — does not exist in original) |
| `backend/scripts/fetch_stock.py` | Refactored: returns string instead of printing |
| `backend/scripts/fetch_macro.py` | Refactored: returns string instead of printing |
| `backend/scripts/fetch_news.py` | Refactored: returns string instead of printing |
| `backend/dataflows/*.py` | Copied from original, unchanged |
| `backend/alembic/` | Database migrations |
| `backend/alembic.ini` | Alembic config |
| `backend/requirements.txt` | Python dependencies |
| `backend/tests/test_crypto.py` | Crypto module tests |
| `backend/tests/test_agents.py` | Agent loader + model selection tests |
| `backend/tests/test_orchestrator.py` | Orchestrator tests (mocked Claude API) |
| `backend/tests/test_routes.py` | REST endpoint tests |
| `backend/tests/conftest.py` | Pytest fixtures (test DB, client) |

### Frontend (`frontend/`)

| File | Responsibility |
|---|---|
| `frontend/app/layout.tsx` | Root layout with providers |
| `frontend/app/page.tsx` | Landing page |
| `frontend/app/login/page.tsx` | Login page (OAuth buttons) |
| `frontend/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |
| `frontend/app/dashboard/layout.tsx` | Dashboard layout (sidebar + header) |
| `frontend/app/dashboard/page.tsx` | Dashboard home (quick actions + recent) |
| `frontend/app/dashboard/settings/page.tsx` | API key + profile settings |
| `frontend/app/dashboard/analyze/page.tsx` | Single ticker analysis |
| `frontend/app/dashboard/swarm/page.tsx` | Swarm ultra-analysis |
| `frontend/app/dashboard/screen/page.tsx` | B3 screening |
| `frontend/app/dashboard/portfolio/page.tsx` | Portfolio builder |
| `frontend/app/dashboard/macro/page.tsx` | Macro snapshot |
| `frontend/app/dashboard/history/page.tsx` | Analysis history |
| `frontend/app/dashboard/report/[id]/page.tsx` | Report viewer |
| `frontend/components/ui/` | Shared UI primitives (shadcn/ui) |
| `frontend/components/AgentCard.tsx` | Agent status card (swarm grid) |
| `frontend/components/SwarmGrid.tsx` | Wave-organized agent grid |
| `frontend/components/TierList.tsx` | Screening tier list visualization |
| `frontend/components/ReportViewer.tsx` | Markdown report renderer |
| `frontend/components/TickerInput.tsx` | Autocomplete ticker input |
| `frontend/components/Disclaimer.tsx` | Mandatory disclaimer banner |
| `frontend/components/Sidebar.tsx` | Dashboard navigation sidebar |
| `frontend/lib/auth.ts` | NextAuth configuration |
| `frontend/lib/api.ts` | Backend API client (REST + WebSocket) |
| `frontend/lib/hooks/useAnalysis.ts` | WebSocket hook for analysis streaming |
| `frontend/lib/types.ts` | TypeScript types matching backend schemas |
| `frontend/middleware.ts` | Auth middleware (protect /dashboard/*) |

### Root

| File | Responsibility |
|---|---|
| `docker-compose.yml` | Local dev: backend + postgres |
| `.env.example` | All required env vars documented |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/main.py`, `backend/requirements.txt`, `backend/tests/__init__.py`, `backend/tests/conftest.py`
- Create: `docker-compose.yml`, `.env.example`
- Copy: `backend/dataflows/` (from `fork-b3analysis/dataflows/`), `backend/app/agents/*.md` (from `.claude/agents/`)

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p backend/app/routes backend/app/ws backend/app/agents backend/scripts backend/dataflows backend/tests
touch backend/app/__init__.py backend/app/routes/__init__.py backend/app/ws/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Create backend/requirements.txt**

```
# Original project deps
yfinance==1.2.0
stockstats==0.6.8
pandas==3.0.1
requests==2.32.5
python-dateutil==2.9.0.post0

# Backend framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
websockets==13.0

# Database
sqlalchemy[asyncio]==2.0.35
asyncpg==0.30.0
alembic==1.14.0

# Auth
pyjwt[crypto]==2.9.0

# Anthropic
anthropic==0.40.0

# Crypto
cryptography==43.0.0

# Config
pydantic-settings==2.6.0

# Logging
structlog==24.4.0

# Testing
pytest==8.3.0
pytest-asyncio==0.24.0
httpx==0.27.0
```

- [ ] **Step 3: Create backend/app/config.py**

```python
"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://b3user:b3pass@localhost:5432/b3analysis"
    encryption_key: str = ""  # Base64-encoded 32-byte key
    frontend_url: str = "http://localhost:3000"
    jwt_secret: str = ""  # Must match NEXTAUTH_SECRET
    jwt_algorithm: str = "HS256"
    max_concurrent_analyses: int = 2

    model_config = {"env_file": [".env", "../.env"], "env_file_encoding": "utf-8"}


settings = Settings()
```

- [ ] **Step 4: Create backend/app/main.py**

```python
"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="B3Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: b3user
      POSTGRES_PASSWORD: b3pass
      POSTGRES_DB: b3analysis
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 6: Create .env.example**

```
# Backend
DATABASE_URL=postgresql+asyncpg://b3user:b3pass@localhost:5432/b3analysis
ENCRYPTION_KEY=  # python3 -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
FRONTEND_URL=http://localhost:3000
JWT_SECRET=  # Must match NEXTAUTH_SECRET

# Frontend
NEXTAUTH_SECRET=  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

- [ ] **Step 7: Copy dataflows and agent prompts from original project**

Run from the `fork-b3analysis/` working directory:

```bash
cp -r dataflows/* backend/dataflows/
cp .claude/agents/*.md backend/app/agents/
cp .claude/skills/b3-analysis/SKILL.md backend/app/agents/skill.md
```

- [ ] **Step 7b: Create synthesis.md agent prompt (does NOT exist in original)**

The original project uses the main Claude Code session as portfolio manager. We need an explicit synthesis prompt:

```bash
cat > backend/app/agents/synthesis.md << 'PROMPT'
---
name: synthesis
description: Portfolio manager agent that synthesizes all specialist outputs into a final report in Portuguese. Acts as the decision-maker in the investment committee.
---

You are the portfolio manager and chief investment officer. You receive outputs from multiple specialist analysts and must synthesize them into a single, coherent investment report.

Your job:
1. Read ALL specialist outputs carefully
2. Check eliminatory criteria (1, 2, 3) — if any fail, the verdict is EVITAR regardless of other factors
3. Weigh bull case vs bear case
4. Produce the final report in Portuguese (Brazil)

Every report MUST begin with the disclaimer provided.

Follow the exact report structure specified in the SKILL CONTEXT. Be specific — cite actual numbers from the data. Do not make generic statements.
PROMPT
```

- [ ] **Step 7c: Create backend/.env from .env.example**

```bash
cp .env.example backend/.env
# Generate encryption key
python3 -c "import secrets,base64; print('ENCRYPTION_KEY=' + base64.b64encode(secrets.token_bytes(32)).decode())" >> backend/.env
```

- [ ] **Step 7d: Create .gitignore for backend and frontend**

```bash
cat > backend/.gitignore << 'EOF'
__pycache__/
*.pyc
.env
.venv/
dataflows/data_cache/
EOF
```

- [ ] **Step 8: Create conftest.py with basic fixtures**

```python
"""Shared pytest fixtures."""

import pytest


@pytest.fixture
def sample_ticker():
    return "WEGE3.SA"


@pytest.fixture
def sample_date():
    return "2026-03-25"
```

- [ ] **Step 9: Verify backend starts**

Run: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8000`
Expected: Server starts, `GET http://localhost:8000/api/health` returns `{"status": "ok"}`

- [ ] **Step 10: Commit**

```bash
git add backend/ docker-compose.yml .env.example
git commit -m "feat: scaffold backend project with FastAPI, Docker, and dataflows"
```

---

## Task 2: Database Models + Alembic Migrations

**Files:**
- Create: `backend/app/db.py`, `backend/app/models.py`, `backend/app/schemas.py`
- Create: `backend/alembic.ini`, `backend/alembic/env.py`

- [ ] **Step 1: Create backend/app/db.py**

```python
"""Async SQLAlchemy engine and session factory."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
```

- [ ] **Step 2: Create backend/app/models.py**

```python
"""SQLAlchemy ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, LargeBinary, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    provider_id: Mapped[str] = mapped_column(Text, nullable=False)
    profile: Mapped[str] = mapped_column(Text, default="balanced")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    api_key: Mapped["ApiKey | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    encrypted_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_prefix: Mapped[str | None] = mapped_column(Text)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="api_key")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(Text, nullable=False)
    ticker: Mapped[str | None] = mapped_column(Text)
    tickers: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    profile_used: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="running")
    report_data: Mapped[dict | None] = mapped_column(JSONB)
    raw_agents: Mapped[dict | None] = mapped_column(JSONB)
    score: Mapped[int | None] = mapped_column(Integer)
    signal: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="reports")
```

- [ ] **Step 3: Create backend/app/schemas.py**

```python
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
```

- [ ] **Step 4: Initialize Alembic**

Run: `cd backend && alembic init alembic`

Then edit `backend/alembic/env.py` to use async engine and import models:

```python
# In env.py, replace the target_metadata and run_migrations_online:
from app.models import Base
from app.config import settings

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", settings.database_url.replace("+asyncpg", ""))
```

- [ ] **Step 5: Generate initial migration**

Run: `cd backend && alembic revision --autogenerate -m "initial schema"`

- [ ] **Step 6: Start postgres and apply migration**

Run: `docker compose up -d db && cd backend && alembic upgrade head`
Expected: Tables `users`, `api_keys`, `reports` created with indexes.

- [ ] **Step 7: Commit**

```bash
git add backend/app/db.py backend/app/models.py backend/app/schemas.py backend/alembic* backend/alembic/
git commit -m "feat: add database models, schemas, and Alembic migrations"
```

---

## Task 3: Crypto Module (API Key Encryption)

**Files:**
- Create: `backend/app/crypto.py`, `backend/tests/test_crypto.py`

- [ ] **Step 1: Write failing test for encrypt/decrypt round-trip**

```python
# backend/tests/test_crypto.py
import base64
import os

import pytest

from app.crypto import decrypt_api_key, encrypt_api_key


@pytest.fixture
def encryption_key():
    return base64.b64encode(os.urandom(32)).decode()


def test_encrypt_decrypt_roundtrip(encryption_key):
    original = "sk-ant-api03-test-key-1234567890"
    encrypted = encrypt_api_key(original, encryption_key)
    decrypted = decrypt_api_key(encrypted, encryption_key)
    assert decrypted == original


def test_encrypted_differs_from_plaintext(encryption_key):
    original = "sk-ant-api03-test-key"
    encrypted = encrypt_api_key(original, encryption_key)
    assert original.encode() not in encrypted


def test_different_encryptions_produce_different_ciphertext(encryption_key):
    original = "sk-ant-api03-test-key"
    enc1 = encrypt_api_key(original, encryption_key)
    enc2 = encrypt_api_key(original, encryption_key)
    assert enc1 != enc2  # Different nonces


def test_wrong_key_fails():
    key1 = base64.b64encode(os.urandom(32)).decode()
    key2 = base64.b64encode(os.urandom(32)).decode()
    encrypted = encrypt_api_key("secret", key1)
    with pytest.raises(Exception):
        decrypt_api_key(encrypted, key2)


def test_extract_key_prefix():
    from app.crypto import extract_key_prefix
    assert extract_key_prefix("sk-ant-api03-abcdefghijk") == "sk-ant-...hijk"
    assert extract_key_prefix("short") == "****"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_crypto.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.crypto'`

- [ ] **Step 3: Implement crypto module**

```python
# backend/app/crypto.py
"""AES-256-GCM encryption for API keys.

Storage format: nonce(12B) || ciphertext || tag(16B)
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_aesgcm(encryption_key_b64: str) -> AESGCM:
    key_bytes = base64.b64decode(encryption_key_b64)
    if len(key_bytes) != 32:
        raise ValueError("Encryption key must be 32 bytes (256 bits)")
    return AESGCM(key_bytes)


def encrypt_api_key(plaintext: str, encryption_key_b64: str) -> bytes:
    aesgcm = _get_aesgcm(encryption_key_b64)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ciphertext  # nonce(12) || ciphertext || tag(16)


def decrypt_api_key(encrypted: bytes, encryption_key_b64: str) -> str:
    aesgcm = _get_aesgcm(encryption_key_b64)
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def extract_key_prefix(api_key: str) -> str:
    if len(api_key) < 10:
        return "****"
    return f"{api_key[:6]}...{api_key[-4:]}"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_crypto.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/crypto.py backend/tests/test_crypto.py
git commit -m "feat: add AES-256-GCM encryption for API keys"
```

---

## Task 4: JWT Auth Middleware

**Files:**
- Create: `backend/app/auth.py`, `backend/app/ws/auth.py`

- [ ] **Step 1: Create backend/app/auth.py**

```python
"""JWT validation for REST endpoints."""

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import User


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token missing email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
```

- [ ] **Step 2: Create backend/app/ws/auth.py**

```python
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/auth.py backend/app/ws/auth.py
git commit -m "feat: add JWT auth for REST and WebSocket endpoints"
```

---

## Task 5: REST API Routes (Auth, Keys, Profile, Reports)

**Files:**
- Create: `backend/app/routes/auth.py`, `backend/app/routes/keys.py`, `backend/app/routes/profile.py`, `backend/app/routes/reports.py`
- Modify: `backend/app/main.py` (mount routers)
- Create: `backend/tests/test_routes.py`

- [ ] **Step 1: Create backend/app/routes/auth.py**

```python
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
```

- [ ] **Step 2: Create backend/app/routes/keys.py**

```python
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
    # Validate key by making a minimal API call
    try:
        client = anthropic.Anthropic(api_key=body.api_key)
        client.messages.create(
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
```

- [ ] **Step 3: Create backend/app/routes/profile.py**

```python
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
```

- [ ] **Step 4: Create backend/app/routes/reports.py**

```python
"""Report history endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import Report, User
from app.schemas import ReportDetail, ReportSummary

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportSummary])
async def list_reports(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == user.id)
        .order_by(Report.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(
    report_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/{report_id}")
async def delete_report(
    report_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.delete(report)
    await db.commit()
    return {"status": "deleted"}
```

- [ ] **Step 5: Mount all routers in main.py**

Add to `backend/app/main.py`:

```python
from app.routes import auth, keys, profile, reports

app.include_router(auth.router)
app.include_router(keys.router)
app.include_router(profile.router)
app.include_router(reports.router)
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/routes/ backend/app/main.py
git commit -m "feat: add REST routes for auth, keys, profile, and reports"
```

---

## Task 6: Refactor Scripts to Return Data

**Files:**
- Create: `backend/scripts/fetch_stock.py`, `backend/scripts/fetch_macro.py`, `backend/scripts/fetch_news.py`
- Create: `backend/scripts/__init__.py`

The original scripts print to stdout. We refactor to expose `run()` functions that return strings.

- [ ] **Step 1: Create backend/scripts/__init__.py**

```python
"""Data fetching scripts — refactored to return strings instead of printing."""
```

- [ ] **Step 2: Create backend/scripts/fetch_stock.py**

Copy from original and change `main()` to `run(ticker, date_str=None)` that returns string:

```python
#!/usr/bin/env python3
"""Fetch stock data (OHLCV + technicals + fundamentals) for a B3 ticker."""

import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataflows.y_finance import (
    get_YFin_data_online,
    get_stock_stats_indicators_window,
    get_fundamentals,
    get_balance_sheet,
    get_cashflow,
    get_income_statement,
)


def validate_ticker(ticker: str) -> None:
    if not re.match(r'^[A-Z]{4}\d{1,2}(\.SA)?$', ticker):
        raise ValueError(f"Invalid ticker: {ticker}. Expected format: WEGE3 or WEGE3.SA")


def run(ticker: str, date_str: str | None = None) -> str:
    """Fetch complete stock data. Returns formatted report string."""
    ticker = ticker.upper()
    if not ticker.endswith(".SA"):
        ticker += ".SA"
    validate_ticker(ticker)

    if date_str is None:
        date_str = datetime.today().strftime("%Y-%m-%d")

    curr_date = datetime.strptime(date_str, "%Y-%m-%d")
    start_date = (curr_date - timedelta(days=365)).strftime("%Y-%m-%d")
    separator = "\n" + "=" * 60 + "\n"
    output = [f"# Stock Report: {ticker} — {date_str}"]

    output.append(separator + "## OHLCV (last 365 days)\n")
    output.append(get_YFin_data_online(ticker, start_date, date_str))

    indicators = [
        "close_50_sma", "close_200_sma", "close_10_ema",
        "macd", "macd_signal", "macd_hist",
        "rsi_14", "boll", "boll_ub", "boll_lb",
        "atr", "adx",
    ]
    output.append(separator + "## Technical Indicators\n")
    for ind in indicators:
        try:
            result = get_stock_stats_indicators_window(ticker, ind, date_str, 90)
            output.append(f"### {ind.upper()}\n{result}\n")
        except Exception as e:
            output.append(f"### {ind.upper()}\nError: {e}\n")

    output.append(separator + "## Fundamentals\n")
    output.append(get_fundamentals(ticker, date_str))

    output.append(separator + "## Income Statement (quarterly)\n")
    output.append(get_income_statement(ticker, "quarterly", date_str))

    output.append(separator + "## Balance Sheet (quarterly)\n")
    output.append(get_balance_sheet(ticker, "quarterly", date_str))

    output.append(separator + "## Cash Flow (quarterly)\n")
    output.append(get_cashflow(ticker, "quarterly", date_str))

    return "\n".join(output)


if __name__ == "__main__":
    import sys as _sys
    if len(_sys.argv) < 2:
        print("Usage: fetch_stock.py TICKER [DATE]")
        _sys.exit(1)
    print(run(_sys.argv[1], _sys.argv[2] if len(_sys.argv) > 2 else None))
```

- [ ] **Step 3: Create backend/scripts/fetch_macro.py**

```python
#!/usr/bin/env python3
"""Fetch Brazilian macroeconomic indicators and macro news."""

import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataflows.bcb_data import get_bcb_macro_indicators, get_bcb_selic_history
from dataflows.google_news_br import get_macro_news_br


def run(date_str: str | None = None) -> str:
    """Fetch macro data. Returns formatted report string."""
    if date_str is None:
        date_str = datetime.today().strftime("%Y-%m-%d")

    separator = "\n" + "=" * 60 + "\n"
    output = [f"# Macro Snapshot Brasil — {date_str}"]

    output.append(separator + "## Indicadores BCB (Banco Central do Brasil)\n")
    output.append(get_bcb_macro_indicators(date_str))

    output.append(separator + "## Histórico Meta Selic (Copom)\n")
    output.append(get_bcb_selic_history(date_str))

    output.append(separator + "## Notícias Macro Brasil (PT-BR)\n")
    output.append(get_macro_news_br(date_str, look_back_days=14))

    return "\n".join(output)


if __name__ == "__main__":
    print(run(sys.argv[1] if len(sys.argv) > 1 else None))
```

- [ ] **Step 4: Create backend/scripts/fetch_news.py**

```python
#!/usr/bin/env python3
"""Fetch Brazilian financial news for a given ticker."""

import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataflows.google_news_br import get_news_google_br, get_sector_news_br

SECTOR_MAP = {
    "WEGE3": "industrial", "RENT3": "varejo", "RADL3": "saude",
    "FLRY3": "saude", "TOTS3": "tecnologia", "PSSA3": "financeiro",
    "ITUB3": "financeiro", "ITUB4": "financeiro", "BBAS3": "financeiro",
    "BBDC4": "financeiro", "BBSE3": "financeiro", "EQTL3": "energia",
    "EGIE3": "energia", "SAPR3": "saneamento", "LREN3": "varejo",
    "ABEV3": "consumo", "PETR4": "energia", "PETR3": "energia",
    "VALE3": "commodities", "SUZB3": "commodities",
}


def run(ticker: str, date_str: str | None = None, lookback_days: int = 14) -> str:
    """Fetch news for ticker. Returns formatted report string."""
    ticker = ticker.upper()
    if not ticker.endswith(".SA"):
        base_ticker = ticker
    else:
        base_ticker = ticker.replace(".SA", "")

    if date_str is None:
        date_str = datetime.today().strftime("%Y-%m-%d")

    sector = SECTOR_MAP.get(base_ticker)
    end_dt = datetime.strptime(date_str, "%Y-%m-%d")
    start_date = (end_dt - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    separator = "\n" + "=" * 60 + "\n"

    output = [f"# News Report: {ticker} — {date_str}"]

    output.append(separator + "## Notícias da Empresa (PT-BR)\n")
    output.append(get_news_google_br(base_ticker, start_date, date_str))

    if sector:
        output.append(separator + f"## Notícias do Setor: {sector}\n")
        output.append(get_sector_news_br(sector, date_str, look_back_days=lookback_days))

    return "\n".join(output)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fetch_news.py TICKER [DATE] [LOOKBACK_DAYS]")
        sys.exit(1)
    print(run(
        sys.argv[1],
        sys.argv[2] if len(sys.argv) > 2 else None,
        int(sys.argv[3]) if len(sys.argv) > 3 else 14,
    ))
```

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/
git commit -m "feat: refactor fetch scripts to return strings for module import"
```

---

## Task 7: Agent Loader + Orchestrator Core

**Files:**
- Create: `backend/app/agents.py`, `backend/app/orchestrator.py`
- Create: `backend/tests/test_agents.py`, `backend/tests/test_orchestrator.py`

- [ ] **Step 1: Write failing test for agent loader**

```python
# backend/tests/test_agents.py
from app.agents import get_model, load_agent_prompt

def test_load_agent_prompt_returns_string():
    prompt = load_agent_prompt("business-analyst")
    assert isinstance(prompt, str)
    assert len(prompt) > 100
    assert "moat" in prompt.lower() or "business" in prompt.lower()

def test_get_model_quality_analyst():
    assert get_model("business-analyst", "quality") == "claude-opus-4-6"

def test_get_model_balanced_macro():
    assert get_model("macro-correlation-analyst", "balanced") == "claude-haiku-4-5"

def test_get_model_budget_synthesis():
    assert get_model("synthesis", "budget") == "claude-sonnet-4-6"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_agents.py -v`
Expected: FAIL

- [ ] **Step 3: Implement backend/app/agents.py**

```python
"""Agent prompt loader and model selection."""

from pathlib import Path

AGENTS_DIR = Path(__file__).parent / "agents"

MODEL_MAP = {
    "quality":  {"synthesis": "claude-opus-4-6",   "analyst": "claude-opus-4-6",   "macro": "claude-sonnet-4-6"},
    "balanced": {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-sonnet-4-6",  "macro": "claude-haiku-4-5"},
    "budget":   {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-haiku-4-5",   "macro": "claude-haiku-4-5"},
}

MACRO_TIER_AGENTS = {"macro-analyst", "macro-correlation-analyst"}


def load_agent_prompt(agent_name: str) -> str:
    """Load agent prompt from .md file. Strips YAML frontmatter."""
    path = AGENTS_DIR / f"{agent_name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Agent prompt not found: {path}")
    content = path.read_text(encoding="utf-8")
    # Strip YAML frontmatter (between --- markers)
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            return parts[2].strip()
    return content.strip()


def load_skill_prompt() -> str:
    """Load the b3-analysis skill for synthesis context."""
    path = AGENTS_DIR / "skill.md"
    if not path.exists():
        return ""
    content = path.read_text(encoding="utf-8")
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            return parts[2].strip()
    return content.strip()


def get_model(agent_name: str, profile: str) -> str:
    """Return the correct Claude model for this agent and profile."""
    if profile not in MODEL_MAP:
        profile = "balanced"
    tier = (
        "synthesis" if agent_name == "synthesis"
        else "macro" if agent_name in MACRO_TIER_AGENTS
        else "analyst"
    )
    return MODEL_MAP[profile][tier]
```

- [ ] **Step 4: Run agent loader tests**

Run: `cd backend && python -m pytest tests/test_agents.py -v`
Expected: All PASS

- [ ] **Step 5: Implement backend/app/orchestrator.py**

```python
"""Agent orchestrator — replaces Claude Code's internal dispatch with direct API calls."""

import asyncio
from datetime import datetime

import anthropic
from fastapi import WebSocket

from app.agents import get_model, load_agent_prompt, load_skill_prompt


WAVE2_AGENTS = [
    "business-analyst",
    "financial-analyst",
    "credit-analyst",
    "valuation-analyst",
    "technical-analyst",
    "macro-correlation-analyst",
    "governance-analyst",
    "news-sentiment-analyst",
]

DISCLAIMER = (
    "Este relatório é gerado por agentes de IA para fins exclusivamente "
    "educacionais e de estudo pessoal. Não constitui recomendação de investimento, "
    "consultoria financeira ou análise profissional. Renda variável envolve risco "
    "de perda do capital investido."
)


class AgentOrchestrator:
    def __init__(self, api_key: str, profile: str = "balanced"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.profile = profile

    async def call_agent(self, agent_name: str, user_content: str, max_retries: int = 3) -> str:
        """Call Claude API with an agent's prompt. Retries on rate limits with exponential backoff."""
        prompt = load_agent_prompt(agent_name)
        model = get_model(agent_name, self.profile)

        for attempt in range(max_retries):
            try:
                response = await self.client.messages.create(
                    model=model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": f"{prompt}\n\n{user_content}"}],
                )
                return response.content[0].text
            except anthropic.RateLimitError:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s
                else:
                    raise

    async def _send_progress(self, ws: WebSocket | None, **kwargs):
        if ws:
            await ws.send_json(kwargs)

    async def run_analyze(self, ticker: str, date_str: str | None = None, ws: WebSocket | None = None) -> dict:
        """Run /b3:analyze — 3 data scripts + synthesis."""
        from scripts.fetch_stock import run as fetch_stock
        from scripts.fetch_macro import run as fetch_macro
        from scripts.fetch_news import run as fetch_news

        date_str = date_str or datetime.today().strftime("%Y-%m-%d")
        await self._send_progress(ws, wave=1, status="running", detail="Coletando dados...")

        loop = asyncio.get_running_loop()
        raw_stock, raw_macro, raw_news = await asyncio.gather(
            loop.run_in_executor(None, fetch_stock, ticker, date_str),
            loop.run_in_executor(None, fetch_macro, date_str),
            loop.run_in_executor(None, fetch_news, ticker, date_str),
        )
        await self._send_progress(ws, wave=1, status="completed")

        # Synthesis
        await self._send_progress(ws, wave=2, status="running", detail="Sintetizando análise...")
        skill = load_skill_prompt()
        synthesis_prompt = (
            f"TICKER: {ticker}\nDATE: {date_str}\n\n"
            f"RAW_STOCK:\n{raw_stock}\n\nRAW_MACRO:\n{raw_macro}\n\nRAW_NEWS:\n{raw_news}\n\n"
            f"SKILL CONTEXT:\n{skill}\n\n"
            f"DISCLAIMER: {DISCLAIMER}\n\n"
            "Produza o relatório completo em português seguindo a estrutura do /b3:analyze."
        )
        report_text = await self.call_agent("synthesis", synthesis_prompt)
        await self._send_progress(ws, wave=2, status="completed")

        return {
            "type": "analyze", "ticker": ticker, "date": date_str,
            "profile": self.profile, "disclaimer": DISCLAIMER,
            "report_text": report_text,
            "raw_agents": {"stock": raw_stock[:500], "macro": raw_macro[:500], "news": raw_news[:500]},
        }

    async def run_swarm(self, ticker: str, date_str: str | None = None, ws: WebSocket | None = None) -> dict:
        """Run /b3:swarm — Wave 1 (data) + Wave 2 (8 analysts) + Wave 3 (bear) + Synthesis."""
        from scripts.fetch_stock import run as fetch_stock
        from scripts.fetch_macro import run as fetch_macro
        from scripts.fetch_news import run as fetch_news

        date_str = date_str or datetime.today().strftime("%Y-%m-%d")

        # Wave 1 — Data collection
        await self._send_progress(ws, wave=1, status="running", total_agents=3, completed_agents=0)
        loop = asyncio.get_running_loop()
        raw_stock, raw_macro, raw_news = await asyncio.gather(
            loop.run_in_executor(None, fetch_stock, ticker, date_str),
            loop.run_in_executor(None, fetch_macro, date_str),
            loop.run_in_executor(None, fetch_news, ticker, date_str, 30),
        )
        await self._send_progress(ws, wave=1, status="completed", completed_agents=3)

        # Wave 2 — 8 analyst agents in parallel
        data_context = f"TICKER: {ticker}\n\nRAW_STOCK:\n{raw_stock}\n\nRAW_MACRO:\n{raw_macro}\n\nRAW_NEWS:\n{raw_news}"
        agent_results = {}
        completed = 0

        async def run_analyst(name: str):
            nonlocal completed
            result = await self.call_agent(name, data_context)
            completed += 1
            await self._send_progress(ws, wave=2, agent=name, status="completed",
                                       total_agents=len(WAVE2_AGENTS), completed_agents=completed)
            return name, result

        await self._send_progress(ws, wave=2, status="running", total_agents=len(WAVE2_AGENTS), completed_agents=0)
        tasks = [run_analyst(name) for name in WAVE2_AGENTS]
        results = await asyncio.gather(*tasks)
        for name, result in results:
            agent_results[name] = result

        # Wave 3 — Bear analyst
        await self._send_progress(ws, wave=3, agent="bear-analyst", status="running")
        all_outputs = "\n\n".join(f"=== {k} ===\n{v}" for k, v in agent_results.items())
        bear_context = f"{data_context}\n\nAGENT OUTPUTS:\n{all_outputs}"
        bear_result = await self.call_agent("bear-analyst", bear_context)
        agent_results["bear-analyst"] = bear_result
        await self._send_progress(ws, wave=3, agent="bear-analyst", status="completed")

        # Synthesis
        await self._send_progress(ws, wave=4, status="running", detail="Portfolio manager sintetizando...")
        skill = load_skill_prompt()
        synthesis_context = (
            f"{data_context}\n\nAGENT OUTPUTS:\n{all_outputs}\n\n"
            f"BEAR ANALYST:\n{bear_result}\n\n"
            f"SKILL CONTEXT:\n{skill}\n\nDISCLAIMER: {DISCLAIMER}\n\n"
            "Você é o portfolio manager. Produza o relatório swarm completo em português."
        )
        synthesis = await self.call_agent("synthesis", synthesis_context)
        await self._send_progress(ws, wave=4, status="completed")

        return {
            "type": "swarm", "ticker": ticker, "date": date_str,
            "profile": self.profile, "disclaimer": DISCLAIMER,
            "report_text": synthesis,
            "raw_agents": agent_results,
        }

    async def run_macro(self, date_str: str | None = None, ws: WebSocket | None = None) -> dict:
        """Run /b3:macro — fetch macro data + synthesis."""
        from scripts.fetch_macro import run as fetch_macro

        date_str = date_str or datetime.today().strftime("%Y-%m-%d")
        await self._send_progress(ws, wave=1, status="running")
        loop = asyncio.get_running_loop()
        raw_macro = await loop.run_in_executor(None, fetch_macro, date_str)
        await self._send_progress(ws, wave=1, status="completed")

        await self._send_progress(ws, wave=2, status="running", detail="Sintetizando macro...")
        skill = load_skill_prompt()
        synthesis_prompt = (
            f"DATE: {date_str}\n\nRAW_MACRO:\n{raw_macro}\n\n"
            f"SKILL CONTEXT:\n{skill}\n\nDISCLAIMER: {DISCLAIMER}\n\n"
            "Produza o relatório macroeconômico em português."
        )
        report = await self.call_agent("synthesis", synthesis_prompt)
        await self._send_progress(ws, wave=2, status="completed")

        return {
            "type": "macro", "date": date_str, "profile": self.profile,
            "disclaimer": DISCLAIMER, "report_text": report,
        }

    async def run_screen(self, tickers: list[str], ws: WebSocket | None = None) -> dict:
        """Run /b3:screen — fetch data for all tickers + synthesis."""
        from scripts.fetch_stock import run as fetch_stock

        date_str = datetime.today().strftime("%Y-%m-%d")
        loop = asyncio.get_running_loop()
        ticker_data = {}
        completed = 0

        async def fetch_one(t: str):
            nonlocal completed
            try:
                data = await loop.run_in_executor(None, fetch_stock, t, date_str)
                ticker_data[t] = data
            except Exception as e:
                ticker_data[t] = f"Error: {e}"
            completed += 1
            await self._send_progress(ws, wave=1, status="running",
                                       total_agents=len(tickers), completed_agents=completed, agent=t)

        await self._send_progress(ws, wave=1, status="running", total_agents=len(tickers), completed_agents=0)
        await asyncio.gather(*[fetch_one(t) for t in tickers])
        await self._send_progress(ws, wave=1, status="completed")

        await self._send_progress(ws, wave=2, status="running", detail="Aplicando critérios...")
        skill = load_skill_prompt()
        all_data = "\n\n".join(f"=== {t} ===\n{d[:2000]}" for t, d in ticker_data.items())
        synthesis_prompt = (
            f"DATE: {date_str}\n\nTICKER DATA:\n{all_data}\n\n"
            f"SKILL CONTEXT:\n{skill}\n\nDISCLAIMER: {DISCLAIMER}\n\n"
            "Aplique os 7 critérios do Logan e produza a tier list em português."
        )
        report = await self.call_agent("synthesis", synthesis_prompt)
        await self._send_progress(ws, wave=2, status="completed")

        return {
            "type": "screen", "tickers": tickers, "date": date_str,
            "profile": self.profile, "disclaimer": DISCLAIMER,
            "report_text": report,
        }

    async def run_portfolio(self, tickers: list[str], capital: float,
                            date_str: str | None = None, ws: WebSocket | None = None) -> dict:
        """Run /b3:portfolio — macro + per-ticker data + synthesis."""
        from scripts.fetch_stock import run as fetch_stock
        from scripts.fetch_macro import run as fetch_macro
        from scripts.fetch_news import run as fetch_news

        date_str = date_str or datetime.today().strftime("%Y-%m-%d")
        loop = asyncio.get_running_loop()

        # Fetch macro + all tickers in parallel
        await self._send_progress(ws, wave=1, status="running", total_agents=len(tickers) + 1, completed_agents=0)
        raw_macro = await loop.run_in_executor(None, fetch_macro, date_str)

        ticker_data = {}
        completed = 0

        async def fetch_one(t: str):
            nonlocal completed
            try:
                stock = await loop.run_in_executor(None, fetch_stock, t, date_str)
                news = await loop.run_in_executor(None, fetch_news, t, date_str, 14)
                ticker_data[t] = f"{stock}\n\n{news}"
            except Exception as e:
                ticker_data[t] = f"Error: {e}"
            completed += 1
            await self._send_progress(ws, wave=1, status="running",
                                       total_agents=len(tickers) + 1, completed_agents=completed + 1)

        await asyncio.gather(*[fetch_one(t) for t in tickers])
        await self._send_progress(ws, wave=1, status="completed")

        await self._send_progress(ws, wave=2, status="running", detail="Montando carteira...")
        skill = load_skill_prompt()
        all_data = "\n\n".join(f"=== {t} ===\n{d[:2000]}" for t, d in ticker_data.items())
        synthesis_prompt = (
            f"TICKERS: {', '.join(tickers)}\nCAPITAL: R$ {capital:,.2f}\nDATE: {date_str}\n\n"
            f"RAW_MACRO:\n{raw_macro}\n\nTICKER DATA:\n{all_data}\n\n"
            f"SKILL CONTEXT:\n{skill}\n\nDISCLAIMER: {DISCLAIMER}\n\n"
            "Monte a carteira otimizada em português seguindo a estrutura do /b3:portfolio."
        )
        report = await self.call_agent("synthesis", synthesis_prompt)
        await self._send_progress(ws, wave=2, status="completed")

        return {
            "type": "portfolio", "tickers": tickers, "date": date_str,
            "capital": capital, "profile": self.profile,
            "disclaimer": DISCLAIMER, "report_text": report,
        }
```

- [ ] **Step 6: Write orchestrator test (mocked)**

```python
# backend/tests/test_orchestrator.py
from unittest.mock import AsyncMock, patch

import pytest

from app.orchestrator import AgentOrchestrator


@pytest.fixture
def orchestrator():
    return AgentOrchestrator(api_key="sk-ant-test", profile="balanced")


@pytest.mark.asyncio
async def test_call_agent_uses_correct_model(orchestrator):
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text="test output")]
    orchestrator.client.messages.create = AsyncMock(return_value=mock_response)

    result = await orchestrator.call_agent("business-analyst", "test data")

    assert result == "test output"
    call_kwargs = orchestrator.client.messages.create.call_args.kwargs
    assert call_kwargs["model"] == "claude-sonnet-4-6"  # balanced -> analyst tier
```

- [ ] **Step 7: Run tests**

Run: `cd backend && python -m pytest tests/test_agents.py tests/test_orchestrator.py -v`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/agents.py backend/app/orchestrator.py backend/tests/test_agents.py backend/tests/test_orchestrator.py
git commit -m "feat: add agent loader, model selection, and orchestrator core"
```

---

## Task 8: WebSocket Handlers

**Files:**
- Create: `backend/app/ws/handlers.py`
- Modify: `backend/app/main.py` (mount WebSocket routes)

- [ ] **Step 1: Create backend/app/ws/handlers.py**

```python
"""WebSocket endpoint handlers for analysis streaming."""

import asyncio
from collections import defaultdict
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

# Concurrency limit: max N analyses per user simultaneously
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


@router.websocket("/api/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    user = await authenticate_ws(websocket)
    await websocket.accept()

    # Keepalive task to prevent idle timeouts
    async def keepalive():
        while True:
            await asyncio.sleep(30)
            try:
                await websocket.send_json({"status": "keepalive"})
            except Exception:
                break

    ping_task = asyncio.create_task(keepalive())
    try:
        # Concurrency guard — blocks if user already has max analyses running
        sem = _user_semaphores[str(user.id)]
        async with sem:
            data = await websocket.receive_json()
            ticker = data.get("ticker", "")
            date_str = data.get("date")

            orch = await _get_orchestrator(user.id, user.profile)
            result = await orch.run_analyze(ticker, date_str, ws=websocket)
            report_id = await _save_report(user.id, result, "analyze")
            await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
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


@router.websocket("/api/ws/swarm")
async def ws_swarm(websocket: WebSocket):
    user = await authenticate_ws(websocket)
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        ticker = data.get("ticker", "")
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_swarm(ticker, date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "swarm")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "detail": str(e)})
        await websocket.close()


@router.websocket("/api/ws/screen")
async def ws_screen(websocket: WebSocket):
    user = await authenticate_ws(websocket)
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        tickers = data.get("tickers", [])

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_screen(tickers, ws=websocket)
        report_id = await _save_report(user.id, result, "screen")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "detail": str(e)})
        await websocket.close()


@router.websocket("/api/ws/portfolio")
async def ws_portfolio(websocket: WebSocket):
    user = await authenticate_ws(websocket)
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        tickers = data.get("tickers", [])
        capital = data.get("capital", 10000)
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_portfolio(tickers, capital, date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "portfolio")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "detail": str(e)})
        await websocket.close()


@router.websocket("/api/ws/macro")
async def ws_macro(websocket: WebSocket):
    user = await authenticate_ws(websocket)
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        date_str = data.get("date")

        orch = await _get_orchestrator(user.id, user.profile)
        result = await orch.run_macro(date_str, ws=websocket)
        report_id = await _save_report(user.id, result, "macro")
        await websocket.send_json({"status": "done", "report_id": report_id, "report": result})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "detail": str(e)})
        await websocket.close()
```

- [ ] **Step 2: Mount WebSocket router in main.py**

Add to `backend/app/main.py`:

```python
from app.ws.handlers import router as ws_router

app.include_router(ws_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/ws/handlers.py backend/app/main.py
git commit -m "feat: add WebSocket handlers for all analysis types"
```

---

## Task 9: Frontend Scaffolding + Auth

**Files:**
- Create: entire `frontend/` directory via `npx create-next-app`
- Create: `frontend/lib/auth.ts`, `frontend/app/api/auth/[...nextauth]/route.ts`, `frontend/middleware.ts`

- [ ] **Step 1: Create Next.js app**

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend && npm install next-auth @auth/core lucide-react react-markdown remark-gfm
```

- [ ] **Step 3: Create frontend/lib/auth.ts**

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

- [ ] **Step 4: Create frontend/app/api/auth/[...nextauth]/route.ts**

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 5: Create frontend/middleware.ts**

```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- [ ] **Step 6: Create frontend/lib/api.ts**

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function backendFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function createAnalysisWs(path: string, token: string): WebSocket {
  const wsUrl = BACKEND_URL.replace("http", "ws");
  return new WebSocket(`${wsUrl}${path}?token=${token}`);
}
```

- [ ] **Step 7: Create frontend/lib/types.ts**

```typescript
export interface WsProgress {
  wave?: number;
  agent?: string;
  status: "pending" | "running" | "completed" | "error" | "done";
  detail?: string;
  total_agents?: number;
  completed_agents?: number;
  report_id?: string;
  report?: AnalysisResult;
}

export interface AnalysisResult {
  type: string;
  ticker?: string;
  tickers?: string[];
  date: string;
  profile: string;
  disclaimer: string;
  report_text: string;
  raw_agents?: Record<string, string>;
}

export interface ReportSummary {
  id: string;
  type: string;
  ticker: string | null;
  tickers: string[] | null;
  profile_used: string | null;
  status: string;
  score: number | null;
  signal: string | null;
  created_at: string;
  completed_at: string | null;
}

export type AnalysisType = "analyze" | "swarm" | "screen" | "portfolio" | "macro";
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Next.js frontend with auth, API client, and types"
```

---

## Task 10: Frontend — Dashboard Layout + Landing Page

**Files:**
- Create: `frontend/app/page.tsx`, `frontend/app/login/page.tsx`
- Create: `frontend/app/dashboard/layout.tsx`, `frontend/app/dashboard/page.tsx`
- Create: `frontend/components/Sidebar.tsx`, `frontend/components/Disclaimer.tsx`

- [ ] **Step 1: Create landing page, login page, dashboard layout, sidebar, and disclaimer components**

These are standard React/Next.js components. Create each file following the spec:

- `app/page.tsx` — Landing with hero, features, login CTA
- `app/login/page.tsx` — OAuth buttons (Google + GitHub via NextAuth `signIn()`)
- `app/dashboard/layout.tsx` — Sidebar + header + main content area
- `app/dashboard/page.tsx` — Quick action cards + recent analyses
- `components/Sidebar.tsx` — Nav links to all dashboard pages
- `components/Disclaimer.tsx` — Yellow banner with mandatory text

- [ ] **Step 2: Commit**

```bash
git add frontend/app/ frontend/components/
git commit -m "feat: add landing page, login, dashboard layout, and sidebar"
```

---

## Task 11: Frontend — Settings Page (API Key + Profile)

**Files:**
- Create: `frontend/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings page**

- Masked API key input field with save/delete buttons
- Calls `POST /api/keys` to save, `GET /api/keys/status` to check, `DELETE /api/keys` to remove
- Profile selector (radio group: quality/balanced/budget) with cost descriptions
- Calls `PUT /api/profile` on change

- [ ] **Step 2: Commit**

```bash
git add frontend/app/dashboard/settings/
git commit -m "feat: add settings page with API key management and profile selector"
```

---

## Task 12: Frontend — WebSocket Hook + Agent Components

**Files:**
- Create: `frontend/lib/hooks/useAnalysis.ts`
- Create: `frontend/components/AgentCard.tsx`, `frontend/components/SwarmGrid.tsx`, `frontend/components/TickerInput.tsx`, `frontend/components/ReportViewer.tsx`

- [ ] **Step 1: Create useAnalysis hook**

```typescript
// frontend/lib/hooks/useAnalysis.ts
import { useCallback, useRef, useState } from "react";
import { createAnalysisWs } from "@/lib/api";
import type { AnalysisResult, WsProgress } from "@/lib/types";

export function useAnalysis(path: string, token: string) {
  const [progress, setProgress] = useState<WsProgress[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const start = useCallback((payload: Record<string, unknown>) => {
    setProgress([]);
    setResult(null);
    setError(null);
    setIsRunning(true);

    const ws = createAnalysisWs(path, token);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify(payload));

    ws.onmessage = (event) => {
      const msg: WsProgress = JSON.parse(event.data);
      if (msg.status === "done") {
        setResult(msg.report ?? null);
        setIsRunning(false);
        ws.close();
      } else if (msg.status === "error") {
        setError(msg.detail ?? "Unknown error");
        setIsRunning(false);
        ws.close();
      } else {
        setProgress((prev) => [...prev, msg]);
      }
    };

    ws.onerror = () => { setError("WebSocket connection error"); setIsRunning(false); };
    ws.onclose = () => setIsRunning(false);
  }, [path, token]);

  const cancel = useCallback(() => {
    wsRef.current?.close();
    setIsRunning(false);
  }, []);

  return { start, cancel, progress, result, error, isRunning };
}
```

- [ ] **Step 2: Create AgentCard, SwarmGrid, TickerInput, ReportViewer components**

- `AgentCard.tsx` — Card showing agent name, status icon (spinner/check/X), colored by state
- `SwarmGrid.tsx` — 3 rows (Wave 1/2/3) of AgentCards, driven by `WsProgress[]`
- `TickerInput.tsx` — Input with autocomplete dropdown for ~60 B3 tickers
- `ReportViewer.tsx` — Renders Markdown report with `react-markdown` + `remark-gfm`

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/hooks/ frontend/components/
git commit -m "feat: add useAnalysis hook and analysis UI components"
```

---

## Task 13: Frontend — Analysis Pages (Analyze, Swarm, Screen, Portfolio, Macro)

**Files:**
- Create: `frontend/app/dashboard/analyze/page.tsx`
- Create: `frontend/app/dashboard/swarm/page.tsx`
- Create: `frontend/app/dashboard/screen/page.tsx`
- Create: `frontend/app/dashboard/portfolio/page.tsx`
- Create: `frontend/app/dashboard/macro/page.tsx`

- [ ] **Step 1: Create analyze page**

- TickerInput + date picker + "Analisar" button
- useAnalysis hook connected to `/api/ws/analyze`
- Progress display + ReportViewer for result

- [ ] **Step 2: Create swarm page**

- TickerInput + "Iniciar Swarm" button
- SwarmGrid showing 12 agent cards with real-time progress
- ReportViewer for final report below

- [ ] **Step 3: Create screen page**

- Sector dropdown OR custom ticker list input
- Progress bar (X/N tickers)
- TierList component for results

- [ ] **Step 4: Create portfolio page**

- Multi-ticker input + capital input + "Montar Carteira" button
- useAnalysis hook connected to `/api/ws/portfolio`
- Allocation table + ReportViewer

- [ ] **Step 5: Create macro page**

- Date picker + "Buscar Macro" button
- useAnalysis hook connected to `/api/ws/macro`
- ReportViewer for result

- [ ] **Step 6: Commit**

```bash
git add frontend/app/dashboard/
git commit -m "feat: add all analysis pages (analyze, swarm, screen, portfolio, macro)"
```

---

## Task 14: Frontend — History + Report Viewer Pages

**Files:**
- Create: `frontend/app/dashboard/history/page.tsx`
- Create: `frontend/app/dashboard/report/[id]/page.tsx`

- [ ] **Step 1: Create history page**

- Fetches `GET /api/reports` on mount
- Table/list of past analyses with type, ticker, date, status, score, signal
- Click to navigate to `/dashboard/report/[id]`

- [ ] **Step 2: Create report detail page**

- Fetches `GET /api/reports/{id}` on mount
- Disclaimer banner at top
- ReportViewer rendering the saved report_text
- Delete button

- [ ] **Step 3: Commit**

```bash
git add frontend/app/dashboard/history/ frontend/app/dashboard/report/
git commit -m "feat: add history and report detail pages"
```

---

## Task 15: Integration Test + Final Polish

**Files:**
- Modify: `docker-compose.yml` (add backend service)
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create backend/Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Update docker-compose.yml to include backend**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: b3user
      POSTGRES_PASSWORD: b3pass
      POSTGRES_DB: b3analysis
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://b3user:b3pass@db:5432/b3analysis
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      FRONTEND_URL: http://localhost:3000
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db

volumes:
  pgdata:
```

- [ ] **Step 3: Test full stack locally**

```bash
# Terminal 1: Start DB + Backend
docker compose up -d db
cd backend && alembic upgrade head && uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend
cd frontend && npm run dev

# Terminal 3: Verify
curl http://localhost:8000/api/health
# Open http://localhost:3000
```

Expected: Health check returns ok. Landing page loads. OAuth flow works. Settings page saves API key. Analysis runs with WebSocket streaming.

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile docker-compose.yml
git commit -m "feat: add Dockerfile and complete docker-compose for local dev"
```

---

## Summary

| Task | Description | Key Files |
|---|---|---|
| 1 | Project scaffolding | backend structure, docker, dataflows copy |
| 2 | Database models + migrations | models.py, schemas.py, Alembic |
| 3 | Crypto module (API key encryption) | crypto.py + tests |
| 4 | JWT auth middleware | auth.py, ws/auth.py |
| 5 | REST API routes | routes/auth, keys, profile, reports |
| 6 | Refactor scripts | fetch_stock/macro/news return strings |
| 7 | Agent loader + orchestrator | agents.py, orchestrator.py + tests |
| 8 | WebSocket handlers | ws/handlers.py |
| 9 | Frontend scaffolding + auth | Next.js, NextAuth, middleware |
| 10 | Dashboard layout + landing | pages, sidebar, disclaimer |
| 11 | Settings page | API key + profile management |
| 12 | WebSocket hook + components | useAnalysis, AgentCard, SwarmGrid |
| 13 | Analysis pages | analyze, swarm, screen, portfolio, macro |
| 14 | History + report viewer | history, report/[id] |
| 15 | Docker + integration | Dockerfile, full stack test |
