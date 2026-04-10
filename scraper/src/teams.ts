import * as cheerio from "cheerio";
import { fetchWithRetry } from "./utils";
import type { ScrapedTeam } from "./types";

const TEAM_LIST_URL =
  "https://stats.ncaa.org/team/inst_team_list?sport_code=MVB&division=1";

const WL_RANKING_URL =
  "https://stats.ncaa.org/rankings/national_ranking?academic_year=2026.0&division=1.0&ranking_period=67.0&sport_code=MVB&stat_seq=530.0";

interface TeamListResult {
  teams: ScrapedTeam[];
}

export const scrapeTeams = async (): Promise<TeamListResult> => {
  // Step 1: Get team list for names, /teams/{id} links, and sport_year_ctl_id
  const listHtml = await fetchWithRetry(TEAM_LIST_URL);
  if (!listHtml) {
    console.error("Failed to fetch team list page");
    return { teams: [] };
  }

  const $list = cheerio.load(listHtml);
  const teamsById = new Map<string, ScrapedTeam>();

  $list('a[href*="/teams/"]').each((_i, el) => {
    const href = $list(el).attr("href") || "";
    const idMatch = href.match(/\/teams\/(\d+)/);
    if (!idMatch?.[1]) return;

    const name = $list(el).text().trim();
    if (!name || name.length < 2) return;

    const ncaaId = idMatch[1];
    if (teamsById.has(ncaaId)) return;

    // Extract sport_year_ctl_id from query param if present (e.g. /teams/123?sport_year_ctl_id=456)
    const ctlMatch = href.match(/sport_year_ctl_id=(\d+)/);
    const statsUrl = ctlMatch?.[1]
      ? `https://stats.ncaa.org/team/${ncaaId}/stats?id=${ctlMatch[1]}`
      : undefined;

    teamsById.set(ncaaId, {
      name,
      ncaaId,
      conference: "Unknown",
      statsUrl,
    });
  });

  // If no sport_year_ctl_id found in links, try fetching one team page to extract it
  const firstTeam = teamsById.values().next().value as ScrapedTeam | undefined;
  let fallbackCtlId: string | null = null;
  if (firstTeam && !firstTeam.statsUrl) {
    const teamPageHtml = await fetchWithRetry(`https://stats.ncaa.org/teams/${firstTeam.ncaaId}`);
    if (teamPageHtml) {
      const $tp = cheerio.load(teamPageHtml);
      $tp('a[href*="sport_year_ctl_id="]').each((_i, el) => {
        if (fallbackCtlId) return;
        const h = $tp(el).attr("href") || "";
        const m = h.match(/sport_year_ctl_id=(\d+)/);
        if (m?.[1]) fallbackCtlId = m[1];
      });
      if (!fallbackCtlId) {
        // Try alternate pattern: /team/{id}/stats?id={ctlId}
        $tp('a[href*="/stats"]').each((_i, el) => {
          if (fallbackCtlId) return;
          const h = $tp(el).attr("href") || "";
          const m = h.match(/\/stats\?id=(\d+)/);
          if (m?.[1]) fallbackCtlId = m[1];
        });
      }
      if (fallbackCtlId) {
        console.log(`Discovered sport_year_ctl_id: ${fallbackCtlId}`);
        for (const [id, team] of teamsById) {
          if (!team.statsUrl) {
            team.statsUrl = `https://stats.ncaa.org/team/${id}/stats?id=${fallbackCtlId}`;
          }
        }
      }
    }
  }

  console.log(`Team list page: found ${teamsById.size} teams`);

  // Step 2: Get W-L ranking to fill in conferences and win/loss records
  const wlHtml = await fetchWithRetry(WL_RANKING_URL);
  if (wlHtml) {
    const $wl = cheerio.load(wlHtml);
    const table = $wl("table").first();

    table.find("tr").slice(1).each((_i, row) => {
      const cells = $wl(row).find("td");
      if (cells.length < 5) return;

      const teamCell = $wl(cells[1]);
      const teamText = teamCell.text().trim();
      const link = teamCell.find("a").attr("href") || "";
      const idMatch = link.match(/\/teams\/(\d+)/);
      if (!idMatch?.[1]) return;

      const ncaaId = idMatch[1];
      const nameConfMatch = teamText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

      const existing = teamsById.get(ncaaId);
      if (existing && nameConfMatch?.[2]) {
        existing.conference = nameConfMatch[2];
      } else if (nameConfMatch?.[1] && nameConfMatch[2]) {
        teamsById.set(ncaaId, {
          name: nameConfMatch[1].trim(),
          ncaaId,
          conference: nameConfMatch[2].trim(),
        });
      }
    });

    console.log(`W-L ranking: enriched conference data`);
  }

  const teams = Array.from(teamsById.values());
  console.log(`Total: ${teams.length} D1 MVB teams`);
  return { teams };
};
