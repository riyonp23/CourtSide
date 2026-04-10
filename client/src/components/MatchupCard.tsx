import { Link } from "react-router-dom";
import { PredictionBar } from "./PredictionBar";
import type { Prediction } from "../types";

interface MatchupCardProps {
  prediction: Prediction;
}

const confidenceBadge: Record<string, string> = {
  high: "bg-green-500/20 text-green-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-slate-500/20 text-slate-400",
};

export function MatchupCard({ prediction }: MatchupCardProps) {
  const { teamA, teamB, confidence, keyFactors } = prediction;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-5 transition-all hover:border-surface-700 hover:shadow-lg hover:shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Matchup Prediction
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${confidenceBadge[confidence]}`}>
          {confidence}
        </span>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="text-center">
          <Link to={`/teams/${teamA.id}`} className="text-lg font-bold text-white hover:text-amber-400 transition-colors">
            {teamA.rank && <span className="text-amber-500 mr-1">#{teamA.rank}</span>}
            {teamA.name}
          </Link>
          <p className="text-sm text-slate-500">{teamA.record} &middot; {teamA.conference}</p>
        </div>
        <span className="text-sm font-bold text-slate-600">vs</span>
        <div className="text-center">
          <Link to={`/teams/${teamB.id}`} className="text-lg font-bold text-white hover:text-amber-400 transition-colors">
            {teamB.rank && <span className="text-amber-500 mr-1">#{teamB.rank}</span>}
            {teamB.name}
          </Link>
          <p className="text-sm text-slate-500">{teamB.record} &middot; {teamB.conference}</p>
        </div>
      </div>

      <PredictionBar teamA={teamA} teamB={teamB} confidence={confidence} />

      <ul className="mt-4 space-y-1">
        {keyFactors.map((factor, i) => (
          <li key={i} className="text-xs text-slate-500">
            &bull; {factor}
          </li>
        ))}
      </ul>
    </div>
  );
}
