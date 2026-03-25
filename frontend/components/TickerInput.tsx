"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TickerInputProps {
  value: string;
  onChange: (ticker: string) => void;
  placeholder?: string;
}

const B3_TICKERS = [
  "ABEV3", "ALPA4", "ARZZ3", "ASAI3", "AZUL4",
  "B3SA3", "BBAS3", "BBDC4", "BBSE3", "BEEF3",
  "BPAC11", "BRAP4", "BRFS3", "BRKM5", "CASH3",
  "CCRO3", "CIEL3", "CMIG4", "CMIN3", "COGN3",
  "CPFE3", "CPLE6", "CRFB3", "CSAN3", "CSNA3",
  "CVCB3", "CYRE3", "DXCO3", "EGIE3", "ELET3",
  "EMBR3", "ENEV3", "ENGI11", "EQTL3", "EZTC3",
  "FLRY3", "GGBR4", "GOAU4", "GOLL4", "HAPV3",
  "HYPE3", "IGTI11", "IRBR3", "ITSA4", "ITUB3",
  "JBSS3", "KLBN11", "LREN3", "LWSA3", "MGLU3",
  "MRFG3", "MRVE3", "MULT3", "NTCO3", "PCAR3",
  "PETR4", "PETZ3", "PRIO3", "PSSA3", "QUAL3",
  "RADL3", "RAIL3", "RAIZ4", "RDOR3", "RENT3",
  "RRRP3", "SANB11", "SAPR3", "SBSP3", "SLCE3",
  "SMTO3", "SOMA3", "SUZB3", "TAEE11", "TIMS3",
  "TOTS3", "UGPA3", "USIM5", "VALE3", "VBBR3",
  "VIVT3", "WEGE3", "YDUQ3",
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
