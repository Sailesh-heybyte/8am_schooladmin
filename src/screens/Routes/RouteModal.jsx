import { useState, useEffect } from "react";
import { createRoute, updateRoute } from "../../api/routes.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function RouteModal({
  isOpen,
  route = null,
  schoolId,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(route?.id);

  const [routeName, setRouteName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill in edit mode, reset in create mode
  useEffect(() => {
    if (!isOpen) return;

    if (route) {
      setRouteName(route.routeName || "");
      setBranchId(route.branchId || "");
      setIsActive(Boolean(route.isActive));
    } else {
      setRouteName("");
      setBranchId("");
      setIsActive(true);
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, route]);

  // Load branches only in create mode
  useEffect(() => {
    if (!isOpen) return;
    if (route) return; // Skip fetch entirely in edit mode

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
  }, [isOpen, schoolId, route]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!routeName.trim()) {
      setError("Route Name is required.");
      return;
    }

    if (!isEditMode && !branchId) {
      setError("Please select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await updateRoute(route.id, {
          routeName: routeName.trim(),
          isActive,
        });
      } else {
        await createRoute({
          routeName: routeName.trim(),
          branchId,
        });
      }

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save route. Please try again.");
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
            <h2>{isEditMode ? "Edit Route" : "Add Route"}</h2>
            <p>
              {isEditMode
                ? "Update route details and status."
                : "Create a new transport route for your school."}
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
              <h3 className="form-section-title">Route Details</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="route-name">Route Name *</label>
                  <input
                    id="route-name"
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. Route 1 - North Campus"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  {isEditMode ? (
                    <>
                      <label htmlFor="route-branch">Branch</label>
                      <input
                        id="route-branch"
                        type="text"
                        value={route.branchId || "Not assigned"}
                        readOnly
                        disabled
                      />
                      <span
                        className="roles-message"
                        style={{ marginTop: "0.25rem", display: "block" }}
                      >
                        A route's branch cannot be modified after creation.
                      </span>
                    </>
                  ) : (
                    <>
                      <label htmlFor="route-branch">Branch *</label>
                      <select
                        id="route-branch"
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

              {isEditMode && (
                <div className="form-row" style={{ marginTop: "0.5rem" }}>
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label
                      htmlFor="route-active"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        id="route-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                        style={{ width: "1.1rem", height: "1.1rem" }}
                      />
                      <span>Active Route</span>
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
                  : "Add Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
