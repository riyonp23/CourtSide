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
function sortTeams(teams) {
    return teams.sort((a, b) => {
        if (a.coachesPollRank !== null && b.coachesPollRank !== null)
            return a.coachesPollRank - b.coachesPollRank;
        if (a.coachesPollRank !== null)
            return -1;
        if (b.coachesPollRank !== null)
            return 1;
        return b.wins - a.wins;
    });
}
export async function standingsRoutes(server) {
    server.get("/standings", async (_request, reply) => {
        try {
            const teams = await prisma.team.findMany({ select: teamSelect });
            const allTeams = sortTeams([...teams]);
            const grouped = new Map();
            for (const team of teams) {
                const existing = grouped.get(team.conference);
                if (existing) {
                    existing.push(team);
                }
                else {
                    grouped.set(team.conference, [team]);
                }
            }
            const conferences = Array.from(grouped.entries())
                .map(([name, confTeams]) => ({ name, teams: sortTeams(confTeams) }))
                .sort((a, b) => a.name.localeCompare(b.name));
            return reply.send({ conferences, allTeams });
        }
        catch (err) {
            reply.log.error(err);
            return reply.status(500).send({ error: "Failed to fetch standings" });
        }
    });
}
