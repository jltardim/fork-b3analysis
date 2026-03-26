"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAnalysis } from "@/lib/hooks/useAnalysis";
import { TickerInput } from "@/components/TickerInput";
import { ReportViewer } from "@/components/ReportViewer";
import { Loader2, Briefcase, AlertCircle, X } from "lucide-react";

export default function PortfolioPage() {
  const { data: session } = useSession();
  const token = ((session as unknown) as Record<string, unknown>)?.accessToken as string ?? "";
  const { start, cancel, progress, result, error, isRunning } = useAnalysis(
    "/api/ws/portfolio",
    token,
  );

  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerInput, setTickerInput] = useState("");
  const [capital, setCapital] = useState("");

  const addTicker = (t: string) => {
    if (t && !tickers.includes(t)) {
      setTickers((prev) => [...prev, t]);
    }
    setTickerInput("");
  };

  const removeTicker = (t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
  };

  const handleStart = () => {
    if (tickers.length === 0) return;
    const payload: Record<string, unknown> = { tickers };
    if (capital) {
      payload.capital = parseFloat(capital.replace(/\D/g, "")) || 0;
    }
    start(payload);
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10);
    return num.toLocaleString("pt-BR");
  };

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const totalAgents = progress[0]?.total_agents ?? tickers.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Montagem de Carteira</h1>
        <p className="mt-1 text-sm text-slate-400">
          Selecione as ações desejadas e o capital disponível para receber uma
          sugestão de alocação diversificada baseada em análise fundamentalista.
        </p>
      </div>

      {/* Input Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-5">
        {/* Ticker Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">
            Ações da carteira
          </label>
          <TickerInput
            value={tickerInput}
            onChange={(t) => {
              setTickerInput(t);
              if (t) addTicker(t);
            }}
            placeholder="Buscar e adicionar ação"
          />

          {tickers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tickers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                >
                  {t}
                  <button
                    onClick={() => removeTicker(t)}
                    className="text-blue-400/50 hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Capital Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Capital disponível (R$)
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              R$
            </span>
            <input
              type="text"
              value={capital}
              onChange={(e) => setCapital(formatCurrency(e.target.value))}
              placeholder="10.000"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={isRunning ? cancel : handleStart}
          disabled={tickers.length === 0 && !isRunning}
          className={`
            inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold
            transition-all disabled:cursor-not-allowed disabled:opacity-40
            ${
              isRunning
                ? "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            }
          `}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelar
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4" />
              Montar Carteira
            </>
          )}
        </button>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Progresso</span>
            <span className="text-blue-400">
              {completedCount}/{totalAgents} agentes
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
              style={{
                width: `${totalAgents > 0 ? (completedCount / totalAgents) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="space-y-1">
            {progress.map((p, i) => (
              <p key={i} className="text-xs text-slate-500">
                {p.agent && <span className="text-slate-400">[{p.agent}]</span>}{" "}
                {p.detail ?? p.status}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && <ReportViewer content={result.report_text} showDisclaimer={false} />}
    </div>
  );
}
