"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { backendFetch } from "@/lib/api";
import { ReportViewer } from "@/components/ReportViewer";
import Disclaimer from "@/components/Disclaimer";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Search,
  Zap,
  Filter,
  Briefcase,
  TrendingUp,
  FileText,
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

interface ReportDetail {
  id: string;
  type: string;
  ticker: string | null;
  tickers: string[] | null;
  profile_used: string | null;
  status: string;
  score: number | null;
  signal: string | null;
  created_at: string;
  completed_at: string | null;
  report_data: {
    report_text?: string;
    [key: string]: unknown;
  } | null;
}

function SkeletonReport() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-white/5" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
        </div>
      </div>
      <div className="h-px bg-white/5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-white/5"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

export default function ReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = (session as any)?.accessToken as string | undefined;

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await backendFetch(`/api/reports/${id}`, token);
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError("Nao foi possivel carregar o relatorio.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const handleDelete = async () => {
    if (!token) return;
    if (!window.confirm("Tem certeza que deseja excluir esta analise?")) return;
    setDeleting(true);
    try {
      await backendFetch(`/api/reports/${id}`, token, { method: "DELETE" });
      router.push("/dashboard/history");
    } catch {
      setDeleting(false);
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

  const tickerDisplay = (r: ReportDetail) => {
    if (r.tickers && r.tickers.length > 0) return r.tickers.join(", ");
    if (r.ticker) return r.ticker;
    return "";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <SkeletonReport />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => router.push("/dashboard/history")}
          className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Historico
        </button>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] py-16">
          <FileText className="h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-500">
            {error || "Relatorio nao encontrado."}
          </p>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[report.type] || FileText;
  const color = TYPE_COLORS[report.type] || "from-slate-500 to-slate-600";
  const reportText = report.report_data?.report_text || "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/history")}
        className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Historico
      </button>

      {/* Disclaimer */}
      <Disclaimer />

      {/* Header card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-lg`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white">
                {TYPE_LABELS[report.type] || report.type}
                {tickerDisplay(report) && (
                  <span className="ml-2 text-slate-300">
                    — {tickerDisplay(report)}
                  </span>
                )}
              </h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDate(report.created_at)}
              {report.profile_used && (
                <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-slate-400">
                  {report.profile_used}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {report.score != null && (
            <div className="text-center">
              <p className="text-xs text-slate-500">Score</p>
              <p className="text-lg font-bold text-white">{report.score}/7</p>
            </div>
          )}
          {report.signal && (
            <div className="text-center">
              <p className="mb-1 text-xs text-slate-500">Sinal</p>
              {report.signal.toUpperCase() === "COMPRAR" && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-400">
                  COMPRAR
                </span>
              )}
              {report.signal.toUpperCase() === "MANTER" && (
                <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-semibold text-yellow-400">
                  MANTER
                </span>
              )}
              {report.signal.toUpperCase() === "EVITAR" && (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-400">
                  EVITAR
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-2 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </button>
        </div>
      </div>

      {/* Report content */}
      {reportText ? (
        <ReportViewer content={reportText} showDisclaimer={false} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] py-16">
          <FileText className="h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-500">
            {report.status === "running"
              ? "Analise em andamento..."
              : "Nenhum conteudo disponivel para este relatorio."}
          </p>
        </div>
      )}
    </div>
  );
}
