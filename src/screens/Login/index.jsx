import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.scss";
import logo from "../../assets/8am-logo.png";
import loginIllustration from "../../assets/login-illustration.jpg";
import { login } from "../../api/auth.js";

function takeLoginNotice() {
  const notice = sessionStorage.getItem("login_notice") || "";
  sessionStorage.removeItem("login_notice");
  return notice;
}

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notice, setNotice] = useState(() => location.state?.notice || takeLoginNotice());
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!identifier || !password) {
      setError("Please enter both fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(identifier, password);
      sessionStorage.setItem("school_login_identifier", identifier);
      onLoginSuccess?.();
      navigate("/dashboard", { replace: true });
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
      <section className="login-panel">
        <div className="login-card">
          <img className="login-logo" src={logo} alt="The 8AM" />

          <div className="login-header">
            <h2>Sign In</h2>
            <p>Enter your email and password to sign in.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            {notice && <div className="status-box">{notice}</div>}

            <div className="field-group">
              <label htmlFor="identifier">
                Email or Username <span className="required">*</span>
              </label>
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
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
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

      <aside className="login-hero">
        <img className="hero-image" src={loginIllustration} alt="" />
      </aside>
    </div>
  );
}
