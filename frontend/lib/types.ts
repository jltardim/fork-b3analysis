export interface WsProgress {
  wave?: number;
  agent?: string;
  status: "pending" | "running" | "completed" | "error" | "done" | "keepalive";
  detail?: string;
  total_agents?: number;
  completed_agents?: number;
  report_id?: string;
  report?: AnalysisResult;
}

export interface AnalysisResult {
  type: string;
  ticker?: string;
  tickers?: string[];
  date: string;
  profile: string;
  disclaimer: string;
  report_text: string;
  raw_agents?: Record<string, string>;
}

export interface ReportSummary {
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
}

export type AnalysisType = "analyze" | "swarm" | "screen" | "portfolio" | "macro";
