import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPlayers, getTeams } from "../lib/api";
import type { PlayerWithStats, Team } from "../types";

export function NavSearch() {
  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState<PlayerWithStats[]>([]);
  const [teamResults, setTeamResults] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const teamsCache = useRef<Team[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getTeams().then((t) => { teamsCache.current = t; }).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setPlayerResults([]);
      setTeamResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      const filteredTeams = teamsCache.current.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 5);
      setTeamResults(filteredTeams);

      getPlayers({ search: query, limit: 5 })
        .then((data) => {
          setPlayerResults(data.players);
          setOpen(data.players.length > 0 || filteredTeams.length > 0);
        })
        .catch(() => setPlayerResults([]));
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(path: string) {
    setOpen(false);
    setQuery("");
    navigate(path);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center rounded-md border border-surface-700 bg-surface-900 px-2">
        <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search players & teams..."
          className="w-[180px] bg-transparent px-2 py-1.5 text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-surface-700 bg-surface-950 py-1 shadow-lg">
          {playerResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-500">Players</div>
              {playerResults.map((p) => (
                <button key={p.id} onClick={() => handleSelect(`/players/${p.id}`)} className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-surface-800">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.teamName}</span>
                </button>
              ))}
            </>
          )}
          {playerResults.length > 0 && teamResults.length > 0 && (
            <div className="mx-3 my-1 border-t border-surface-700" />
          )}
          {teamResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-500">Teams</div>
              {teamResults.map((t) => (
                <button key={t.id} onClick={() => handleSelect(`/teams/${t.id}`)} className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-surface-800">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <span className="text-xs text-slate-400">{t.conference}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
