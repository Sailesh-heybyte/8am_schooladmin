import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getParent } from "../../api/parents.js";
import "../SchoolAdmin/popups/ProfileModal.scss";

export default function ParentDetailsModal({ isOpen, parentId, onClose }) {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !parentId) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    getParent(parentId)
      .then((data) => {
        if (!isMounted) return;
        setParent(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load parent.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, parentId]);

  if (!isOpen) return null;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="profile-modal-body">
          <p className="empty-permissions">Loading parent...</p>
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

    if (!parent) return null;

    return (
      <div className="profile-modal-body">
        <div className="profile-section">
          <h3 className="profile-section-title">Parent Details</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Full Name</span>
              <strong className="field-value">{parent.fullName || "-"}</strong>
            </div>

            <div className="profile-field">
              <span className="field-label">Phone</span>
              <span className="field-value">
                {parent.phone || <span className="muted-cell">-</span>}
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Branch</span>
              <span className="field-value">
                {parent.branchId ? (
                  <code>{parent.branchId}</code>
                ) : (
                  <span className="muted-cell">Not assigned</span>
                )}
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Status</span>
              <div style={{ marginTop: "0.15rem" }}>
                <StatusBadge
                  status={parent.isActive ? "Active" : "Inactive"}
                />
              </div>
            </div>

            <div className="profile-field">
              <span className="field-label">Parent ID</span>
              <span className="field-value">
                <code>{parent.id}</code>
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Created</span>
              <span className="field-value">{parent.createdAt || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div
        className="profile-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Parent Details</h2>
            <p>View parent profile and account information.</p>
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
