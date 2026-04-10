import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStandings } from "../lib/api";
import type { StandingsConference, Team } from "../types";

type Tab = "overall" | "conference";

export default function Standings() {
  const [conferences, setConferences] = useState<StandingsConference[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overall");

  useEffect(() => {
    getStandings()
      .then((data) => { setConferences(data.conferences); setAllTeams(data.allTeams); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <div className="h-6 w-1/4 rounded bg-surface-800" />
            <div className="mt-3 h-40 rounded bg-surface-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      tab === t ? "bg-accent text-surface-950" : "bg-surface-800 text-slate-300 hover:text-white"
    }`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Standings</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("overall")} className={tabClass("overall")}>Overall Rankings</button>
          <button onClick={() => setTab("conference")} className={tabClass("conference")}>By Conference</button>
        </div>
      </div>

      {tab === "overall" ? (
        <OverallView teams={allTeams} />
      ) : (
        <ConferenceView conferences={conferences} />
      )}
    </div>
  );
}

function OverallView({ teams }: { teams: Team[] }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-surface-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-800 bg-surface-900">
            {["Rank", "Team", "Conference", "W", "L", "Win%", "Titles"].map((h) => (
              <th key={h} className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const total = team.wins + team.losses;
            const winPct = total > 0 ? (team.wins / total) * 100 : 0;
            const isTop5 = team.coachesPollRank !== null && team.coachesPollRank <= 5;
            return (
              <tr
                key={team.id}
                className={`border-b border-surface-800 transition-colors ${
                  isTop5 ? "border-l-2 border-l-amber-500" : ""
                } ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-950"} hover:bg-surface-800`}
              >
                <td className="px-4 py-2 font-semibold text-amber-400">
                  {team.coachesPollRank ?? "-"}
                </td>
                <td className="px-4 py-2">
                  <Link to={`/teams/${team.id}`} className="font-medium text-white hover:text-accent">
                    {team.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-400">{team.conference}</td>
                <td className="px-4 py-2 font-semibold text-accent">{team.wins}</td>
                <td className="px-4 py-2 text-slate-400">{team.losses}</td>
                <td className="px-4 py-2 text-slate-300">{winPct.toFixed(1)}%</td>
                <td className="px-4 py-2 text-slate-300">
                  {team.nationalTitles > 0 ? <span>🏆 {team.nationalTitles}</span> : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConferenceView({ conferences }: { conferences: StandingsConference[] }) {
  return (
    <div className="mt-8 space-y-10">
      {conferences.map((conf) => (
        <section key={conf.name}>
          <div className="rounded-t-lg border border-surface-800 bg-surface-800 px-4 py-2">
            <Link
              to={`/standings/${encodeURIComponent(conf.name)}`}
              className="text-sm font-semibold uppercase tracking-wide text-slate-300 hover:text-accent"
            >
              {conf.name}
            </Link>
          </div>
          <div className="overflow-x-auto rounded-b-lg border border-t-0 border-surface-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-800 bg-surface-900">
                  {["Rank", "Team", "W", "L", "Win%"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-semibold uppercase text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conf.teams.map((team, i) => {
                  const total = team.wins + team.losses;
                  const winPct = total > 0 ? (team.wins / total) * 100 : 0;
                  return (
                    <tr
                      key={team.id}
                      className={`border-b border-surface-800 transition-colors ${
                        i === 0 ? "border-l-2 border-l-accent" : ""
                      } ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-950"} hover:bg-surface-800`}
                    >
                      <td className="px-4 py-2 text-amber-400">{team.coachesPollRank ?? "-"}</td>
                      <td className="px-4 py-2">
                        <Link to={`/teams/${team.id}`} className="font-medium text-white hover:text-accent">
                          {team.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 font-semibold text-accent">{team.wins}</td>
                      <td className="px-4 py-2 text-slate-400">{team.losses}</td>
                      <td className="px-4 py-2 text-slate-300">{winPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export { Standings };
