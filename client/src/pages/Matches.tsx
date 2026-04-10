import { useState, useEffect } from "react";
import { MatchupCard } from "../components/MatchupCard";
import { MatchupBuilder } from "../components/MatchupBuilder";
import { getFeaturedMatchups } from "../lib/api";
import type { Prediction } from "../types";

export default function Matches() {
  const [featured, setFeatured] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedMatchups()
      .then(setFeatured)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Match Predictions</h1>
        <p className="mt-2 text-slate-400">AI-powered matchup analysis based on team performance data</p>
      </div>

      <section className="mb-12">
        <h2 className="mb-5 text-xl font-bold text-white">Featured Matchups</h2>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-surface-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {featured.map((m, i) => (
              <MatchupCard key={i} prediction={m} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-5 text-xl font-bold text-white">Build Your Matchup</h2>
        <MatchupBuilder />
      </section>

      <p className="text-center text-xs text-slate-600">
        Predictions are based on a weighted logistic model using team season statistics. Not affiliated with the NCAA.
      </p>
    </div>
  );
}

export { Matches };
