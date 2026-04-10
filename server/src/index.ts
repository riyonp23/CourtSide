import Fastify from "fastify";
import cors from "@fastify/cors";
import { initWebSocket } from "./lib/ws.js";
import { healthRoute } from "./routes/health.js";
import { teamsRoutes } from "./routes/teams.js";
import { playersRoutes } from "./routes/players.js";
import { standingsRoutes } from "./routes/standings.js";
import { compareRoutes } from "./routes/compare.js";
import { scraperRoutes } from "./routes/scraper.js";
import { predictRoutes } from "./routes/predict.js";

const server = Fastify({ logger: true });

const start = async () => {
  await server.register(cors, { origin: true });
  await server.register(healthRoute, { prefix: "/api" });
  await server.register(teamsRoutes, { prefix: "/api" });
  await server.register(playersRoutes, { prefix: "/api" });
  await server.register(standingsRoutes, { prefix: "/api" });
  await server.register(compareRoutes, { prefix: "/api" });
  await server.register(scraperRoutes, { prefix: "/api" });
  await server.register(predictRoutes, { prefix: "/api" });

  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: "0.0.0.0" });

    // Attach WebSocket server to the same HTTP server
    const rawServer = server.server;
    initWebSocket(rawServer);
    server.log.info("WebSocket server attached on /ws");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
