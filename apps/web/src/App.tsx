import { useEffect, useState } from "react";
import { getTournament } from "./api/tournamentApi";
import { getCurrentUser } from "./api/userApi";
import TournamentTable from "./components/TournamentTable";
import Login from "./components/Login";
import { TournamentWithDetails } from "./types/Tournament";
import { User } from "./types/User";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<number>(1);

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
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchTournament = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getTournament(1);
        setTournament(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tournament");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setTournament(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!user) return;

    if (!searchId || searchId <= 0) {
      setError("Please enter a valid tournament ID");
      return;
    }

    setTournament(null);
    setLoading(true);
    setError(null);

    try {
      const data = await getTournament(searchId);
      setTournament(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tournament");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Checking login session...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Welcome, {user.username}!</h1>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <h2>Tournament Search</h2>

      <div className="input-group mb-3">
        <input
          type="number"
          className="form-control"
          value={searchId}
          onChange={(e) => setSearchId(Number(e.target.value))}
          placeholder="Enter tournament ID"
          min={1}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">Error: {error}</div>}
      {tournament && <TournamentTable tournament={tournament} />}
    </div>
  );
}

export default App;