import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser } from "./api/userApi";
import { getTournaments } from "./api/tournamentApi";
import Login from "./components/Login";
import Home from "./components/Home";
import CreateTournament from "./components/CreateTournament";
import TournamentDetail from "./components/TournamentDetail";
import Profile from "./components/Profile";
import { TournamentSummary } from "./types/Tournament";
import { User } from "./types/User";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (!savedUser) {
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments();
        setTournaments(data);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
      }
    };

    fetchTournaments();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Keep tournaments visible for public viewing
  };

  const handleTournamentCreated = (createdTournament: TournamentSummary) => {
    setTournaments((prev) => [createdTournament, ...prev]);
  };

  const handleTournamentDeleted = async () => {
    try {
      const data = await getTournaments();
      setTournaments(data);
    } catch (err) {
      console.error("Failed to fetch tournaments after deletion:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Checking login session...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          <Home
            user={user}
            onLogout={handleLogout}
            tournaments={tournaments}
            onTournamentsChange={setTournaments}
          />
        }
      />
      <Route
        path="/create"
        element={
          <CreateTournament
            user={user}
            onLogout={handleLogout}
            onTournamentCreated={handleTournamentCreated}
          />
        }
      />
      <Route
        path="/tournament/:id"
        element={
          <TournamentDetail
            user={user}
            onLogout={handleLogout}
            onTournamentDeleted={handleTournamentDeleted}
          />
        }
      />
      <Route
        path="/profile"
        element={<Profile user={user} onLogout={handleLogout} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
