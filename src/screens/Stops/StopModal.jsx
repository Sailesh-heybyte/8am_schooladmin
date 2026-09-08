import { useState, useEffect } from "react";
import { createStop, updateStop } from "../../api/stops.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function StopModal({
  isOpen,
  stop = null,
  schoolId,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(stop?.id);

  const [stopName, setStopName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill in edit mode, reset in create mode
  // A null latitude or longitude prefills as an empty string, never 0
  useEffect(() => {
    if (!isOpen) return;

    if (stop) {
      setStopName(stop.stopName || "");
      setLatitude(
        stop.latitude !== null && stop.latitude !== undefined
          ? String(stop.latitude)
          : "",
      );
      setLongitude(
        stop.longitude !== null && stop.longitude !== undefined
          ? String(stop.longitude)
          : "",
      );
      setIsActive(Boolean(stop.isActive));
      setBranchId("");
    } else {
      setStopName("");
      setLatitude("");
      setLongitude("");
      setBranchId("");
      setIsActive(true);
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, stop]);

  // Load branches only in create mode
  useEffect(() => {
    if (!isOpen) return;
    if (stop) return; // Skip fetch entirely in edit mode

    let isMounted = true;
    setBranchesLoading(true);
    setBranchesError("");

    const branchesRequest = schoolId
      ? getBranches(schoolId)
      : Promise.resolve([]);

    branchesRequest
      .then((data) => {
        if (!isMounted) return;
        setBranches(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setBranchesError(err.message || "Failed to load branches.");
      })
      .finally(() => {
        if (isMounted) {
          setBranchesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, schoolId, stop]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!stopName.trim()) {
      setError("Stop Name is required.");
      return;
    }

    if (!isEditMode) {
      if (latitude === "" || isNaN(Number(latitude))) {
        setError("Latitude is required and must be a valid number.");
        return;
      }
      if (longitude === "" || isNaN(Number(longitude))) {
        setError("Longitude is required and must be a valid number.");
        return;
      }
      if (!branchId) {
        setError("Please select a branch.");
        return;
      }
    } else {
      if (latitude !== "" && isNaN(Number(latitude))) {
        setError("Latitude must be a valid number.");
        return;
      }
      if (longitude !== "" && isNaN(Number(longitude))) {
        setError("Longitude must be a valid number.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Do NOT send branchId, routeId or sequence on update
        await updateStop(stop.id, {
          stopName: stopName.trim(),
          latitude: latitude !== "" ? Number(latitude) : undefined,
          longitude: longitude !== "" ? Number(longitude) : undefined,
          isActive,
        });
      } else {
        await createStop({
          stopName: stopName.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          branchId,
        });
      }

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save stop. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    (!isEditMode && branchesLoading) ||
    (!isEditMode && Boolean(branchesError));

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>{isEditMode ? "Edit Stop" : "Add Stop"}</h2>
            <p>
              {isEditMode
                ? "Update stop information and status."
                : "Add a new stop to your school."}
            </p>
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
              <h3 className="form-section-title">Stop Details</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="stop-name">Stop Name *</label>
                  <input
                    id="stop-name"
                    type="text"
                    value={stopName}
                    onChange={(e) => setStopName(e.target.value)}
                    placeholder="e.g. Main Gate Stop"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="stop-latitude">
                    Latitude {isEditMode ? "" : "*"}
                  </label>
                  <input
                    id="stop-latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 17.385044"
                    required={!isEditMode}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="stop-longitude">
                    Longitude {isEditMode ? "" : "*"}
                  </label>
                  <input
                    id="stop-longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 78.486671"
                    required={!isEditMode}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {!isEditMode && (
                <div className="form-row">
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label htmlFor="stop-branch">Branch *</label>
                    <select
                      id="stop-branch"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      required
                      disabled={
                        isSubmitting ||
                        branchesLoading ||
                        Boolean(branchesError)
                      }
                    >
                      {branchesLoading ? (
                        <option value="" disabled>
                          Loading branches...
                        </option>
                      ) : (
                        <>
                          <option value="">Select a branch...</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.branchName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {branchesError && (
                      <span
                        className="roles-error"
                        style={{
                          marginTop: "0.25rem",
                          display: "block",
                          color: "#d9534f",
                        }}
                      >
                        {branchesError}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isEditMode && (
                <div className="form-row" style={{ marginTop: "0.5rem" }}>
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label
                      htmlFor="stop-active"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        id="stop-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                        style={{ width: "1.1rem", height: "1.1rem" }}
                      />
                      <span>Active Stop</span>
                    </label>
                  </div>
                </div>
              )}
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
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Stop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
