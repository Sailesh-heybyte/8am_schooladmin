import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login/Login.scss";
import { changePassword } from "../../api/auth.js";

export default function ChangePassword() {
  const navigate = useNavigate();

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
      await changePassword(temporaryPassword, newPassword);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page change-password-page">
      <aside className="login-hero">
        <div className="brand-mark">
          <i className="bi bi-bus-front"></i>
        </div>

        <div className="hero-copy">
          <h1>8AM</h1>
          <p>
            Set a password you will use from now on. The temporary password from
            your welcome email works only once.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>Step 1</strong>
            <span>Set your password</span>
          </div>
          <div>
            <strong>Step 2</strong>
            <span>Add your students</span>
          </div>
          <div>
            <strong>Step 3</strong>
            <span>Start tracking</span>
          </div>
        </div>
      </aside>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-header">
            <p className="eyebrow">One-time step</p>
            <h2>Change your password</h2>
            <p>Replace the temporary password.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="temporary">Temporary Password</label>
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
              <label htmlFor="new-password">New Password</label>
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
              <label htmlFor="confirm-password">Confirm New Password</label>
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
    </div>
  );
}
