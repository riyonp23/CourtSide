import { useState, useEffect, useMemo } from "react";
import { getTeams } from "../lib/api";
import { TeamRow } from "../components/TeamRow";
import type { Team } from "../types";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-surface-800 bg-surface-900 p-5">
      <div className="h-5 w-3/4 rounded bg-surface-800" />
      <div className="mt-2 h-4 w-1/2 rounded bg-surface-800" />
      <div className="mt-3 h-7 w-1/4 rounded bg-surface-800" />
    </div>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conference, setConference] = useState("");

  useEffect(() => {
    setLoading(true);
    getTeams()
      .then(setTeams)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const conferences = useMemo(
    () => [...new Set(teams.map((t) => t.conference))].sort(),
    [teams]
  );

  const filtered = conference
    ? teams.filter((t) => t.conference === conference)
    : teams;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">All Teams</h1>
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
      </div>

      {error && (
        <p className="mt-6 text-center text-red-400">Error: {error}</p>
      )}

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-12 text-center text-slate-400">
          No teams found{conference ? ` in ${conference}` : ""}.
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamRow key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

export { Teams };
