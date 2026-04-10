import { Link } from "react-router-dom";
import type { TeamWithPlayers } from "../types";

interface TeamAgg {
  kills: number;
  blocks: number;
  aces: number;
  hittingPct: number;
  points: number;
}

function aggregate(team: TeamWithPlayers): TeamAgg {
  let kills = 0, blocks = 0, aces = 0, points = 0;
  let hittingPctSum = 0, hittingCount = 0;
  for (const p of team.players) {
    const s = p.seasonStats[0];
    if (!s) continue;
    kills += s.kills;
    blocks += s.blocks;
    aces += s.aces;
    points += s.points;
    hittingPctSum += s.hittingPct;
    hittingCount++;
  }
  return {
    kills,
    blocks,
    aces,
    hittingPct: hittingCount > 0 ? hittingPctSum / hittingCount : 0,
    points,
  };
}

interface TeamCompareCardProps {
  team: TeamWithPlayers;
  highlights: Set<string>;
}

export function TeamCompareCard({ team, highlights }: TeamCompareCardProps) {
  const agg = aggregate(team);
  const total = team.wins + team.losses;
  const winPct = total > 0 ? ((team.wins / total) * 100).toFixed(1) : "0.0";

  const rows: { key: string; label: string; value: string }[] = [
    { key: "kills", label: "Total Kills", value: String(agg.kills) },
    { key: "blocks", label: "Total Blocks", value: String(agg.blocks) },
    { key: "aces", label: "Total Aces", value: String(agg.aces) },
    { key: "hittingPct", label: "Avg Hitting %", value: agg.hittingPct.toFixed(3) },
    { key: "points", label: "Total Points", value: String(agg.points) },
  ];

  return (
    <div className="min-w-[220px] flex-1 rounded-lg border border-surface-800 border-t-accent bg-surface-900 p-5">
      <Link to={`/teams/${team.id}`} className="text-lg font-bold text-white hover:text-accent">
        {team.name}
      </Link>
      <p className="text-sm text-slate-400">
        <Link
          to={`/standings/${encodeURIComponent(team.conference)}`}
          className="hover:text-accent"
        >
          {team.conference}
        </Link>
      </p>
      <p className="mt-2 text-2xl font-bold text-accent">
        {team.wins}-{team.losses}{" "}
        <span className="text-sm font-normal text-slate-400">({winPct}%)</span>
      </p>

      <div className="mt-4 space-y-1.5">
        {rows.map((row) => {
          const isLeading = highlights.has(row.key);
          return (
            <div key={row.key} className="flex items-center justify-between text-sm">
              <span className={isLeading ? "text-accent" : "text-slate-400"}>
                {row.label}
              </span>
              <span className={isLeading ? "font-bold text-accent" : "text-white"}>
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { aggregate };
