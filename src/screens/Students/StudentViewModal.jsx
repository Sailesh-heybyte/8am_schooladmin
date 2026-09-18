import StatusBadge from "../../components/StatusBadge.jsx";
import { formatDate } from "../../utils/helpers.js";
import "../SchoolAdmin/popups/ProfileModal.scss";

function formatRelationship(rel) {
  if (!rel) return "—";
  return rel.charAt(0).toUpperCase() + rel.slice(1);
}

export default function StudentViewModal({ isOpen, student, onClose }) {
  if (!isOpen || !student) return null;

  const parents = student.parents || [];
  const homeLat =
    student.homeLatitude !== null && student.homeLatitude !== undefined
      ? student.homeLatitude
      : "—";
  const homeLng =
    student.homeLongitude !== null && student.homeLongitude !== undefined
      ? student.homeLongitude
      : "—";
  const createdDate = formatDate(student.createdAt) || "—";

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div
        className="profile-modal"
        style={{ width: "38rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Student Details</h2>
            <p>View student profile and linked parent contacts.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Student Information */}
          <div className="profile-section">
            <h3 className="profile-section-title">Student Information</h3>
            <div className="profile-account-grid">
              <div className="profile-field">
                <span className="field-label">Full Name</span>
                <strong className="field-value">{student.fullName || "—"}</strong>
              </div>

              <div className="profile-field">
                <span className="field-label">Admission Number</span>
                <strong className="field-value">
                  {student.admissionNumber || "—"}
                </strong>
              </div>

              <div className="profile-field">
                <span className="field-label">Status</span>
                <div style={{ marginTop: "0.15rem" }}>
                  <StatusBadge
                    status={student.isActive ? "Active" : "Inactive"}
                  />
                </div>
              </div>

              <div className="profile-field">
                <span className="field-label">Created Date</span>
                <span className="field-value">{createdDate}</span>
              </div>

              <div className="profile-field">
                <span className="field-label">Branch</span>
                <span className="field-value">
                  {student.branchId ? (
                    <code>{student.branchId}</code>
                  ) : (
                    <span className="muted-cell">—</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Stop</span>
                <span className="field-value">
                  {student.stopId ? (
                    <code>{student.stopId}</code>
                  ) : (
                    <span className="muted-cell">—</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Home Latitude</span>
                <span className="field-value">{homeLat}</span>
              </div>

              <div className="profile-field">
                <span className="field-label">Home Longitude</span>
                <span className="field-value">{homeLng}</span>
              </div>
            </div>
          </div>

          {/* Parents Section */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              Parents {parents.length > 0 ? `(${parents.length})` : ""}
            </h3>
            {parents.length === 0 ? (
              <p className="empty-permissions">No parents linked.</p>
            ) : (
              parents.map((p, idx) => (
                <div
                  key={p.parentId || `parent-${idx}`}
                  className="profile-account-grid"
                  style={{
                    gridTemplateColumns: "1.2fr 1fr 1fr",
                    ...(idx > 0
                      ? {
                          marginTop: "0.75rem",
                          paddingTop: "0.75rem",
                          borderTop: "0.05rem solid #e4e7ec",
                        }
                      : {}),
                  }}
                >
                  <div className="profile-field">
                    <span className="field-label">Full Name</span>
                    <strong className="field-value">{p.fullName || "—"}</strong>
                  </div>

                  <div className="profile-field">
                    <span className="field-label">Phone</span>
                    <span className="field-value">{p.phone || "—"}</span>
                  </div>

                  <div className="profile-field">
                    <span className="field-label">Relationship</span>
                    <span className="field-value">
                      {formatRelationship(p.relationship)}
                    </span>
                  </div>
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
