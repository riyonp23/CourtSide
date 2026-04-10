import { useState, useEffect, useRef } from "react";
import { getPlayers } from "../lib/api";
import type { PlayerWithStats } from "../types";

interface PlayerSearchProps {
  onSelect: (player: PlayerWithStats) => void;
  excludeIds: string[];
}

export function PlayerSearch({ onSelect, excludeIds }: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerWithStats[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setLoading(true);
      getPlayers({ limit: 50 })
        .then((data) => {
          const filtered = data.players.filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) &&
              !excludeIds.includes(p.id)
          );
          setResults(filtered.slice(0, 10));
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, excludeIds]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (player: PlayerWithStats) => {
    onSelect(player);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder="Search for a player..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent focus:outline-none"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-surface-700 border-t-accent" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-surface-700 bg-surface-900 py-1 shadow-lg">
          {results.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => handleSelect(player)}
                className="w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-surface-800"
              >
                {player.name}{" "}
                <span className="text-slate-400">
                  — {player.teamName} ({player.conference})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-slate-400">
          No players found
        </div>
      )}
    </div>
  );
}
