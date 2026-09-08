import { useState, useEffect } from "react";
import { assignBus } from "../../api/routes.js";
import { getBuses } from "../../api/buses.js";
import "../Roles/RoleModal.scss";

export default function AssignBusModal({
  isOpen,
  route,
  onClose,
  onSaved,
}) {
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setLoadError("");
    setError("");
    setSelectedBusId("");

    getBuses()
      .then((data) => {
        if (!isMounted) return;
        setBuses(data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to load buses.");
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

  if (!isOpen || !route) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedBusId) {
      setError("Please select a bus.");
      return;
    }

    setIsSubmitting(true);

    try {
      await assignBus(route.id, selectedBusId);
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign bus. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    loading ||
    Boolean(loadError) ||
    buses.length === 0 ||
    !selectedBusId;

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        style={{ width: "32rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Assign Bus</h2>
            <p>Assign a bus to {route.routeName}.</p>
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
              <h3 className="form-section-title">Bus Assignment</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-route-name">Route</label>
                  <input
                    id="assign-route-name"
                    type="text"
                    value={route.routeName}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-bus-select">Bus *</label>
                  <select
                    id="assign-bus-select"
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    required
                    disabled={
                      isSubmitting ||
                      loading ||
                      Boolean(loadError) ||
                      buses.length === 0
                    }
                  >
                    {loading ? (
                      <option value="" disabled>
                        Loading buses...
                      </option>
                    ) : loadError ? (
                      <option value="" disabled>
                        Failed to load buses
                      </option>
                    ) : buses.length === 0 ? (
                      <option value="" disabled>
                        No buses available. Add a bus first.
                      </option>
                    ) : (
                      <>
                        <option value="">Select a bus...</option>
                        {buses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.busName}{b.registrationNumber ? ` (${b.registrationNumber})` : ""}
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
              {isSubmitting ? "Assigning..." : "Assign Bus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
