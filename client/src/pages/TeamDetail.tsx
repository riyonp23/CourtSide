import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getTeam } from "../lib/api";
import type { TeamWithPlayers, Player } from "../types";

type SortKey =
  | "jersey"
  | "name"
  | "position"
  | "classYear"
  | "killsPerSet"
  | "hittingPct"
  | "assistsPerSet"
  | "acesPerSet"
  | "digsPerSet"
  | "blocksPerSet"
  | "pointsPerSet";

const columns: { key: SortKey; label: string }[] = [
  { key: "jersey", label: "#" },
  { key: "name", label: "Name" },
  { key: "position", label: "Pos" },
  { key: "classYear", label: "Class" },
  { key: "killsPerSet", label: "K/S" },
  { key: "hittingPct", label: "Hit%" },
  { key: "assistsPerSet", label: "A/S" },
  { key: "acesPerSet", label: "Ace/S" },
  { key: "digsPerSet", label: "D/S" },
  { key: "blocksPerSet", label: "Blk/S" },
  { key: "pointsPerSet", label: "Pts/S" },
];

function statVal(player: Player, key: SortKey): number | string {
  if (key === "jersey") return player.jersey;
  if (key === "name") return player.name;
  if (key === "position") return player.position;
  if (key === "classYear") return player.classYear;
  const stats = player.seasonStats[0];
  if (!stats) return 0;
  return stats[key];
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("pointsPerSet");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTeam(id)
      .then(setTeam)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const sorted = useMemo(() => {
    if (!team) return [];
    return [...team.players].sort((a, b) => {
      const aVal = statVal(a, sortKey);
      const bVal = statVal(b, sortKey);
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [team, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-surface-800" />
        <div className="h-6 w-1/4 rounded bg-surface-800" />
        <div className="mt-6 h-64 rounded bg-surface-800" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-400">Error: {error}</p>;
  }

  if (!team) {
    return <p className="text-center text-slate-400">Team not found.</p>;
  }

  return (
    <div>
      <Link to="/teams" className="text-sm text-slate-400 hover:text-accent">
        &larr; All Teams
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            to={`/standings/${encodeURIComponent(team.conference)}`}
            className="rounded border border-surface-700 bg-surface-800 px-2 py-0.5 text-xs text-slate-300 hover:text-accent"
          >
            {team.conference}
          </Link>
          <span className="text-2xl font-bold text-accent">
            {team.wins}-{team.losses}
          </span>
          {team.coachesPollRank && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
              #{team.coachesPollRank} Coaches Poll
            </span>
          )}
        </div>
        {team.nationalTitles > 0 && (
          <div className="mt-2 flex items-center gap-2 text-amber-400">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-semibold">{team.nationalTitles} National Championship{team.nationalTitles > 1 ? "s" : ""}</span>
            {team.titleYears && <span className="text-xs text-slate-400">({team.titleYears})</span>}
          </div>
        )}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase text-slate-400 hover:text-accent"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? "\u25B2" : "\u25BC"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const stats = player.seasonStats[0];
              const isSelected = player.id === selectedId;
              return (
                <tr
                  key={player.id}
                  onClick={() => setSelectedId(isSelected ? null : player.id)}
                  className={`cursor-pointer border-b border-surface-800 transition-colors ${
                    isSelected
                      ? "border-l-2 border-l-accent bg-surface-800"
                      : i % 2 === 0
                        ? "bg-surface-900"
                        : "bg-surface-950"
                  } hover:border-l-2 hover:border-l-accent hover:bg-surface-800`}
                >
                  <td className="px-3 py-2 text-slate-400">{player.jersey}</td>
                  <td className="px-3 py-2 font-medium text-white">
                    <Link to={`/players/${player.id}`} className="hover:text-accent">
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{player.position}</td>
                  <td className="px-3 py-2 text-slate-400">{player.classYear}</td>
                  <td className="px-3 py-2">{stats?.killsPerSet.toFixed(2) ?? "-"}</td>
                  <td className="px-3 py-2">{stats?.hittingPct.toFixed(3) ?? "-"}</td>
                  <td className="px-3 py-2">{stats?.assistsPerSet.toFixed(2) ?? "-"}</td>
                  <td className="px-3 py-2">{stats?.acesPerSet.toFixed(2) ?? "-"}</td>
                  <td className="px-3 py-2">{stats?.digsPerSet.toFixed(2) ?? "-"}</td>
                  <td className="px-3 py-2">{stats?.blocksPerSet.toFixed(2) ?? "-"}</td>
                  <td className="px-3 py-2 font-semibold text-accent">
                    {stats?.pointsPerSet.toFixed(2) ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { TeamDetail };
