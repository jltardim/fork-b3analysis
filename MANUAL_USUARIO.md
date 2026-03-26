# B3Analysis Web — Manual do Usuário

## O que é o B3Analysis Web?

O B3Analysis Web é uma plataforma de análise de ações da B3 (Bolsa de Valores do Brasil) que utiliza **12 agentes de inteligência artificial** para produzir relatórios completos de investimento. Cada agente é especializado em uma área: negócios, financeiro, crédito, valuation, análise técnica, macro, governança, sentimento de notícias e um "advogado do diabo" que desafia a tese de investimento.

> **Aviso importante:** Os relatórios são gerados por IA para fins exclusivamente educacionais e de estudo pessoal. Não constituem recomendação de investimento, consultoria financeira ou análise profissional. Renda variável envolve risco de perda do capital investido.

---

## Primeiros Passos

### 1. Criar uma conta

Acesse a plataforma e clique em **"Começar Agora"**. Você pode entrar com:

- **Email e senha** — cadastro direto na plataforma
- **Google** — login via conta Google
- **GitHub** — login via conta GitHub

### 2. Configurar sua chave de API

Antes de rodar qualquer análise, você precisa configurar sua chave da Anthropic:

1. Acesse https://console.anthropic.com/settings/keys
2. Crie uma nova chave (formato `sk-ant-...`)
3. No app, vá em **Configurações** (menu lateral)
4. Cole a chave no campo "Chave de API Anthropic"
5. Clique em **"Salvar Chave"**

A plataforma valida a chave em tempo real. Se o indicador ficar verde, está tudo certo.

> **Segurança:** Sua chave é criptografada com AES-256-GCM antes de ser armazenada. Ela nunca é exibida em texto puro após ser salva.

### 3. Escolher um perfil de análise

Na página de **Configurações**, escolha o perfil que define a relação custo/qualidade:

| Perfil | Modelos Utilizados | Indicado para |
|--------|-------------------|---------------|
| **Quality** | Claude Opus para tudo | Decisões de investimento reais, máxima profundidade |
| **Balanced** | Claude Sonnet + Haiku | Uso diário, bom equilíbrio (padrão) |
| **Budget** | Claude Haiku para análises | Screenings em massa, estudos exploratórios |

**Dica:** Comece com **Balanced**. Use **Quality** quando for analisar uma ação que você realmente está considerando comprar.

---

## Funcionalidades

### Análise Rápida (`Analisar`)

Análise individual de uma ação com 3 fontes de dados + síntese por IA.

**Como usar:**
1. Vá em **Analisar** no menu lateral
2. Digite o ticker (ex: `WEGE3`, `ITUB3`, `VALE3`)
3. Opcionalmente escolha uma data
4. Clique em **"Analisar"**

**O que você recebe:**
- Dados fundamentalistas (lucro, receita, margens, ROE)
- Indicadores técnicos (SMA, RSI, MACD, Bollinger)
- Cenário macroeconômico atual
- Notícias recentes da empresa
- Relatório sintetizado com veredito

**Tempo médio:** 1-2 minutos | **Custo estimado:** ~$0.05 (balanced)

---

### Ultra-Análise Swarm (`Swarm`)

O recurso mais poderoso da plataforma. 12 agentes de IA trabalham em 4 ondas simulando um comitê de investimentos.

**Como usar:**
1. Vá em **Swarm** no menu lateral
2. Digite o ticker
3. Clique em **"Iniciar Swarm"**
4. Acompanhe o progresso em tempo real no grid de agentes

**As 4 ondas:**

| Onda | Agentes | O que fazem |
|------|---------|------------|
| **1 — Dados** | 3 coletores | Buscam dados de ações, macro e notícias em paralelo |
| **2 — Análise** | 8 analistas | Cada um avalia uma dimensão diferente em paralelo |
| **3 — Bear Case** | 1 advogado do diabo | Ataca os pontos fracos da tese de investimento |
| **4 — Síntese** | 1 portfolio manager | Pesa tudo e emite o veredito final |

**Os 8 analistas da Onda 2:**
- **Negócios** — moat, gestão, posição competitiva
- **Financeiro** — lucros, margens, ROE, fluxo de caixa
- **Crédito** — dívida/EBITDA, liquidez, stress test com Selic
- **Valuation** — 3 métodos de precificação, faixa de preço-alvo
- **Técnico** — SMA, RSI, MACD, Bollinger, zona de entrada
- **Macro-Correlação** — impacto da Selic/câmbio/inflação no setor
- **Governança** — Novo Mercado, tag along, risco estatal
- **Sentimento** — análise de notícias e sentimento de mercado

**Tempo médio:** 3-5 minutos | **Custo estimado:** ~$0.50 (balanced), ~$2.00 (quality)

---

### Screening B3 (`Screening`)

Avalia múltiplas ações de uma vez e classifica em tiers de qualidade.

**Como usar:**
1. Vá em **Screening** no menu lateral
2. Escolha um setor (bancos, energia, varejo, etc.) **ou** selecione tickers manualmente
3. Clique em **"Iniciar Screening"**
4. Acompanhe a barra de progresso

**Setores disponíveis:**
- Bancos (ITUB3, BBAS3, BBDC4, SANB3)
- Energia (EQTL3, EGIE3, PETR4, PETR3)
- Varejo (RENT3, LREN3, MGLU3)
- Saúde (RADL3, FLRY3, HAPV3)
- Tecnologia (TOTS3, POSI3)
- Industrial (WEGE3, TUPY3)
- Commodities (VALE3, SUZB3, KLBN3)
- Saneamento (SAPR3, SBSP3)
- Consumo (ABEV3, MDIA3)
- Financeiro (PSSA3, BBSE3, B3SA3)

**O que você recebe:**
- Score de 0-7 para cada ação baseado nos 7 critérios de qualidade
- Classificação em tiers: Elite (6-7), Bom (4-5), OK (3), Evitar (0-2)
- Checklist dos critérios para cada ação

**Dica:** Use o perfil **Budget** para screening — a qualidade é suficiente para triagem e o custo é muito menor.

---

### Montagem de Carteira (`Carteira`)

Monta uma carteira diversificada a partir de ações selecionadas.

**Como usar:**
1. Vá em **Carteira** no menu lateral
2. Adicione os tickers desejados (ex: WEGE3, ITUB3, VALE3)
3. Informe o capital disponível (ex: R$ 50.000)
4. Clique em **"Montar Carteira"**

**O que você recebe:**
- Alocação otimizada por ação (% e valor em R$)
- Diversificação setorial
- Score e justificativa para cada posição
- Considerações macro (impacto da Selic, câmbio)

**Dica:** Rode primeiro um **Screening** para selecionar as melhores ações, depois use a **Carteira** com as que passaram nos critérios.

---

### Cenário Macroeconômico (`Macro`)

Snapshot da economia brasileira e seus impactos no mercado.

**Como usar:**
1. Vá em **Macro** no menu lateral
2. Opcionalmente escolha uma data
3. Clique em **"Buscar Macro"**

**O que você recebe:**
- Indicadores BCB: Selic, CDI, IPCA, IGP-M, câmbio BRL/USD
- Histórico da meta Selic (decisões do Copom)
- Notícias macroeconômicas recentes
- Análise de impactos setoriais

**Tempo médio:** ~1 minuto | **Custo estimado:** ~$0.02 (balanced)

---

### Histórico

Todas as análises ficam salvas automaticamente. Acesse **Histórico** no menu lateral para:

- Ver todas as análises passadas
- Filtrar por tipo, ticker, data
- Reabrir qualquer relatório
- Excluir análises antigas

---

## Os 7 Critérios de Qualidade

O B3Analysis usa um framework de 7 critérios para avaliar ações. **Os 3 primeiros são eliminatórios** — se uma ação falhar em qualquer um deles, o veredito é automaticamente EVITAR.

| # | Critério | Eliminatório? | O que verifica |
|---|----------|:---:|----------------|
| 1 | **Lucros crescentes** | SIM | Histórico de lucros consistente, sem prejuízos recorrentes |
| 2 | **Ações ON líquidas** | SIM | Ticker terminando em 3, volume > R$10M/dia |
| 3 | **Sem IPO recente** | SIM | Mínimo 5 anos de histórico de lucros na B3 |
| 4 | Novo Mercado | Parcial | Listagem no segmento Novo Mercado |
| 5 | Tag Along 100% | Parcial | Proteção total aos minoritários |
| 6 | Dívida controlada | Parcial | Caixa líquido ou Dívida/EBITDA < 2x |
| 7 | Retorno > CDI | Parcial | Retorno esperado acima de ~14,75% a.a. |

**Score:** 6-7 = Compra forte | 4-5 = Bom | 3 = OK | 0-2 = Evitar

---

## Boas Práticas

### Para análises mais precisas

- **Use o perfil Quality para decisões importantes.** A diferença de qualidade entre Opus e Haiku é significativa para análises complexas.
- **Prefira o Swarm ao invés da Análise Rápida** quando estiver avaliando uma ação para compra. O bear case é essencial para evitar viés de confirmação.
- **Sempre leia o Bear Case.** O agente "advogado do diabo" existe para mostrar o que pode dar errado — não ignore.
- **Cruze com o cenário macro.** Uma ação boa no momento errado (Selic subindo para varejo, por exemplo) pode ser uma armadilha.

### Para economizar custos

- **Use Budget para screening em massa.** Haiku é suficiente para triagem inicial.
- **Use Balanced para análises individuais.** Sonnet oferece boa qualidade a custo razoável.
- **Reserve Quality para as decisões finais.** Quando estiver pronto para investir de fato.
- **Evite rodar Swarm em Quality para muitas ações.** Cada Swarm Quality custa ~$2. Faça screening com Budget primeiro, depois Swarm Quality nas 3-5 finalistas.

### Fluxo recomendado de análise

```
1. Macro     → Entender o cenário atual (Selic, câmbio, inflação)
2. Screening → Filtrar o universo B3 por qualidade (perfil Budget)
3. Swarm     → Analisar as melhores do screening (perfil Balanced ou Quality)
4. Carteira  → Montar a alocação com as aprovadas no Swarm
```

### Sinais de atenção (Red Flags)

Fique atento quando o relatório mencionar:

- **Ticker terminando em 4 ou 11** sem liquidez em ON — risco de governança
- **Controlador só com ações ON** — conflito de interesses
- **Tag Along < 100%** — minoritários desprotegidos
- **Interferência estatal** — empresas com governo como acionista relevante
- **Dívida/EBITDA > 3x** — alavancagem perigosa
- **"Dados insuficientes"** — a análise pode estar incompleta

### O que o B3Analysis NÃO faz

- Não executa ordens de compra/venda
- Não monitora sua carteira em tempo real
- Não envia alertas de preço
- Não garante retornos — é uma ferramenta educacional
- Não substitui um assessor de investimentos certificado

---

## Referência Rápida

| Ação | Onde | Tempo | Custo (Balanced) |
|------|------|-------|-----------------|
| Análise rápida de 1 ação | Analisar | 1-2 min | ~$0.05 |
| Ultra-análise com 12 agentes | Swarm | 3-5 min | ~$0.50 |
| Screening de 1 setor (~5 ações) | Screening | 2-3 min | ~$0.10 |
| Montagem de carteira | Carteira | 2-4 min | ~$0.15 |
| Cenário macroeconômico | Macro | ~1 min | ~$0.02 |

---

## Contexto Macroeconômico Atual

- **Selic meta:** ~14,75% a.a. (ciclo de aperto, 2025-2026)
- **CDI** ≈ Selic − 0,10% a.a. — benchmark mínimo para renda variável
- **Selic alta favorece:** seguradoras, exportadoras, bancos
- **Selic alta prejudica:** varejo, utilities, tech de alto crescimento

---

## Suporte

- **Problemas técnicos:** Verifique se o backend está rodando (`/api/health`)
- **Chave API inválida:** Verifique em https://console.anthropic.com se a chave está ativa
- **Análise travada:** Aguarde até 5 minutos — APIs externas podem estar lentas
- **Erro de WebSocket:** Recarregue a página e tente novamente
