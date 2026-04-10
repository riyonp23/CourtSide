import { Link } from "react-router-dom";
import type { PlayerWithStats } from "../types";

const STAT_COLUMNS: { key: string; label: string }[] = [
  { key: "killsPerSet", label: "K/S" },
  { key: "hittingPct", label: "Hit%" },
  { key: "assistsPerSet", label: "A/S" },
  { key: "acesPerSet", label: "SA/S" },
  { key: "digsPerSet", label: "D/S" },
  { key: "blocksPerSet", label: "B/S" },
  { key: "pointsPerSet", label: "Pts/S" },
];

interface PlayerTableProps {
  players: PlayerWithStats[];
  highlightStat?: string;
  rankOffset?: number;
}

export function PlayerTable({
  players,
  highlightStat,
  rankOffset = 0,
}: PlayerTableProps) {
  const getStat = (p: PlayerWithStats, key: string): string => {
    if (!p.stats) return "-";
    const val = p.stats[key as keyof typeof p.stats];
    if (typeof val === "number") {
      return key === "hittingPct" ? val.toFixed(3) : val.toFixed(2);
    }
    return "-";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-800 bg-surface-800">
            <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              #
            </th>
            <th className="sticky left-0 bg-surface-800 px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              Name
            </th>
            <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              Team
            </th>
            <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              Conf
            </th>
            <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              Pos
            </th>
            <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">
              Class
            </th>
            {STAT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2 text-xs font-semibold uppercase ${
                  highlightStat === col.key
                    ? "text-accent"
                    : "text-slate-400"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <tr
              key={player.id}
              className={`border-b border-surface-800 transition-colors hover:border-l-2 hover:border-l-accent hover:bg-surface-800 ${
                i % 2 === 0 ? "bg-surface-900" : "bg-surface-950"
              }`}
            >
              <td className="px-4 py-2 text-slate-400">
                {rankOffset + i + 1}
              </td>
              <td className="sticky left-0 bg-inherit px-4 py-2 font-medium text-white">
                <Link to={`/players/${player.id}`} className="hover:text-accent">
                  {player.name}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-300">
                <Link to={`/teams/${player.teamId}`} className="hover:text-accent">
                  {player.teamName}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-400">
                <Link to={`/standings/${encodeURIComponent(player.conference)}`} className="hover:text-accent">
                  {player.conference}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-400">{player.position}</td>
              <td className="px-4 py-2 text-slate-400">{player.classYear}</td>
              {STAT_COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2 ${
                    highlightStat === col.key
                      ? "font-bold text-accent"
                      : "text-slate-300"
                  }`}
                >
                  {getStat(player, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
