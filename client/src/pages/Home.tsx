import { useState, useEffect, useCallback } from "react";
import { StatCard } from "../components/StatCard";
import { TopTeams } from "../components/TopTeams";
import { QuickGuide } from "../components/QuickGuide";
import { ScrapeStatus } from "../components/ScrapeStatus";
import { FeaturedMatchups } from "../components/FeaturedMatchups";
import { getTeams, getPlayers } from "../lib/api";

interface HomeStats {
  teams: number;
  players: number;
  conferences: number;
  matches: number;
}

const FALLBACK: HomeStats = { teams: 71, players: 329, conferences: 6, matches: 1200 };

export default function Home() {
  const [stats, setStats] = useState<HomeStats>(FALLBACK);

  const refreshStats = useCallback(() => {
    Promise.all([getTeams(), getPlayers({ limit: 1 })])
      .then(([teams, playerData]) => {
        const confs = new Set(teams.map((t) => t.conference));
        const totalMatches = teams.reduce((sum, t) => sum + t.wins + t.losses, 0);
        setStats({
          teams: teams.length,
          players: playerData.total,
          conferences: confs.size,
          matches: Math.floor(totalMatches / 2),
        });
      })
      .catch(() => setStats(FALLBACK));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="py-10">
      <div className="text-center">
        <h1 className="font-outfit text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-accent">COURT</span>
          <span className="text-white">SIDE</span>
        </h1>
        <p className="mt-2 text-xl text-slate-300">NCAA D1 Men&apos;s Volleyball</p>
        <p className="mt-1 text-sm text-slate-500">2025-26 Season Analytics</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Teams" value={stats.teams} />
        <StatCard label="Players" value={stats.players} />
        <StatCard label="Conferences" value={stats.conferences} />
        <StatCard label="Matches Tracked" value={stats.matches} />
      </div>

      <div className="mt-6">
        <ScrapeStatus onComplete={refreshStats} />
      </div>

      <div className="mt-10">
        <FeaturedMatchups />
      </div>

      <div className="mt-8">
        <QuickGuide />
      </div>

      <hr className="my-10 border-surface-800" />
      <TopTeams />
    </div>
  );
}

export { Home };
