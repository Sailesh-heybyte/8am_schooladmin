import { useState, useEffect } from "react";
import { assignStop } from "../../api/students.js";
import { getStops } from "../../api/stops.js";
import "../Roles/RoleModal.scss";

export default function AssignStopModal({
  isOpen,
  student,
  onClose,
  onSaved,
}) {
  const [stops, setStops] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load stops inside the modal on open, keyed on [isOpen]
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setLoadError("");
    setError("");
    setSelectedStopId("");

    getStops()
      .then((data) => {
        if (!isMounted) return;
        setStops(data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to load stops.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStopId) {
      setError("Please select a stop.");
      return;
    }

    setIsSubmitting(true);

    try {
      await assignStop(student.id, selectedStopId);
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign stop. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    loading ||
    Boolean(loadError) ||
    stops.length === 0 ||
    !selectedStopId;

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Assign Stop</h2>
            <p>Assign a stop to {student.fullName}.</p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="add-user-body">
            <div className="form-section">
              <h3 className="form-section-title">Student Information</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-student-name">Student Name</label>
                  <input
                    id="assign-student-name"
                    type="text"
                    value={student.fullName || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-student-admission">
                    Admission Number
                  </label>
                  <input
                    id="assign-student-admission"
                    type="text"
                    value={student.admissionNumber || "-"}
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Stop Assignment</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-stop-select">Stop *</label>
                  <select
                    id="assign-stop-select"
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    required
                    disabled={
                      isSubmitting ||
                      loading ||
                      Boolean(loadError) ||
                      stops.length === 0
                    }
                  >
                    {loading ? (
                      <option value="" disabled>
                        Loading stops...
                      </option>
                    ) : loadError ? (
                      <option value="" disabled>
                        Failed to load stops
                      </option>
                    ) : stops.length === 0 ? (
                      <option value="" disabled>
                        No stops found. Add a stop first.
                      </option>
                    ) : (
                      <>
                        <option value="">Select a stop...</option>
                        {stops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.stopName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {loadError && (
                    <span
                      className="roles-error"
                      style={{
                        marginTop: "0.25rem",
                        display: "block",
                        color: "#d9534f",
                      }}
                    >
                      {loadError}
                    </span>
                  )}

                  {!loading && !loadError && stops.length === 0 && (
                    <span
                      className="roles-message"
                      style={{
                        marginTop: "0.25rem",
                        display: "block",
                        color: "#667085",
                      }}
                    >
                      No stops found. Add a stop first.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="add-user-error">{error}</div>}

          <div className="add-user-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-save"
              disabled={isSaveDisabled}
            >
              {isSubmitting ? "Assigning..." : "Assign Stop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
