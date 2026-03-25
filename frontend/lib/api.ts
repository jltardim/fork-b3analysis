const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function backendFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function createAnalysisWs(path: string, token: string): WebSocket {
  const wsUrl = BACKEND_URL.replace("http", "ws");
  return new WebSocket(`${wsUrl}${path}?token=${token}`);
}
