import { useState, useEffect } from "react";
import { getTournament } from "./api/tournamentApi";
import TournamentTable from "./components/TournamentTable";
import Login from "./components/Login";
import { TournamentWithDetails } from "./types/Tournament";
import { User } from "./types/User";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<number>(1);

  useEffect(() => {
    if (user) {
      const fetchTournament = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getTournament(1);
          setTournament(data);
        } catch (err) {
          if (err instanceof Error) setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTournament();
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setTournament(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!user) return;
    setTournament(null);
    setLoading(true);
    setError(null);
    try {
      const data = await getTournament(searchId);
      setTournament(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
