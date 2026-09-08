import { useState, useEffect } from "react";
import { assignDriver } from "../../api/buses.js";
import { getDrivers } from "../../api/drivers.js";
import "../Roles/RoleModal.scss";

export default function AssignDriverModal({
  isOpen,
  bus,
  onClose,
  onSaved,
}) {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load drivers inside the modal on open, matching BusModal's pattern
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setLoadError("");
    setError("");
    setSelectedDriverId("");

    getDrivers()
      .then((data) => {
        if (!isMounted) return;
        setDrivers(data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to load drivers.");
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

  if (!isOpen || !bus) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDriverId) {
      setError("Please select a driver.");
      return;
    }

    setIsSubmitting(true);

    try {
      await assignDriver(bus.id, selectedDriverId);
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign driver. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    loading ||
    Boolean(loadError) ||
    drivers.length === 0 ||
    !selectedDriverId;

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Assign Driver</h2>
            <p>Assign a driver to {bus.busName}.</p>
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
              <h3 className="form-section-title">Driver Assignment</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-bus-name">Bus</label>
                  <input
                    id="assign-bus-name"
                    type="text"
                    value={bus.busName}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="assign-driver-select">Driver *</label>
                  <select
                    id="assign-driver-select"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    required
                    disabled={
                      isSubmitting ||
                      loading ||
                      Boolean(loadError) ||
                      drivers.length === 0
                    }
                  >
                    {loading ? (
                      <option value="" disabled>
                        Loading drivers...
                      </option>
                    ) : loadError ? (
                      <option value="" disabled>
                        Failed to load drivers
                      </option>
                    ) : drivers.length === 0 ? (
                      <option value="" disabled>
                        No drivers found. Add a driver first.
                      </option>
                    ) : (
                      <>
                        <option value="">Select a driver...</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName}
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

                  {!loading && !loadError && drivers.length === 0 && (
                    <span
                      className="roles-message"
                      style={{
                        marginTop: "0.25rem",
                        display: "block",
                        color: "#667085",
                      }}
                    >
                      No drivers found. Add a driver first.
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
              {isSubmitting ? "Assigning..." : "Assign Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
