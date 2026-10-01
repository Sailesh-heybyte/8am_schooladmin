import { useState } from "react";
import "../../Roles/RoleModal.scss";
import "./ChangePasswordModal.scss";
import { changePassword } from "../../../api/auth.js";

function PasswordField({ id, label, value, onChange, autoComplete, disabled }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="form-field role-description-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-shell">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-eye"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          <i className={`bi ${isVisible ? "bi-eye-slash" : "bi-eye"}`}></i>
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    currentPassword !== "" &&
    newPassword !== "" &&
    confirmPassword !== "" &&
    passwordsMatch &&
    !isSubmitting;

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");

    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await onChanged();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-user-overlay">
      <div
        className="add-user-modal role-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Change Password</h2>
            <p>You will be signed out and can sign in with the new password.</p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="add-user-body">
            <div className="form-section">
              <h3 className="form-section-title">Password</h3>

              <div className="form-row">
                <PasswordField
                  id="current-password"
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <PasswordField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <PasswordField
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              {confirmPassword !== "" && (
                <p
                  className={`password-match ${
                    passwordsMatch ? "is-match" : "is-mismatch"
                  }`}
                >
                  <i
                    className={`bi ${
                      passwordsMatch ? "bi-check-circle" : "bi-x-circle"
                    }`}
                  ></i>
                  {passwordsMatch
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
            </div>
          </div>

          {error && <div className="add-user-error">{error}</div>}

          <div className="add-user-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="modal-save" disabled={!canSubmit}>
              {isSubmitting ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
