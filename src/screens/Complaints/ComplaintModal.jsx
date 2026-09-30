import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getStudent } from "../../api/students.js";
import { updateComplaint } from "../../api/complaints.js";
import { formatDateTime, formatEnumLabel } from "../../utils/helpers.js";
import "../SchoolAdmin/popups/ProfileModal.scss";
import "./ComplaintModal.scss";

export default function ComplaintModal({ complaint, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState("");

  const isResolved = complaint.status === "resolved";

  useEffect(() => {
    let isMounted = true;

    getStudent(complaint.studentId)
      .then((student) => {
        if (!isMounted) return;
        setStudentName(student.fullName);
      })
      .catch((err) => {
        if (!isMounted) return;
        setStudentError(err.message);
      })
      .finally(() => {
        if (isMounted) setStudentLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [complaint.studentId]);

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleResolve = async () => {
    setError("");
    if (!note.trim()) {
      setError("Resolution note is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateComplaint(complaint.id, {
        status: "resolved",
        resolutionNote: note.trim(),
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="profile-modal-overlay"
      onMouseDown={isResolved ? onClose : undefined}
    >
      <div
        className="profile-modal complaint-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Complaint details</h2>
            <p>{`Submitted ${formatDateTime(complaint.createdAtIso)}`}</p>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-section">
            <h3 className="profile-section-title">Details</h3>
            <div className="profile-account-grid">
              <div className="profile-field profile-field-wide">
                <span className="field-label">Subject</span>
                <span className="field-value">{complaint.subject}</span>
              </div>

              <div className="profile-field">
                <span className="field-label">Student</span>
                <span className="field-value">
                  {studentLoading
                    ? "Loading…"
                    : studentError
                      ? studentError
                      : studentName}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Category</span>
                <span className="field-value">
                  {formatEnumLabel(complaint.category)}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <StatusBadge status={complaint.status} />
                </span>
              </div>

              <div className="profile-field profile-field-wide">
                <span className="field-label">Description</span>
                <span className="field-value complaint-text">
                  {complaint.description}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">Resolution</h3>
            {isResolved ? (
              <div className="profile-account-grid">
                <div className="profile-field">
                  <span className="field-label">Resolved</span>
                  <span className="field-value">
                    {formatDateTime(complaint.resolvedAtIso)}
                  </span>
                </div>

                <div className="profile-field profile-field-wide">
                  <span className="field-label">Note</span>
                  <span className="field-value complaint-text">
                    {complaint.resolutionNote}
                  </span>
                </div>
              </div>
            ) : (
              <div className="profile-field profile-field-wide">
                <label className="field-label" htmlFor="resolution-note">
                  Resolution note
                </label>
                <textarea
                  id="resolution-note"
                  className="complaint-note-input"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe what was done to resolve this complaint."
                  disabled={isSubmitting}
                />
                {error && <p className="complaint-note-error">{error}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="profile-modal-footer">
          <button
            type="button"
            className="modal-cancel"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            Close
          </button>
          {!isResolved && (
            <button
              type="button"
              className="primary-button"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Mark as resolved"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
