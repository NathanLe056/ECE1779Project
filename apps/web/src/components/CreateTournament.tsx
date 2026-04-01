import { useNavigate } from "react-router-dom";
import { TournamentSummary } from "../types/Tournament";
import { User } from "../types/User";
import CreateTournamentForm from "./CreateTournamentForm";

interface CreateTournamentProps {
  user: User | null;
  onLogout: () => void;
  onTournamentCreated: (tournament: TournamentSummary) => void;
}

function CreateTournament({
  user,
  onLogout,
  onTournamentCreated,
}: CreateTournamentProps) {
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleCreated = (tournament: TournamentSummary) => {
    onTournamentCreated(tournament);
    navigate("/");
  };

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-left">
          <button className="nav-btn" onClick={() => navigate("/")}>
            Home
          </button>
          <button className="nav-btn" onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>
      <CreateTournamentForm
        onCancel={() => navigate("/")}
        onCreated={handleCreated}
      />
    </>
  );
}

export default CreateTournament;
