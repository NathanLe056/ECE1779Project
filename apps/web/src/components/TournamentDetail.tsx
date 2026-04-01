import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTournament, deleteTournament } from "../api/tournamentApi";
import { joinTournament } from "../api/tournamentMemberApi";
import TournamentTable from "./TournamentTable";
import { TournamentWithDetails } from "../types/Tournament";
import { User } from "../types/User";

interface TournamentDetailProps {
  user: User | null;
  onLogout: () => void;
  onTournamentDeleted: (tournamentId: number) => void;
}

function TournamentDetail({
  user,
  onLogout,
  onTournamentDeleted,
}: TournamentDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joinRanking, setJoinRanking] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const tournamentId = parseInt(id);
        if (isNaN(tournamentId)) {
          throw new Error("Invalid tournament ID");
        }
        const data = await getTournament(tournamentId);
        setTournament(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tournament details");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const handleJoinTournament = async () => {
    if (!tournament || !user) {
      return;
    }

    setJoinLoading(true);
    setJoinMessage(null);
    setError(null);

    const parsedRanking = Number(joinRanking);
    if (!Number.isInteger(parsedRanking)) {
      setJoinMessage("Please enter a valid integer ranking.");
      setJoinLoading(false);
      return;
    }

    try {
      await joinTournament({
        tournament_id: tournament.id,
        user_id: user.id,
        role: "player",
        ranking: parsedRanking,
      });

      const updatedDetails = await getTournament(tournament.id);
      setTournament(updatedDetails);
      setJoinMessage("You joined this tournament successfully.");
      setJoinRanking("");
    } catch (err: any) {
      setJoinMessage(err.message || "Could not join tournament.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournament) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this tournament? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteTournament(tournament.id);
      await onTournamentDeleted(tournament.id);
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete tournament");
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentUserId = user?.id;
  const isCreator =
    !!tournament &&
    currentUserId !== undefined &&
    tournament.created_by === currentUserId;
  const isAlreadyMember =
    !!tournament &&
    currentUserId !== undefined &&
    tournament.members.some((member) => member.user_id === currentUserId);

  if (loading) {
    return (
      <div className="app-shell">
        <header className="top-nav">
          <div className="top-nav-left">
            {user ? (
              <>
                <button className="nav-btn" onClick={() => navigate("/")}>
                  Home
                </button>
                <button
                  className="nav-btn"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>
              </>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/")}>
                Login
              </button>
            )}
          </div>
          {user && (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </header>
        <main className="main-content">
          <div className="status-text">Loading tournament details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <header className="top-nav">
          <div className="top-nav-left">
            {user ? (
              <>
                <button className="nav-btn" onClick={() => navigate("/")}>
                  Home
                </button>
                <button
                  className="nav-btn"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>
              </>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>
                Login
              </button>
            )}
          </div>
          {user && (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </header>
        <main className="main-content">
          <div className="inline-error">{error}</div>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="app-shell">
        <header className="top-nav">
          <div className="top-nav-left">
            {user ? (
              <>
                <button className="nav-btn" onClick={() => navigate("/")}>
                  Home
                </button>
                <button
                  className="nav-btn"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>
              </>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>
                Login
              </button>
            )}
          </div>
          {user && (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </header>
        <main className="main-content">
          <div className="inline-error">Tournament not found</div>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-left">
          {user ? (
            <>
              <button className="nav-btn" onClick={() => navigate("/")}>
                Home
              </button>
              <button className="nav-btn" onClick={() => navigate("/profile")}>
                Profile
              </button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
        {user && (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </header>

      <main className="main-content">
        <div className="feature-card details-card">
          <h2 className="section-title">
            Tournament Details: {tournament.name}
          </h2>
          <p className="section-subtitle">
            {user
              ? "View and manage tournament information."
              : "View tournament information. Login to join or manage tournaments."}
          </p>

          {joinMessage && <div className="join-status">{joinMessage}</div>}
          {deleteError && <div className="inline-error">{deleteError}</div>}

          <div className="join-actions-wrap">
            {user ? (
              // Authenticated user - show full functionality
              isCreator ? (
                <>
                  <p className="muted-text">
                    You are the creator of this tournament and have admin
                    access. Creators are not included in tournament members.
                  </p>
                  <p className="muted-text">
                    Share this tournament with others by sharing the URL.
                  </p>
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
                <p className="muted-text">
                  You are already a member of this tournament.
                </p>
              ) : (
                <>
                  <p className="muted-text">
                    Join this tournament by entering your ranking.
                  </p>
                  <div className="join-form">
                    <input
                      type="number"
                      className="ranking-input"
                      value={joinRanking}
                      onChange={(e) => setJoinRanking(e.target.value)}
                      placeholder="Your ranking"
                      min="1"
                    />
                    <button
                      className="join-btn"
                      onClick={handleJoinTournament}
                      disabled={joinLoading}
                    >
                      {joinLoading ? "Joining..." : "Join Tournament"}
                    </button>
                  </div>
                </>
              )
            ) : (
              // Unauthenticated user - read-only mode
              <div className="read-only-notice">
                <p className="muted-text">
                  This tournament information is publicly viewable. To join
                  tournaments or create your own, please{" "}
                  <button className="link-btn" onClick={() => navigate("/")}>
                    login
                  </button>
                  .
                </p>
              </div>
            )}
          </div>

          <TournamentTable
            tournament={tournament}
            currentUserId={user?.id ?? null}
          />
        </div>
      </main>
    </div>
  );
}

export default TournamentDetail;
