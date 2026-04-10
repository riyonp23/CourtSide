import { PrismaClient } from "@prisma/client";
import { scrapeTeams } from "./teams";
import { scrapeAllPlayers } from "./roster";
import type { ProgressCallback } from "./roster";
import { scrapeTeamRecords } from "./schedule";
import { applyRankings, applyChampionshipHistory } from "./rankings";

const SEASON = "2025-26";

export interface PipelineResult {
  teams: number;
  players: number;
}

export const runPipeline = async (
  onProgress?: ProgressCallback
): Promise<PipelineResult> => {
  const prisma = new PrismaClient();

  try {
    console.log("=== Courtside Scraper: 2025-26 NCAA D1 MVB ===\n");

    // Step 1: Fetch all D1 MVB teams
    console.log("Step 1: Fetching D1 MVB team list...");
    const { teams } = await scrapeTeams();

    if (teams.length === 0) {
      console.error("No teams found. Aborting.");
      onProgress?.("scrape:error", { message: "No teams found" });
      return { teams: 0, players: 0 };
    }

    onProgress?.("scrape:start", { total: teams.length });

    // Step 2: Get W-L records and conference data
    console.log("\nStep 2: Fetching team W-L records...");
    const records = await scrapeTeamRecords();

    const recordByTeamsId = new Map(records.map((r) => [r.teamsId, r]));
    const recordByName = new Map(records.map((r) => [r.name.toLowerCase(), r]));

    // Upsert teams with enriched data
    console.log(`\nUpserting ${teams.length} teams...`);
    const teamIdMap = new Map<string, string>();
    const teamNameToDbId = new Map<string, string>();
    const ncaaIdToDbId = new Map<string, string>();

    for (const team of teams) {
      const record =
        recordByTeamsId.get(team.ncaaId) ||
        recordByName.get(team.name.toLowerCase());

      const conference = record?.conference || team.conference;
      const wins = record?.wins || 0;
      const losses = record?.losses || 0;

      const dbTeam = await prisma.team.upsert({
        where: { ncaaId: team.ncaaId },
        create: {
          ncaaId: team.ncaaId,
          name: team.name,
          conference,
          season: SEASON,
          wins,
          losses,
        },
        update: {
          name: team.name,
          conference,
          season: SEASON,
          wins,
          losses,
        },
      });
      teamIdMap.set(team.ncaaId, dbTeam.id);
      teamNameToDbId.set(team.name.toLowerCase(), dbTeam.id);
      ncaaIdToDbId.set(team.ncaaId, dbTeam.id);
    }
    console.log(`Upserted ${teamIdMap.size} teams.`);

    // Step 3: Fetch player stats from ranking pages (primary source)
    console.log("\nStep 3: Fetching player stats from ranking pages...");
    const { players: rankingPlayers } = await scrapeAllPlayers();

    let playerCount = 0;
    for (const [_key, player] of rankingPlayers) {
      const teamDbId = teamNameToDbId.get(player.teamName.toLowerCase()) || (() => {
        for (const [name, id] of teamNameToDbId) {
          if (name.includes(player.teamName.toLowerCase()) || player.teamName.toLowerCase().includes(name)) {
            return id;
          }
        }
        return null;
      })();

      if (!teamDbId) continue;

      const playerNcaaId = `${teamDbId}-${player.name.replace(/\s+/g, "-").toLowerCase()}`;

      const dbPlayer = await prisma.player.upsert({
        where: { ncaaId: playerNcaaId },
        create: {
          ncaaId: playerNcaaId,
          name: player.name,
          teamId: teamDbId,
          position: player.position,
          jersey: null,
          classYear: player.classYear,
          season: SEASON,
        },
        update: {
          name: player.name,
          teamId: teamDbId,
          position: player.position,
          classYear: player.classYear,
          season: SEASON,
        },
      });

      await prisma.playerSeasonStats.upsert({
        where: {
          playerId_season: {
            playerId: dbPlayer.id,
            season: SEASON,
          },
        },
        create: {
          playerId: dbPlayer.id,
          season: SEASON,
          setsPlayed: player.setsPlayed,
          kills: player.kills,
          killsPerSet: player.killsPerSet,
          hittingPct: player.hittingPct,
          assists: player.assists,
          assistsPerSet: player.assistsPerSet,
          aces: player.aces,
          acesPerSet: player.acesPerSet,
          digs: player.digs,
          digsPerSet: player.digsPerSet,
          blocks: player.blocks,
          blocksPerSet: player.blocksPerSet,
          points: player.points,
          pointsPerSet: player.pointsPerSet,
        },
        update: {
          setsPlayed: player.setsPlayed,
          kills: player.kills,
          killsPerSet: player.killsPerSet,
          hittingPct: player.hittingPct,
          assists: player.assists,
          assistsPerSet: player.assistsPerSet,
          aces: player.aces,
          acesPerSet: player.acesPerSet,
          digs: player.digs,
          digsPerSet: player.digsPerSet,
          blocks: player.blocks,
          blocksPerSet: player.blocksPerSet,
          points: player.points,
          pointsPerSet: player.pointsPerSet,
        },
      });

      playerCount++;
      if (playerCount % 100 === 0) {
        console.log(`  Upserted ${playerCount} players...`);
      }
    }

    console.log(`\nRanking pages: ${playerCount} players from ${rankingPlayers.size} unique entries`);

    onProgress?.("scrape:players", { count: playerCount });

    // Step 4: Apply coaches poll rankings
    console.log("\nStep 4: Applying Coaches Poll rankings...");
    await applyRankings(prisma);

    // Step 5: Apply championship history
    console.log("\nStep 5: Applying championship history...");
    await applyChampionshipHistory(prisma);

    console.log("\n=== Scraping complete! ===");
    console.log(`Teams: ${teamIdMap.size}`);
    console.log(`Players: ${playerCount}`);

    onProgress?.("scrape:complete", { teams: teamIdMap.size, players: playerCount });

    return { teams: teamIdMap.size, players: playerCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Pipeline failed:", message);
    onProgress?.("scrape:error", { message });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
};

// CLI entry point
const isCLI = process.argv[1]?.includes("index");
if (isCLI) {
  runPipeline((event, data) => {
    // In CLI mode, onProgress just logs
    console.log(`[${event}]`, JSON.stringify(data));
  })
    .catch((err) => {
      console.error("Pipeline failed:", err);
      process.exit(1);
    });
}
