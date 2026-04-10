import { Link } from "react-router-dom";
import type { Team } from "../types";

interface TeamRowProps {
  team: Team;
}

export function TeamRow({ team }: TeamRowProps) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="group block rounded-lg border border-surface-800 bg-surface-900 p-5 transition-all duration-200 hover:scale-[1.01] hover:border-accent"
    >
      <p className="text-lg font-semibold text-white group-hover:text-accent">
        {team.name}
      </p>
      <p className="mt-1 text-sm text-slate-400">{team.conference}</p>
      <p className="mt-2 text-2xl font-bold text-accent">
        {team.wins}-{team.losses}
      </p>
    </Link>
  );
}
