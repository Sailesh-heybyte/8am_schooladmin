import { useState, useEffect } from "react";
import { createStop, updateStop } from "../../api/stops.js";
import { getBranches } from "../../api/branches.js";
import LocationPicker from "../../components/LocationPicker.jsx";
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
  const [mapsPaste, setMapsPaste] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill fields in edit mode, reset in create mode
  useEffect(() => {
    if (!isOpen) return;

    if (stop) {
      setStopName(stop.stopName || "");
      // A null latitude or longitude must prefill as an empty string, never as 0
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
      setBranchId(stop.branchId || "");
      setIsActive(Boolean(stop.isActive));
      setMapsPaste("");
    } else {
      setStopName("");
      setLatitude("");
      setLongitude("");
      setBranchId("");
      setIsActive(true);
      setMapsPaste("");
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, stop]);

  // Load branches inside the modal only for create mode
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

  const handlePasteChange = (e) => {
    const val = e.target.value;
    setMapsPaste(val);

    // If matches two numbers separated by a comma, split and fill latitude and longitude
    const parts = val.split(",");
    if (parts.length === 2) {
      const latStr = parts[0].trim();
      const lngStr = parts[1].trim();

      const numRegex = /^-?\d+(\.\d+)?$/;
      if (numRegex.test(latStr) && numRegex.test(lngStr)) {
        setLatitude(latStr);
        setLongitude(lngStr);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!stopName.trim()) {
      setError("Stop Name is required.");
      return;
    }

    if (latitude === "" || latitude === null || latitude === undefined) {
      setError("Latitude is required.");
      return;
    }

    if (longitude === "" || longitude === null || longitude === undefined) {
      setError("Longitude is required.");
      return;
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    if (!isEditMode && !branchId) {
      setError("Please select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Do NOT send branchId, routeId or sequence on update
        await updateStop(stop.id, {
          stopName: stopName.trim(),
          latitude: latNum,
          longitude: lngNum,
          isActive,
        });
      } else {
        await createStop({
          stopName: stopName.trim(),
          latitude: latNum,
          longitude: lngNum,
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
      <div className="add-user-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-user-header">
          <div>
            <h2>{isEditMode ? "Edit Stop" : "Add Stop"}</h2>
            <p>
              {isEditMode
                ? "Update stop name, coordinates, and active status."
                : "Add a new stop location for school routes."}
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

              {/* Map Location Picker */}
              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label>Stop Location (Map)</label>
                  <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(lat, lng) => {
                      setLatitude(String(lat));
                      setLongitude(String(lng));
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="stop-latitude">Latitude *</label>
                  <input
                    id="stop-latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 17.385044"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="stop-longitude">Longitude *</label>
                  <input
                    id="stop-longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 78.486671"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  {isEditMode ? (
                    <>
                      <label htmlFor="stop-branch">Branch</label>
                      <input
                        id="stop-branch"
                        type="text"
                        value={stop.branchId || "Not assigned"}
                        readOnly
                        disabled
                      />
                      <span
                        className="roles-message"
                        style={{ marginTop: "0.25rem", display: "block" }}
                      >
                        A stop cannot be moved between branches.
                      </span>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Route Display in Edit Mode if Stop is on a Route */}
              {isEditMode && stop.routeId && (
                <div className="form-row">
                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
                    <label htmlFor="stop-route">Route</label>
                    <input
                      id="stop-route"
                      type="text"
                      value={`${stop.routeId}${
                        stop.sequence !== null && stop.sequence !== undefined
                          ? ` · stop ${stop.sequence}`
                          : ""
                      }`}
                      readOnly
                      disabled
                    />
                    <span
                      className="roles-message"
                      style={{ marginTop: "0.25rem", display: "block" }}
                    >
                      Route membership is managed from the Routes screen.
                    </span>
                  </div>
                </div>
              )}

              {/* Active Checkbox in Edit Mode */}
              {isEditMode && (
                <div className="form-row" style={{ marginTop: "0.5rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#344054",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={isSubmitting}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    Active stop
                  </label>
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
