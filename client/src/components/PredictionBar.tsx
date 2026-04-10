import { useState, useEffect } from "react";

interface PredictionBarProps {
  teamA: { name: string; winProb: number; rank: number | null };
  teamB: { name: string; winProb: number; rank: number | null };
  confidence: "high" | "medium" | "low";
  size?: "sm" | "md" | "lg";
}

const confidenceColors: Record<string, string> = {
  high: "bg-green-500/20 text-green-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-slate-500/20 text-slate-400",
};

export function PredictionBar({ teamA, teamB, confidence, size = "md" }: PredictionBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const pctA = Math.round(teamA.winProb * 100);
  const pctB = Math.round(teamB.winProb * 100);
  const compact = size === "sm";
  const large = size === "lg";
  const barHeight = compact ? "h-7" : large ? "h-12" : "h-10";
  const textSize = compact ? "text-xs" : large ? "text-base" : "text-sm";

  return (
    <div className="w-full">
      <div className={`relative ${barHeight} overflow-hidden rounded-lg bg-surface-800`}>
        <div
          className="absolute inset-y-0 left-0 bg-amber-500/80 transition-all duration-[800ms] ease-out"
          style={{ width: animated ? `${pctA}%` : "50%" }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-white/20 transition-all duration-[800ms] ease-out"
          style={{ width: animated ? `${pctB}%` : "50%" }}
        />
        <div className={`relative flex h-full items-center justify-between px-3 ${textSize} font-medium`}>
          <span className="flex items-center gap-1.5 text-white drop-shadow-sm">
            {teamA.rank && (
              <span className="rounded bg-amber-600/80 px-1.5 py-0.5 text-[10px] font-bold">#{teamA.rank}</span>
            )}
            {compact ? truncate(teamA.name) : teamA.name} {pctA}%
          </span>
          <span className="flex items-center gap-1.5 text-white drop-shadow-sm">
            {pctB}% {compact ? truncate(teamB.name) : teamB.name}
            {teamB.rank && (
              <span className="rounded bg-white/30 px-1.5 py-0.5 text-[10px] font-bold">#{teamB.rank}</span>
            )}
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex justify-center">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${confidenceColors[confidence]}`}>
          {confidence} confidence
        </span>
      </div>
    </div>
  );
}

function truncate(name: string): string {
  return name.length > 14 ? name.slice(0, 12) + "..." : name;
}
