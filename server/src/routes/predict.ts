import { FastifyInstance } from "fastify";
import { predictMatchup, generateFeaturedMatchups } from "../lib/predictor.js";

interface PredictQuery {
  teamA?: string;
  teamB?: string;
}

interface FeaturedCache {
  data: Awaited<ReturnType<typeof generateFeaturedMatchups>> | null;
  timestamp: number;
}

const featuredCache: FeaturedCache = { data: null, timestamp: 0 };
const ONE_HOUR = 60 * 60 * 1000;

export async function predictRoutes(server: FastifyInstance) {
  server.get<{ Querystring: PredictQuery }>(
    "/predict",
    async (request, reply) => {
      try {
        const { teamA, teamB } = request.query;
        if (!teamA || !teamB) {
          return reply.status(400).send({ error: "teamA and teamB query parameters are required" });
        }
        if (teamA === teamB) {
          return reply.status(400).send({ error: "teamA and teamB must be different" });
        }
        const prediction = await predictMatchup(teamA, teamB);
        return reply.send({ prediction });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: "Failed to generate prediction" });
      }
    }
  );

  server.get("/predict/featured", async (request, reply) => {
    try {
      const now = Date.now();
      if (featuredCache.data && now - featuredCache.timestamp < ONE_HOUR) {
        return reply.send({ matchups: featuredCache.data });
      }
      const matchups = await generateFeaturedMatchups();
      featuredCache.data = matchups;
      featuredCache.timestamp = now;
      return reply.send({ matchups });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to generate featured matchups" });
    }
  });
}
