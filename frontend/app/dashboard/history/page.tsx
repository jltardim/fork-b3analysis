"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { backendFetch } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";
import {
  Search,
  Zap,
  Filter,
  Briefcase,
  TrendingUp,
  Trash2,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  analyze: "Analise",
  swarm: "Swarm",
  screen: "Screening",
  portfolio: "Carteira",
  macro: "Macro",
};

const TYPE_ICONS: Record<string, typeof Search> = {
  analyze: Search,
  swarm: Zap,
  screen: Filter,
  portfolio: Briefcase,
  macro: TrendingUp,
};

const TYPE_COLORS: Record<string, string> = {
  analyze: "from-blue-500 to-blue-600",
  swarm: "from-indigo-500 to-purple-600",
  screen: "from-emerald-500 to-teal-600",
  portfolio: "from-amber-500 to-orange-600",
  macro: "from-rose-500 to-pink-600",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        Concluido
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
        Em andamento
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
      Falhou
    </span>
  );
}

function SignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const upper = signal.toUpperCase();
  if (upper === "COMPRAR") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        COMPRAR
      </span>
    );
  }
  if (upper === "MANTER") {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
        MANTER
      </span>
    );
  }
  if (upper === "EVITAR") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
        EVITAR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-slate-400">
      {signal}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/5 px-5 py-4 last:border-b-0"
        >
          <div className="h-9 w-9 animate-pulse rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-white/5" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-white/5" />
        </div>
      ))}
    </>
  );
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = (session as any)?.accessToken as string | undefined;

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      const data = await backendFetch("/api/reports", token);
      setReports(data);
    } catch {
      // silently fail – empty state will show
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm("Tem certeza que deseja excluir esta analise?")) return;
    setDeleting(id);
    try {
      await backendFetch(`/api/reports/${id}`, token, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const tickerDisplay = (r: ReportSummary) => {
    if (r.tickers && r.tickers.length > 0) return r.tickers.join(", ");
    if (r.ticker) return r.ticker;
    return "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Clock className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Historico de Analises
          </h1>
          <p className="text-sm text-slate-400">
            Todas as analises realizadas na plataforma
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
        {/* Header row – hidden on mobile */}
        <div className="hidden border-b border-white/5 bg-white/[0.02] px-5 py-3 sm:flex">
          <span className="w-14 text-xs font-medium uppercase tracking-wider text-slate-500" />
          <span className="flex-1 text-xs font-medium uppercase tracking-wider text-slate-500">
            Tipo / Ticker
          </span>
          <span className="hidden w-40 text-xs font-medium uppercase tracking-wider text-slate-500 md:block">
            Data
          </span>
          <span className="w-28 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Status
          </span>
          <span className="w-16 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Score
          </span>
          <span className="w-24 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Sinal
          </span>
          <span className="w-10" />
        </div>

        {loading ? (
          <SkeletonRows />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <FileText className="h-12 w-12 text-slate-600" />
            <p className="text-sm text-slate-500">
              Nenhuma analise encontrada
            </p>
            <p className="text-xs text-slate-600">
              Execute uma analise para ver os resultados aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reports.map((r) => {
              const Icon = TYPE_ICONS[r.type] || FileText;
              const color = TYPE_COLORS[r.type] || "from-slate-500 to-slate-600";

              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/dashboard/report/${r.id}`)}
                  className="group flex cursor-pointer flex-wrap items-center gap-y-2 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-nowrap"
                >
                  {/* Icon */}
                  <div className="mr-4 sm:mr-0 sm:w-14">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-lg`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* Type + Ticker */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {tickerDisplay(r)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {TYPE_LABELS[r.type] || r.type}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="hidden w-40 md:block">
                    <p className="text-xs text-slate-400">
                      {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="w-28 text-center">
                    <StatusBadge status={r.status} />
                  </div>

                  {/* Score */}
                  <div className="w-16 text-center">
                    {r.score != null ? (
                      <span className="text-sm font-semibold text-slate-200">
                        {r.score}/7
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>

                  {/* Signal */}
                  <div className="w-24 text-center">
                    <SignalBadge signal={r.signal} />
                  </div>

                  {/* Delete */}
                  <div className="w-10 text-right">
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      disabled={deleting === r.id}
                      className="rounded-lg p-1.5 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                      title="Excluir"
                    >
                      {deleting === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
