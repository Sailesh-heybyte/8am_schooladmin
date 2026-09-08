import { useState, useEffect } from "react";
import { getMe } from "../../../api/auth.js";
import "./ProfileModal.scss";

function formatPermissionName(codename) {
  if (!codename) return "";
  const words = codename.split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function ProfileModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    getMe()
      .then((data) => {
        if (!isMounted) return;
        setUser(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load profile.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPlatformLevel = !user?.school_id && !user?.branch_id;
  const permissions = user?.permissions || [];

  const renderBody = () => {
    if (loading) {
      return (
        <div className="profile-modal-body">
          <p className="empty-permissions">Loading profile...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="profile-modal-body">
          <p className="empty-permissions" style={{ color: "#d9534f" }}>
            {error}
          </p>
        </div>
      );
    }

    return (
      <div className="profile-modal-body">
        {/* Account Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">Account</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Full Name</span>
              <strong className="field-value">{user?.full_name || "-"}</strong>
            </div>

            <div className="profile-field">
              <span className="field-label">Email Address</span>
              <strong className="field-value">{user?.email || "-"}</strong>
            </div>

            <div className="profile-field profile-field-wide">
              <span className="field-label">Access Scope</span>
              <div className="scope-box">
                <strong className="scope-title">
                  {isPlatformLevel
                    ? "Platform level - full system access"
                    : "School level"}
                </strong>
                <p className="scope-desc">
                  {isPlatformLevel
                    ? "This account has global administrative access across all platform schools and branches."
                    : "This account is restricted to assigned school and branch operations."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">
            Permissions ({permissions.length})
          </h3>
          {permissions.length === 0 ? (
            <p className="empty-permissions">No permissions assigned.</p>
          ) : (
            <div className="permissions-grid">
              {permissions.map((perm) => (
                <div key={perm} className="permission-pill">
                  <i className="bi bi-shield-check"></i>
                  <span>{formatPermissionName(perm)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <h2>User Profile</h2>
            <p>View your account details and assigned system permissions.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {renderBody()}

        <div className="profile-modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
