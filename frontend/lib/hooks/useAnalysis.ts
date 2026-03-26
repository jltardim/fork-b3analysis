"use client";

import { useCallback, useRef, useState } from "react";
import { createAnalysisWs } from "@/lib/api";
import type { AnalysisResult, WsProgress } from "@/lib/types";

export function useAnalysis(path: string, token: string) {
  const [progress, setProgress] = useState<WsProgress[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const start = useCallback(
    (payload: Record<string, unknown>) => {
      setProgress([]);
      setResult(null);
      setError(null);
      setIsRunning(true);

      const ws = createAnalysisWs(path, token);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify(payload));

      ws.onmessage = (event) => {
        const msg: WsProgress = JSON.parse(event.data);
        if (msg.status === "done") {
          setResult(msg.report ?? null);
          setIsRunning(false);
          ws.close();
        } else if (msg.status === "error") {
          setError(msg.detail ?? "Erro desconhecido");
          setIsRunning(false);
          ws.close();
        } else if (msg.status !== "keepalive") {
          setProgress((prev) => [...prev, msg]);
        }
      };

      ws.onerror = () => {
        setError("Erro na conexão WebSocket");
        setIsRunning(false);
      };
      ws.onclose = () => setIsRunning(false);
    },
    [path, token],
  );

  const cancel = useCallback(() => {
    wsRef.current?.close();
    setIsRunning(false);
  }, []);

  return { start, cancel, progress, result, error, isRunning };
}
