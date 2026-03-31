import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signUp } from "../api/userApi";
import { User } from "../types/User";

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = isSignUp
        ? await signUp(username, email, password)
        : await login(email, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      onLogin(response.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="login-bg">
      <div className="login-center-container">
        <div className="login-card">
          <div className="login-card-body">
            <h1 className="login-title">{isSignUp ? "Sign Up" : "Login"}</h1>
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="login-field">
                  <label className="login-label">Username</label>
                  <input
                    type="text"
                    className="login-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="login-field">
                <label className="login-label">Email</label>
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="login-field">
                <label className="login-label">Password</label>
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? isSignUp
                    ? "Signing up..."
                    : "Logging in..."
                  : isSignUp
                    ? "Sign Up"
                    : "Login"}
              </button>
            </form>
            <button
              type="button"
              className="login-toggle-btn"
              onClick={toggleMode}
            >
              {isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </button>
            {error && <div className="login-error">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
