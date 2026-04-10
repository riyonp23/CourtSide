import * as cheerio from "cheerio";
import { fetchWithRetry } from "./utils";
import type { ScrapedMatch } from "./types";

// Team W-L data from rankings (always accessible)
const WL_RANKING_URL =
  "https://stats.ncaa.org/rankings/national_ranking?academic_year=2026.0&division=1.0&ranking_period=67.0&sport_code=MVB&stat_seq=530.0";

export interface TeamRecord {
  teamsId: string;
  name: string;
  conference: string;
  wins: number;
  losses: number;
}

export const scrapeTeamRecords = async (): Promise<TeamRecord[]> => {
  const html = await fetchWithRetry(WL_RANKING_URL);
  if (!html) {
    console.warn("Failed to fetch W-L rankings");
    return [];
  }

  const $ = cheerio.load(html);
  const records: TeamRecord[] = [];
  const table = $("table").first();

  table.find("tr").slice(1).each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 5) return;

    const teamCell = $(cells[1]);
    const teamText = teamCell.text().trim();
    const link = teamCell.find("a").attr("href") || "";
    const idMatch = link.match(/\/teams\/(\d+)/);
    if (!idMatch?.[1]) return;

    const nameConfMatch = teamText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!nameConfMatch?.[1]) return;

    records.push({
      teamsId: idMatch[1],
      name: nameConfMatch[1].trim(),
      conference: nameConfMatch[2]?.trim() || "Unknown",
      wins: parseInt($(cells[2]).text().trim()) || 0,
      losses: parseInt($(cells[3]).text().trim()) || 0,
    });
  });

  console.log(`W-L rankings: ${records.length} teams with records`);
  return records;
};

// Fallback: scrape individual team schedule page (works from residential IPs)
export const scrapeSchedule = async (
  ncaaId: string,
  seasonId: string
): Promise<ScrapedMatch[]> => {
  const url = `https://stats.ncaa.org/team/schedule?org_id=${ncaaId}&sport_year_ctl_id=${seasonId}`;
  const html = await fetchWithRetry(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const matches: ScrapedMatch[] = [];
  const tables = $("table");

  let schedTableIdx = -1;
  tables.each((i, table) => {
    const headers = $(table).find("thead tr th, tr:first-child th, tr:first-child td");
    let hasDateCol = false;
    let hasOpponentCol = false;
    headers.each((_j, th) => {
      const text = $(th).text().trim().toLowerCase();
      if (text === "date") hasDateCol = true;
      if (text === "opponent" || text === "opponents") hasOpponentCol = true;
    });
    if (hasDateCol && hasOpponentCol && schedTableIdx === -1) {
      schedTableIdx = i;
    }
  });

  if (schedTableIdx === -1) {
    if (tables.length > 2) schedTableIdx = 2;
    else if (tables.length > 0) schedTableIdx = tables.length - 1;
  }

  if (schedTableIdx === -1 || !tables[schedTableIdx]) return [];
  const schedTable = $(tables[schedTableIdx]);

  const headerRow = schedTable.find("thead tr, tr").first();
  const colMap: Record<string, number> = {};
  headerRow.find("th, td").each((idx, cell) => {
    colMap[$(cell).text().trim().toLowerCase()] = idx;
  });

  const findCol = (names: string[]): number => {
    for (const name of names) {
      if (colMap[name] !== undefined) return colMap[name];
    }
    return -1;
  };

  const dateCol = findCol(["date"]);
  const oppCol = findCol(["opponent", "opponents"]);
  const resultCol = findCol(["result", "results", "score"]);
  const locCol = findCol(["location", "loc", "site"]);

  schedTable.find("tbody tr, tr").slice(1).each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const getCellText = (colIdx: number): string => {
      if (colIdx < 0 || colIdx >= cells.length) return "";
      return $(cells[colIdx]).text().trim();
    };

    const dateStr = dateCol >= 0 ? getCellText(dateCol) : getCellText(0);
    if (!dateStr || dateStr.toLowerCase().includes("total")) return;

    const oppCell = oppCol >= 0 ? $(cells[oppCol]) : $(cells[1]);
    let opponentName = oppCell.text().trim()
      .replace(/^[@#]\s*/, "")
      .replace(/^#\d+\s+/, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/&amp;/g, "&")
      .trim();

    if (!opponentName) return;

    let opponentNcaaId: string | null = null;
    const oppLink = oppCell.find("a[href*='/team']").first();
    if (oppLink.length) {
      const oppHref = oppLink.attr("href") || "";
      const oppIdMatch = oppHref.match(/\/teams?\/(\d+)/);
      if (oppIdMatch?.[1]) opponentNcaaId = oppIdMatch[1];
      opponentName = oppLink.text().trim() || opponentName;
    }
    opponentName = opponentName.replace(/^\s*@\s*/, "").replace(/^#\d+\s+/, "").trim();

    const resultText = resultCol >= 0 ? getCellText(resultCol) : getCellText(2);
    let result: "W" | "L" | null = null;
    if (resultText.startsWith("W") || resultText.includes("W ")) result = "W";
    else if (resultText.startsWith("L") || resultText.includes("L ")) result = "L";

    const { homeSets, awaySets, homeScore, awayScore } = parseSetScores(resultText);
    const location = locCol >= 0 ? getCellText(locCol) || null : null;

    matches.push({
      date: dateStr,
      opponentName,
      opponentNcaaId,
      location,
      result,
      homeSets,
      awaySets,
      homeScore,
      awayScore,
    });
  });

  return matches;
};

const parseSetScores = (
  resultText: string
): { homeSets: number; awaySets: number; homeScore: number; awayScore: number } => {
  const setMatch = resultText.match(/(\d+)\s*-\s*(\d+)/);
  const homeSets = setMatch?.[1] ? parseInt(setMatch[1]) : 0;
  const awaySets = setMatch?.[2] ? parseInt(setMatch[2]) : 0;

  const scoresInParens = resultText.match(/\(([^)]+)\)/);
  let homeScore = 0;
  let awayScore = 0;

  if (scoresInParens?.[1]) {
    for (const set of scoresInParens[1].split(",")) {
      const scores = set.trim().match(/(\d+)\s*-\s*(\d+)/);
      if (scores?.[1] && scores[2]) {
        homeScore += parseInt(scores[1]);
        awayScore += parseInt(scores[2]);
      }
    }
  }

  return { homeSets, awaySets, homeScore, awayScore };
};
