import { useState, useEffect } from "react";
import { getStudentParents } from "../../api/students.js";
import "../SchoolAdmin/popups/ProfileModal.scss";

export default function StudentParentsModal({ isOpen, student, onClose }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !student?.id) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    getStudentParents(student.id)
      .then((data) => {
        if (!isMounted) return;
        setParents(data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load parents.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div
        className="profile-modal"
        style={{ width: "38rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Student Parents</h2>
            <p>View linked parents and guardians for this student.</p>
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
          {/* Student Context */}
          <div className="profile-section">
            <h3 className="profile-section-title">Student</h3>
            <div className="profile-account-grid">
              <div className="profile-field">
                <span className="field-label">Student Name</span>
                <strong className="field-value">
                  {student.fullName || "-"}
                </strong>
              </div>

              <div className="profile-field">
                <span className="field-label">Admission Number</span>
                <strong className="field-value">
                  {student.admissionNumber || "-"}
                </strong>
              </div>
            </div>
          </div>

          {/* Linked Parents Section */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              Linked Parents {loading ? "" : `(${parents.length})`}
            </h3>

            {loading ? (
              <p className="empty-permissions">Loading parents...</p>
            ) : error ? (
              <p className="empty-permissions" style={{ color: "#d9534f" }}>
                {error}
              </p>
            ) : parents.length === 0 ? (
              <div style={{ padding: "0.25rem 0" }}>
                <p
                  style={{
                    margin: 0,
                    color: "#475467",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  No parents linked to this student.
                </p>
                <span
                  className="muted-cell"
                  style={{
                    fontSize: "0.7rem",
                    marginTop: "0.25rem",
                    display: "block",
                  }}
                >
                  Use &quot;Add parent&quot; from the student&apos;s three-dot
                  menu to link a guardian.
                </span>
              </div>
            ) : (
              parents.map((p, idx) => (
                <div
                  key={p.parentId || idx}
                  className="profile-account-grid"
                  style={
                    idx > 0
                      ? {
                          marginTop: "0.75rem",
                          paddingTop: "0.75rem",
                          borderTop: "0.05rem solid #e4e7ec",
                        }
                      : undefined
                  }
                >
                  <div className="profile-field">
                    <span className="field-label">Full Name</span>
                    <strong className="field-value">{p.fullName || "-"}</strong>
                  </div>

                  <div className="profile-field">
                    <span className="field-label">Relationship</span>
                    <span className="field-value">
                      {p.relationship
                        ? p.relationship.charAt(0).toUpperCase() +
                          p.relationship.slice(1)
                        : "-"}
                    </span>
                  </div>

                  <div className="profile-field">
                    <span className="field-label">Phone</span>
                    <span className="field-value">
                      {p.phone || <span className="muted-cell">-</span>}
                    </span>
                  </div>

                  <div className="profile-field"></div>
                </div>
              ))
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
