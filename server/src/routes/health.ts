import { FastifyInstance } from "fastify";

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

export async function healthRoute(server: FastifyInstance) {
  server.get<{ Reply: HealthResponse | ErrorResponse }>(
    "/health",
    async (_request, reply) => {
      try {
        return reply.send({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        return reply.status(500).send({
          error: "Health check failed",
        });
      }
    }
  );
}
