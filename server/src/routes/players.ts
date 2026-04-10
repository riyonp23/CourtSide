import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

const validStats = [
  "kills", "killsPerSet", "hittingPct",
  "assists", "assistsPerSet",
  "aces", "acesPerSet",
  "digs", "digsPerSet",
  "blocks", "blocksPerSet",
  "points", "pointsPerSet",
] as const;

type StatName = typeof validStats[number];

interface PlayersQuery {
  stat?: string;
  conference?: string;
  search?: string;
  limit?: string;
  offset?: string;
}

interface PlayerParams {
  id: string;
}

interface ErrorResponse {
  error: string;
}

const statsSelect = {
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
} as const;

export async function playersRoutes(server: FastifyInstance) {
  server.get<{ Querystring: PlayersQuery }>(
    "/players",
    async (request, reply) => {
      try {
        const stat = (request.query.stat ?? "killsPerSet") as string;
        if (!validStats.includes(stat as StatName)) {
          return reply.status(400).send({ error: `Invalid stat: ${stat}` });
        }

        const limit = Math.min(Math.max(parseInt(request.query.limit ?? "25", 10) || 25, 1), 100);
        const offset = Math.max(parseInt(request.query.offset ?? "0", 10) || 0, 0);
        const conference = request.query.conference;
        const search = request.query.search;

        const where: Record<string, unknown> = {};
        if (conference) where.team = { conference };
        if (search) where.name = { contains: search, mode: "insensitive" };

        const [players, total] = await Promise.all([
          prisma.player.findMany({
            where,
            select: {
              id: true,
              name: true,
              position: true,
              classYear: true,
              team: { select: { id: true, name: true, conference: true } },
              seasonStats: {
                select: statsSelect,
                orderBy: { [stat]: "desc" },
                take: 1,
              },
            },
            orderBy: { seasonStats: { _count: "desc" } },
            skip: offset,
            take: limit,
          }),
          prisma.player.count({ where }),
        ]);

        // flatten and sort by the selected stat
        const sorted = players
          .map((p) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            classYear: p.classYear,
            teamId: p.team.id,
            teamName: p.team.name,
            conference: p.team.conference,
            stats: p.seasonStats[0] ?? null,
          }))
          .sort((a, b) => {
            const aVal = (a.stats as Record<string, unknown>)?.[stat];
            const bVal = (b.stats as Record<string, unknown>)?.[stat];
            return (typeof bVal === "number" ? bVal : 0) - (typeof aVal === "number" ? aVal : 0);
          });

        return reply.send({ players: sorted, total });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: "Failed to fetch players" });
      }
    }
  );

  server.get<{ Params: PlayerParams }>(
    "/players/:id",
    async (request, reply) => {
      try {
        const player = await prisma.player.findUnique({
          where: { id: request.params.id },
          select: {
            id: true,
            ncaaId: true,
            name: true,
            position: true,
            jersey: true,
            classYear: true,
            season: true,
            team: {
              select: {
                id: true,
                name: true,
                conference: true,
                division: true,
                season: true,
                wins: true,
                losses: true,
              },
            },
            seasonStats: { select: statsSelect },
          },
        });

        if (!player) {
          return reply.status(404).send({ error: "Player not found" });
        }

        return reply.send({ player });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: "Failed to fetch player" });
      }
    }
  );
}
