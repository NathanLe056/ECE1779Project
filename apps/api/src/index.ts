import { createServer } from "http";
import express from "express";
import cors from "cors";
import client from "prom-client"; // 1. Import the client

import authRoutes from "./routes/authRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import tournamentMemberRoutes from "./routes/tournamentMemberRoutes.js";
import { initWebSocketServer } from "./websocket.js";

const app = express();

// 2. Initialize Prometheus Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// 3. ADD 'export' SO OTHER FILES CAN USE THIS
export const loginCounter = new client.Counter({
  name: 'api_login_success_total',
  help: 'Total number of successful logins'
});

// Note: You don't actually need register.registerMetric(loginCounter)
// if you are using the global registry, but keeping it won't hurt.
register.registerMetric(loginCounter);

app.use(cors({
  origin: [
    "http://localhost:5172",
    // This Regex allows any subdomain ending in .fly.dev
    /^https:\/\/.*\.fly\.dev$/,
    // Regex for Minikube ports
    /^http:\/\/127\.0\.0\.1(:\d+)?$/
  ],
  credentials: true
}));

app.use(express.json());

// 4. THE METRICS ENDPOINT
// This is where Fly.io (Prometheus) will "scrape" your data
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
    // This line detects if it's inside K8s or just Docker/Local
    platform: process.env.KUBERNETES_SERVICE_HOST ? "Kubernetes" : "Docker/Local",
    status: "Healthy",
    time: new Date().toISOString()
  });
});

// 5. Create an HTTP server from the Express app, then attach the WebSocket
//    server to the same port so both HTTP and WS traffic share one port.
const server = createServer(app);
initWebSocketServer(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
