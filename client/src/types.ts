export interface Team {
  id: string;
  ncaaId: string;
  name: string;
  conference: string;
  division: string;
  logoUrl: string;
  season: string;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  coachesPollRank: number | null;
  nationalTitles: number;
  titleYears: string | null;
}

export interface PlayerSeasonStats {
  id: string;
  season: string;
  setsPlayed: number;
  kills: number;
  killsPerSet: number;
  hittingPct: number;
  assists: number;
  assistsPerSet: number;
  aces: number;
  acesPerSet: number;
  digs: number;
  digsPerSet: number;
  blocks: number;
  blocksPerSet: number;
  points: number;
  pointsPerSet: number;
}

export interface Player {
  id: string;
  ncaaId: string;
  name: string;
  position: string;
  jersey: number;
  classYear: string;
  season: string;
  seasonStats: PlayerSeasonStats[];
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface PlayerWithStats {
  id: string;
  name: string;
  position: string;
  classYear: string;
  teamId: string;
  teamName: string;
  conference: string;
  stats: PlayerSeasonStats | null;
}

export interface PlayerDetail {
  id: string;
  ncaaId: string;
  name: string;
  position: string;
  jersey: number;
  classYear: string;
  season: string;
  team: {
    id: string;
    name: string;
    conference: string;
    division: string;
    season: string;
    wins: number;
    losses: number;
  };
  seasonStats: PlayerSeasonStats[];
}

export interface ComparePlayer {
  id: string;
  ncaaId: string;
  name: string;
  position: string;
  jersey: string;
  classYear: string;
  season: string;
  team: {
    id: string;
    name: string;
    conference: string;
    division: string;
    season: string;
    wins: number;
    losses: number;
  };
  seasonStats: PlayerSeasonStats[];
}

export interface StandingsConference {
  name: string;
  teams: Team[];
}

export interface PredictionTeam {
  id: string;
  name: string;
  conference: string;
  record: string;
  winProb: number;
  rank: number | null;
}

export interface Prediction {
  teamA: PredictionTeam;
  teamB: PredictionTeam;
  confidence: "high" | "medium" | "low";
  keyFactors: string[];
}
