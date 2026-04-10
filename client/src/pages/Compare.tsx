import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { comparePlayers, getPlayer } from "../lib/api";
import { PlayerSearch } from "../components/PlayerSearch";
import { CompareCard } from "../components/CompareCard";
import { TeamCompareTab } from "../components/TeamCompareTab";
import type { ComparePlayer, PlayerSeasonStats, PlayerWithStats } from "../types";

type Tab = "players" | "teams";

const RADAR_STATS: { key: keyof PlayerSeasonStats; label: string }[] = [
  { key: "killsPerSet", label: "Kills" }, { key: "hittingPct", label: "Hit%" },
  { key: "assistsPerSet", label: "Assists" }, { key: "acesPerSet", label: "Aces" },
  { key: "digsPerSet", label: "Digs" }, { key: "blocksPerSet", label: "Blocks" },
];
const COLORS = ["#f59e0b", "#ffffff", "#94a3b8", "#64748b"];
const CMP_STATS: (keyof PlayerSeasonStats)[] = [
  "setsPlayed", "killsPerSet", "hittingPct", "assistsPerSet", "acesPerSet",
  "digsPerSet", "blocksPerSet", "pointsPerSet", "kills", "assists",
  "aces", "digs", "blocks", "points",
];

function toPlayerWithStats(p: ComparePlayer): PlayerWithStats {
  return {
    id: p.id, name: p.name, position: p.position, classYear: p.classYear,
    teamId: p.team.id, teamName: p.team.name, conference: p.team.conference,
    stats: p.seasonStats[0] ?? null,
  };
}

export default function Compare() {
  const [tab, setTab] = useState<Tab>("players");
  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      tab === t ? "bg-accent text-surface-950" : "bg-surface-800 text-slate-300 hover:text-white"
    }`;

  return (
    <div>
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Compare</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("players")} className={tabClass("players")}>Compare Players</button>
          <button onClick={() => setTab("teams")} className={tabClass("teams")}>Compare Teams</button>
        </div>
      </div>
      {tab === "players" ? <PlayerCompare /> : <TeamCompareTab />}
    </div>
  );
}

function PlayerCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<PlayerWithStats[]>([]);
  const [compared, setCompared] = useState<ComparePlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotCount, setSlotCount] = useState(2);
  const [copied, setCopied] = useState(false);
  const [init, setInit] = useState(false);

  const updateUrl = useCallback((players: PlayerWithStats[]) => {
    if (players.length > 0) {
      setSearchParams({ ids: players.map((p) => p.id).join(",") }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (init) return;
    const idsParam = searchParams.get("ids");
    if (!idsParam) { setInit(true); return; }
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) { setInit(true); return; }
    setSlotCount(Math.max(2, ids.length + (ids.length < 4 ? 1 : 0)));
    if (ids.length >= 2) {
      setLoading(true);
      comparePlayers(ids)
        .then((players) => { setCompared(players); setSelected(players.map(toPlayerWithStats)); })
        .catch((err: Error) => setError(err.message))
        .finally(() => { setLoading(false); setInit(true); });
    } else {
      setInit(true);
      getPlayer(ids[0] as string).then((p) => {
        setSelected([{
          id: p.id, name: p.name, position: p.position, classYear: p.classYear,
          teamId: p.team.id, teamName: p.team.name, conference: p.team.conference,
          stats: p.seasonStats[0] ?? null,
        }]);
      }).catch(() => {});
    }
  }, [searchParams, init]);

  const handleSelect = (index: number, player: PlayerWithStats) => {
    const next = [...selected]; next[index] = player;
    const filtered = next.filter(Boolean);
    setSelected(filtered); updateUrl(filtered);
  };
  const handleRemove = (index: number) => {
    const next = selected.filter((_, i) => i !== index);
    setSelected(next); updateUrl(next);
    if (slotCount > 2 && next.length < slotCount - 1) setSlotCount(Math.max(2, next.length + 1));
  };
  const fetchComparison = () => {
    if (selected.length < 2) return;
    setLoading(true); setError(null);
    comparePlayers(selected.map((p) => p.id))
      .then(setCompared).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const excludeIds = selected.map((p) => p.id);
  const getLeads = (player: ComparePlayer, all: ComparePlayer[]): Set<string> => {
    const leads = new Set<string>();
    const stats = player.seasonStats[0];
    if (!stats) return leads;
    for (const key of CMP_STATS) {
      const val = stats[key];
      if (typeof val !== "number") continue;
      if (all.every((p) => { const s = p.seasonStats[0]; return !s || (s[key] as number) <= val; }))
        leads.add(key);
    }
    return leads;
  };
  const radarData = RADAR_STATS.map((rs) => {
    const mx = Math.max(...compared.map((p) => { const s = p.seasonStats[0]; return s ? (s[rs.key] as number) : 0; }), 0.001);
    const e: Record<string, string | number> = { stat: rs.label };
    compared.forEach((p, i) => { const s = p.seasonStats[0]; e[`p${i}`] = Math.round(((s ? (s[rs.key] as number) : 0) / mx) * 100); });
    return e;
  });

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        {selected.length >= 1 && (
          <div className="relative">
            <button onClick={handleShare} className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-white transition-colors hover:border-accent">Share</button>
            {copied && <span className="share-toast absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-surface-950">Copied!</span>}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: slotCount }, (_, i) => (
          <div key={i} className="flex-1">
            {selected[i] ? (
              <div className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white">
                <span>{selected[i].name} <span className="text-slate-400">— {selected[i].teamName}</span></span>
                <button onClick={() => handleRemove(i)} className="ml-2 text-slate-400 hover:text-red-400">✕</button>
              </div>
            ) : (
              <PlayerSearch onSelect={(p) => handleSelect(i, p)} excludeIds={excludeIds} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        {slotCount < 4 && (
          <button onClick={() => setSlotCount((c) => c + 1)} className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-white transition-colors hover:border-accent">+ Add Player</button>
        )}
        {selected.length >= 2 && (
          <button onClick={fetchComparison} disabled={loading} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-surface-950 transition-colors hover:bg-accent-hover disabled:opacity-50">{loading ? "Comparing..." : "Compare"}</button>
        )}
      </div>
      {selected.length < 2 && compared.length === 0 && <p className="mt-8 text-center text-slate-400">Select at least 2 players to compare</p>}
      {error && <p className="mt-4 text-center text-red-400">Error: {error}</p>}
      {compared.length >= 2 && (
        <>
          <div className="mt-8 flex flex-wrap gap-4">
            {compared.map((player) => <CompareCard key={player.id} player={player} statHighlights={getLeads(player, compared)} />)}
          </div>
          <div className="mt-8 rounded-lg border border-surface-800 bg-surface-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Per-Set Stats Comparison</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#243049" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                {compared.map((player, i) => <Radar key={player.id} name={player.name} dataKey={`p${i}`} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />)}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export { Compare };
