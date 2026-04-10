import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeams } from "../lib/api";
import type { Team } from "../types";

export function TopTeams() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    getTeams()
      .then((data) => {
        const ranked = data
          .filter((t) => t.coachesPollRank !== null)
          .sort((a, b) => (a.coachesPollRank as number) - (b.coachesPollRank as number))
          .slice(0, 10);
        setTeams(ranked);
      })
      .catch(() => {});
  }, []);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Top 10 Teams</h2>
        <Link
          to="/standings"
          className="text-sm text-slate-400 transition-colors hover:text-accent"
        >
          View All &rarr;
        </Link>
      </div>
      <div className="rounded-lg border border-surface-800 bg-surface-900">
        {teams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="flex items-center gap-4 border-b border-surface-800 px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-800"
          >
            <span className="w-6 text-right text-sm font-bold text-amber-500">
              {team.coachesPollRank}
            </span>
            <span className="flex-1">
              <span className="font-semibold text-white">{team.name}</span>
              <span className="ml-2 text-sm text-slate-500">
                {team.conference}
              </span>
            </span>
            <span className="text-sm text-slate-300">
              {team.wins}-{team.losses}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
