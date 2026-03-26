"use client";

import type { WsProgress } from "@/lib/types";
import { AgentCard } from "./AgentCard";

interface SwarmGridProps {
  progress: WsProgress[];
}

interface WaveConfig {
  label: string;
  wave: number;
  agents: string[];
}

const WAVES: WaveConfig[] = [
  {
    label: "Onda 1 — Coleta de Dados",
    wave: 1,
    agents: ["fetch_stock", "fetch_macro", "fetch_news"],
  },
  {
    label: "Onda 2 — Analistas",
    wave: 2,
    agents: [
      "business-analyst",
      "financial-analyst",
      "credit-analyst",
      "valuation-analyst",
      "technical-analyst",
      "macro-correlation-analyst",
      "governance-analyst",
      "news-sentiment-analyst",
    ],
  },
  {
    label: "Onda 3 — Advogado do Diabo",
    wave: 3,
    agents: ["bear-analyst"],
  },
  {
    label: "Onda 4 — Síntese",
    wave: 4,
    agents: ["synthesis"],
  },
];

function deriveStatus(
  agentName: string,
  progress: WsProgress[],
): "pending" | "running" | "completed" | "error" {
  const msgs = progress.filter((p) => p.agent === agentName);
  if (msgs.length === 0) return "pending";

  const last = msgs[msgs.length - 1];
  if (last.status === "completed") return "completed";
  if (last.status === "error") return "error";
  if (last.status === "running") return "running";
  return "pending";
}

function isWaveActive(wave: WaveConfig, progress: WsProgress[]): boolean {
  return wave.agents.some((a) => deriveStatus(a, progress) === "running");
}

function isWaveCompleted(wave: WaveConfig, progress: WsProgress[]): boolean {
  return (
    wave.agents.length > 0 &&
    wave.agents.every((a) => deriveStatus(a, progress) === "completed")
  );
}

export function SwarmGrid({ progress }: SwarmGridProps) {
  return (
    <div className="space-y-6">
      {WAVES.map((wave) => {
        const active = isWaveActive(wave, progress);
        const completed = isWaveCompleted(wave, progress);

        return (
          <div key={wave.wave} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${
                  active
                    ? "text-blue-400"
                    : completed
                      ? "text-emerald-400"
                      : "text-slate-500"
                }`}
              >
                {wave.label}
              </h3>
              {active && (
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              )}
              {completed && (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {wave.agents.map((agent) => (
                <AgentCard
                  key={agent}
                  name={agent}
                  status={deriveStatus(agent, progress)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
