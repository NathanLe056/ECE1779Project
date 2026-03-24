import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import tournamentMemberRoutes from "./routes/tournamentMemberRoutes.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://ece1779-frontend.fly.dev"
  ],
  credentials: true
})); //added frontend flyio url so it can accept data from frontend

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/tournament-members", tournamentMemberRoutes);
app.use("/api/matches", matchRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
  res.json({ 
    message: "Tournament Tracker API is LIVE in Toronto!",
    status: "Healthy",
    time: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => { //because flyio needs to listen to not only self
  console.log(`API running on port ${PORT}`);
});