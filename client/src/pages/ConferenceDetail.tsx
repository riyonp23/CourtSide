import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getStandings, getPlayers } from "../lib/api";
import type { StandingsConference, PlayerWithStats } from "../types";

export default function ConferenceDetail() {
  const { conference } = useParams<{ conference: string }>();
  const decoded = conference ? decodeURIComponent(conference) : "";
  const [conf, setConf] = useState<StandingsConference | null>(null);
  const [topPlayers, setTopPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!decoded) return;
    setLoading(true);
    Promise.all([
      getStandings(),
      getPlayers({ conference: decoded, stat: "killsPerSet", limit: 5 }),
    ])
      .then(([data, playersData]) => {
        const found = data.conferences.find((c: StandingsConference) => c.name === decoded);
        setConf(found ?? null);
        setTopPlayers(playersData.players);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [decoded]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-surface-800" />
        <div className="mt-6 h-64 rounded bg-surface-800" />
      </div>
    );
  }

  if (error) return <p className="text-center text-red-400">Error: {error}</p>;
  if (!conf) return <p className="text-center text-slate-400">Conference not found.</p>;

  return (
    <div>
      <Link to="/standings" className="text-sm text-slate-400 hover:text-accent">
        &larr; All Standings
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{conf.name}</h1>

      <div className="mt-8 overflow-x-auto rounded-lg border border-surface-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-800">
              <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">Rank</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">Team</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">W</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">L</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">Win%</th>
            </tr>
          </thead>
          <tbody>
            {conf.teams.map((team, i) => {
              const total = team.wins + team.losses;
              const winPct = total > 0 ? (team.wins / total) * 100 : 0;
              return (
                <tr
                  key={team.id}
                  className={`border-b border-surface-800 transition-colors ${
                    i === 0 ? "border-l-2 border-l-accent" : ""
                  } ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-950"} hover:bg-surface-800`}
                >
                  <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link to={`/teams/${team.id}`} className="font-medium text-white hover:text-accent">
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-semibold text-accent">{team.wins}</td>
                  <td className="px-4 py-2 text-slate-400">{team.losses}</td>
                  <td className="px-4 py-2 text-slate-300">{winPct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {topPlayers.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Top Players in Conference</h2>
          <div className="space-y-2">
            {topPlayers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-surface-800 bg-surface-900 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-accent">{i + 1}</span>
                  <div>
                    <Link to={`/players/${p.id}`} className="font-medium text-white hover:text-accent">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      <Link to={`/teams/${p.teamId}`} className="hover:text-accent">
                        {p.teamName}
                      </Link>
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-accent">
                  {p.stats?.killsPerSet.toFixed(2) ?? "-"} K/S
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ConferenceDetail };
