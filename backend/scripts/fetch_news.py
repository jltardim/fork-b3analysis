#!/usr/bin/env python3
"""Fetch Brazilian financial news for a given ticker."""

import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dataflows.google_news_br import get_news_google_br, get_sector_news_br

SECTOR_MAP = {
    # Bancos e Financeiro
    "ITUB3": "financeiro", "ITUB4": "financeiro", "BBAS3": "financeiro",
    "BBDC3": "financeiro", "BBDC4": "financeiro", "SANB11": "financeiro",
    "BPAC11": "financeiro", "BRSR3": "financeiro", "ABCB4": "financeiro",
    "BPAN4": "financeiro", "BBSE3": "financeiro", "PSSA3": "financeiro",
    "B3SA3": "financeiro", "CXSE3": "financeiro", "IRBR3": "financeiro",
    "WIZC3": "financeiro",
    # Energia Elétrica
    "ELET3": "energia", "ELET6": "energia", "EQTL3": "energia",
    "CPFE3": "energia", "EGIE3": "energia", "ENGI11": "energia",
    "NEOE3": "energia", "CPLE6": "energia", "CMIG4": "energia",
    "TAEE11": "energia", "ALUP11": "energia", "AESB3": "energia",
    "ENEV3": "energia", "TRPL4": "energia",
    # Petróleo e Gás
    "PETR3": "petroleo", "PETR4": "petroleo", "PRIO3": "petroleo",
    "RECV3": "petroleo", "RRRP3": "petroleo", "ENAT3": "petroleo",
    "CSAN3": "petroleo", "UGPA3": "petroleo", "VBBR3": "petroleo",
    "RAIZ4": "petroleo",
    # Mineração, Siderurgia e Commodities
    "VALE3": "commodities", "CSNA3": "siderurgia", "GGBR4": "siderurgia",
    "GOAU4": "siderurgia", "USIM5": "siderurgia", "BRAP4": "commodities",
    "CMIN3": "commodities", "FESA4": "siderurgia", "SUZB3": "commodities",
    "KLBN11": "commodities", "DXCO3": "industrial", "RANI3": "commodities",
    # Varejo
    "RENT3": "varejo", "LREN3": "varejo", "MGLU3": "varejo",
    "BHIA3": "varejo", "ARZZ3": "varejo", "SOMA3": "varejo",
    "GUAR3": "varejo", "GRND3": "varejo", "ALPA4": "varejo",
    "LJQQ3": "varejo", "CEAB3": "varejo", "SBFG3": "varejo",
    "PETZ3": "varejo", "ASAI3": "varejo", "CRFB3": "varejo",
    "PCAR3": "varejo",
    # Saúde
    "RDOR3": "saude", "HAPV3": "saude", "FLRY3": "saude",
    "RADL3": "saude", "DASA3": "saude", "BLAU3": "saude",
    "ONCO3": "saude", "PARD3": "saude", "QUAL3": "saude",
    "AALR3": "saude", "ODPV3": "saude", "HYPE3": "saude",
    # Tecnologia
    "TOTS3": "tecnologia", "LWSA3": "tecnologia", "POSI3": "tecnologia",
    "INTB3": "tecnologia", "SQIA3": "tecnologia", "CASH3": "tecnologia",
    "NINJ3": "tecnologia", "MBLY3": "tecnologia", "DESK3": "tecnologia",
    # Industrial
    "WEGE3": "industrial", "EMBR3": "industrial", "TUPY3": "industrial",
    "MYPK3": "industrial", "KEPL3": "industrial", "ROMI3": "industrial",
    "FRAS3": "industrial", "POMO4": "industrial", "LEVE3": "industrial",
    # Construção Civil
    "CYRE3": "construcao", "MRVE3": "construcao", "EZTC3": "construcao",
    "CURY3": "construcao", "TEND3": "construcao", "DIRR3": "construcao",
    "EVEN3": "construcao", "MDNE3": "construcao", "HBOR3": "construcao",
    # Alimentos e Bebidas
    "ABEV3": "consumo", "JBSS3": "consumo", "BRFS3": "consumo",
    "MRFG3": "consumo", "MDIA3": "consumo", "SMTO3": "consumo",
    "SLCE3": "consumo", "CAML3": "consumo", "BEEF3": "consumo",
    # Transporte e Logística
    "CCRO3": "transporte", "RAIL3": "transporte", "STBP3": "transporte",
    "JSLG3": "transporte", "VAMO3": "transporte", "TGMA3": "transporte",
    "AZUL4": "transporte", "GOLL4": "transporte", "ECOR3": "transporte",
    # Telecomunicações
    "VIVT3": "telecomunicacoes", "TIMS3": "telecomunicacoes",
    "OIBR3": "telecomunicacoes",
    # Saneamento
    "SBSP3": "saneamento", "SAPR3": "saneamento", "SAPR11": "saneamento",
    "CSMG3": "saneamento",
    # Shopping e Imobiliário
    "MULT3": "varejo", "IGTI11": "varejo", "JHSF3": "varejo",
    # Agro e Educação
    "AGRO3": "consumo", "TTEN3": "consumo",
    "YDUQ3": "educacao", "COGN3": "educacao", "SEER3": "educacao",
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
