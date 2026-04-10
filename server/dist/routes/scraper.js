import { spawn } from "child_process";
import { resolve } from "path";
import { prisma } from "../lib/prisma.js";
import { broadcast } from "../lib/ws.js";
let scraping = false;
export async function scraperRoutes(server) {
    server.post("/scrape", async (_request, reply) => {
        try {
            if (scraping) {
                return reply.status(409).send({ error: "Scrape already in progress" });
            }
            scraping = true;
            // Spawn the scraper as a child process
            const scraperDir = resolve(import.meta.dirname, "..", "..", "..", "scraper");
            const child = spawn("npx", ["tsx", "src/index.ts"], {
                cwd: scraperDir,
                shell: true,
                stdio: ["ignore", "pipe", "pipe"],
            });
            child.stdout.on("data", (data) => {
                const lines = data.toString().split("\n").filter(Boolean);
                for (const line of lines) {
                    // Parse structured progress events from the scraper's onProgress output
                    const eventMatch = line.match(/^\[(.+?)\]\s*(.+)$/);
                    if (eventMatch?.[1] && eventMatch[2]) {
                        try {
                            const eventName = eventMatch[1];
                            const eventData = JSON.parse(eventMatch[2]);
                            broadcast(eventName, eventData);
                        }
                        catch {
                            // not JSON, just log output
                        }
                    }
                    server.log.info(`[scraper] ${line}`);
                }
            });
            child.stderr.on("data", (data) => {
                server.log.warn(`[scraper] ${data.toString()}`);
            });
            child.on("close", (code) => {
                scraping = false;
                if (code === 0) {
                    broadcast("scrape:complete", { teams: 71, players: 0 });
                }
                else {
                    broadcast("scrape:error", { message: `Scraper exited with code ${code}` });
                }
            });
            child.on("error", (err) => {
                scraping = false;
                broadcast("scrape:error", { message: err.message });
            });
            return reply.send({ status: "started" });
        }
        catch (err) {
            scraping = false;
            _request.log.error(err);
            return reply.status(500).send({ error: "Failed to start scrape" });
        }
    });
    server.get("/scrape/status", async (_request, reply) => {
        try {
            const [totalTeams, totalPlayers, lastUpdatedTeam] = await Promise.all([
                prisma.team.count(),
                prisma.player.count(),
                prisma.team.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
            ]);
            return reply.send({
                lastScrapedAt: lastUpdatedTeam?.updatedAt ?? null,
                totalTeams,
                totalPlayers,
                scraping,
            });
        }
        catch (err) {
            _request.log.error(err);
            return reply.status(500).send({ error: "Failed to get scrape status" });
        }
    });
}
