import { useState, useEffect } from "react";
import { getTeams, getPrediction } from "../lib/api";
import { MatchupCard } from "./MatchupCard";
import type { Team, Prediction } from "../types";

export function MatchupBuilder() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTeams().then(setTeams).catch(() => {});
  }, []);

  const canPredict = teamAId && teamBId && teamAId !== teamBId && !loading;

  const handlePredict = async () => {
    if (!canPredict) return;
    setLoading(true);
    try {
      const result = await getPrediction(teamAId, teamBId);
      setPrediction(result);
    } catch {
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-400">Team A</label>
          <select
            value={teamAId}
            onChange={(e) => { setTeamAId(e.target.value); setPrediction(null); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select a team...</option>
            {sorted.map((t) => (
              <option key={t.id} value={t.id}>
                {t.coachesPollRank ? `#${t.coachesPollRank} ` : ""}{t.name}
              </option>
            ))}
          </select>
        </div>

        <span className="hidden text-sm font-bold text-slate-600 sm:block sm:pb-2.5">vs</span>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-400">Team B</label>
          <select
            value={teamBId}
            onChange={(e) => { setTeamBId(e.target.value); setPrediction(null); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select a team...</option>
            {sorted.map((t) => (
              <option key={t.id} value={t.id}>
                {t.coachesPollRank ? `#${t.coachesPollRank} ` : ""}{t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePredict}
          disabled={!canPredict}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      {teamAId && teamBId && teamAId === teamBId && (
        <p className="mt-2 text-xs text-red-400">Please select two different teams.</p>
      )}

      {prediction && (
        <div className="mt-6">
          <MatchupCard prediction={prediction} />
        </div>
      )}
    </div>
  );
}
