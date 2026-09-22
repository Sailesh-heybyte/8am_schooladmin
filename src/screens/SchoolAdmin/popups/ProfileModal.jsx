import "./ProfileModal.scss";

function formatPermissionName(codename) {
  if (!codename) return "";
  const words = codename.split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function ProfileModal({ isOpen, me, onClose }) {
  if (!isOpen) return null;

  const isPlatformLevel = !me.school_id && !me.branch_id;
  const permissions = me.permissions;

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

        <div className="profile-modal-body">
          {/* Account Section */}
          <div className="profile-section">
            <h3 className="profile-section-title">Account</h3>
            <div className="profile-account-grid">
              <div className="profile-field">
                <span className="field-label">Full Name</span>
                <strong className="field-value">{me.full_name}</strong>
              </div>

              <div className="profile-field">
                <span className="field-label">Email Address</span>
                <strong className="field-value">{me.email}</strong>
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

        <div className="profile-modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
