import * as cheerio from "cheerio";
import { fetchWithRetry, sleep } from "./utils";
import type { ScrapedPlayer } from "./types";

// Individual ranking stat_seq values for MVB
const STAT_PAGES = {
  kills: { seq: "521.0", totalCol: "Kills", perSetCol: "Per Set" },
  hittingPct: { seq: "520.0", totalCol: "Attacks", perSetCol: "Pct." },
  assists: { seq: "522.0", totalCol: "Assists", perSetCol: "Per Set" },
  aces: { seq: "532.0", totalCol: "Aces", perSetCol: "Per Set" },
  digs: { seq: "524.0", totalCol: "Digs", perSetCol: "Per Set" },
  blocks: { seq: "523.0", totalCol: "Blocks", perSetCol: "Per Set" },
  points: { seq: "686.0", totalCol: "Points", perSetCol: "Per Set" },
} as const;

const RANKING_BASE =
  "https://stats.ncaa.org/rankings/national_ranking?academic_year=2026.0&division=1.0&ranking_period=67.0&sport_code=MVB&stat_seq=";

const POSITION_MAP: Record<string, ScrapedPlayer["position"]> = {
  OH: "OH",
  OPP: "OPP",
  RS: "OPP",
  MB: "MB",
  MH: "MB",
  M: "MB",
  S: "S",
  SET: "S",
  L: "L",
  LIB: "L",
  DS: "DS",
};

const CLASS_MAP: Record<string, ScrapedPlayer["classYear"]> = {
  "Fr.": "FR",
  "So.": "SO",
  "Jr.": "JR",
  "Sr.": "SR",
  "Gr.": "SR",
};

const parseNum = (val: string): number => {
  const cleaned = val.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

interface PlayerKey {
  name: string;
  teamName: string;
}

interface PartialStats {
  name: string;
  teamName: string;
  teamsId: string | null;
  conference: string;
  classYear: ScrapedPlayer["classYear"];
  position: ScrapedPlayer["position"];
  jersey: string | null;
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

const makeKey = (pk: PlayerKey): string =>
  `${pk.name.toLowerCase()}|${pk.teamName.toLowerCase()}`;

export interface ProgressCallback {
  (event: string, data: Record<string, unknown>): void;
}

// Scrape ranking pages (top 100 per stat category) — primary data source
export const scrapeAllPlayers = async (): Promise<{
  players: Map<string, PartialStats>;
}> => {
  const playerMap = new Map<string, PartialStats>();

  const getOrCreate = (
    name: string,
    teamName: string,
    teamsId: string | null,
    conference: string,
    classYear: ScrapedPlayer["classYear"],
    position: ScrapedPlayer["position"],
    setsPlayed: number
  ): PartialStats => {
    const key = makeKey({ name, teamName });
    const existing = playerMap.get(key);
    if (existing) {
      if (setsPlayed > existing.setsPlayed) existing.setsPlayed = setsPlayed;
      if (position !== "OH" && existing.position === "OH") existing.position = position;
      return existing;
    }
    const newPlayer: PartialStats = {
      name,
      teamName,
      teamsId,
      conference,
      classYear,
      position,
      jersey: null,
      setsPlayed,
      kills: 0,
      killsPerSet: 0,
      hittingPct: 0,
      assists: 0,
      assistsPerSet: 0,
      aces: 0,
      acesPerSet: 0,
      digs: 0,
      digsPerSet: 0,
      blocks: 0,
      blocksPerSet: 0,
      points: 0,
      pointsPerSet: 0,
    };
    playerMap.set(key, newPlayer);
    return newPlayer;
  };

  for (const [statName, config] of Object.entries(STAT_PAGES)) {
    const url = RANKING_BASE + config.seq;
    console.log(`  Fetching ${statName} rankings...`);

    const html = await fetchWithRetry(url);
    if (!html) {
      console.warn(`  Failed to fetch ${statName} ranking`);
      continue;
    }

    const $ = cheerio.load(html);
    const table = $("table").first();
    if (!table.length) {
      console.warn(`  No table found for ${statName}`);
      continue;
    }

    const headerRow = table.find("tr").first();
    const colMap: Record<string, number> = {};
    headerRow.find("td, th").each((idx, cell) => {
      colMap[$(cell).text().trim()] = idx;
    });

    const playerColIdx = colMap["Player"] ?? 1;
    const classColIdx = colMap["Cl"] ?? 2;
    const posColIdx = colMap["Pos"] ?? 4;
    const setsColIdx = colMap["S"] ?? 5;
    const totalColIdx = colMap[config.totalCol] ?? 6;
    const perSetColIdx = colMap[config.perSetCol] ?? 7;

    let count = 0;
    table.find("tr").slice(1).each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 5) return;

      const playerText = $(cells[playerColIdx]).text().trim();
      const match = playerText.match(/^(.+?),\s*(.+?)\s*\(([^)]+)\)\s*$/);
      if (!match?.[1] || !match[2]) return;

      const name = match[1].trim();
      const teamName = match[2].trim();
      const conference = match[3]?.trim() || "Unknown";

      const rawClass = $(cells[classColIdx]).text().trim();
      const classYear = CLASS_MAP[rawClass] || "FR";

      const rawPos = $(cells[posColIdx]).text().trim();
      const position = POSITION_MAP[rawPos] || "OH";

      const setsPlayed = parseNum($(cells[setsColIdx]).text().trim());
      const totalVal = parseNum($(cells[totalColIdx]).text().trim());
      const perSetVal = parseNum($(cells[perSetColIdx]).text().trim());

      const player = getOrCreate(
        name,
        teamName,
        null,
        conference,
        classYear,
        position,
        setsPlayed
      );

      switch (statName) {
        case "kills":
          player.kills = totalVal;
          player.killsPerSet = perSetVal;
          break;
        case "hittingPct":
          player.hittingPct = perSetVal;
          break;
        case "assists":
          player.assists = totalVal;
          player.assistsPerSet = perSetVal;
          break;
        case "aces":
          player.aces = totalVal;
          player.acesPerSet = perSetVal;
          break;
        case "digs":
          player.digs = totalVal;
          player.digsPerSet = perSetVal;
          break;
        case "blocks":
          player.blocks = totalVal;
          player.blocksPerSet = perSetVal;
          break;
        case "points":
          player.points = totalVal;
          player.pointsPerSet = perSetVal;
          break;
      }

      count++;
    });

    console.log(`  ${statName}: parsed ${count} players`);
    await sleep(500);
  }

  console.log(`Total unique players from rankings: ${playerMap.size}`);
  return { players: playerMap };
};
