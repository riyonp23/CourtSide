import { prisma } from "../lib/prisma.js";
const teamSelect = {
    id: true,
    ncaaId: true,
    name: true,
    conference: true,
    division: true,
    logoUrl: true,
    season: true,
    wins: true,
    losses: true,
    confWins: true,
    confLosses: true,
    coachesPollRank: true,
    nationalTitles: true,
    titleYears: true,
};
export async function teamsRoutes(server) {
    server.get("/teams", async (request, reply) => {
        try {
            const { conference } = request.query;
            const teams = await prisma.team.findMany({
                where: conference ? { conference } : undefined,
                select: teamSelect,
                orderBy: { wins: "desc" },
            });
            return reply.send({ teams });
        }
        catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: "Failed to fetch teams" });
        }
    });
    server.get("/teams/:id", async (request, reply) => {
        try {
            const team = await prisma.team.findUnique({
                where: { id: request.params.id },
                select: {
                    ...teamSelect,
                    players: {
                        select: {
                            id: true,
                            ncaaId: true,
                            name: true,
                            position: true,
                            jersey: true,
                            classYear: true,
                            season: true,
                            seasonStats: {
                                select: {
                                    id: true,
                                    season: true,
                                    setsPlayed: true,
                                    kills: true,
                                    killsPerSet: true,
                                    hittingPct: true,
                                    assists: true,
                                    assistsPerSet: true,
                                    aces: true,
                                    acesPerSet: true,
                                    digs: true,
                                    digsPerSet: true,
                                    blocks: true,
                                    blocksPerSet: true,
                                    points: true,
                                    pointsPerSet: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!team) {
                return reply.status(404).send({ error: "Team not found" });
            }
            return reply.send({ team });
        }
        catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: "Failed to fetch team" });
        }
    });
}
