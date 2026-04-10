import { useState, useEffect } from "react";
import { getPlayers, getTeams } from "../lib/api";
import { PlayerTable } from "../components/PlayerTable";
import type { PlayerWithStats } from "../types";

const STAT_OPTIONS: { value: string; label: string }[] = [
  { value: "killsPerSet", label: "Kills/Set" },
  { value: "hittingPct", label: "Hitting %" },
  { value: "assistsPerSet", label: "Assists/Set" },
  { value: "acesPerSet", label: "Aces/Set" },
  { value: "digsPerSet", label: "Digs/Set" },
  { value: "blocksPerSet", label: "Blocks/Set" },
  { value: "pointsPerSet", label: "Points/Set" },
  { value: "kills", label: "Total Kills" },
  { value: "assists", label: "Total Assists" },
  { value: "aces", label: "Total Aces" },
  { value: "digs", label: "Total Digs" },
  { value: "blocks", label: "Total Blocks" },
  { value: "points", label: "Total Points" },
];

const LIMIT = 25;

export default function Players() {
  const [stat, setStat] = useState("killsPerSet");
  const [conference, setConference] = useState("");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conferences, setConferences] = useState<string[]>([]);

  useEffect(() => {
    getTeams().then((teams) => {
      const confs = [...new Set(teams.map((t) => t.conference))].sort();
      setConferences(confs);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlayers({
      stat,
      conference: conference || undefined,
      limit: LIMIT,
      offset,
    })
      .then((data) => {
        setPlayers(data.players);
        setTotal(data.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [stat, conference, offset]);

  useEffect(() => {
    setOffset(0);
  }, [stat, conference]);

  const filtered = search
    ? players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  const page = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);
  const showStart = offset + 1;
  const showEnd = Math.min(offset + LIMIT, total);

  if (error) {
    return <p className="text-center text-red-400">Error: {error}</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Player Leaderboard</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={stat}
          onChange={(e) => setStat(e.target.value)}
          className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          {STAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={conference}
          onChange={(e) => setConference(e.target.value)}
          className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          <option value="">All Conferences</option>
          {conferences.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="animate-pulse space-y-1">
            <div className="h-10 rounded-t-lg bg-surface-800" />
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-10 ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-950"}`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-12 text-center text-slate-400">
            No players found{search ? ` matching "${search}"` : ""}.
          </p>
        ) : (
          <PlayerTable
            players={filtered}
            highlightStat={stat}
            rankOffset={offset}
          />
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {showStart}-{showEnd} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
              disabled={page <= 1}
              className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-1.5 text-white transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset((o) => o + LIMIT)}
              disabled={page >= totalPages}
              className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-1.5 text-white transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { Players };
