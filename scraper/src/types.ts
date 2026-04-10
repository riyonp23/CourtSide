export interface ScrapedTeam {
  name: string;
  ncaaId: string;
  conference: string;
  statsUrl?: string;
}

export interface ScrapedPlayer {
  name: string;
  jersey: string | null;
  position: "OH" | "MB" | "S" | "L" | "OPP" | "DS";
  classYear: "FR" | "SO" | "JR" | "SR";
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

export interface ScrapedMatch {
  date: string;
  opponentName: string;
  opponentNcaaId: string | null;
  location: string | null;
  result: "W" | "L" | null;
  homeSets: number;
  awaySets: number;
  homeScore: number;
  awayScore: number;
}
