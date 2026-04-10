import { WebSocketServer, WebSocket } from "ws";
let wss = null;
const clients = new Set();
export const initWebSocket = (server) => {
    wss = new WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (ws) => {
        clients.add(ws);
        ws.on("close", () => clients.delete(ws));
        ws.on("error", () => clients.delete(ws));
    });
    return wss;
};
export const broadcast = (event, data) => {
    const message = JSON.stringify({ event, ...data });
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
};
