import { useState, useEffect } from "react";
import { createRoute, updateRoute } from "../../api/routes.js";
import { useBranches } from "../../context/BranchesContext.jsx";
import "../Roles/RoleModal.scss";
import TypeAhead from "../../components/TypeAhead.jsx";
import RoutePointPicker from "./RoutePointPicker.jsx";

const checkPoint = (label, lat, lng) => {
  if (lat === "" || lng === "") {
    return `${label} point is required. Set it on the map.`;
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return `${label} latitude must be between -90 and 90.`;
  }
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return `${label} longitude must be between -180 and 180.`;
  }
  return "";
};

export default function RouteModal({
  isOpen,
  route = null,
  me,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(route?.id);
  const isPinned = Boolean(me.branch_id);

  const [routeName, setRouteName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startLat, setStartLat] = useState("");
  const [startLng, setStartLng] = useState("");
  const [endLat, setEndLat] = useState("");
  const [endLng, setEndLng] = useState("");
  const { branches, branchesLoading, branchesError, loadBranches } =
    useBranches();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pickerStep, setPickerStep] = useState(null);
  const [isGuidedFlow, setIsGuidedFlow] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (route) {
      setRouteName(route.routeName || "");
      setBranchId(route.branchId || "");
      setIsActive(Boolean(route.isActive));
      setStartLat(route.startLat !== null ? String(route.startLat) : "");
      setStartLng(route.startLng !== null ? String(route.startLng) : "");
      setEndLat(route.endLat !== null ? String(route.endLat) : "");
      setEndLng(route.endLng !== null ? String(route.endLng) : "");
    } else {
      setRouteName("");
      setBranchId(isPinned ? me.branch_id : "");
      setIsActive(true);
      setStartLat("");
      setStartLng("");
      setEndLat("");
      setEndLng("");
    }
    setError("");
    setIsSubmitting(false);
    setPickerStep(null);
    setIsGuidedFlow(false);
  }, [isOpen, route, isPinned, me.branch_id]);

  useEffect(() => {
    if (!isOpen) return;
    if (route) return;
    if (isPinned) return;

    loadBranches();
  }, [isOpen, route, isPinned, loadBranches]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!routeName.trim()) {
      setError("Route Name is required.");
      return;
    }

    if (!isEditMode && !isPinned && !branchId) {
      setError("Please select a branch.");
      return;
    }

    const pointError =
      checkPoint("Start", startLat, startLng) ||
      checkPoint("End", endLat, endLng);
    if (pointError) {
      setError(pointError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await updateRoute(route.id, {
          routeName: routeName.trim(),
          isActive,
          startLat: Number(startLat),
          startLng: Number(startLng),
          endLat: Number(endLat),
          endLng: Number(endLng),
        });
      } else {
        await createRoute({
          routeName: routeName.trim(),
          branchId: isPinned ? me.branch_id : branchId,
          startLat: Number(startLat),
          startLng: Number(startLng),
          endLat: Number(endLat),
          endLng: Number(endLng),
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
    (!isEditMode && !isPinned && branchesLoading) ||
    (!isEditMode && !isPinned && Boolean(branchesError));

  const openPicker = (step) => {
    setIsGuidedFlow(step === "start" && endLat === "");
    setPickerStep(step);
  };

  const closePicker = () => {
    setPickerStep(null);
    setIsGuidedFlow(false);
  };

  const handleConfirmPoint = (lat, lng) => {
    setError("");
    if (pickerStep === "start") {
      setStartLat(lat);
      setStartLng(lng);
      if (isGuidedFlow) {
        setPickerStep("end");
        return;
      }
    } else {
      setEndLat(lat);
      setEndLng(lng);
    }
    closePicker();
  };

  const pointRows = [
    { step: "start", label: "Start point", lat: startLat, lng: startLng },
    { step: "end", label: "End point", lat: endLat, lng: endLng },
  ];

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="add-user-overlay">
      <div className="add-user-modal" onMouseDown={(e) => e.stopPropagation()}>
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
            onClick={requestClose}
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
                    placeholder="Route 1 - North Campus"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                {isEditMode ? (
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label htmlFor="route-branch">Branch</label>
                    <input
                      id="route-branch"
                      type="text"
                      value={route.branchName || "Not assigned"}
                      readOnly
                      disabled
                    />
                    <span
                      className="roles-message"
                      style={{ marginTop: "0.25rem", display: "block" }}
                    >
                      A route's branch cannot be modified after creation.
                    </span>
                  </div>
                ) : !isPinned ? (
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label htmlFor="route-branch">Branch *</label>
                    <TypeAhead
                      options={branches.map((b) => ({ value: b.id, label: b.branchName }))}
                      value={branchId}
                      onChange={setBranchId}
                      placeholder="Select a branch..."
                      disabled={isSubmitting || branchesLoading || Boolean(branchesError)}
                      loading={branchesLoading}
                      emptyMessage="No branches available"
                      noMatchMessage="No branches found"
                    />
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
                ) : null}
              </div>

              <div className="route-points">
                <label>Start and End Points *</label>
                {pointRows.map((row) => (
                  <div className="route-point-row" key={row.step}>
                    <span
                      className={`route-point-dot is-${row.step}`}
                      aria-hidden="true"
                    ></span>
                    <div className="route-point-text">
                      <span className="route-point-label">{row.label}</span>
                      <span className="route-point-value">
                        {row.lat !== "" ? `${row.lat}, ${row.lng}` : "Not set"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="route-point-action"
                      onClick={() => openPicker(row.step)}
                      disabled={isSubmitting}
                    >
                      {row.lat !== "" ? "Change" : "Set on map"}
                    </button>
                  </div>
                ))}
              </div>

              {isEditMode && (
                <div className="form-row" style={{ marginTop: "0.5rem" }}>
                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
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
              onClick={requestClose}
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

      {pickerStep && (
        <RoutePointPicker
          key={pickerStep}
          step={pickerStep}
          initialLat={pickerStep === "start" ? startLat : endLat}
          initialLng={pickerStep === "start" ? startLng : endLng}
          initialCenter={
            pickerStep === "start"
              ? endLat !== ""
                ? [Number(endLat), Number(endLng)]
                : null
              : startLat !== ""
                ? [Number(startLat), Number(startLng)]
                : null
          }
          stepLabel={
            isGuidedFlow
              ? pickerStep === "start"
                ? "Step 1 of 2"
                : "Step 2 of 2"
              : ""
          }
          onConfirm={handleConfirmPoint}
          onBack={closePicker}
        />
      )}
    </div>
  );
}
