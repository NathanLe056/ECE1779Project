import { useNavigate } from "react-router-dom";
import { User } from "../types/User";

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
}

function Profile({ user, onLogout }: ProfileProps) {
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-left">
          <button className="nav-btn" onClick={() => navigate("/")}>
            Home
          </button>
          <button className="nav-btn active">Profile</button>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="main-content">
        <section className="home-content">
          <h1 className="welcome-title">Profile</h1>

          <div className="feature-card">
            <h2 className="section-title">User Information</h2>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
