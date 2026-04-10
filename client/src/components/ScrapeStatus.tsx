import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";

interface ScrapeStatusData {
  lastScrapedAt: string | null;
  totalTeams: number;
  totalPlayers: number;
  scraping: boolean;
}

interface ScrapeProgress {
  current: number;
  total: number;
  teamName: string;
}

export function ScrapeStatus({ onComplete }: { onComplete?: () => void }) {
  const [status, setStatus] = useState<ScrapeStatusData | null>(null);
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/scrape/status`);
      if (res.ok) {
        const data = await res.json() as ScrapeStatusData;
        setStatus(data);
        if (data.scraping) {
          setScraping(true);
          connectWs();
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        const eventType = msg.event as string;

        if (eventType === "scrape:team") {
          setProgress({
            current: msg.current as number,
            total: msg.total as number,
            teamName: msg.teamName as string,
          });
        } else if (eventType === "scrape:complete") {
          setScraping(false);
          setProgress(null);
          ws.close();
          wsRef.current = null;
          fetchStatus();
          onComplete?.();
        } else if (eventType === "scrape:error") {
          setError(msg.message as string);
          setScraping(false);
          setProgress(null);
          ws.close();
          wsRef.current = null;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      ws.close();
      wsRef.current = null;
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [fetchStatus, onComplete]);

  useEffect(() => {
    fetchStatus();
    return () => {
      wsRef.current?.close();
    };
  }, [fetchStatus]);

  const handleRefresh = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/scrape`, { method: "POST" });
      if (res.ok) {
        setScraping(true);
        setProgress(null);
        connectWs();
      } else if (res.status === 409) {
        setScraping(true);
        connectWs();
      } else {
        setError("Failed to start scrape");
      }
    } catch {
      setError("Failed to connect to server");
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {status ? (
            status.totalTeams === 0 ? (
              "No data yet — click Refresh to scrape NCAA stats."
            ) : (
              <>
                Last updated: <span className="text-slate-300">{formatDate(status.lastScrapedAt)}</span>
                <span className="ml-3 text-slate-500">
                  {status.totalTeams} teams, {status.totalPlayers} players
                </span>
              </>
            )
          ) : (
            "Loading status..."
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={scraping}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scraping ? "Scraping..." : "Refresh Data"}
        </button>
      </div>

      {scraping && progress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>
              {progress.current}/{progress.total}: {progress.teamName}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
