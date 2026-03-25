"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAnalysis } from "@/lib/hooks/useAnalysis";
import { TickerInput } from "@/components/TickerInput";
import { ReportViewer } from "@/components/ReportViewer";
import { Loader2, Play, AlertCircle } from "lucide-react";

export default function AnalyzePage() {
  const { data: session } = useSession();
  const token = (session as Record<string, unknown>)?.accessToken as string ?? "";
  const { start, cancel, progress, result, error, isRunning } = useAnalysis(
    "/api/ws/analyze",
    token,
  );

  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState("");

  const handleAnalyze = () => {
    if (!ticker) return;
    const payload: Record<string, unknown> = { ticker };
    if (date) payload.date = date;
    start(payload);
  };

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const totalAgents = progress[0]?.total_agents ?? 3;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Análise Rápida</h1>
        <p className="mt-1 text-sm text-slate-400">
          Análise com 3 agentes de IA — coleta de dados, análise e síntese em
          poucos minutos.
        </p>
      </div>

      {/* Input Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-slate-300">Ação</label>
            <TickerInput value={ticker} onChange={setTicker} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Data (opcional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={isRunning ? cancel : handleAnalyze}
            disabled={!ticker && !isRunning}
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
                <Play className="h-4 w-4" />
                Analisar
              </>
            )}
          </button>
        </div>
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
