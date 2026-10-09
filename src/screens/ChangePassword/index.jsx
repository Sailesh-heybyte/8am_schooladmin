import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Login/Login.scss";
import logo from "../../assets/8am-logo.png";
import loginIllustration from "../../assets/login-illustration.jpg";
import { changePassword, login, getMe } from "../../api/auth.js";

export default function ChangePassword({ onSignedOut }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTemporary, setShowTemporary] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!temporaryPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === temporaryPassword) {
      setError("New password must be different from the temporary password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await changePassword(temporaryPassword, newPassword);
      if (data?.access_token) {
        localStorage.setItem("school_access_token", data.access_token);
        if (data?.refresh_token) {
          localStorage.setItem("school_refresh_token", data.refresh_token);
        }
        navigate("/dashboard");
      } else {
        const storedIdentifier =
          location.state?.identifier ||
          sessionStorage.getItem("school_login_identifier");

        let email = null;
        if (!storedIdentifier) {
          try {
            const me = await getMe();
            email = me?.email;
          } catch {
            // fallback ignored
          }
        }

        if (storedIdentifier) {
          await login(storedIdentifier, newPassword);
          sessionStorage.removeItem("school_login_identifier");
          navigate("/dashboard");
        } else if (email) {
          await login(email, newPassword);
          sessionStorage.removeItem("school_login_identifier");
          navigate("/dashboard");
        } else {
          localStorage.removeItem("school_access_token");
          localStorage.removeItem("school_refresh_token");
          sessionStorage.setItem(
            "login_notice",
            "Password changed. Please sign in with your new password.",
          );
          onSignedOut();
          navigate("/login", {
            replace: true,
            state: {
              notice:
                "Password changed. Please sign in with your new password.",
            },
          });
        }
      }
    } catch (err) {
      setError(err.message || "Could not change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page change-password-page">
      <section className="login-panel">
        <div className="login-card">
          <img className="login-logo" src={logo} alt="The 8AM" />

          <div className="login-header">
            <h2>Change your password</h2>
            <p>Replace the temporary password from your welcome email.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="temporary">
                Temporary Password <span className="required">*</span>
              </label>
              <div className="input-shell">
                <input
                  id="temporary"
                  type={showTemporary ? "text" : "password"}
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="From your welcome email"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowTemporary(!showTemporary)}
                  aria-label={showTemporary ? "Hide password" : "Show password"}
                >
                  <i
                    className={`bi ${showTemporary ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="new-password">
                New Password <span className="required">*</span>
              </label>
              <div className="input-shell">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  <i
                    className={`bi ${showNew ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirm-password">
                Confirm New Password <span className="required">*</span>
              </label>
              <div className="input-shell">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the new password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <i
                    className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}
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
                {isSubmitting ? "Saving..." : "Change Password"}
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
