import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface CompareQuery {
  ids?: string;
}

interface ErrorResponse {
  error: string;
}

export async function compareRoutes(server: FastifyInstance) {
  server.get<{ Querystring: CompareQuery }>(
    "/compare",
    async (request, reply) => {
      try {
        const idsParam = request.query.ids;
        if (!idsParam) {
          return reply.status(400).send({ error: "ids query parameter is required" });
        }

        const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);

        if (ids.length < 2 || ids.length > 4) {
          return reply.status(400).send({ error: "Provide between 2 and 4 player IDs" });
        }

        const players = await prisma.player.findMany({
          where: { id: { in: ids } },
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
        });

        if (players.length < 2) {
          return reply.status(404).send({ error: "One or more players not found" });
        }

        return reply.send({ players });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: "Failed to compare players" });
      }
    }
  );
}
