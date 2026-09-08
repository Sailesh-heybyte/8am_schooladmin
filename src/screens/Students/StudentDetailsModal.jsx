import StatusBadge from "../../components/StatusBadge.jsx";
import "../SchoolAdmin/popups/ProfileModal.scss";

export default function StudentDetailsModal({ isOpen, student, onClose }) {
  if (!isOpen || !student) return null;

  const parents = student.parents || [];

  const hasCoords =
    student.homeLatitude !== null &&
    student.homeLatitude !== undefined &&
    student.homeLongitude !== null &&
    student.homeLongitude !== undefined;

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
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Student Section */}
          <div className="profile-section">
            <h3 className="profile-section-title">Student</h3>
            <div className="profile-account-grid">
              <div className="profile-field">
                <span className="field-label">Full Name</span>
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

              <div className="profile-field">
                <span className="field-label">Branch</span>
                <span className="field-value">
                  {student.branchId ? (
                    <code>{student.branchId}</code>
                  ) : (
                    <span className="muted-cell">Not assigned</span>
                  )}
                </span>
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
                <span className="field-label">Home Coordinates</span>
                <span className="field-value">
                  {hasCoords
                    ? `${student.homeLatitude}, ${student.homeLongitude}`
                    : "Not set"}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Stop</span>
                <span className="field-value">
                  {student.stopId ? (
                    <code>{student.stopId}</code>
                  ) : (
                    <span className="muted-cell">Not assigned</span>
                  )}
                </span>
              </div>

              <div className="profile-field profile-field-wide">
                <span className="field-label">Created At</span>
                <span className="field-value">{student.createdAt || "-"}</span>
              </div>
            </div>
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
