# ESPINHA DORSAL — B3Analysis

> Documento de referencia completo do projeto. Funciona como indice de um livro: consulte aqui para saber exatamente onde ir em cada parte do codigo.

---

## 1. VISAO GERAL DO PROJETO

**O que e:** Sistema de analise de acoes brasileiras (B3) usando **agent swarm** — equipes de agentes IA especializados que trabalham em paralelo no Claude Code.

**Objetivo:** Aplicar a metodologia de qualidade do Logan (@investimentosemevidencia) com 7 criterios de avaliacao, sendo 3 eliminatorios, usando dados publicos (sem API keys).

**Linguagem dos relatorios:** Portugues (Brasil). Codigo e documentacao tecnica em ingles.

**Disclaimer obrigatorio em todo relatorio:**
> Este relatorio e gerado por agentes de IA para fins exclusivamente educacionais e de estudo pessoal. Nao constitui recomendacao de investimento.

---

## 2. ESTRUTURA DE DIRETORIOS

```
fork-b3analysis/
|
|-- CLAUDE.md                  <- Guia principal para o Claude Code
|-- README.md                  <- Documentacao publica do projeto
|-- ESPINHA_DORSAL.md          <- ESTE DOCUMENTO (indice de referencia)
|-- requirements.txt           <- Dependencias Python (yfinance, stockstats, pandas, requests)
|-- run.sh                     <- Runner Python com venv automatico
|-- setup.sh                   <- Setup manual alternativo do venv
|-- .b3profile                 <- Perfil ativo (quality/balanced/budget) [gitignored]
|-- .gitignore                 <- Ignora .venv, __pycache__, data_cache, .b3profile
|
|-- .claude/
|   |-- settings.json          <- Modelo ativo + permissoes + hooks
|   |-- agents/                <- 12 agentes registrados (3 tiers)
|   |   |-- stock-analyst.md
|   |   |-- macro-analyst.md
|   |   |-- news-analyst.md
|   |   |-- business-analyst.md
|   |   |-- financial-analyst.md
|   |   |-- credit-analyst.md
|   |   |-- valuation-analyst.md
|   |   |-- technical-analyst.md
|   |   |-- macro-correlation-analyst.md
|   |   |-- governance-analyst.md
|   |   |-- news-sentiment-analyst.md
|   |   |-- bear-analyst.md
|   |-- commands/b3/           <- 6 slash commands
|   |   |-- swarm.md
|   |   |-- analyze.md
|   |   |-- screen.md
|   |   |-- portfolio.md
|   |   |-- macro.md
|   |   |-- profile.md
|   |-- hooks/                 <- 2 hooks (validacao + deteccao de erros)
|   |   |-- validate_run_args.sh
|   |   |-- detect_errors.sh
|   |-- skills/b3-analysis/    <- Skill de dominio
|       |-- SKILL.md
|
|-- scripts/                   <- Scripts CLI de coleta de dados
|   |-- fetch_stock.py
|   |-- fetch_macro.py
|   |-- fetch_news.py
|
|-- dataflows/                 <- Modulos Python de integracao com fontes de dados
|   |-- __init__.py
|   |-- y_finance.py
|   |-- bcb_data.py
|   |-- google_news_br.py
|   |-- stockstats_utils.py
|   |-- config.py
|   |-- data_cache/            <- Cache local de CSVs [gitignored]
```

---

## 3. FONTES DE DADOS (SEM API KEY)

| Fonte | Modulo | O que fornece |
|---|---|---|
| Yahoo Finance (yfinance) | `dataflows/y_finance.py` | OHLCV, fundamentos, DRE, balanco, fluxo de caixa |
| BCB API publica | `dataflows/bcb_data.py` | Selic, CDI, IPCA, IGP-M, BRL/USD, divida/PIB |
| Google News RSS | `dataflows/google_news_br.py` | Noticias financeiras PT-BR por ticker e setor |
| stockstats | `dataflows/stockstats_utils.py` | RSI, MACD, Bollinger, SMA, ADX, ATR (calculados) |

---

## 4. SCRIPTS DE COLETA (pasta `scripts/`)

### 4.1 fetch_stock.py
- **Arquivo:** `scripts/fetch_stock.py`
- **Uso:** `bash run.sh scripts/fetch_stock.py WEGE3.SA 2026-03-24`
- **Args:** TICKER (obrigatorio), DATE (opcional, default=hoje)
- **Output:** OHLCV 365 dias + indicadores tecnicos (SMA, EMA, MACD, RSI, Bollinger, ATR, ADX) + fundamentos + DRE trimestral + balanco trimestral + fluxo de caixa trimestral
- **Depende de:** `dataflows/y_finance.py`, `dataflows/stockstats_utils.py`
- **Lookback tecnico:** 90 dias

### 4.2 fetch_macro.py
- **Arquivo:** `scripts/fetch_macro.py`
- **Uso:** `bash run.sh scripts/fetch_macro.py 2026-03-24`
- **Args:** DATE (opcional, default=hoje)
- **Output:** Indicadores BCB (Selic, CDI, IPCA, IGP-M, cambio) + historico Selic/Copom + noticias macro PT-BR
- **Depende de:** `dataflows/bcb_data.py`, `dataflows/google_news_br.py`

### 4.3 fetch_news.py
- **Arquivo:** `scripts/fetch_news.py`
- **Uso:** `bash run.sh scripts/fetch_news.py WEGE3.SA 2026-03-24 14`
- **Args:** TICKER (obrigatorio), DATE (opcional), LOOKBACK_DAYS (opcional, default=21)
- **Output:** Noticias por ticker + noticias por setor (se mapeado)
- **Depende de:** `dataflows/google_news_br.py`
- **Mapeamento de setores:** industrial, varejo, saude, energia, financeiro, etc.

---

## 5. DATAFLOWS — MODULOS DE INTEGRACAO (pasta `dataflows/`)

### 5.1 y_finance.py
- **Arquivo:** `dataflows/y_finance.py`
- **Funcoes principais:**
  - `get_YFin_data_online(ticker, start, end)` -> OHLCV DataFrame
  - `get_stock_stats_indicators_window(ticker, date, lookback, indicators)` -> indicadores tecnicos
  - `get_fundamentals(ticker)` -> dict com Market Cap, PE, Beta, DY, ROE, D/E, etc.
  - `get_balance_sheet(ticker, freq)` -> balanco patrimonial
  - `get_cashflow(ticker, freq)` -> fluxo de caixa
  - `get_income_statement(ticker, freq)` -> DRE
  - `get_insider_transactions(ticker)` -> transacoes de insiders
- **Cache:** usa `dataflows/data_cache/` via config.py

### 5.2 bcb_data.py
- **Arquivo:** `dataflows/bcb_data.py`
- **Funcoes principais:**
  - `get_bcb_macro_indicators()` -> relatorio formatado (Selic, CDI, IPCA, IGP-M, cambio, fiscal)
  - `get_bcb_selic_history()` -> historico de decisoes do Copom
- **Series BCB usadas:** 432 (Selic), 4389 (CDI), 433 (IPCA), 189 (IGP-M), 1 (BRL/USD), 4536 (divida/PIB)
- **API:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados`

### 5.3 google_news_br.py
- **Arquivo:** `dataflows/google_news_br.py`
- **Funcoes principais:**
  - `get_news_google_br(ticker, ref_date, lookback)` -> noticias por ticker
  - `get_macro_news_br(ref_date, lookback)` -> noticias macroeconomicas
  - `get_sector_news_br(sector, ref_date, lookback)` -> noticias por setor
- **Setores mapeados:** energia, financeiro, commodities, varejo, imobiliario, saude, tecnologia, saneamento
- **Mapeamento ticker->empresa:** WEGE3->WEG, ITUB3->Itau, VALE3->Vale, etc.

### 5.4 stockstats_utils.py
- **Arquivo:** `dataflows/stockstats_utils.py`
- **Funcoes principais:**
  - `yf_retry(func, *args)` -> wrapper com retry exponencial para rate limits
  - `StockstatsUtils.get_stock_stats(ticker, date, indicator_list)` -> valores dos indicadores
- **Indicadores suportados:** close_50_sma, close_200_sma, close_50_ema, rsi_14, macd, macds, macdh, boll_ub, boll_lb, atr_14, adx, etc.

### 5.5 config.py
- **Arquivo:** `dataflows/config.py`
- **Funcao:** `get_config()` -> dict com `data_cache_dir` (caminho para `dataflows/data_cache/`)

---

## 6. ARQUITETURA DE AGENTES (12 agentes, 3 tiers)

### TIER 1 — Agentes de Dados (Wave 1, paralelo)
Coletam dados brutos via scripts. Tem acesso a ferramenta Bash.

| Agente | Arquivo | Funcao | Script que executa |
|---|---|---|---|
| stock-analyst | `.claude/agents/stock-analyst.md` | OHLCV + tecnicos + fundamentos | `fetch_stock.py` |
| macro-analyst | `.claude/agents/macro-analyst.md` | Indicadores BCB + noticias macro | `fetch_macro.py` |
| news-analyst | `.claude/agents/news-analyst.md` | Noticias PT-BR por ticker | `fetch_news.py` |

### TIER 2 — Analistas Especialistas (Wave 2, paralelo)
Recebem dados brutos via prompt. NAO usam ferramentas — apenas raciocinam.

| Agente | Arquivo | Mandato | Criterios que avalia |
|---|---|---|---|
| business-analyst | `.claude/agents/business-analyst.md` | Moat, gestao, dinamicas do setor, posicionamento | Qualitativo |
| financial-analyst | `.claude/agents/financial-analyst.md` | Escadinha de lucros, margens, ROE, FCF | Crit. 1 e 3 (eliminatorios) |
| credit-analyst | `.claude/agents/credit-analyst.md` | D/EBITDA, liquidez, stress test Selic | Crit. 6 |
| valuation-analyst | `.claude/agents/valuation-analyst.md` | 3 metodos: E/P vs CDI, multiplos, FCF/DDM | Crit. 7 |
| technical-analyst | `.claude/agents/technical-analyst.md` | SMA/RSI/MACD/Bollinger/ADX, zona de entrada | Tecnico |
| macro-correlation-analyst | `.claude/agents/macro-correlation-analyst.md` | Impacto Selic/BRL/IPCA no setor especifico | Macro setorial |
| governance-analyst | `.claude/agents/governance-analyst.md` | ON/liquidez, Novo Mercado, tag along, risco estatal | Crit. 2 (eliminatorio), 4, 5 |
| news-sentiment-analyst | `.claude/agents/news-sentiment-analyst.md` | Score sentimento -5 a +5, catalisadores | Noticias |

### TIER 3 — Devil's Advocate (Wave 3, sequencial)
Recebe TODOS os outputs do Tier 2. Desafia a tese bull.

| Agente | Arquivo | Funcao |
|---|---|---|
| bear-analyst | `.claude/agents/bear-analyst.md` | Ataca 3 hipoteses fracas, propoe cenario bear, calcula fragilidade |

### Sintese Final
A sessao principal (portfolio manager) pesa bull vs bear, verifica criterios eliminatorios, produz veredicto final.

---

## 7. COMANDOS SLASH (pasta `.claude/commands/b3/`)

### 7.1 /b3:swarm — Ultra-analise (flagship)
- **Arquivo:** `.claude/commands/b3/swarm.md`
- **Agentes:** 11 (3 dados + 7 analistas + 1 bear)
- **Fluxo:** Wave 1 (dados paralelo) -> Wave 2 (analise paralelo) -> Wave 3 (bear sequencial) -> Sintese
- **Output:** Painel completo com scores de cada agente, criterios eliminatorios, bear case, preco-alvo range, veredicto, gestao de risco
- **Uso:** `/b3:swarm WEGE3.SA`

### 7.2 /b3:analyze — Analise completa (3 agentes)
- **Arquivo:** `.claude/commands/b3/analyze.md`
- **Agentes:** 3 (stock + macro + news)
- **Fluxo:** 3 agentes paralelo -> Sintese com checklist 7 criterios
- **Output:** Resumo executivo, checklist, tecnica, fundamentos, macro, noticias, preco-alvo
- **Uso:** `/b3:analyze WEGE3.SA [2026-03-24]`

### 7.3 /b3:screen — Screening do universo B3
- **Arquivo:** `.claude/commands/b3/screen.md`
- **Agentes:** 1 stock-analyst por ticker (~60 no universo completo)
- **Fluxo:** Coleta paralela -> Aplicacao dos 7 criterios -> Tier list rankeada
- **Output:** Tabelas por tier (Elite, Bom, OK, Evitar)
- **Uso:** `/b3:screen` ou `/b3:screen --setor bancos` ou `/b3:screen WEGE3 ITUB3`

### 7.4 /b3:portfolio — Carteira diversificada
- **Arquivo:** `.claude/commands/b3/portfolio.md`
- **Agentes:** 1 macro + 1 por ticker
- **Fluxo:** Coleta paralela -> Scoring individual -> Alocacao por conviction
- **Output:** Tabela de alocacao com %, valor R$, justificativa
- **Uso:** `/b3:portfolio WEGE3,ITUB3,RADL3 10000`

### 7.5 /b3:macro — Snapshot macroeconomico
- **Arquivo:** `.claude/commands/b3/macro.md`
- **Agentes:** nenhum subagente (executa direto)
- **Fluxo:** fetch_macro.py -> Relatorio formatado
- **Output:** Painel de indicadores, ciclo de juros, inflacao, cambio, ambiente para RV
- **Uso:** `/b3:macro`

### 7.6 /b3:profile — Perfil de modelos
- **Arquivo:** `.claude/commands/b3/profile.md`
- **Funcao:** Altera modelo usado por tipo de agente
- **Arquivos afetados:** `.b3profile` + `.claude/settings.json`
- **Uso:** `/b3:profile quality` ou `/b3:profile balanced` ou `/b3:profile budget`

---

## 8. PERFIS DE ANALISE

| Perfil | Sintese (sessao principal) | Agentes ticker | Agente macro | Quando usar |
|---|---|---|---|---|
| `quality` | claude-opus-4-6 | claude-opus-4-6 | claude-sonnet-4-6 | Decisao real de investimento |
| `balanced` | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-haiku-4-5 | Padrao — bom equilibrio |
| `budget` | claude-sonnet-4-6 | claude-haiku-4-5 | claude-haiku-4-5 | Screening rapido |

**Estado do perfil:** 2 arquivos devem estar em sincronia:
- `.b3profile` -> nome do perfil
- `.claude/settings.json` -> `{ "model": "..." }`

---

## 9. METODOLOGIA — 7 CRITERIOS DO LOGAN

| # | Criterio | Eliminatorio | Como avaliar |
|---|---|---|---|
| 1 | Lucros crescentes (escadinha) | SIM | DRE historico — padrao de escada sem prejuizos |
| 2 | ON com liquidez (final 3, vol >R$10M/dia) | SIM | Ticker + volume OHLCV |
| 3 | Sem IPO recente (5+ anos historico) | SIM | Data de listagem + anos de lucro |
| 4 | Novo Mercado | Parcial | Segmento de listagem |
| 5 | Tag Along 100% | Parcial | Protecao ao minoritario |
| 6 | Divida controlada (D/EBITDA <2x ou caixa liquido) | Parcial | totalDebt / ebitda |
| 7 | Retorno esperado > CDI (~14,75% a.a.) | Parcial | Earnings Yield = 1/P/L vs CDI |

**Scoring:** 6-7 = Strong Buy | 5 = Buy | 4 = Hold | 0-3 = Avoid

**Red flags:** ticker 4/11 sem ON liquida | controlador so em ON | tag along <100% | interferencia estatal | D/EBITDA >3x

---

## 10. HOOKS (pasta `.claude/hooks/`)

### 10.1 validate_run_args.sh (PreToolUse)
- **Arquivo:** `.claude/hooks/validate_run_args.sh`
- **Quando:** Antes de qualquer chamada Bash com `run.sh`
- **Valida:** Formato do ticker (4 letras + 1-2 digitos + .SA opcional) e data (YYYY-MM-DD)
- **Exit 2:** Bloqueia execucao se invalido
- **Exit 0:** Permite execucao

### 10.2 detect_errors.sh (PostToolUse)
- **Arquivo:** `.claude/hooks/detect_errors.sh`
- **Quando:** Depois de qualquer chamada Bash com `run.sh`
- **Detecta:** Python Traceback, linhas "Error:", falhas BCB API
- **Saida:** Avisos no stderr (nunca bloqueia, sempre exit 0)

---

## 11. SKILL DE DOMINIO

### b3-analysis (SKILL.md)
- **Arquivo:** `.claude/skills/b3-analysis/SKILL.md`
- **Conteudo:**
  - Checklist completo dos 7 criterios com instrucoes de avaliacao
  - Tabela de interpretacao de indicadores tecnicos (sinais bull/bear)
  - Framework de impacto macro por setor (banking, utilities, retail, etc.)
  - Lista de red flags
  - Regras de output (idioma, disclaimer, comparacao CDI)
  - **Universo B3 completo (~60 tickers)** organizado por setor
  - Gotchas importantes (D/EBITDA vs D/E, P/L yfinance, CDI anualizado)

---

## 12. CONFIGURACAO (settings.json)

- **Arquivo:** `.claude/settings.json`
- **Modelo padrao:** `claude-sonnet-4-6` (perfil balanced)
- **Permissoes auto-aprovadas:**
  - `Bash(bash run.sh *)` — execucao de scripts
  - `Bash(cat .b3profile*)` — leitura do perfil
  - `Bash(echo * > .b3profile)` — escrita do perfil
- **Hooks configurados:**
  - PreToolUse (Bash) -> `validate_run_args.sh`
  - PostToolUse (Bash) -> `detect_errors.sh`

---

## 13. DEPENDENCIAS

```
yfinance==1.2.0          # Yahoo Finance - dados de acoes
stockstats==0.6.8        # Indicadores tecnicos
pandas==3.0.1            # Manipulacao de dados
requests==2.32.5         # HTTP para BCB API
python-dateutil==2.9.0   # Parsing de datas
```

**Python:** 3.10+
**Venv:** Criado automaticamente pelo `run.sh` na primeira execucao

---

## 14. CONTEXTO MACROECONOMICO (ref. marco 2026)

- **Selic meta:** ~14,75% a.a. (ciclo de alta 2025-2026)
- **CDI:** ~Selic - 0,10% -> benchmark minimo para renda variavel
- **Alta Selic favorece:** seguradoras, exportadoras
- **Alta Selic prejudica:** varejo, utilities, tech/growth
- **BRL fraco:** favorece exportadoras, prejudica importadoras e endividados em USD

---

## 15. FLUXO RECOMENDADO DE USO

```
/b3:screen                       <- Descobrir melhores acoes (tier list)
    |
    v
/b3:analyze TICKER               <- Aprofundar em candidatos Elite/Bom
    |
    v
/b3:swarm TICKER                 <- Ultra-analise buy-side (11 agentes)
    |
    v
/b3:portfolio TICKERS CAPITAL    <- Montar carteira otimizada
```

---

## 16. MAPA RAPIDO — "ONDE MEXER PARA..."

| Objetivo | Arquivo(s) |
|---|---|
| Adicionar nova fonte de dados | `dataflows/` (novo modulo) + `scripts/` (novo fetch) |
| Adicionar novo indicador tecnico | `dataflows/stockstats_utils.py` + `dataflows/y_finance.py` |
| Mudar criterios de avaliacao | `.claude/skills/b3-analysis/SKILL.md` + `CLAUDE.md` |
| Adicionar novo agente ao swarm | `.claude/agents/` (novo .md) + `.claude/commands/b3/swarm.md` |
| Adicionar novo comando slash | `.claude/commands/b3/` (novo .md) + `CLAUDE.md` |
| Mudar universo de screening | `.claude/skills/b3-analysis/SKILL.md` (secao Universo B3) |
| Mudar modelos por perfil | `.claude/commands/b3/profile.md` + `CLAUDE.md` |
| Adicionar validacao de input | `.claude/hooks/validate_run_args.sh` |
| Adicionar deteccao de erro | `.claude/hooks/detect_errors.sh` |
| Mudar dependencias Python | `requirements.txt` |
| Mudar disclaimer dos relatorios | `CLAUDE.md` (secao Report language) |
| Adicionar novo setor ao mapeamento de noticias | `dataflows/google_news_br.py` |
| Mudar cache de dados | `dataflows/config.py` |
| Adicionar ticker ao universo padrao | `.claude/skills/b3-analysis/SKILL.md` (secao Universo B3) |

---

## 17. GOTCHAS E ARMADILHAS

1. **D/EBITDA vs D/E:** yfinance retorna `debtToEquity` (divida/patrimonio). Para D/EBITDA real, usar `totalDebt / ebitda` dos fundamentos.
2. **P/L yfinance:** Trailing PE usa ajustes US GAAP — cruzar com DRE do `fetch_stock.py`.
3. **CDI no BCB:** Vem mensal — `fetch_macro.py` anualiza, mas verificar logica ao citar.
4. **Google News RSS:** Sem paginacao — janelas longas com poucos artigos = gap de dados, nao erro.
5. **Score <= 2:** Excluir da carteira SEMPRE, independente do ambiente macro.
6. **Criterio 2:** Verificar TANTO o sufixo do ticker (final 3) QUANTO volume >R$10M/dia.
7. **Agentes Tier 2:** NAO tem acesso a ferramentas — recebem dados via prompt.
8. **Agentes Tier 1:** TEM acesso a Bash para executar scripts.
9. **Bear analyst:** Roda DEPOIS de todos os Tier 2 — precisa dos outputs deles.

---

*Documento gerado em 2026-03-25. Atualizar conforme o projeto evolui.*
