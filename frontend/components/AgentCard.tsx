"use client";

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface AgentCardProps {
  name: string;
  status: "pending" | "running" | "completed" | "error";
}

const AGENT_LABELS: Record<string, string> = {
  fetch_stock: "Dados de Ações",
  fetch_macro: "Dados Macro",
  fetch_news: "Notícias",
  "business-analyst": "Negócios",
  "financial-analyst": "Financeiro",
  "credit-analyst": "Crédito",
  "valuation-analyst": "Valuation",
  "technical-analyst": "Técnico",
  "macro-correlation-analyst": "Macro-Correlação",
  "governance-analyst": "Governança",
  "news-sentiment-analyst": "Sentimento",
  "bear-analyst": "Bear Case",
  synthesis: "Síntese",
};

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    bg: "bg-slate-700/50",
    border: "border-slate-600",
    text: "text-slate-400",
    iconColor: "text-slate-400",
    label: "Aguardando",
  },
  running: {
    icon: Loader2,
    bg: "bg-blue-950/50",
    border: "border-blue-500",
    text: "text-blue-300",
    iconColor: "text-blue-400",
    label: "Executando",
  },
  completed: {
    icon: CheckCircle2,
    bg: "bg-emerald-950/40",
    border: "border-emerald-500",
    text: "text-emerald-300",
    iconColor: "text-emerald-400",
    label: "Concluído",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-950/40",
    border: "border-red-500",
    text: "text-red-300",
    iconColor: "text-red-400",
    label: "Erro",
  },
};

export function AgentCard({ name, status }: AgentCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const label = AGENT_LABELS[name] ?? name;

  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg border px-4 py-3
        transition-all duration-300
        ${config.bg} ${config.border}
        ${status === "running" ? "animate-pulse" : ""}
      `}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${config.iconColor} ${
          status === "running" ? "animate-spin" : ""
        }`}
      />
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${config.text}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500">{config.label}</p>
      </div>
    </div>
  );
}
