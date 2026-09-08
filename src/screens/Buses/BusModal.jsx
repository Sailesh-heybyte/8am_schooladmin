import { useState, useEffect } from "react";
import { createBus, updateBus } from "../../api/buses.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function BusModal({
  isOpen,
  bus = null,
  schoolId,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(bus?.id);

  const [busName, setBusName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (bus) {
      setBusName(bus.busName || "");
      setRegistrationNumber(bus.registrationNumber || "");
      setCapacity(
        bus.capacity !== undefined && bus.capacity !== null
          ? String(bus.capacity)
          : "",
      );
      setBranchId(bus.branchId || "");
    } else {
      setBusName("");
      setRegistrationNumber("");
      setCapacity("");
      setBranchId("");
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, bus]);

  // Load branches inside the modal for create mode
  useEffect(() => {
    if (!isOpen) return;
    if (bus) return; // Edit mode does not need branches

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
  }, [isOpen, schoolId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!busName.trim()) {
      setError("Bus Name is required.");
      return;
    }
    if (!registrationNumber.trim()) {
      setError("Registration Number is required.");
      return;
    }
    const numCap = Number(capacity);
    if (!capacity || isNaN(numCap) || numCap < 1) {
      setError("Capacity must be at least 1.");
      return;
    }
    if (!isEditMode && !branchId) {
      setError("Please select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await updateBus(bus.id, {
          busName: busName.trim(),
          registrationNumber: registrationNumber.trim(),
          capacity: numCap,
        });
      } else {
        await createBus({
          busName: busName.trim(),
          registrationNumber: registrationNumber.trim(),
          capacity: numCap,
          branchId,
        });
      }

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save bus. Please try again.");
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
            <h2>{isEditMode ? "Edit Bus" : "Add Bus"}</h2>
            <p>
              {isEditMode
                ? "Update bus information and seating capacity."
                : "Add a new bus to your school fleet."}
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
              <h3 className="form-section-title">Bus Details</h3>
              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="bus-name">Bus Name *</label>
                  <input
                    id="bus-name"
                    type="text"
                    value={busName}
                    onChange={(e) => setBusName(e.target.value)}
                    placeholder="e.g. Bus Garuda"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="bus-registration">
                    Registration Number *
                  </label>
                  <input
                    id="bus-registration"
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. AP01AB9959"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="bus-capacity">Capacity *</label>
                  <input
                    id="bus-capacity"
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 40"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  {isEditMode ? (
                    <>
                      <label htmlFor="bus-branch">Branch</label>
                      <input
                        id="bus-branch"
                        type="text"
                        value={bus.branchId || "Not assigned"}
                        readOnly
                        disabled
                      />
                      <span
                        className="roles-message"
                        style={{ marginTop: "0.25rem", display: "block" }}
                      >
                        A bus cannot be moved between branches.
                      </span>
                    </>
                  ) : (
                    <>
                      <label htmlFor="bus-branch">Branch *</label>
                      <select
                        id="bus-branch"
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
                  : "Add Bus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
