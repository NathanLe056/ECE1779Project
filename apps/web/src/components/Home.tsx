import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTournaments, getMyTournaments } from "../api/tournamentApi";
import { TournamentSummary } from "../types/Tournament";
import { User } from "../types/User";

interface HomeProps {
  user: User | null;
  onLogout: () => void;
  tournaments: TournamentSummary[];
  onTournamentsChange: (tournaments: TournamentSummary[]) => void;
}

function Home({ user, onLogout, tournaments, onTournamentsChange }: HomeProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [myTournaments, setMyTournaments] = useState<TournamentSummary[]>([]);
  const [myTournamentsLoading, setMyTournamentsLoading] = useState(false);
  const [myTournamentsError, setMyTournamentsError] = useState<string | null>(
    null,
  );

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchName.trim().toLowerCase()),
  );

  useEffect(() => {
    if (user) {
      setMyTournamentsLoading(true);
      setMyTournamentsError(null);
      getMyTournaments()
        .then(setMyTournaments)
        .catch((err) => {
          console.error("Failed to fetch my tournaments:", err);
          setMyTournamentsError("Failed to load your tournaments");
        })
        .finally(() => setMyTournamentsLoading(false));
    }
  }, [user]);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-left">
          <button className="nav-btn active">Home</button>
          {user && (
            <button className="nav-btn" onClick={() => navigate("/profile")}>
              Profile
            </button>
          )}
        </div>
        {user ? (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <button className="nav-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </header>

      <main className="main-content">
        <section className="home-content">
          <h1 className="welcome-title">
            {user ? `Welcome ${user.username}` : "Tournament Viewer"}
          </h1>

          {user && (
            <div className="feature-card create-card">
              <h2 className="section-title">Create Tournaments</h2>
              <p className="section-subtitle">
                Start a new tournament and manage participants from your
                dashboard.
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate("/create")}
              >
                Open Create Form
              </button>
            </div>
          )}

          {user && (
            <div className="feature-card my-tournaments-card">
              <h2 className="section-title">My Tournaments</h2>
              {myTournamentsLoading && (
                <div className="status-text">Loading your tournaments...</div>
              )}
              {myTournamentsError && (
                <div className="inline-error">{myTournamentsError}</div>
              )}
              {!myTournamentsLoading && !myTournamentsError && (
                <div className="my-tournaments-list">
                  {myTournaments.length === 0 ? (
                    <p className="muted-text">
                      You haven't joined or created any tournaments yet.
                    </p>
                  ) : (
                    <ul className="name-list">
                      {myTournaments.map((tournament) => (
                        <li
                          key={tournament.id}
                          className="name-item"
                          onClick={() =>
                            navigate(`/tournament/${tournament.id}`)
                          }
                        >
                          <span>{tournament.name}</span>
                          <span className="name-item-meta">
                            {tournament.creator.id === user.id
                              ? "Created"
                              : "Joined"}{" "}
                            • #{tournament.id}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="feature-card search-card">
            <h2 className="section-title">Search Tournaments By Name</h2>
            <input
              type="text"
              className="search-input"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Type tournament name"
            />

            {loading && (
              <div className="status-text">Loading tournaments...</div>
            )}
            {error && <div className="inline-error">{error}</div>}

            {!loading && (
              <div className="name-results">
                {filteredTournaments.length === 0 ? (
                  <p className="muted-text">No tournament names found.</p>
                ) : (
                  <ul className="name-list">
                    {filteredTournaments.map((tournament) => (
                      <li
                        key={tournament.id}
                        className="name-item"
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                      >
                        <span>{tournament.name}</span>
                        <span className="name-item-meta">#{tournament.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
