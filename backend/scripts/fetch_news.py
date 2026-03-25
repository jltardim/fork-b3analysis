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
