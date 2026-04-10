import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayer, getAllPlayers } from "../lib/api";
import { PercentileBar } from "../components/PercentileBar";
import type { PlayerDetail as PlayerDetailType, PlayerSeasonStats, PlayerWithStats } from "../types";

const STAT_DEFS: { key: keyof PlayerSeasonStats; label: string }[] = [
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

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allPlayersRef = useRef<PlayerWithStats[] | null>(null);
  const [allReady, setAllReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPlayer(id)
      .then(setPlayer)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (allPlayersRef.current) {
      setAllReady(true);
      return;
    }
    getAllPlayers().then((all) => {
      allPlayersRef.current = all;
      setAllReady(true);
    }).catch(() => {});
  }, []);

  const allValuesFor = (key: keyof PlayerSeasonStats): number[] => {
    if (!allPlayersRef.current) return [];
    return allPlayersRef.current
      .map((p) => (p.stats ? (p.stats[key] as number) : null))
      .filter((v): v is number => v !== null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-surface-800" />
        <div className="h-6 w-1/4 rounded bg-surface-800" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="h-12 rounded bg-surface-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-400">Error: {error}</p>;
  if (!player) return <p className="text-center text-slate-400">Player not found.</p>;

  const stats = player.seasonStats[0] ?? null;

  return (
    <div>
      <Link to="/players" className="text-sm text-slate-400 hover:text-accent">
        &larr; All Players
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold">{player.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded border border-surface-700 bg-surface-800 px-2 py-0.5 text-xs text-slate-300">
            {player.position}
          </span>
          <span className="rounded border border-surface-700 bg-surface-800 px-2 py-0.5 text-xs text-slate-300">
            {player.classYear}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          <Link to={`/teams/${player.team.id}`} className="text-white hover:text-accent">
            {player.team.name}
          </Link>
          {" · "}
          <Link
            to={`/standings/${encodeURIComponent(player.team.conference)}`}
            className="hover:text-accent"
          >
            {player.team.conference}
          </Link>
        </p>
      </div>

      {stats && allReady && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {STAT_DEFS.map((def) => (
            <PercentileBar
              key={def.key}
              label={def.label}
              value={stats[def.key] as number}
              allValues={allValuesFor(def.key)}
            />
          ))}
        </div>
      )}

      {!stats && (
        <p className="mt-8 text-center text-slate-400">No stats available for this player.</p>
      )}

      <div className="mt-8">
        <Link
          to={`/compare?ids=${player.id}`}
          className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-950 transition-colors hover:bg-accent-hover"
        >
          Compare with...
        </Link>
      </div>
    </div>
  );
}

export { PlayerDetailPage as PlayerDetail };
