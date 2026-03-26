# B3Analysis Web

![B3Analysis](docs/banner.png)

![Agent Swarm](https://img.shields.io/badge/Agent%20Swarm-12%20agentes-blueviolet?style=flat-square)
![SaaS](https://img.shields.io/badge/SaaS-BYOK-blue?style=flat-square)
![B3 Brasil](https://img.shields.io/badge/B3-%F0%9F%87%A7%F0%9F%87%B7-009c3b?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square)

Plataforma web de análise de ações brasileiras (B3) com **12 agentes de IA** trabalhando em paralelo. Interface moderna, streaming em tempo real, e modelo BYOK (Bring Your Own Key) — o usuário traz sua própria chave da Anthropic.

---

> **Aviso:** Os relatórios são gerados por agentes de IA para fins exclusivamente **educacionais e de estudo pessoal**. Não constituem recomendação de investimento, consultoria financeira ou análise profissional. Renda variável envolve risco de perda do capital investido.

---

## Funcionalidades

| Funcionalidade | Descrição | Agentes |
|----------------|-----------|---------|
| **Análise Rápida** | Relatório completo de uma ação (fundamentos, técnico, macro, notícias) | 3 coletores + síntese |
| **Ultra-Análise Swarm** | Comitê de investimentos com 12 agentes em 4 ondas | 3 dados + 8 analistas + 1 bear + síntese |
| **Screening B3** | Avalia dezenas de ações e classifica em tiers de qualidade | 1 por ticker + síntese |
| **Montagem de Carteira** | Carteira diversificada com alocação otimizada | Macro + N tickers + síntese |
| **Cenário Macro** | Snapshot da economia brasileira (Selic, IPCA, câmbio) | 1 coletor + síntese |
| **Histórico** | Todas as análises salvas com busca e re-visualização | — |

---

## Arquitetura

```
                        Usuário (navegador)
                              │
                        ┌─────┴─────┐
                        │  Next.js  │  Auth (NextAuth), UI, Dashboard
                        └─────┬─────┘
                              │ REST + WebSocket
                        ┌─────┴─────┐
                        │  FastAPI  │  Orchestrator, Agent Dispatch
                        └──┬──┬──┬──┘
                           │  │  │
                    ┌──────┘  │  └──────┐
                    ▼         ▼         ▼
              Claude API  PostgreSQL  Scripts Python
             (chave do   (usuários,  (yfinance, BCB,
              usuário)    histórico)  Google News)
```

### Stack

| Componente | Tecnologia |
|------------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+, SQLAlchemy async |
| Banco de dados | PostgreSQL 16 |
| Auth | NextAuth.js (OAuth Google/GitHub + email/senha) |
| Real-time | WebSocket (streaming de progresso por agente) |
| Criptografia | AES-256-GCM (chaves API criptografadas em repouso) |
| Infra local | Docker Compose |

---

## Início Rápido

### Pré-requisitos

- Docker e Docker Compose
- Python 3.10+
- Node.js 18+
- Chave da Anthropic (https://console.anthropic.com/settings/keys)

### 1. Clonar e subir o banco

```bash
git clone https://github.com/jltardim/fork-b3analysis.git
cd fork-b3analysis
docker compose up -d db
```

### 2. Configurar e iniciar o backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Gerar chaves
python3 -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

Criar `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://b3user:b3pass@localhost:5433/b3analysis
ENCRYPTION_KEY=<chave gerada acima>
FRONTEND_URL=http://localhost:3000
JWT_SECRET=<outra chave gerada>
```

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

### 3. Configurar e iniciar o frontend

```bash
cd frontend
npm install
```

Criar `frontend/.env.local`:
```
NEXTAUTH_SECRET=<mesmo valor do JWT_SECRET>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

```bash
npm run dev
```

### 4. Acessar

Abra http://localhost:3000, crie uma conta, configure sua chave API da Anthropic em **Configurações**, e comece a analisar.

---

## Swarm: Como Funciona

O `/swarm` é o recurso principal — simula um comitê de investimentos buy-side com 4 ondas:

```
/swarm WEGE3
    │
    ├─▶ ONDA 1 — Coleta de Dados (3 em paralelo)
    │   ├── fetch_stock   → OHLCV + técnicos + fundamentos (365 dias)
    │   ├── fetch_macro   → BCB: Selic, CDI, IPCA, câmbio
    │   └── fetch_news    → Google News PT-BR (30 dias)
    │
    ├─▶ ONDA 2 — 8 Analistas Especializados (em paralelo)
    │   ├── business-analyst         → moat, gestão, competição
    │   ├── financial-analyst        → lucros, margens, ROE, FCF
    │   ├── credit-analyst           → dívida, liquidez, stress test Selic
    │   ├── valuation-analyst        → 3 métodos de precificação
    │   ├── technical-analyst        → SMA, RSI, MACD, Bollinger, ADX
    │   ├── macro-correlation-analyst → impacto Selic/câmbio no setor
    │   ├── governance-analyst       → Novo Mercado, tag along, risco estatal
    │   └── news-sentiment-analyst   → sentimento de mercado, catalisadores
    │
    ├─▶ ONDA 3 — Bear Analyst (sequencial)
    │   └── bear-analyst → ataca as 3 hipóteses mais fracas, cenário pessimista
    │
    └─▶ ONDA 4 — Síntese (Portfolio Manager)
        └── synthesis → pesa bull vs bear, veredito final, gestão de risco
```

O progresso de cada agente é exibido em **tempo real** via WebSocket.

---

## Os 7 Critérios de Qualidade

Baseados na metodologia da tier list B3 do Logan. **Critérios 1-3 são eliminatórios.**

| # | Critério | Eliminatório |
|---|----------|:---:|
| 1 | **Lucros crescentes (escadinha)** — sem prejuízos recorrentes | SIM |
| 2 | **ON com liquidez (final 3)** — volume > R$10M/dia | SIM |
| 3 | **Sem IPO recente** — mínimo 5 anos de histórico | SIM |
| 4 | Novo Mercado | Parcial |
| 5 | Tag Along 100% | Parcial |
| 6 | Dívida controlada — D/EBITDA < 2x | Parcial |
| 7 | Retorno esperado > CDI (~14,75% a.a.) | Parcial |

**Score:** 6-7 = Compra forte | 4-5 = Bom | 3 = OK | 0-2 = Evitar

---

## Perfis de Análise

Controla o equilíbrio custo/qualidade. Configurável em **Configurações** no app.

| Perfil | Síntese | Analistas | Macro | Custo Swarm |
|--------|---------|-----------|-------|-------------|
| **Quality** | Claude Opus | Claude Opus | Claude Sonnet | ~$2.00 |
| **Balanced** | Claude Sonnet | Claude Sonnet | Claude Haiku | ~$0.50 |
| **Budget** | Claude Sonnet | Claude Haiku | Claude Haiku | ~$0.15 |

---

## Modelo de Negócio

**BYOK (Bring Your Own Key)** — o usuário fornece sua própria chave da Anthropic.

- Custo zero de inferência para o operador da plataforma
- Receita via assinatura mensal pelo acesso à plataforma
- Chave API criptografada com AES-256-GCM em repouso
- Usuário paga a Anthropic diretamente pelo uso de IA

---

## Fontes de Dados

Todos os dados vêm de fontes públicas — sem API keys externas necessárias.

| Fonte | Dados | Auth |
|-------|-------|------|
| [Yahoo Finance](https://finance.yahoo.com) via `yfinance` | OHLCV, fundamentos, DRE, balanço, fluxo de caixa | Nenhuma |
| [BCB API](https://dadosabertos.bcb.gov.br) | Selic, CDI, IPCA, IGP-M, câmbio | Nenhuma |
| [Google News RSS](https://news.google.com) | Notícias financeiras PT-BR | Nenhuma |

---

## Estrutura do Projeto

```
fork-b3analysis/
├── backend/                    ← FastAPI
│   ├── app/
│   │   ├── main.py            ← App + routers
│   │   ├── orchestrator.py    ← Orquestração de agentes (core)
│   │   ├── agents.py          ← Loader de prompts + seleção de modelo
│   │   ├── agents/*.md        ← Prompts dos 12 agentes + síntese
│   │   ├── auth.py            ← JWT middleware
│   │   ├── crypto.py          ← AES-256-GCM para chaves API
│   │   ├── models.py          ← SQLAlchemy ORM
│   │   ├── routes/            ← REST endpoints
│   │   └── ws/                ← WebSocket handlers
│   ├── scripts/               ← fetch_stock, fetch_macro, fetch_news
│   ├── dataflows/             ← yfinance, BCB, Google News
│   └── tests/
├── frontend/                   ← Next.js
│   ├── app/
│   │   ├── dashboard/         ← Todas as páginas do app
│   │   ├── login/             ← Login (email/senha + OAuth)
│   │   └── api/auth/          ← NextAuth route
│   ├── components/            ← AgentCard, SwarmGrid, TickerInput, etc.
│   └── lib/                   ← API client, hooks, types
├── docker-compose.yml          ← PostgreSQL + backend
├── MANUAL_USUARIO.md           ← Guia completo do usuário
└── ESPINHA_DORSAL.md           ← Documentação técnica do projeto original
```

---

## Segurança

- Chaves API criptografadas em repouso (AES-256-GCM, nonce único por operação)
- JWT para autenticação REST e WebSocket
- Senhas hashadas com PBKDF2-SHA256
- CORS restrito ao domínio do frontend
- Limite de 2 análises simultâneas por usuário
- Validação de input em todos os endpoints
- Chaves nunca expostas em logs ou mensagens de erro

---

## Documentação

- **[Manual do Usuário](MANUAL_USUARIO.md)** — Guia completo com boas práticas, fluxo recomendado, e referência de custos
- **[Espinha Dorsal](ESPINHA_DORSAL.md)** — Documentação técnica do projeto original (CLI)

---

## Referências

- **[TradingAgents](https://github.com/TauricResearch/TradingAgents)** — Arquitetura multi-agente para análise financeira
- **[Investimentos em Evidência](https://www.youtube.com/@investimentosemevidencia)** — Canal do Logan, fonte da metodologia de qualidade B3
