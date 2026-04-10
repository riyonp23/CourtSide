import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PredictionBar } from "./PredictionBar";
import { getFeaturedMatchups } from "../lib/api";
import type { Prediction } from "../types";

const confidenceBadge: Record<string, string> = {
  high: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function FeaturedMatchups() {
  const [matchups, setMatchups] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedMatchups()
      .then((data) => setMatchups(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-36 animate-pulse rounded-xl bg-surface-800" />
          <div className="h-36 animate-pulse rounded-xl bg-surface-800" />
        </div>
      </div>
    );
  }

  if (matchups.length === 0) return null;

  const hero = matchups[0]!;
  const rest = matchups.slice(1);

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="font-outfit text-2xl font-bold tracking-wide text-amber-400 sm:text-3xl">
          🔮 MATCHUP SPOTLIGHT
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          AI-powered predictions for the biggest matchups in D1 volleyball
        </p>
      </div>

      <Link
        to="/matches"
        className="group relative block overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-surface-900 via-surface-900 to-amber-950/20 p-6 transition-all hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/10 sm:p-8 spotlight-glow"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 sm:gap-3">
              {hero.teamA.rank && (
                <span className="rounded-lg bg-amber-600/80 px-2 py-1 text-xs font-bold text-white">
                  #{hero.teamA.rank}
                </span>
              )}
              <span className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                {hero.teamA.name}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {hero.teamA.record} • {hero.teamA.conference}
            </p>
          </div>

          <div className="mx-4 flex flex-col items-center sm:mx-8">
            <span className="font-outfit text-2xl font-black tracking-widest text-slate-500 sm:text-3xl">
              VS
            </span>
          </div>

          <div className="flex-1 text-center sm:text-right">
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <span className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                {hero.teamB.name}
              </span>
              {hero.teamB.rank && (
                <span className="rounded-lg bg-white/20 px-2 py-1 text-xs font-bold text-white">
                  #{hero.teamB.rank}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {hero.teamB.record} • {hero.teamB.conference}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PredictionBar teamA={hero.teamA} teamB={hero.teamB} confidence={hero.confidence} size="lg" />
        </div>

        {hero.keyFactors.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${confidenceBadge[hero.confidence]}`}>
              {hero.confidence} confidence
            </span>
            {hero.keyFactors.map((factor, i) => (
              <span key={i} className="rounded-full bg-surface-800 px-3 py-1 text-xs text-slate-400">
                {factor}
              </span>
            ))}
          </div>
        )}
      </Link>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((m, i) => (
            <Link
              key={i}
              to="/matches"
              className="rounded-xl border border-surface-800 bg-surface-900 p-4 transition-all hover:border-surface-700 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white">
                <span>
                  {m.teamA.rank ? `#${m.teamA.rank} ` : ""}
                  {truncate(m.teamA.name)}
                </span>
                <span className="text-xs text-slate-600">vs</span>
                <span>
                  {m.teamB.rank ? `#${m.teamB.rank} ` : ""}
                  {truncate(m.teamB.name)}
                </span>
              </div>
              <PredictionBar teamA={m.teamA} teamB={m.teamB} confidence={m.confidence} size="sm" />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/matches"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
        >
          See All Matchups →
        </Link>
      </div>
    </div>
  );
}

function truncate(name: string): string {
  return name.length > 16 ? name.slice(0, 14) + "..." : name;
}
