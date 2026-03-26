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
                    await asyncio.sleep(2 ** attempt)
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

        await self._send_progress(ws, wave=1, status="running", total_agents=3, completed_agents=0)
        loop = asyncio.get_running_loop()
        raw_stock, raw_macro, raw_news = await asyncio.gather(
            loop.run_in_executor(None, fetch_stock, ticker, date_str),
            loop.run_in_executor(None, fetch_macro, date_str),
            loop.run_in_executor(None, fetch_news, ticker, date_str, 30),
        )
        await self._send_progress(ws, wave=1, status="completed", completed_agents=3)

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

        await self._send_progress(ws, wave=3, agent="bear-analyst", status="running")
        all_outputs = "\n\n".join(f"=== {k} ===\n{v}" for k, v in agent_results.items())
        bear_context = f"{data_context}\n\nAGENT OUTPUTS:\n{all_outputs}"
        bear_result = await self.call_agent("bear-analyst", bear_context)
        agent_results["bear-analyst"] = bear_result
        await self._send_progress(ws, wave=3, agent="bear-analyst", status="completed")

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
