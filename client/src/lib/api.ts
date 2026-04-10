import type {
  Team,
  TeamWithPlayers,
  PlayerWithStats,
  PlayerDetail,
  ComparePlayer,
  StandingsConference,
  Prediction,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getTeams(
  conference?: string
): Promise<Team[]> {
  const params = conference
    ? `?conference=${encodeURIComponent(conference)}`
    : "";
  const data = await fetchJson<{ teams: Team[] }>(`/teams${params}`);
  return data.teams;
}

export async function getTeam(id: string): Promise<TeamWithPlayers> {
  const data = await fetchJson<{ team: TeamWithPlayers }>(`/teams/${id}`);
  return data.team;
}

export async function getPlayers(params?: {
  stat?: string;
  conference?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ players: PlayerWithStats[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.stat) searchParams.set("stat", params.stat);
  if (params?.conference) searchParams.set("conference", params.conference);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const qs = searchParams.toString();
  return fetchJson<{ players: PlayerWithStats[]; total: number }>(
    `/players${qs ? `?${qs}` : ""}`
  );
}

export async function getStandings(): Promise<{ conferences: StandingsConference[]; allTeams: Team[] }> {
  return fetchJson<{ conferences: StandingsConference[]; allTeams: Team[] }>("/standings");
}

export async function getPlayer(id: string): Promise<PlayerDetail> {
  const data = await fetchJson<{ player: PlayerDetail }>(`/players/${id}`);
  return data.player;
}

export async function getAllPlayers(): Promise<PlayerWithStats[]> {
  const data = await fetchJson<{ players: PlayerWithStats[]; total: number }>(
    "/players?limit=100&stat=killsPerSet"
  );
  const all: PlayerWithStats[] = [...data.players];
  if (data.total > 100) {
    const remaining = await fetchJson<{ players: PlayerWithStats[] }>(
      `/players?limit=100&offset=100&stat=killsPerSet`
    );
    all.push(...remaining.players);
    if (data.total > 200) {
      const more = await fetchJson<{ players: PlayerWithStats[] }>(
        `/players?limit=100&offset=200&stat=killsPerSet`
      );
      all.push(...more.players);
    }
    if (data.total > 300) {
      const more = await fetchJson<{ players: PlayerWithStats[] }>(
        `/players?limit=100&offset=300&stat=killsPerSet`
      );
      all.push(...more.players);
    }
  }
  return all;
}

export async function comparePlayers(
  ids: string[]
): Promise<ComparePlayer[]> {
  const data = await fetchJson<{ players: ComparePlayer[] }>(
    `/compare?ids=${ids.join(",")}`
  );
  return data.players;
}

export async function getPrediction(teamAId: string, teamBId: string): Promise<Prediction> {
  const data = await fetchJson<{ prediction: Prediction }>(
    `/predict?teamA=${encodeURIComponent(teamAId)}&teamB=${encodeURIComponent(teamBId)}`
  );
  return data.prediction;
}

export async function getFeaturedMatchups(): Promise<Prediction[]> {
  const data = await fetchJson<{ matchups: Prediction[] }>("/predict/featured");
  return data.matchups;
}
