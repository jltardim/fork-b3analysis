# B3Analysis Web — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Author:** Brainstorming session

---

## 1. Overview

Transform the B3Analysis CLI (multi-agent stock analysis system for Brazilian B3 exchange) into a **SaaS web application** with a BYOK (Bring Your Own Key) model. Users sign in via OAuth, provide their own Claude API key, and run the full suite of analysis tools through a modern web interface.

### Business Model
- **BYOK SaaS**: Users provide their own Anthropic API key
- **Revenue**: Monthly subscription for platform access (analysis execution, history, UI)
- **Zero inference cost** for the platform operator — users pay Anthropic directly

### Core Value Proposition
- Professional-grade B3 stock analysis powered by 12 AI agents
- Real-time visualization of agent swarm progress
- Persistent history of all analyses
- No CLI knowledge required

---

## 2. Architecture

```
                            USER (browser)
                                  |
                            [Next.js App]
                            /     |     \
                     Auth    Dashboard   Analyses
                   (NextAuth)  (SSR)   (WebSocket)
                                  |
                            [FastAPI Backend]
                           /      |       \
                    Claude API  Python    PostgreSQL
                    (per-user   Scripts   (users, keys,
                     API key)  (existing)  history)
```

### Stack

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | UI, auth, dashboard, report rendering |
| Backend | FastAPI (Python 3.10+) | Agent orchestration, script execution, Claude API calls |
| Auth | NextAuth.js | OAuth Google/GitHub, JWT sessions |
| Database | PostgreSQL | Users, encrypted API keys, analysis history |
| Real-time | WebSocket | Streaming agent progress to frontend |
| Cache | Redis (Phase 2, optional) | Market data caching |

### Communication Flow (Swarm Example)

1. User clicks "Swarm Analysis", enters ticker (e.g., `WEGE3`)
2. Frontend opens WebSocket to backend
3. Backend decrypts user's API key from database
4. **Wave 1**: Backend runs `fetch_stock.py`, `fetch_macro.py`, `fetch_news.py` in parallel. Sends progress via WebSocket.
5. **Wave 2**: Backend sends 8 parallel Claude API calls (one per analyst agent: business, financial, credit, valuation, technical, macro-correlation, governance, news-sentiment), each with the agent's `.md` prompt + raw data. Streams progress per agent.
6. **Wave 3**: Backend sends bear-analyst call with all Wave 2 outputs.
7. **Synthesis**: Backend sends final Claude call to synthesize.
8. Result saved to PostgreSQL + sent to frontend in real-time.

---

## 3. Frontend Design (Next.js)

### Pages

```
/                        -> Landing page (marketing + login)
/login                   -> OAuth Google/GitHub
/dashboard               -> Main dashboard post-login
/dashboard/settings      -> Configure API key + profile
/dashboard/analyze       -> Single ticker analysis (3 agents)
/dashboard/swarm         -> Ultra-analysis with 12 agents (3+8+1)
/dashboard/screen        -> B3 universe screening
/dashboard/portfolio     -> Portfolio builder
/dashboard/macro         -> Macroeconomic snapshot
/dashboard/history       -> Past analyses
/dashboard/report/[id]   -> View saved report
```

### Dashboard (`/dashboard`)
- **Header**: Logo + user name + active profile badge (quality/balanced/budget)
- **Sidebar**: Navigation between features (Analyze, Swarm, Screen, Portfolio, Macro, History)
- **Main area**: Quick-access cards + recent analyses
- **Quick action bar**: Ticker input with autocomplete for ~60 B3 universe tickers

### Swarm Page (`/dashboard/swarm`)
- Ticker input at top
- **Progress panel**: Visual grid showing 12 agents as cards (3 data + 8 analysts + 1 bear)
  - Each card: agent name + status (pending/running/completed/error) + icon
  - Real-time animation as each agent completes
  - Organized by wave (Wave 1 | Wave 2 | Wave 3)
- **Final report**: Rendered below in formatted Markdown with tables, scores
- "Export PDF" and "Save to history" buttons

### Screening Page (`/dashboard/screen`)
- Filters: sector dropdown or custom ticker list
- "Run Screening" button
- Progress bar: X/60 tickers analyzed
- Result: **Visual tier list** with colored cards (Elite=gold, Good=green, OK=yellow, Avoid=red)
- Each card: ticker, score, 7-criteria checklist with icons

### Analyze Page (`/dashboard/analyze`)
- Ticker + date input
- Formatted report with collapsible sections (Summary, Checklist, Technical, Fundamentals, Macro, News, Price Target)
- Charts: candlestick with technical indicators overlay (SMA, Bollinger)

### Portfolio Page (`/dashboard/portfolio`)
- Input: ticker list + available capital
- Output: allocation table + pie chart by sector
- Per-ticker cards with score and justification

### Settings Page (`/dashboard/settings`)
- API key field (masked, encrypted on backend)
- Profile selector (quality/balanced/budget) with cost explanation
- Cost estimate per analysis type

---

## 4. Backend Design (FastAPI)

### API Endpoints

```
Auth
POST   /api/auth/verify          -> Validate NextAuth JWT

API Key Management
POST   /api/keys                 -> Save encrypted API key
GET    /api/keys/status          -> Check if key exists and is valid
DELETE /api/keys                 -> Remove key

Analyses (all via WebSocket for streaming)
WS     /api/ws/analyze           -> Single analysis (3 agents)
WS     /api/ws/swarm             -> Ultra-analysis (12 agents: 3+8+1)
WS     /api/ws/screen            -> Screening (1 agent per ticker)
WS     /api/ws/portfolio         -> Portfolio (1 macro + N tickers)
WS     /api/ws/macro             -> Macro snapshot

History
GET    /api/reports              -> List user's reports
GET    /api/reports/{id}         -> Get specific report
DELETE /api/reports/{id}         -> Delete report

Profile
GET    /api/profile              -> Active profile
PUT    /api/profile              -> Change profile
```

### Agent Orchestrator (Core)

The orchestrator replaces Claude Code's internal agent dispatch with direct Claude API calls:

```python
class AgentOrchestrator:
    def __init__(self, api_key: str, profile: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)  # Async client for await
        self.profile = profile

    # Model mapping per profile, matching original project's per-tier granularity
    MODEL_MAP = {
        "quality":  {"synthesis": "claude-opus-4-6",   "analyst": "claude-opus-4-6",   "macro": "claude-sonnet-4-6"},
        "balanced": {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-sonnet-4-6",  "macro": "claude-haiku-4-5"},
        "budget":   {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-haiku-4-5",   "macro": "claude-haiku-4-5"},
    }

    async def run_swarm(self, ticker: str, ws: WebSocket):
        # Wave 1 — data collection (parallel, local Python — no AI)
        raw_stock, raw_macro, raw_news = await asyncio.gather(
            self.run_script("fetch_stock.py", ticker),
            self.run_script("fetch_macro.py"),
            self.run_script("fetch_news.py", ticker),
        )
        await ws.send_json({"wave": 1, "status": "complete"})

        # Wave 2 — 8 analyst agents (parallel Claude API calls)
        analysts = await asyncio.gather(
            self.call_agent("business-analyst", raw_stock, raw_macro, raw_news),
            self.call_agent("financial-analyst", ...),
            self.call_agent("credit-analyst", ...),
            self.call_agent("valuation-analyst", ...),
            self.call_agent("technical-analyst", ...),
            self.call_agent("macro-correlation-analyst", ...),
            self.call_agent("governance-analyst", ...),
            self.call_agent("news-sentiment-analyst", ...),
        )
        await ws.send_json({"wave": 2, "status": "complete"})

        # Wave 3 — bear analyst (sequential, receives all Wave 2 outputs)
        bear = await self.call_agent("bear-analyst", *analysts)

        # Synthesis (uses synthesis-tier model)
        report = await self.call_agent("synthesis", *analysts, bear)
        return report

    async def call_agent(self, agent_name: str, *data):
        prompt = load_agent_prompt(f"agents/{agent_name}.md")
        response = await self.client.messages.create(
            model=self.get_model(agent_name),
            messages=[{"role": "user", "content": prompt + "\n\n" + format_data(*data)}],
        )
        return response.content[0].text

    def get_model(self, agent_name: str) -> str:
        tier = "synthesis" if agent_name == "synthesis" else \
               "macro" if agent_name in ("macro-analyst", "macro-correlation-analyst") else \
               "analyst"
        return self.MODEL_MAP[self.profile][tier]
```

### API Key Security
- Encrypted with **AES-256-GCM** in PostgreSQL. Stored as `nonce(12B) || ciphertext || tag(16B)` in the BYTEA column — unique nonce per encryption operation.
- Encryption key stored in environment variable (`ENCRYPTION_KEY`)
- Key never exposed in UI (masked: `sk-ant-...****`)
- Decrypted only in memory during analysis execution
- Rate limiting per user to prevent abuse
- **Key validated at save time** (`POST /api/keys`) with a minimal Claude API call for immediate feedback
- **Key rotation strategy** (Phase 2): support `ENCRYPTION_KEY_V2` env var; background job re-encrypts all keys

### WebSocket Authentication
- WebSocket connections authenticated via **token query parameter**: `ws://host/api/ws/swarm?token=<JWT>`
- JWT validated on handshake; connection rejected if invalid
- Keepalive pings every 30s to prevent idle timeout on load balancers
- **Concurrent analysis limit**: max 2 simultaneous analyses per user; additional requests queued

### Model Selection by Profile (per-tier granularity)

| Profile | Synthesis | Analysts (Tier 2) | Macro agents | Scripts |
|---|---|---|---|---|
| quality | claude-opus-4-6 | claude-opus-4-6 | claude-sonnet-4-6 | Local Python |
| balanced | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-haiku-4-5 | Local Python |
| budget | claude-sonnet-4-6 | claude-haiku-4-5 | claude-haiku-4-5 | Local Python |

---

## 5. Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    name          TEXT,
    avatar_url    TEXT,
    provider      TEXT NOT NULL,           -- google/github
    provider_id   TEXT NOT NULL,
    profile       TEXT DEFAULT 'balanced', -- quality/balanced/budget
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    encrypted_key BYTEA NOT NULL,          -- AES-256-GCM
    key_prefix    TEXT,                     -- "sk-ant-...xxxx" for display
    is_valid      BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,            -- analyze/swarm/screen/portfolio/macro
    ticker        TEXT,                     -- null for screen/macro
    tickers       TEXT[],                   -- for portfolio/screen
    profile_used  TEXT,                     -- quality/balanced/budget
    status        TEXT DEFAULT 'running',   -- running/completed/failed
    report_data   JSONB,                    -- full structured report
    raw_agents    JSONB,                    -- individual agent outputs
    score         INTEGER,                  -- final score (0-7)
    signal        TEXT,                     -- COMPRAR/MANTER/EVITAR
    created_at    TIMESTAMPTZ DEFAULT now(),
    completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX idx_reports_ticker ON reports(ticker);
```

---

## 6. Deployment

| Service | Platform | Justification |
|---|---|---|
| Frontend (Next.js) | Vercel | Automatic deploy, optimized SSR, free hobby tier |
| Backend (FastAPI) | Railway or Fly.io | Python support, WebSocket, persistent connections |
| PostgreSQL | Supabase or Neon | Managed PostgreSQL, generous free tier |
| Domain | Any registrar | e.g., `b3analysis.com.br` |

---

## 7. Project Structure

```
b3-analysis-web/
|-- frontend/                  <- Next.js app
|   |-- app/                   <- App Router pages
|   |   |-- page.tsx           <- Landing page
|   |   |-- login/
|   |   |-- dashboard/
|   |   |   |-- page.tsx       <- Main dashboard
|   |   |   |-- analyze/
|   |   |   |-- swarm/
|   |   |   |-- screen/
|   |   |   |-- portfolio/
|   |   |   |-- macro/
|   |   |   |-- history/
|   |   |   |-- settings/
|   |   |   |-- report/[id]/
|   |-- components/            <- Reusable React components
|   |   |-- AgentCard.tsx
|   |   |-- SwarmGrid.tsx
|   |   |-- TierList.tsx
|   |   |-- ReportViewer.tsx
|   |   |-- TickerInput.tsx
|   |-- lib/                   <- Utils, API client, auth config
|   |-- public/
|   |-- package.json
|
|-- backend/                   <- FastAPI app
|   |-- app/
|   |   |-- main.py            <- FastAPI app + routes
|   |   |-- orchestrator.py    <- Agent orchestration (core logic)
|   |   |-- agents/            <- Agent prompts (.md files copied from original)
|   |   |-- auth.py            <- JWT validation
|   |   |-- crypto.py          <- API key encryption/decryption
|   |   |-- db.py              <- PostgreSQL connection (SQLAlchemy async)
|   |   |-- models.py          <- SQLAlchemy + Pydantic models
|   |   |-- ws.py              <- WebSocket handlers
|   |-- dataflows/             <- Copied from original project
|   |-- scripts/               <- Copied from original project
|   |-- requirements.txt
|
|-- docker-compose.yml         <- Local dev (backend + postgres)
|-- README.md
```

---

## 8. Reuse from Original Project

| Original | Reused in Web | How |
|---|---|---|
| `dataflows/*.py` | `backend/dataflows/` | Direct copy as Python modules, imported directly (no subprocess) |
| `scripts/fetch_*.py` | `backend/scripts/` | Refactored to expose `main()` functions that return data (instead of printing to stdout). Called as module imports, not subprocess. |
| `.claude/agents/*.md` | `backend/app/agents/` | Prompts loaded as strings for Claude API |
| `.claude/skills/b3-analysis/SKILL.md` | `backend/app/agents/skill.md` | Used in synthesis prompt |
| `requirements.txt` | `backend/requirements.txt` | Extended with fastapi, anthropic, sqlalchemy, cryptography, etc. |

### Deviation from Original: Tier 1 Agent Replacement

In the original project, Tier 1 agents (`stock-analyst`, `macro-analyst`, `news-analyst`) are Claude Code agents that execute scripts AND format the output via LLM. In the web version, **Tier 1 is replaced by direct script execution** — scripts run as Python functions, and their raw output goes directly to Wave 2 analysts. This saves API costs (3 fewer LLM calls per analysis).

**Note:** Wave 2 agent prompts already accept raw data ("You will receive: TICKER, RAW_STOCK, RAW_MACRO, RAW_NEWS"), so no prompt changes are needed. The `news-sentiment-analyst` prompt also accepts raw news data directly.

---

## 9. Error Handling

- **Invalid API key**: Backend validates key on first use by calling Claude API with a minimal prompt. If 401, mark key as invalid and notify user.
- **Claude API rate limits**: Retry with exponential backoff. Notify user via WebSocket if delayed.
- **Script failures**: Catch subprocess errors, send error status via WebSocket, continue with partial data where possible.
- **WebSocket disconnection**: Save partial results to database. User can resume viewing from history.
- **yfinance/BCB failures**: Same as original project — graceful degradation with "dados insuficientes" flags.

---

## 10. Security Considerations

- API keys encrypted at rest (AES-256-GCM with unique nonce per key)
- HTTPS everywhere (enforced by Vercel + Railway)
- JWT validation on every backend request (REST via header, WebSocket via query param)
- Rate limiting per user (prevent abuse of platform)
- No API keys in logs or error messages
- CORS restricted to frontend domain only
- Input validation on all ticker/date parameters (reuse hook logic)
- Max 2 concurrent analyses per user

---

## 11. Environment Variables

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `ENCRYPTION_KEY` | Backend | AES-256 key for API key encryption (32 bytes, base64) |
| `NEXTAUTH_SECRET` | Frontend | NextAuth session signing secret |
| `NEXTAUTH_URL` | Frontend | Frontend base URL (e.g., `https://b3analysis.com.br`) |
| `GOOGLE_CLIENT_ID` | Frontend | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Frontend | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | Frontend | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Frontend | GitHub OAuth client secret |
| `BACKEND_URL` | Frontend | FastAPI backend URL for API calls |
| `FRONTEND_URL` | Backend | For CORS allowed origins |

---

## 12. Report Data Structure (JSONB)

The `report_data` column stores a structured JSON object:

```json
{
  "type": "swarm",
  "ticker": "WEGE3.SA",
  "date": "2026-03-25",
  "profile": "balanced",
  "disclaimer": "...",
  "summary": { "signal": "COMPRAR", "score": 6, "conviction": "ALTA", "thesis": "..." },
  "checklist": [
    { "criterion": 1, "label": "Escadinha de lucros", "status": "pass", "evidence": "..." },
    ...
  ],
  "agents": {
    "business-analyst": { "signal": "COMPRAR", "score": 8, "findings": "..." },
    "financial-analyst": { "signal": "COMPRAR", "score": 7, "findings": "..." },
    ...
  },
  "bear_case": { "fragility": "Baixa", "score": 3, "weak_points": [...], "scenarios": [...] },
  "valuation": { "bear_target": 42.0, "base_target": 55.0, "bull_target": 68.0 },
  "price_current": 50.5
}
```

---

## 13. Mandatory Disclaimer

All web-rendered reports must include the disclaimer from the original project:

> Este relatorio e gerado por agentes de IA para fins exclusivamente educacionais e de estudo pessoal. Nao constitui recomendacao de investimento, consultoria financeira ou analise profissional. Renda variavel envolve risco de perda do capital investido.

This is rendered as a banner at the top of every report page and included in PDF exports.

---

## 14. Testing Strategy

- **Backend unit tests**: Orchestrator logic, crypto module, model selection, input validation (pytest)
- **Backend integration tests**: Claude API mocked, full swarm flow with sample data
- **Frontend unit tests**: Component rendering, WebSocket state management (vitest + React Testing Library)
- **E2E tests**: Full flow from login to report view (Playwright, Phase 2)
- **Database**: Alembic for migrations, test database seeded per test run

---

## 15. Logging and Observability

- **Structured logging**: Python `structlog` with JSON output
- **Key events logged**: Analysis start/complete/error, agent completion times, API key validation, WebSocket connect/disconnect
- **Error tracking**: Sentry (backend + frontend) — Phase 2
- **Metrics**: Agent execution time per tier, success/failure rates — Phase 2

---

## 16. Out of Scope (Phase 2+)

- Redis caching for market data
- Email notifications / alerts
- Comparison view (side-by-side stock analysis)
- Billing/payment integration
- Admin panel
- Multi-language support (PT-BR only for MVP)
- Sentry error tracking
- Performance metrics dashboard
- API key rotation background job
- Mobile-optimized layout (sidebar should be collapsible in MVP)
