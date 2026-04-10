import { Link } from "react-router-dom";

const pills = [
  { emoji: "\uD83C\uDFD0", label: "Teams", to: "/teams" },
  { emoji: "\uD83D\uDCCA", label: "Leaderboard", to: "/players" },
  { emoji: "\u26A1", label: "Compare", to: "/compare" },
  { emoji: "\uD83C\uDFC6", label: "Standings", to: "/standings" },
  { emoji: "🔮", label: "Matches", to: "/matches" },
];

export function QuickGuide() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {pills.map((pill) => (
        <Link
          key={pill.to}
          to={pill.to}
          className="flex items-center gap-2 rounded-full bg-surface-800 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-amber-500/20 hover:text-amber-400"
        >
          <span>{pill.emoji}</span>
          <span>{pill.label}</span>
        </Link>
      ))}
    </div>
  );
}
