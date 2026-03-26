"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TickerInputProps {
  value: string;
  onChange: (ticker: string) => void;
  placeholder?: string;
}

// Lista completa de ações negociadas na B3 (ON, PN e Units)
const B3_TICKERS = [
  // A
  "AALR3", "ABCB4", "ABEV3", "AERI3", "AESB3", "AGRO3", "ALLD3", "ALOS3",
  "ALPA3", "ALPA4", "ALUP11", "ALUP3", "ALUP4", "AMBP3", "ANIM3", "ARML3",
  "ARZZ3", "ASAI3", "AURA33", "AZUL4",
  // B
  "B3SA3", "BAUH4", "BBAS3", "BBDC3", "BBDC4", "BBSE3", "BEEF3", "BHIA3",
  "BLAU3", "BMOB3", "BOAS3", "BOBR4", "BPAC11", "BPAC3", "BPAC5", "BPAN4",
  "BRAP3", "BRAP4", "BRBI11", "BRFS3", "BRKM3", "BRKM5", "BRPR3", "BRSR3",
  "BRSR6",
  // C
  "CAML3", "CASH3", "CBAV3", "CCRO3", "CEAB3", "CEED3", "CEED4", "CEGR3",
  "CEPE5", "CIEL3", "CLSA3", "CMIG3", "CMIG4", "CMIN3", "COCE5", "COGN3",
  "CPFE3", "CPLE11", "CPLE3", "CPLE6", "CRFB3", "CSAN3", "CSMG3", "CSNA3",
  "CSUD3", "CURY3", "CVCB3", "CXSE3", "CYRE3",
  // D
  "DASA3", "DESK3", "DEXP3", "DIRR3", "DMMO3", "DMVF3", "DXCO3",
  // E
  "ECOR3", "EGIE3", "ELET3", "ELET6", "ELMD3", "EMAE4", "EMBR3", "ENAT3",
  "ENEV3", "ENGI11", "ENGI3", "ENGI4", "ENJU3", "EQPA3", "EQTL3", "ESPA3",
  "EVEN3", "EZTC3",
  // F
  "FESA3", "FESA4", "FIQE3", "FLRY3", "FRAS3", "FRIO3",
  // G
  "GFSA3", "GGBR3", "GGBR4", "GGPS3", "GMAT3", "GOAU3", "GOAU4", "GOLL4",
  "GPIV33", "GRND3", "GUAR3", "GUAR4",
  // H
  "HAPV3", "HBOR3", "HBRE3", "HYPE3",
  // I
  "IFCM3", "IGTI11", "IGTI3", "IGTI4", "INTB3", "IRBR3", "ISAE3", "ISAE4",
  "ITSA3", "ITSA4", "ITUB3", "ITUB4",
  // J
  "JALL3", "JBSS3", "JHSF3", "JSLG3",
  // K
  "KEPL3", "KLBN11", "KLBN3", "KLBN4",
  // L
  "LAND3", "LAVV3", "LEVE3", "LJQQ3", "LOGG3", "LOGN3", "LREN3", "LUPA3",
  "LWSA3",
  // M
  "MATD3", "MBLY3", "MDIA3", "MDNE3", "MEAL3", "MEGA3", "MELK3", "MGLU3",
  "MILS3", "MLAS3", "MMAQ4", "MNDL3", "MOVI3", "MRFG3", "MRVE3", "MTRE3",
  "MULT3", "MYPK3",
  // N
  "NEOE3", "NGRD3", "NINJ3", "NTCO3", "NUTR3",
  // O
  "ODPV3", "OFSA3", "OIBR3", "OIBR4", "ONCO3", "OPCT3", "ORVR3",
  // P
  "PARD3", "PCAR3", "PETR3", "PETR4", "PETZ3", "PINE4", "PLPL3", "PMAM3",
  "PNVL3", "POMO3", "POMO4", "PORT3", "POSI3", "PRIO3", "PRNR3", "PSSA3",
  "PTBL3", "PTNT4",
  // Q
  "QUAL3",
  // R
  "RADL3", "RAIL3", "RAIZ4", "RANI3", "RAPT3", "RAPT4", "RCSL3", "RDOR3",
  "RECV3", "RENT3", "ROMI3", "RPMG3", "RRRP3", "RSID3", "RSUL4",
  // S
  "SANB11", "SANB3", "SANB4", "SAPR11", "SAPR3", "SAPR4", "SBFG3", "SBSP3",
  "SCAR3", "SEQL3", "SEER3", "SHUL4", "SIMH3", "SLCE3", "SMFT3", "SMTO3",
  "SOMA3", "SQIA3", "STBP3", "SUZB3",
  // T
  "TAEE11", "TAEE3", "TAEE4", "TASA3", "TASA4", "TCSA3", "TEND3", "TGMA3",
  "TIMS3", "TLPP3", "TLPP4", "TOTS3", "TPIS3", "TRAD3", "TRIS3", "TRPL3",
  "TRPL4", "TTEN3", "TUPY3", "TXRX4",
  // U
  "UCAS3", "UGPA3", "UNIP3", "UNIP6", "USIM3", "USIM5",
  // V
  "VALE3", "VAMO3", "VBBR3", "VIVA3", "VIVR3", "VIVT3", "VLID3", "VULC3",
  "VVEO3",
  // W
  "WEGE3", "WEST3", "WHRL3", "WHRL4", "WIZC3",
  // Y-Z
  "YDUQ3", "ZAMP3",
];

export function TickerInput({
  value,
  onChange,
  placeholder = "Buscar ação (ex: WEGE3)",
}: TickerInputProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? B3_TICKERS.filter((t) => t.startsWith(query.toUpperCase())).slice(0, 10)
    : B3_TICKERS.slice(0, 10);

  const select = useCallback(
    (ticker: string) => {
      setQuery(ticker);
      onChange(ticker);
      setIsOpen(false);
    },
    [onChange],
  );

  const clear = useCallback(() => {
    setQuery("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIdx]) select(filtered[highlightIdx]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.parentElement?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full rounded-lg border border-slate-600 bg-slate-800
            py-2.5 pl-10 pr-10 text-sm text-white
            placeholder-slate-400
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            transition-colors
          "
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="
            absolute z-50 mt-1 max-h-60 w-full overflow-auto
            rounded-lg border border-slate-600 bg-slate-800
            py-1 shadow-xl
          "
        >
          {filtered.map((ticker, idx) => (
            <li
              key={ticker}
              onClick={() => select(ticker)}
              className={`
                cursor-pointer px-4 py-2 text-sm transition-colors
                ${
                  idx === highlightIdx
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              {ticker}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
