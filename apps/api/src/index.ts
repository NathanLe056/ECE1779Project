import { createServer } from "http";
import express from "express";
import cors from "cors";
import client from "prom-client";

import authRoutes from "./routes/authRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import tournamentMemberRoutes from "./routes/tournamentMemberRoutes.js";
import { initWebSocketServer } from "./websocket.js";

const app = express();

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const loginCounter = new client.Counter({
  name: "api_login_success_total",
  help: "Total number of successful logins",
});
register.registerMetric(loginCounter);

app.use(
  cors({
    origin: [
      "http://localhost:5172",
      "https://ece1779-frontend.fly.dev",
      "https://ece1779-testing-frontend.fly.dev",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/tournament-members", tournamentMemberRoutes);
app.use("/api/matches", matchRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Tournament Tracker API is LIVE in Toronto!",
    platform: process.env.KUBERNETES_SERVICE_HOST ? "Kubernetes" : "Docker/Local",
    status: "Healthy",
    time: new Date().toISOString(),
  });
});

// Create one HTTP server shared by Express and the WebSocket server
const server = createServer(app);
initWebSocketServer(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
