import { Link } from "react-router-dom";
import type { ComparePlayer, PlayerSeasonStats } from "../types";

const STAT_ROWS: { key: keyof PlayerSeasonStats; label: string }[] = [
  { key: "setsPlayed", label: "Sets Played" },
  { key: "killsPerSet", label: "Kills/Set" },
  { key: "hittingPct", label: "Hitting %" },
  { key: "assistsPerSet", label: "Assists/Set" },
  { key: "acesPerSet", label: "Aces/Set" },
  { key: "digsPerSet", label: "Digs/Set" },
  { key: "blocksPerSet", label: "Blocks/Set" },
  { key: "pointsPerSet", label: "Points/Set" },
  { key: "kills", label: "Total Kills" },
  { key: "assists", label: "Total Assists" },
  { key: "aces", label: "Total Aces" },
  { key: "digs", label: "Total Digs" },
  { key: "blocks", label: "Total Blocks" },
  { key: "points", label: "Total Points" },
];

interface CompareCardProps {
  player: ComparePlayer;
  statHighlights: Set<string>;
}

export function CompareCard({ player, statHighlights }: CompareCardProps) {
  const stats = player.seasonStats[0] ?? null;

  const formatVal = (key: keyof PlayerSeasonStats, val: number): string => {
    if (key === "hittingPct") return val.toFixed(3);
    if (key === "setsPlayed" || key === "kills" || key === "assists" || key === "aces" || key === "digs" || key === "blocks" || key === "points") {
      return String(val);
    }
    return val.toFixed(2);
  };

  return (
    <div className="min-w-[220px] flex-1 rounded-lg border border-surface-800 border-t-accent bg-surface-900 p-5">
      <Link to={`/players/${player.id}`} className="text-lg font-bold text-white hover:text-accent">
        {player.name}
      </Link>
      <p className="text-sm text-slate-400">
        <Link to={`/teams/${player.team.id}`} className="hover:text-accent">
          {player.team.name}
        </Link>
        {" ("}
        <Link to={`/standings/${encodeURIComponent(player.team.conference)}`} className="hover:text-accent">
          {player.team.conference}
        </Link>
        {")"}
      </p>

      <div className="mt-3 flex gap-2">
        <span className="rounded bg-surface-800 px-2 py-0.5 text-xs text-slate-300">
          {player.position}
        </span>
        <span className="rounded bg-surface-800 px-2 py-0.5 text-xs text-slate-300">
          {player.classYear}
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        {stats ? (
          STAT_ROWS.map((row) => {
            const val = stats[row.key];
            const isLeading = statHighlights.has(row.key);
            return (
              <div
                key={row.key}
                className="flex items-center justify-between text-sm"
              >
                <span className={isLeading ? "text-accent" : "text-slate-400"}>
                  {row.label}
                </span>
                <span
                  className={
                    isLeading ? "font-bold text-accent" : "text-white"
                  }
                >
                  {typeof val === "number" ? formatVal(row.key, val) : "-"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">No stats available</p>
        )}
      </div>
    </div>
  );
}
