export async function healthRoute(server) {
    server.get("/health", async (_request, reply) => {
        try {
            return reply.send({
                status: "ok",
                timestamp: new Date().toISOString(),
            });
        }
        catch (err) {
            return reply.status(500).send({
                error: "Health check failed",
            });
        }
    });
}
