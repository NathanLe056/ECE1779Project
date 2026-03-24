import { useEffect, useState } from "react";
import { getTournament, getTournaments, deleteTournament } from "./api/tournamentApi";
import { joinTournament } from "./api/tournamentMemberApi";
import { getCurrentUser } from "./api/userApi";
import Login from "./components/Login";
import CreateTournamentForm from "./components/CreateTournamentForm";
import TournamentTable from "./components/TournamentTable";
import { TournamentSummary, TournamentWithDetails } from "./types/Tournament";
import { User } from "./types/User";

type ViewMode = "home" | "profile" | "create";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>("home");
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joinRanking, setJoinRanking] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [selectedTournament, setSelectedTournament] =
    useState<TournamentWithDetails | null>(null);

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

    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getTournaments();
        setTournaments(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tournaments");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView("home");
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setTournaments([]);
    setSearchName("");
    setView("home");
    setError(null);
  };

  const handleTournamentCreated = (createdTournament: TournamentSummary) => {
    setTournaments((prev) => [createdTournament, ...prev]);
    setView("home");
    setError(null);
  };

  const handleSelectTournament = async (tournamentId: number) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setJoinMessage(null);
    setJoinRanking("");

    try {
      const details = await getTournament(tournamentId);
      setSelectedTournament(details);
    } catch (err: any) {
      setSelectedTournament(null);
      setDetailsError(err.message || "Failed to fetch tournament details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchName.trim().toLowerCase())
  );

  const currentUserId = user?.id;

  const isCreatorOfSelectedTournament =
    !!selectedTournament &&
    currentUserId !== undefined &&
    selectedTournament.created_by === currentUserId;

  const isAlreadyMember =
    !!selectedTournament &&
    currentUserId !== undefined &&
    selectedTournament.members.some((member) => member.user_id === currentUserId);

  const handleJoinTournament = async () => {
    if (!selectedTournament || !user) {
      return;
    }

    setJoinLoading(true);
    setJoinMessage(null);
    setDetailsError(null);

    const parsedRanking = Number(joinRanking);
    if (!Number.isInteger(parsedRanking)) {
      setJoinMessage("Please enter a valid integer ranking.");
      setJoinLoading(false);
      return;
    }

    try {
      await joinTournament({
        tournament_id: selectedTournament.id,
        user_id: user.id,
        role: "player",
        ranking: parsedRanking,
      });

      const updatedDetails = await getTournament(selectedTournament.id);
      setSelectedTournament(updatedDetails);
      setJoinMessage("You joined this tournament successfully.");
      setJoinRanking("");
    } catch (err: any) {
      setJoinMessage(err.message || "Could not join tournament.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleTournamentDeleted = () => {
    setTournaments((prev) =>
      prev.filter((t) => t.id !== selectedTournament?.id)
    );
    setSelectedTournament(null);
    setJoinMessage(null);
    setDetailsError(null);
    setSearchName("");
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteTournament(selectedTournament.id);
      handleTournamentDeleted();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete tournament");
    } finally {
      setDeleteLoading(false);
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

  if (view === "create") {
    return (
      <>
        <header className="top-nav">
          <div className="top-nav-left">
            <button
              className="nav-btn"
              onClick={() => setView("home")}
            >
              Home
            </button>
            <button
              className="nav-btn"
              onClick={() => setView("profile")}
            >
              Profile
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <CreateTournamentForm
          onCancel={() => setView("home")}
          onCreated={handleTournamentCreated}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-left">
          <button
            className={`nav-btn ${view === "home" ? "active" : ""}`}
            onClick={() => setView("home")}
          >
            Home
          </button>
          <button
            className={`nav-btn ${view === "profile" ? "active" : ""}`}
            onClick={() => setView("profile")}
          >
            Profile
          </button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="main-content">
        {view === "home" && (
          <section className="home-content">
            <h1 className="welcome-title">Welcome {user.username}</h1>

            <div className="feature-card create-card">
              <h2 className="section-title">Create Tournaments</h2>
              <p className="section-subtitle">
                Start a new tournament and manage participants from your dashboard.
              </p>
              <button
                className="primary-btn"
                onClick={() => setView("create")}
              >
                Open Create Form
              </button>
            </div>

            <div className="feature-card search-card">
              <h2 className="section-title">Search Tournaments By Name</h2>
              <input
                type="text"
                className="search-input"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setSelectedTournament(null);
                  setDetailsError(null);
                  setJoinMessage(null);
                }}
                placeholder="Type tournament name"
              />

              {loading && <div className="status-text">Loading tournaments...</div>}
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
                          onClick={() => handleSelectTournament(tournament.id)}
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

            <div className="feature-card details-card">
              <h2 className="section-title">Tournament Details</h2>
              <p className="section-subtitle">
                Select a tournament name above to view full details.
              </p>
              {detailsLoading && (
                <div className="status-text">Loading tournament details...</div>
              )}
              {detailsError && <div className="inline-error">{detailsError}</div>}
              {joinMessage && <div className="join-status">{joinMessage}</div>}
              {!detailsLoading && !detailsError && selectedTournament && (
                <div className="join-actions-wrap">
                  {isCreatorOfSelectedTournament ? (
                    <>
                      <p className="muted-text">
                        You are the creator of this tournament and have admin access.
                        Creators are not included in tournament members.
                      </p>
                      {deleteError && <div className="inline-error">{deleteError}</div>}
                      <button
                        className="small-delete-btn"
                        onClick={handleDeleteTournament}
                        disabled={deleteLoading}
                        title="Delete this tournament"
                      >
                        {deleteLoading ? "..." : "Delete Tournament"}
                      </button>
                    </>
                  ) : isAlreadyMember ? (
                    <p className="muted-text">You already joined this tournament.</p>
                  ) : (
                    <div className="join-form-row">
                      <input
                        type="number"
                        className="search-input join-ranking-input"
                        placeholder="Enter ranking"
                        value={joinRanking}
                        onChange={(e) => setJoinRanking(e.target.value)}
                      />
                      <button
                        className="primary-btn join-btn"
                        onClick={handleJoinTournament}
                        disabled={joinLoading}
                      >
                        {joinLoading ? "Joining..." : "Join Tournament"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!detailsLoading && !detailsError && selectedTournament && (
                <TournamentTable
                  tournament={selectedTournament}
                />
              )}
              {!detailsLoading && !detailsError && !selectedTournament && (
                <p className="muted-text">No tournament selected yet.</p>
              )}
            </div>
          </section>
        )}

        {view === "profile" && (
          <section className="feature-card profile-card">
            <h2 className="section-title">Profile</h2>
            <div className="profile-row">
              <span className="profile-key">Username</span>
              <span className="profile-value">{user.username}</span>
            </div>
            <div className="profile-row">
              <span className="profile-key">Email</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="profile-key">User ID</span>
              <span className="profile-value">{user.id}</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;