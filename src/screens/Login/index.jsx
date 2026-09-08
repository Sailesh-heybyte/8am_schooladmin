import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.scss";
import { login, getMe } from "../../api/auth.js";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Please enter both fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(identifier, password);

      // The temporary password from the welcome email must be
      // replaced before anything else is reachable.
      const me = await getMe();

      onLoginSuccess?.();

      if (me.must_change_password) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Login failed. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="brand-mark">
          <i className="bi bi-bus-front"></i>
        </div>

        <div className="hero-copy">
          <h1>8AM</h1>
          <p>
            Manage your students, buses, drivers and routes, and keep parents
            informed every time a child boards or alights.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>Live</strong>
            <span>RFID tap alerts</span>
          </div>
          <div>
            <strong>Every trip</strong>
            <span>Boarding records</span>
          </div>
          <div>
            <strong>One place</strong>
            <span>Fleet and students</span>
          </div>
        </div>
      </aside>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-header">
            <p className="eyebrow">School Admin</p>
            <h2>Welcome back</h2>
            <p>Sign in to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="field-group">
              <label htmlFor="identifier">Email or Username</label>
              <div className="input-shell">
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@yourschool.edu"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="input-shell">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            {error && <small className="field-error">{error}</small>}

            <div className="action-row">
              <button
                type="submit"
                className="primary-button full-width"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
