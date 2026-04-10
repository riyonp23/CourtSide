import { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { getTeams, getTeam } from "../lib/api";
import { TeamCompareCard, aggregate } from "./TeamCompareCard";
import type { Team, TeamWithPlayers } from "../types";

const RADAR_KEYS = ["kills", "blocks", "aces", "hittingPct", "points"] as const;
const RADAR_LABELS: Record<string, string> = {
  kills: "Kills", blocks: "Blocks", aces: "Aces", hittingPct: "Hit%", points: "Points",
};

export function TeamCompareTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [teamA, setTeamA] = useState<TeamWithPlayers | null>(null);
  const [teamB, setTeamB] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getTeams().then(setTeams).catch(() => {}); }, []);

  useEffect(() => {
    if (!idA || !idB) return;
    setLoading(true); setError(null);
    Promise.all([getTeam(idA), getTeam(idB)])
      .then(([a, b]) => { setTeamA(a); setTeamB(b); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [idA, idB]);

  const highlights = (a: TeamWithPlayers, b: TeamWithPlayers): [Set<string>, Set<string>] => {
    const aggA = aggregate(a); const aggB = aggregate(b);
    const hA = new Set<string>(); const hB = new Set<string>();
    for (const key of RADAR_KEYS) {
      if (aggA[key] > aggB[key]) hA.add(key);
      else if (aggB[key] > aggA[key]) hB.add(key);
    }
    return [hA, hB];
  };

  const radarData = teamA && teamB ? (() => {
    const aggA = aggregate(teamA); const aggB = aggregate(teamB);
    return RADAR_KEYS.map((key) => {
      const maxVal = Math.max(aggA[key], aggB[key], 0.001);
      return { stat: RADAR_LABELS[key], teamA: Math.round((aggA[key] / maxVal) * 100), teamB: Math.round((aggB[key] / maxVal) * 100) };
    });
  })() : [];

  const [hA, hB] = teamA && teamB ? highlights(teamA, teamB) : [new Set<string>(), new Set<string>()];

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <select value={idA} onChange={(e) => setIdA(e.target.value)} className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white">
          <option value="">Select team...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={idB} onChange={(e) => setIdB(e.target.value)} className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-white">
          <option value="">Select team...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {loading && <div className="mt-8 animate-pulse"><div className="grid gap-4 sm:grid-cols-2"><div className="h-48 rounded bg-surface-800" /><div className="h-48 rounded bg-surface-800" /></div></div>}
      {error && <p className="mt-4 text-center text-red-400">Error: {error}</p>}
      {teamA && teamB && !loading && (
        <>
          <div className="mt-8 flex flex-wrap gap-4">
            <TeamCompareCard team={teamA} highlights={hA} />
            <TeamCompareCard team={teamB} highlights={hB} />
          </div>
          <div className="mt-8 rounded-lg border border-surface-800 bg-surface-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Team Comparison</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#243049" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Radar name={teamA.name} dataKey="teamA" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Radar name={teamB.name} dataKey="teamB" stroke="#ffffff" fill="#ffffff" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
